/**
 * BFF-S2-05: Profile Data Migration Verification Script
 *
 * Verifies that existing user documents in Firestore are intact and compatible
 * with the current User interface after the BFF-50 Firebase Auth migration.
 *
 * Checks:
 * 1. No user documents still contain a `password` field (migration complete)
 * 2. All required fields present (id, name, email, role)
 * 3. Role values are valid (ADMIN | ATTENDEE | STAFF)
 * 4. No orphaned Firestore users (Firebase Auth UID exists for each doc)
 * 5. No orphaned Firebase Auth users (Firestore doc exists for each auth user)
 * 6. Default fields are correctly set (shareMyCampsite, shareMyLocation, ticketType, notificationsEnabled)
 *
 * Usage:
 *   npm run verify:migration              # Run verification
 *   npm run verify:migration -- --fix     # Auto-fix backfillable issues (defaults only, no data loss)
 *
 * Exit codes:
 *   0 = all checks passed
 *   1 = issues found (see report)
 */

import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const args = process.argv.slice(2);
const autoFix = args.includes('--fix');

const VALID_ROLES = ['ADMIN', 'ATTENDEE', 'STAFF'];
const REQUIRED_FIELDS = ['name', 'email', 'role'];
const DEFAULT_FIELDS: Record<string, any> = {
  shareMyCampsite: false,
  shareMyLocation: false,
  ticketType: 'need-ticket',
  notificationsEnabled: true,
  shareMySchedule: true,
};

interface UserIssue {
  uid: string;
  email?: string;
  issues: string[];
  fixable: boolean;
  fixes?: Record<string, any>;
}

interface VerificationReport {
  totalFirestoreUsers: number;
  totalAuthUsers: number;
  passed: number;
  withIssues: UserIssue[];
  orphanedFirestoreDocs: string[]; // Firestore doc but no Auth user
  orphanedAuthUsers: string[];     // Auth user but no Firestore doc
  passwordFieldsRemaining: number;
  fixesApplied: number;
}

function initFirebase() {
  if (admin.apps.length > 0) return;

  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credPath && fs.existsSync(credPath)) {
    const sa = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    admin.initializeApp({ credential: admin.credential.cert(sa) });
  } else {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  }
}

async function getAllAuthUsers(): Promise<Map<string, admin.auth.UserRecord>> {
  const users = new Map<string, admin.auth.UserRecord>();
  let pageToken: string | undefined;

  do {
    const result = await admin.auth().listUsers(1000, pageToken);
    result.users.forEach(u => users.set(u.uid, u));
    pageToken = result.pageToken;
  } while (pageToken);

  return users;
}

