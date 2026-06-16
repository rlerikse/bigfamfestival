#!/usr/bin/env node
/**
 * set-admin-role.js
 *
 * Sets a user's role to 'admin' in both Firebase Auth custom claims
 * and the Firestore 'users' document for a given Firebase project.
 *
 * Uses Firebase REST APIs with the currently authenticated Firebase CLI token.
 * No service account key required — just `firebase login` beforehand.
 *
 * Usage:
 *   node scripts/set-admin-role.js <email-or-uid> [project-id]
 *
 * Examples:
 *   node scripts/set-admin-role.js eriksen.solutions@gmail.com
 *   node scripts/set-admin-role.js eriksen.solutions@gmail.com bigfam-test-ok6ox7
 *
 * Defaults to project 'bigfamfestival' if no project specified.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Read Firebase CLI token from configstore
function getFirebaseToken() {
  const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
  if (!fs.existsSync(configPath)) {
    throw new Error('Firebase CLI not authenticated. Run `firebase login` first.');
  }
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const token = config?.tokens?.access_token;
  if (!token) {
    throw new Error('No Firebase access token found. Run `firebase login` first.');
  }
  return token;
}

function httpsRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { resolve(data); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function lookupUser(projectId, token, emailOrUid) {
  const isEmail = emailOrUid.includes('@');
  const body = isEmail
    ? { email: [emailOrUid] }
    : { localId: [emailOrUid] };

  const result = await httpsRequest({
    hostname: 'identitytoolkit.googleapis.com',
    path: `/v1/projects/${projectId}/accounts:lookup`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  }, body);

  if (result.error) throw new Error(`Lookup error: ${JSON.stringify(result.error)}`);
  if (!result.users || result.users.length === 0) {
    throw new Error(`User not found in project ${projectId}: ${emailOrUid}`);
  }
  return result.users[0];
}

async function setCustomClaims(projectId, token, uid, claims) {
  const result = await httpsRequest({
    hostname: 'identitytoolkit.googleapis.com',
    path: `/v1/projects/${projectId}/accounts:update`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  }, { localId: uid, customAttributes: JSON.stringify(claims) });

  if (result.error) throw new Error(`Set claims error: ${JSON.stringify(result.error)}`);
  return result;
}

async function setFirestoreDoc(projectId, token, uid, data) {
  const fields = {};
  for (const [k, v] of Object.entries(data)) {
    if (typeof v === 'string') fields[k] = { stringValue: v };
    else if (typeof v === 'boolean') fields[k] = { booleanValue: v };
    else if (typeof v === 'number') fields[k] = { integerValue: String(v) };
  }

  const updateMask = Object.keys(fields).map(k => `updateMask.fieldPaths=${k}`).join('&');
  const result = await httpsRequest({
    hostname: 'firestore.googleapis.com',
    path: `/v1/projects/${projectId}/databases/(default)/documents/users/${uid}?${updateMask}`,
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  }, { fields });

  if (result.error) throw new Error(`Firestore error: ${JSON.stringify(result.error)}`);
  return result;
}

async function getFirestoreDoc(projectId, token, uid) {
  const result = await httpsRequest({
    hostname: 'firestore.googleapis.com',
    path: `/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`,
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  }, null);
  return result;
}

async function main() {
  const emailOrUid = process.argv[2];
  const projectId = process.argv[3] || 'bigfamfestival';

  if (!emailOrUid) {
    console.error('Usage: node scripts/set-admin-role.js <email-or-uid> [project-id]');
    console.error('');
    console.error('Examples:');
    console.error('  node scripts/set-admin-role.js eriksen.solutions@gmail.com');
    console.error('  node scripts/set-admin-role.js eriksen.solutions@gmail.com bigfam-test-ok6ox7');
    process.exit(1);
  }

  console.log(`\n🔧 Setting admin role on project: ${projectId}`);
  console.log(`   Target: ${emailOrUid}\n`);

  const token = getFirebaseToken();

  // 1. Look up the user
  const user = await lookupUser(projectId, token, emailOrUid);
  const uid = user.localId;
  const email = user.email;
  const currentClaims = user.customAttributes ? JSON.parse(user.customAttributes) : {};
  console.log(`   UID:    ${uid}`);
  console.log(`   Email:  ${email}`);
  console.log(`   Claims: ${JSON.stringify(currentClaims)}`);

  // 2. Set Firebase Auth custom claims
  const newClaims = { ...currentClaims, role: 'admin' };
  await setCustomClaims(projectId, token, uid, newClaims);
  console.log(`\n   ✅ Firebase Auth custom claims set: ${JSON.stringify(newClaims)}`);

  // 3. Check existing Firestore doc
  const existingDoc = await getFirestoreDoc(projectId, token, uid);
  const docExists = !existingDoc.error;

  // 4. Set Firestore doc fields
  const firestoreData = {
    role: 'admin',
    email: email || '',
    name: user.displayName || (email ? email.split('@')[0] : 'Admin'),
    ticketType: 'vip',
    shareMyCampsite: false,
    shareMyLocation: false,
    shareMySchedule: true,
    notificationsEnabled: true,
  };

  if (docExists && existingDoc.fields) {
    // Preserve existing fields, only update role
    firestoreData.name = existingDoc.fields.name?.stringValue || firestoreData.name;
    firestoreData.ticketType = existingDoc.fields.ticketType?.stringValue || 'vip';
    console.log(`   (Updating existing Firestore doc)`);
  } else {
    console.log(`   (Creating new Firestore doc)`);
  }

  await setFirestoreDoc(projectId, token, uid, firestoreData);
  console.log(`   ✅ Firestore users/${uid} updated with role: admin`);

  // 5. Verify
  const verifyDoc = await getFirestoreDoc(projectId, token, uid);
  const verifyRole = verifyDoc.fields?.role?.stringValue;
  const verifyClaims = await lookupUser(projectId, token, uid);
  const verifyClaimsObj = verifyClaims.customAttributes ? JSON.parse(verifyClaims.customAttributes) : {};

  console.log(`\n   Verification:`);
  console.log(`     Firestore role:     ${verifyRole}`);
  console.log(`     Auth custom claims: ${JSON.stringify(verifyClaimsObj)}`);

  if (verifyRole === 'admin' && verifyClaimsObj.role === 'admin') {
    console.log(`\n✅ Done! ${email} is now admin on ${projectId}`);
    console.log(`   ⚠️  User must sign out and back in for new claims to take effect.\n`);
  } else {
    console.log(`\n⚠️  Something looks off — verify manually in Firebase Console.\n`);
  }
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
