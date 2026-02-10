/**
 * Firebase Auth Migration Script
 *
 * Migrates existing users from Firestore (with bcrypt passwords) to Firebase Auth.
 * Preserves user UIDs to maintain data consistency.
 *
 * Usage:
 *   npm run migrate:firebase              # Full migration
 *   npm run migrate:firebase:dry          # Dry run (no changes)
 *   npm run migrate:firebase -- --limit=5 # Migrate only 5 users
 *
 * @see specs/BFF-50-firebase-auth-migration/spec.md
 */

import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Types
interface FirestoreUser {
  id: string;
  email: string;
  password: string;
  name: string;
  role: string;
  phone?: string;
}

interface MigrationResult {
  success: string[];
  failed: { uid: string; email: string; error: string }[];
  skipped: string[];
}

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const limitArg = args.find((arg) => arg.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : undefined;

// Initialize Firebase Admin
function initializeFirebase(): void {
  if (admin.apps.length > 0) {
    console.log('Firebase Admin SDK already initialized');
    return;
  }

  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

  if (credentialsJson) {
    // Credentials provided as JSON string
    const serviceAccount = JSON.parse(credentialsJson);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else if (credentialsPath && fs.existsSync(credentialsPath)) {
    // Credentials provided as file path
    const serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    // Try to find credentials file in common locations
    const possiblePaths = [
      path.join(__dirname, '..', 'bigfamfestival-firebase-adminsdk-fbsvc-e0085afeb3.json'),
      path.join(__dirname, '..', 'service-account.json'),
      path.join(__dirname, '..', '..', 'service-account.json'),
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        const serviceAccount = JSON.parse(fs.readFileSync(p, 'utf8'));
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        return;
      }
    }

    throw new Error(
      'Firebase credentials not found. Set GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_APPLICATION_CREDENTIALS_JSON',
    );
  }
}

/**
 * Fetch all users from Firestore that have passwords (need migration)
 */
async function fetchUsersFromFirestore(
  limitCount?: number,
): Promise<FirestoreUser[]> {
  const db = admin.firestore();
  let query = db.collection('users').where('password', '!=', '');

  if (limitCount) {
    query = query.limit(limitCount) as any;
  }

  const snapshot = await query.get();
  const users: FirestoreUser[] = [];

  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data.password) {
      users.push({
        id: doc.id,
        email: data.email,
        password: data.password,
        name: data.name || '',
        role: data.role || 'ATTENDEE',
        phone: data.phone,
      });
    }
  });

  return users;
}

/**
 * Check if user already exists in Firebase Auth
 */
async function userExistsInFirebaseAuth(uid: string): Promise<boolean> {
  try {
    await admin.auth().getUser(uid);
    return true;
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      return false;
    }
    throw error;
  }
}

/**
 * Import users to Firebase Auth using importUsers API with bcrypt password hashes
 */
async function importUsersToFirebaseAuth(
  users: FirestoreUser[],
  dryRun: boolean,
): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: [],
    failed: [],
    skipped: [],
  };

  // Check for existing users first
  const usersToImport: admin.auth.UserImportRecord[] = [];

  for (const user of users) {
    const exists = await userExistsInFirebaseAuth(user.id);
    if (exists) {
      console.log(`⏭️  Skipping ${user.email} - already exists in Firebase Auth`);
      result.skipped.push(user.id);
      continue;
    }

    // Build import record
    // Firebase Auth accepts bcrypt hashes with $2a$, $2b$, or $2y$ prefixes
    // Our hashes use $2b$ which Firebase accepts
    usersToImport.push({
      uid: user.id,
      email: user.email,
      displayName: user.name,
      phoneNumber: user.phone ? formatPhoneNumber(user.phone) : undefined,
      passwordHash: Buffer.from(user.password),
      // Note: passwordSalt is not needed for bcrypt as it's embedded in the hash
    });
  }

  if (usersToImport.length === 0) {
    console.log('No users to import');
    return result;
  }

  console.log(`\n📤 Importing ${usersToImport.length} users to Firebase Auth...`);

  if (dryRun) {
    console.log('🔍 DRY RUN - No changes will be made');
    usersToImport.forEach((u) => {
      console.log(`  Would import: ${u.email} (uid: ${u.uid})`);
    });
    result.success = usersToImport.map((u) => u.uid!);
    return result;
  }

  // Import in batches (Firebase limit is 1000 users per batch)
  const BATCH_SIZE = 1000;
  for (let i = 0; i < usersToImport.length; i += BATCH_SIZE) {
    const batch = usersToImport.slice(i, i + BATCH_SIZE);
    console.log(
      `  Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} users`,
    );

    try {
      const importResult = await admin.auth().importUsers(batch, {
        hash: {
          algorithm: 'BCRYPT',
        },
      });

      // Process results
      importResult.errors.forEach((error) => {
        const failedUser = batch[error.index];
        console.log(
          `  ❌ Failed: ${failedUser.email} - ${error.error.message}`,
        );
        result.failed.push({
          uid: failedUser.uid!,
          email: failedUser.email!,
          error: error.error.message,
        });
      });

      // Mark successful imports
      batch.forEach((user, index) => {
        const failed = importResult.errors.some((e) => e.index === index);
        if (!failed) {
          console.log(`  ✅ Imported: ${user.email}`);
          result.success.push(user.uid!);
        }
      });
    } catch (error: any) {
      console.error(`  ❌ Batch import failed: ${error.message}`);
      batch.forEach((user) => {
        result.failed.push({
          uid: user.uid!,
          email: user.email!,
          error: error.message,
        });
      });
    }
  }

  return result;
}

