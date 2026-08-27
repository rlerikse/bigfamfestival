#!/usr/bin/env node
/**
 * flip-event-years.js
 *
 * Re-tags events in Firestore by changing ONLY their `year` field, to hide them
 * from the public. The public API (`events.service.ts`) returns an event only
 * when `!year || year === 2026`, so setting `year` to a sentinel like 2023
 * both hides the event and marks the batch so it can be found/reverted later.
 *
 * Uses the Firebase CLI login token + Firestore REST (same approach as
 * set-admin-role.js). No service account key required — run `firebase login`
 * first with access to the target project.
 *
 * SAFETY:
 *   - Dry run by default. Nothing is written unless you pass --apply.
 *   - Writes ONLY the `year` field via updateMask (never overwrites the doc).
 *   - Before applying, writes a backup JSON of every targeted doc's prior state.
 *
 * Usage:
 *   node scripts/flip-event-years.js                 # dry run, project bigfamfestival
 *   node scripts/flip-event-years.js --to 2023       # dry run, sentinel 2023
 *   node scripts/flip-event-years.js --to 2023 --apply
 *   node scripts/flip-event-years.js --project bigfam-test-ok6ox7 --to 2023 --apply
 *
 * Flags:
 *   --to <year>        Sentinel year to write (default 2023).
 *   --from <year>      Only target events whose current year === <from>.
 *                      Omit to target ALL currently-public events
 *                      (year === 2026 OR year missing).
 *   --project <id>     Firebase project id (default bigfamfestival).
 *   --apply            Actually write. Without it, dry run only.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PUBLIC_YEAR = 2026; // events.service.ts treats this (or missing) as public

function parseArgs(argv) {
  const args = { to: 2023, from: null, project: 'bigfamfestival', apply: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--apply') args.apply = true;
    else if (a === '--to') args.to = parseInt(argv[++i], 10);
    else if (a === '--from') args.from = parseInt(argv[++i], 10);
    else if (a === '--project') args.project = argv[++i];
    else { console.error(`Unknown arg: ${a}`); process.exit(1); }
  }
  if (!Number.isInteger(args.to)) { console.error('--to must be a year'); process.exit(1); }
  return args;
}

function getFirebaseToken() {
  const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
  if (!fs.existsSync(configPath)) {
    throw new Error('Firebase CLI not authenticated. Run `firebase login` first.');
  }
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const token = config?.tokens?.access_token;
  if (!token) throw new Error('No Firebase access token found. Run `firebase login` first.');
  return { token, config, configPath };
}

// firebase-tools public desktop OAuth client (used only to refresh our own token).
const FB_CLIENT_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const FB_CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi';

function refreshAccessToken(refreshToken) {
  return new Promise((resolve, reject) => {
    const body = new URLSearchParams({
      client_id: FB_CLIENT_ID,
      client_secret: FB_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }).toString();
    const req = https.request({
      hostname: 'oauth2.googleapis.com', path: '/token', method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) },
    }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.access_token) resolve(parsed.access_token);
          else reject(new Error(`Refresh failed: ${data}`));
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function httpsRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(data); } catch { parsed = data; }
        resolve({ status: res.statusCode, body: parsed });
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function listAllEvents(projectId, token) {
  const docs = [];
  let pageToken = '';
  do {
    const q = `pageSize=300${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
    const res = await httpsRequest({
      hostname: 'firestore.googleapis.com',
      path: `/v1/projects/${projectId}/databases/(default)/documents/events?${q}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    }, null);
    if (res.status === 401) { const err = new Error('UNAUTHORIZED'); err.code = 401; throw err; }
    if (res.body.error) throw new Error(`List error: ${JSON.stringify(res.body.error)}`);
    for (const d of res.body.documents || []) docs.push(d);
    pageToken = res.body.nextPageToken || '';
  } while (pageToken);
  return docs;
}

function readYear(doc) {
  const y = doc.fields?.year;
  if (!y) return null;
  if (y.integerValue != null) return parseInt(y.integerValue, 10);
  if (y.doubleValue != null) return Math.round(y.doubleValue);
  return null;
}

function readStr(doc, field) {
  return doc.fields?.[field]?.stringValue ?? '';
}

function shortId(name) { return name.split('/').pop(); }

async function patchYear(projectId, token, docName, toYear) {
  const res = await httpsRequest({
    hostname: 'firestore.googleapis.com',
    path: `/v1/projects/${projectId}/databases/(default)/documents/events/${shortId(docName)}?updateMask.fieldPaths=year`,
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  }, { fields: { year: { integerValue: String(toYear) } } });
  if (res.body.error) throw new Error(`Patch error on ${shortId(docName)}: ${JSON.stringify(res.body.error)}`);
  return res.body;
}

async function main() {
  const args = parseArgs(process.argv);
  const { token: initialToken, config } = getFirebaseToken();
  let token = initialToken;

  let docs;
  try {
    docs = await listAllEvents(args.project, token);
  } catch (e) {
    if (e.code === 401 && config?.tokens?.refresh_token) {
      console.log('   (access token expired — refreshing…)');
      token = await refreshAccessToken(config.tokens.refresh_token);
      docs = await listAllEvents(args.project, token);
    } else { throw e; }
  }

  // Categorize
  const byBucket = { public2026: [], missing: [], other: new Map() };
  for (const d of docs) {
    const y = readYear(d);
    if (y === PUBLIC_YEAR) byBucket.public2026.push(d);
    else if (y === null) byBucket.missing.push(d);
    else {
      if (!byBucket.other.has(y)) byBucket.other.set(y, []);
      byBucket.other.get(y).push(d);
    }
  }

  // Determine targets
  let targets;
  if (args.from != null) {
    targets = docs.filter((d) => readYear(d) === args.from);
  } else {
    targets = [...byBucket.public2026, ...byBucket.missing]; // all currently-public
  }
  targets = targets.filter((d) => readYear(d) !== args.to); // skip already-at-target

  console.log(`\n📅 Event year re-tag  —  project: ${args.project}`);
  console.log(`   Total events in collection: ${docs.length}`);
  console.log(`   Currently public (year=2026): ${byBucket.public2026.length}`);
  console.log(`   Currently public (year missing): ${byBucket.missing.length}`);
  for (const [y, arr] of [...byBucket.other.entries()].sort((a, b) => a[0] - b[0])) {
    console.log(`   Already hidden (year=${y}): ${arr.length}`);
  }
  console.log(`\n   Target set${args.from != null ? ` (from year ${args.from})` : ' (all currently-public)'} → set year=${args.to}: ${targets.length} events`);

  if (targets.length === 0) { console.log('\n   Nothing to change. Done.'); return; }

  console.log('\n   Events that WOULD change:');
  for (const d of targets.slice(0, 500)) {
    console.log(`     - ${shortId(d.name).padEnd(22)} year=${String(readYear(d)).padEnd(6)} ${readStr(d, 'date')}  ${readStr(d, 'name')} @ ${readStr(d, 'stage')}`);
  }

  if (!args.apply) {
    console.log(`\n   DRY RUN. No writes made. Re-run with --apply to change these ${targets.length} events.`);
    return;
  }

  // Backup before writing
  const backupDir = path.join(__dirname, '..', 'data', 'backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `events-year-backup-${stamp}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(targets.map((d) => ({
    id: shortId(d.name), priorYear: readYear(d), name: readStr(d, 'name'), date: readStr(d, 'date'),
  })), null, 2));
  console.log(`\n   💾 Backup written: ${backupPath}`);

  console.log(`\n   Applying: setting year=${args.to} on ${targets.length} events…`);
  let ok = 0, fail = 0;
  for (const d of targets) {
    try { await patchYear(args.project, token, d.name, args.to); ok++; if (ok % 25 === 0) console.log(`     …${ok}/${targets.length}`); }
    catch (e) { fail++; console.error(`     ✗ ${shortId(d.name)}: ${e.message}`); }
  }
  console.log(`\n   ✅ Done. Updated ${ok}, failed ${fail}. Backup: ${backupPath}`);
}

main().catch((e) => { console.error('\n❌ Error:', e.message); process.exit(1); });
