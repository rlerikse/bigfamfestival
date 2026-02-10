/**
 * BFF-50: Remove password fields from Firestore user documents
 *
 * After migrating to Firebase Auth, passwords are managed by Firebase.
 * This script removes the legacy `password` field from all user documents in Firestore.
 *
 * Usage:
 *   npx ts-node scripts/remove-passwords-from-firestore.ts              # Dry run (default)
 *   npx ts-node scripts/remove-passwords-from-firestore.ts --execute    # Actually remove passwords
 *
 * Prerequisites:
 *   - GOOGLE_APPLICATION_CREDENTIALS env var set to service account key
 *   - GOOGLE_PROJECT_ID env var set
 */

import * as admin from 'firebase-admin';

// Parse command-line args
const args = process.argv.slice(2);
const isDryRun = !args.includes('--execute');

async function main() {
  // Initialize Firebase Admin if not already initialized
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.GOOGLE_PROJECT_ID,
    });
  }

  const db = admin.firestore();
  const usersCollection = db.collection('users');

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  BFF-50: Remove Password Fields from Firestore');
  console.log(`  Mode: ${isDryRun ? '🔍 DRY RUN (no changes)' : '⚠️  EXECUTE (will modify data)'}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  // Fetch all user documents
  const snapshot = await usersCollection.get();
  const totalDocs = snapshot.size;
  let docsWithPassword = 0;
  let docsProcessed = 0;
  let errors = 0;

  console.log(`Found ${totalDocs} user documents.\n`);

  const batch = db.batch();
  const BATCH_LIMIT = 500; // Firestore batch limit
  let batchCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();

    if (data.password !== undefined) {
      docsWithPassword++;

      if (isDryRun) {
        const maskedPassword = data.password
          ? `${String(data.password).substring(0, 10)}...`
          : '(empty)';
        console.log(`  [DRY RUN] Would remove password from: ${doc.id} (email: ${data.email || 'N/A'}, hash: ${maskedPassword})`);
      } else {
        try {
          batch.update(doc.ref, {
            password: admin.firestore.FieldValue.delete(),
          });
          batchCount++;
          docsProcessed++;

          // Commit batch if we hit the limit
          if (batchCount >= BATCH_LIMIT) {
            await batch.commit();
            console.log(`  Committed batch of ${batchCount} updates.`);
            batchCount = 0;
          }
        } catch (error) {
          errors++;
          console.error(`  ❌ Error processing ${doc.id}: ${error}`);
        }
      }
    }
  }

  // Commit any remaining batch operations
  if (!isDryRun && batchCount > 0) {
    await batch.commit();
    console.log(`  Committed final batch of ${batchCount} updates.`);
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  Summary:');
  console.log(`  Total user documents: ${totalDocs}`);
  console.log(`  Documents with password field: ${docsWithPassword}`);

  if (isDryRun) {
    console.log(`  Changes: None (dry run)`);
    console.log('\n  To execute, run with --execute flag:');
    console.log('  npx ts-node scripts/remove-passwords-from-firestore.ts --execute');
  } else {
    console.log(`  Passwords removed: ${docsProcessed}`);
    console.log(`  Errors: ${errors}`);
  }

  console.log('═══════════════════════════════════════════════════════════');

  process.exit(errors > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