async function verify(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  BFF-S2-05: Profile Data Migration Verification');
  console.log(`  Mode: ${autoFix ? '🔧 VERIFY + AUTO-FIX (backfill defaults only)' : '🔍 VERIFY ONLY'}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  initFirebase();
  const db = admin.firestore();

  const report: VerificationReport = {
    totalFirestoreUsers: 0,
    totalAuthUsers: 0,
    passed: 0,
    withIssues: [],
    orphanedFirestoreDocs: [],
    orphanedAuthUsers: [],
    passwordFieldsRemaining: 0,
    fixesApplied: 0,
  };

  // 1. Fetch all Firestore user docs
  console.log('📥 Fetching Firestore user documents...');
  const snapshot = await db.collection('users').get();
  report.totalFirestoreUsers = snapshot.size;
  console.log(`   Found ${snapshot.size} documents\n`);

  // 2. Fetch all Firebase Auth users
  console.log('📥 Fetching Firebase Auth users...');
  const authUsers = await getAllAuthUsers();
  report.totalAuthUsers = authUsers.size;
  console.log(`   Found ${authUsers.size} auth users\n`);

  // 3. Build set of Firestore UIDs for orphan check
  const firestoreUids = new Set<string>();

  // 4. Verify each Firestore doc
  console.log('🔍 Verifying user documents...');
  const fixBatch = db.batch();
  let fixCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const uid = doc.id;
    firestoreUids.add(uid);

    const issues: string[] = [];
    const fixes: Record<string, any> = {};

    // Check: password field still present
    if (data.password !== undefined) {
      report.passwordFieldsRemaining++;
      issues.push('password field still present (migration incomplete)');
    }

    // Check: required fields
    for (const field of REQUIRED_FIELDS) {
      if (!data[field]) {
        issues.push(`missing required field: ${field}`);
      }
    }

    // Check: valid role
    if (data.role && !VALID_ROLES.includes(data.role)) {
      issues.push(`invalid role: "${data.role}" (expected ADMIN|ATTENDEE|STAFF)`);
    }

    // Check: default fields — backfillable
    for (const [field, defaultValue] of Object.entries(DEFAULT_FIELDS)) {
      if (data[field] === undefined || data[field] === null) {
        issues.push(`missing default field: ${field} (will default to ${JSON.stringify(defaultValue)})`);
        fixes[field] = defaultValue;
      }
    }

    // Check: Firebase Auth user exists
    if (!authUsers.has(uid)) {
      report.orphanedFirestoreDocs.push(uid);
      issues.push('no matching Firebase Auth user (orphaned Firestore doc)');
    }

    if (issues.length === 0) {
      report.passed++;
    } else {
      const fixable = Object.keys(fixes).length > 0 &&
        issues.every(i => i.includes('missing default field'));

      report.withIssues.push({
        uid,
        email: data.email,
        issues,
        fixable,
        fixes: Object.keys(fixes).length > 0 ? fixes : undefined,
      });

      if (autoFix && Object.keys(fixes).length > 0) {
        fixBatch.update(doc.ref, { ...fixes, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
        fixCount++;
      }
    }
  }

  // 5. Check for orphaned Auth users (auth user with no Firestore doc)
  for (const [uid] of authUsers) {
    if (!firestoreUids.has(uid)) {
      report.orphanedAuthUsers.push(uid);
    }
  }

  // 6. Apply fixes
  if (autoFix && fixCount > 0) {
    console.log(`\n🔧 Applying ${fixCount} backfill fixes...`);
    await fixBatch.commit();
    report.fixesApplied = fixCount;
    console.log(`   ✅ ${fixCount} documents updated`);
  }

  // 7. Print report
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  VERIFICATION REPORT');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Firestore users:     ${report.totalFirestoreUsers}`);
  console.log(`  Firebase Auth users: ${report.totalAuthUsers}`);
  console.log(`  ✅ Clean:            ${report.passed}`);
  console.log(`  ⚠️  With issues:      ${report.withIssues.length}`);
  console.log(`  🔴 Password fields:  ${report.passwordFieldsRemaining}`);
  console.log(`  🔴 Orphaned (FS):    ${report.orphanedFirestoreDocs.length}`);
  console.log(`  🟡 Orphaned (Auth):  ${report.orphanedAuthUsers.length}`);
  if (autoFix) {
    console.log(`  🔧 Fixes applied:    ${report.fixesApplied}`);
  }

  if (report.withIssues.length > 0) {
    console.log('\n  Issues found:');
    for (const user of report.withIssues) {
      console.log(`\n  uid: ${user.uid} (${user.email || 'no email'})`);
      user.issues.forEach(i => console.log(`    - ${i}`));
      if (user.fixable && !autoFix) {
        console.log(`    → Re-run with --fix to backfill defaults`);
      }
    }
  }

  if (report.orphanedAuthUsers.length > 0) {
    console.log('\n  Orphaned Auth users (no Firestore doc):');
    report.orphanedAuthUsers.forEach(uid => console.log(`    - ${uid}`));
    console.log('  → These users authenticated but never completed profile creation');
  }

  if (report.passwordFieldsRemaining > 0) {
    console.log('\n  ⛔ Password fields still present — run remove-passwords-from-firestore.ts --execute');
  }

  console.log('\n═══════════════════════════════════════════════════════════════');

  const hasCritical = report.passwordFieldsRemaining > 0 ||
    report.orphanedFirestoreDocs.length > 0 ||
    report.withIssues.some(u => !u.fixable);

  if (hasCritical) {
    console.log('  ❌ VERIFICATION FAILED — critical issues require manual review');
    process.exit(1);
  } else if (report.withIssues.length > 0 && !autoFix) {
    console.log('  ⚠️  VERIFICATION PASSED with warnings — run with --fix to backfill defaults');
    process.exit(0);
  } else {
    console.log('  ✅ VERIFICATION PASSED — all user data is clean');
    process.exit(0);
  }
}

verify().catch(err => {
  console.error('\n❌ Verification failed:', err.message);
  process.exit(1);
});
