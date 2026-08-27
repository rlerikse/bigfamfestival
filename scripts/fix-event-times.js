#!/usr/bin/env node
/**
 * fix-event-times.js
 *
 * Normalizes malformed event `startTime`/`endTime` values (e.g. "0:00" -> "00:00")
 * in Firestore. Malformed times crash the backend overlap check
 * (minutesFromFestivalStart throws on non-HH:MM), producing a 500 on POST /events
 * for any event sharing that stage + festivalDay.
 *
 * Uses the Firebase CLI login token + Firestore REST. Dry run by default;
 * writes ONLY the startTime/endTime fields via updateMask; backs up first.
 *
 * Usage:
 *   node scripts/fix-event-times.js            # dry run
 *   node scripts/fix-event-times.js --apply
 */
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PROJECT = 'bigfamfestival';
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const APPLY = process.argv.includes('--apply');

function getTokens() {
  const p = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
  const c = JSON.parse(fs.readFileSync(p, 'utf8'));
  return { access: c?.tokens?.access_token, refresh: c?.tokens?.refresh_token };
}
function refresh(rt) {
  return new Promise((res, rej) => {
    const body = new URLSearchParams({
      client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',
      client_secret: 'j9iVZfS8kkCEFUPaAeJV0sAi', refresh_token: rt, grant_type: 'refresh_token',
    }).toString();
    const r = https.request({ hostname: 'oauth2.googleapis.com', path: '/token', method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) } },
      (resp) => { let d = ''; resp.on('data', c => d += c); resp.on('end', () => { try { res(JSON.parse(d).access_token); } catch (e) { rej(e); } }); });
    r.on('error', rej); r.write(body); r.end();
  });
}
function req(opts, body) {
  return new Promise((res, rej) => {
    const r = https.request(opts, (resp) => { let d = ''; resp.on('data', c => d += c); resp.on('end', () => { let p; try { p = JSON.parse(d); } catch { p = d; } res({ status: resp.statusCode, body: p }); }); });
    r.on('error', rej); if (body) r.write(JSON.stringify(body)); r.end();
  });
}
const H = (t) => ({ Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' });

async function listAll(t) {
  const docs = []; let pageToken = '';
  do {
    const q = `pageSize=300${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
    const r = await req({ hostname: 'firestore.googleapis.com', method: 'GET',
      path: `/v1/projects/${PROJECT}/databases/(default)/documents/events?${q}`, headers: H(t) }, null);
    if (r.status === 401) { const e = new Error('401'); e.code = 401; throw e; }
    if (r.body.error) throw new Error(JSON.stringify(r.body.error));
    for (const d of r.body.documents || []) docs.push(d);
    pageToken = r.body.nextPageToken || '';
  } while (pageToken);
  return docs;
}
const sid = (n) => n.split('/').pop();
const str = (d, f) => d.fields?.[f]?.stringValue ?? '';

// Zero-pad an "H:MM" or "HH:M" style time to strict HH:MM. Returns null if unfixable.
function normalizeTime(v) {
  if (!v || typeof v !== 'string') return null;
  const m = v.trim().match(/^(\d{1,2}):(\d{1,2})$/);
  if (!m) return null;
  const hh = m[1].padStart(2, '0');
  const mm = m[2].padStart(2, '0');
  const out = `${hh}:${mm}`;
  return TIME_RE.test(out) ? out : null;
}

async function patchTimes(t, docName, fields) {
  const mask = Object.keys(fields).map((k) => `updateMask.fieldPaths=${k}`).join('&');
  const body = { fields: {} };
  for (const [k, v] of Object.entries(fields)) body.fields[k] = { stringValue: v };
  const r = await req({ hostname: 'firestore.googleapis.com', method: 'PATCH',
    path: `/v1/projects/${PROJECT}/databases/(default)/documents/events/${sid(docName)}?${mask}`, headers: H(t) }, body);
  if (r.body.error) throw new Error(`${sid(docName)}: ${JSON.stringify(r.body.error)}`);
}

async function main() {
  const { access, refresh: rt } = getTokens();
  let t = access, docs;
  try { docs = await listAll(t); }
  catch (e) { if (e.code === 401 && rt) { t = await refresh(rt); docs = await listAll(t); } else throw e; }

  const bad = [];
  for (const d of docs) {
    const st = str(d, 'startTime'), et = str(d, 'endTime');
    const stBad = st && !TIME_RE.test(st);
    const etBad = et && !TIME_RE.test(et);
    if (!stBad && !etBad) continue;
    const fix = {};
    if (stBad) fix.startTime = normalizeTime(st);
    if (etBad) fix.endTime = normalizeTime(et);
    bad.push({ d, st, et, fix });
  }

  console.log(`\n🕑 Event time normalization — project ${PROJECT}`);
  console.log(`   Total events: ${docs.length}`);
  console.log(`   Malformed startTime/endTime: ${bad.length}\n`);
  for (const b of bad) {
    const unfixable = Object.values(b.fix).some((v) => v === null);
    console.log(`   ${sid(b.d.name).padEnd(22)} ${str(b.d, 'name')} @ ${str(b.d, 'stage')} ${str(b.d, 'date')}`);
    console.log(`       start "${b.st}"${b.fix.startTime !== undefined ? ` -> "${b.fix.startTime}"` : ''}   end "${b.et}"${b.fix.endTime !== undefined ? ` -> "${b.fix.endTime}"` : ''}${unfixable ? '   ⚠️ UNFIXABLE (manual)' : ''}`);
  }

  if (bad.length === 0) { console.log('   Nothing to fix.'); return; }
  if (!APPLY) { console.log(`\n   DRY RUN. Re-run with --apply to normalize these ${bad.length} events.`); return; }

  const fixable = bad.filter((b) => !Object.values(b.fix).some((v) => v === null));
  const backupDir = path.join(__dirname, '..', 'data', 'backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `events-time-backup-${stamp}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(fixable.map((b) => ({ id: sid(b.d.name), startTime: b.st, endTime: b.et })), null, 2));
  console.log(`\n   💾 Backup: ${backupPath}`);

  let ok = 0, fail = 0;
  for (const b of fixable) {
    const fields = {};
    if (b.fix.startTime) fields.startTime = b.fix.startTime;
    if (b.fix.endTime) fields.endTime = b.fix.endTime;
    try { await patchTimes(t, b.d.name, fields); ok++; } catch (e) { fail++; console.error('   ✗', e.message); }
  }
  console.log(`\n   ✅ Done. Fixed ${ok}, failed ${fail}. Backup: ${backupPath}`);
}
main().catch((e) => { console.error('❌', e.message); process.exit(1); });
