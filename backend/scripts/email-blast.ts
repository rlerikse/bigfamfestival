/**
 * BFF-S2-04: Email Blast Script (SendGrid)
 *
 * Sends a bulk email to a list of recipients from a CSV file.
 * Uses SendGrid's batch send — respects rate limits with configurable delay.
 *
 * ⚠️  DO NOT RUN IN PRODUCTION without Robert's explicit approval.
 * ⚠️  SendGrid free tier = 100 emails/day. Essentials plan needed for full 4,000 blast.
 *
 * CSV format expected:
 *   email,name,ticketType
 *   user@example.com,Jane Doe,ga
 *
 * If columns differ, update COLUMN_MAP below.
 *
 * Usage:
 *   npx ts-node scripts/email-blast.ts --csv=../assets/customers/customers.csv --dry-run
 *   npx ts-node scripts/email-blast.ts --csv=../assets/customers/customers.csv --subject="Big Fam is coming!" --template=d-xxxx
 *
 * Flags:
 *   --csv=<path>         Path to CSV file (required)
 *   --subject=<text>     Email subject line
 *   --template=<id>      SendGrid Dynamic Template ID (d-xxxx...)
 *   --dry-run            Parse CSV and report counts without sending
 *   --limit=<n>          Only send to first N recipients (testing)
 *   --batch-size=<n>     Emails per batch (default: 50, max: 1000)
 *   --delay-ms=<n>       Delay between batches in ms (default: 1000)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import * as dotenv from 'dotenv';
import * as sgMail from '@sendgrid/mail';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

// ─── Column mapping — update if CSV structure differs ───────────────────────
const COLUMN_MAP = {
  email: 'email',       // column name for email address
  name: 'name',         // column name for recipient display name
  ticketType: 'ticketType', // optional: for personalization
};
// ────────────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const getArg = (name: string): string | undefined =>
  args.find(a => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');
const hasFlag = (name: string): boolean => args.includes(`--${name}`);

const csvPath = getArg('csv');
const subject = getArg('subject') || 'A message from Big Fam Festival';
const templateId = getArg('template');
const isDryRun = hasFlag('dry-run');
const limit = getArg('limit') ? parseInt(getArg('limit')!, 10) : undefined;
const batchSize = getArg('batch-size') ? parseInt(getArg('batch-size')!, 10) : 50;
const delayMs = getArg('delay-ms') ? parseInt(getArg('delay-ms')!, 10) : 1000;

interface Recipient {
  email: string;
  name?: string;
  ticketType?: string;
  [key: string]: string | undefined;
}

async function parseCSV(filePath: string): Promise<{ recipients: Recipient[]; columns: string[] }> {
  const recipients: Recipient[] = [];
  let columns: string[] = [];

  const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity,
  });

  let isHeader = true;
  for await (const line of rl) {
    if (!line.trim()) continue;

    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));

    if (isHeader) {
      columns = values.map(v => v.toLowerCase());
      isHeader = false;
      continue;
    }

    const row: Record<string, string> = {};
    columns.forEach((col, i) => { row[col] = values[i] || ''; });

    const emailCol = COLUMN_MAP.email.toLowerCase();
    const email = row[emailCol];
    if (!email || !email.includes('@')) continue; // Skip invalid emails

    recipients.push({
      email: email.toLowerCase(),
      name: row[COLUMN_MAP.name.toLowerCase()] || undefined,
      ticketType: row[COLUMN_MAP.ticketType.toLowerCase()] || undefined,
      ...row,
    });
  }

  return { recipients, columns };
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function blast(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  BFF-S2-04: Big Fam Email Blast (SendGrid)');
  console.log(`  Mode: ${isDryRun ? '🔍 DRY RUN (no emails sent)' : '🚀 LIVE SEND'}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (!csvPath) {
    console.error('❌ --csv=<path> is required');
    process.exit(1);
  }

  const resolvedCsv = path.resolve(__dirname, '..', csvPath);
  if (!fs.existsSync(resolvedCsv)) {
    console.error(`❌ CSV file not found: ${resolvedCsv}`);
    process.exit(1);
  }

  // Parse CSV
  console.log(`📥 Parsing CSV: ${resolvedCsv}`);
  const { recipients, columns } = await parseCSV(resolvedCsv);
  console.log(`   Columns detected: ${columns.join(', ')}`);
  console.log(`   Valid recipients: ${recipients.length}`);

  const sendList = limit ? recipients.slice(0, limit) : recipients;
  console.log(`   Will send to: ${sendList.length}${limit ? ` (limited to ${limit})` : ''}`);

  if (sendList.length === 0) {
    console.log('\n⚠️  No valid recipients found. Check CSV format and COLUMN_MAP.');
    process.exit(0);
  }

  // Free tier warning
  if (!isDryRun && sendList.length > 100) {
    console.warn(`\n⚠️  WARNING: Sending to ${sendList.length} recipients.`);
    console.warn('   SendGrid free tier is 100/day. Upgrade to Essentials ($20/mo) before full blast.');
    console.warn('   Run with --dry-run to preview without sending.\n');
  }

  if (isDryRun) {
    console.log('\n📋 Recipient preview (first 5):');
    sendList.slice(0, 5).forEach(r => {
      console.log(`   ${r.email} (${r.name || 'no name'})`);
    });
    if (sendList.length > 5) {
      console.log(`   ... and ${sendList.length - 5} more`);
    }
    console.log('\n✅ Dry run complete. No emails sent.');
    return;
  }

  // Configure SendGrid
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.error('❌ SENDGRID_API_KEY not set in environment');
    process.exit(1);
  }
  sgMail.setApiKey(apiKey);

  const fromEmail = process.env.EMAIL_FROM || 'noreply@bigfamfestival.com';
  const fromName = process.env.EMAIL_FROM_NAME || 'Big Fam Festival';

  console.log(`\n📤 Sending in batches of ${batchSize} with ${delayMs}ms delay...\n`);

  let sent = 0;
  let failed = 0;
  const failedEmails: string[] = [];

  for (let i = 0; i < sendList.length; i += batchSize) {
    const batch = sendList.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(sendList.length / batchSize);

    process.stdout.write(`  Batch ${batchNum}/${totalBatches} (${batch.length} emails)... `);

    const messages: sgMail.MailDataRequired[] = batch.map(r => ({
      to: { email: r.email, name: r.name },
      from: { email: fromEmail, name: fromName },
      subject,
      ...(templateId
        ? { templateId, dynamicTemplateData: { name: r.name || 'Friend', ticketType: r.ticketType } }
        : { text: `Hi ${r.name || 'there'},\n\nSee you at Big Fam Festival!\n\nThe Big Fam Team` }),
    }));

    try {
      await sgMail.send(messages as any);
      sent += batch.length;
      console.log(`✅`);
    } catch (err: any) {
      failed += batch.length;
      batch.forEach(r => failedEmails.push(r.email));
      console.log(`❌ ${err.message}`);
    }

    if (i + batchSize < sendList.length) {
      await sleep(delayMs);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  BLAST SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  ✅ Sent:   ${sent}`);
  console.log(`  ❌ Failed: ${failed}`);

  if (failedEmails.length > 0) {
    const failPath = path.join(__dirname, '..', 'email-blast-failures.txt');
    fs.writeFileSync(failPath, failedEmails.join('\n'));
    console.log(`\n  Failed addresses written to: ${failPath}`);
  }

  console.log('═══════════════════════════════════════════════════════════════');
  process.exit(failed > 0 ? 1 : 0);
}

blast().catch(err => {
  console.error('\n❌ Blast failed:', err.message);
  process.exit(1);
});