/**
 * Set custom claims (role) for successfully imported users
 */
async function setCustomClaims(
  userIds: string[],
  users: FirestoreUser[],
  dryRun: boolean,
): Promise<void> {
  console.log(`\n🏷️  Setting custom claims for ${userIds.length} users...`);

  if (dryRun) {
    console.log('🔍 DRY RUN - No changes will be made');
    return;
  }

  for (const uid of userIds) {
    const user = users.find((u) => u.id === uid);
    if (!user) continue;

    try {
      await admin.auth().setCustomUserClaims(uid, {
        role: user.role || 'ATTENDEE',
      });
      console.log(`  ✅ Set role=${user.role} for ${user.email}`);
    } catch (error: any) {
      console.log(`  ❌ Failed to set claims for ${user.email}: ${error.message}`);
    }
  }
}

/**
 * Format phone number to E.164 format for Firebase
 */
function formatPhoneNumber(phone: string): string | undefined {
  if (!phone) return undefined;

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // If it's a US number without country code, add +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // If it already has country code, add +
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  // For other formats, try to use as-is with +
  if (digits.length >= 10) {
    return `+${digits}`;
  }

  // Invalid phone number
  return undefined;
}

/**
 * Main migration function
 */
async function migrate(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  FIREBASE AUTH MIGRATION SCRIPT');
  console.log('  BFF-50: Firebase Auth Migration');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Mode: ${isDryRun ? '🔍 DRY RUN' : '🚀 LIVE'}`);
  if (limit) console.log(`  Limit: ${limit} users`);
  console.log('');

  // Initialize Firebase
  initializeFirebase();
  console.log('✅ Firebase Admin SDK initialized');

  // Fetch users from Firestore
  console.log('\n📥 Fetching users from Firestore...');
  const users = await fetchUsersFromFirestore(limit);
  console.log(`  Found ${users.length} users with passwords`);

  if (users.length === 0) {
    console.log('\n⚠️  No users to migrate');
    process.exit(0);
  }

  // Import users to Firebase Auth
  const result = await importUsersToFirebaseAuth(users, isDryRun);

  // Set custom claims for successful imports
  if (result.success.length > 0) {
    await setCustomClaims(result.success, users, isDryRun);
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  MIGRATION SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  ✅ Imported: ${result.success.length}`);
  console.log(`  ⏭️  Skipped (already exist): ${result.skipped.length}`);
  console.log(`  ❌ Failed: ${result.failed.length}`);

  if (result.failed.length > 0) {
    console.log('\n  Failed users:');
    result.failed.forEach((f) => {
      console.log(`    - ${f.email}: ${f.error}`);
    });
  }

  console.log('═══════════════════════════════════════════════════════════════');

  // Exit with error if any users failed
  if (result.failed.length > 0) {
    process.exit(1);
  }
}

// Run migration
migrate().catch((error) => {
  console.error('\n❌ Migration failed:', error.message);
  process.exit(1);
});
