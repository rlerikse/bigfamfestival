/**
 * Generate a Firebase custom token for load testing authenticated endpoints.
 *
 * Usage:
 *   node load-tests/generate-test-token.js
 *   node load-tests/generate-test-token.js > /tmp/k6-token.txt
 *
 * Then run k6 with:
 *   k6 run -e AUTH_TOKEN=$(cat /tmp/k6-token.txt) -e BASE_URL=http://localhost:8080/api/v1 load-tests/attendee-flow.js
 *
 * Requires GOOGLE_APPLICATION_CREDENTIALS env var or bigfam-dev-serviceaccount.json in backend/.
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
  path.join(__dirname, '..', 'bigfam-dev-serviceaccount.json');

if (!admin.apps.length) {
  if (fs.existsSync(credPath)) {
    const sa = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    admin.initializeApp({ credential: admin.credential.cert(sa) });
  } else {
    console.error(`Service account key not found at: ${credPath}`);
    console.error('Set GOOGLE_APPLICATION_CREDENTIALS or place bigfam-dev-serviceaccount.json in backend/');
    process.exit(1);
  }
}

const LOAD_TEST_UID = 'load-test-user-0001';

async function main() {
  try {
    // Create a custom token with ATTENDEE role
    const customToken = await admin.auth().createCustomToken(LOAD_TEST_UID, {
      role: 'ATTENDEE',
    });

    // Exchange custom token for an ID token via Firebase REST API
    const projectId = admin.app().options.projectId || 
      JSON.parse(fs.readFileSync(credPath, 'utf8')).project_id;

    const fetch = globalThis.fetch || (await import('node-fetch')).default;
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=AIzaSyDummy`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: customToken,
          returnSecureToken: true,
        }),
      }
    );

    if (!res.ok) {
      // Custom tokens can't be used directly with k6 — output the custom token
      // and note that the test user needs to exist in Firebase Auth
      console.error('Note: Custom token generated but ID token exchange requires a valid API key.');
      console.error('For load testing, consider using a real user ID token from Firebase.');
      console.error('Custom token (use with Firebase client SDK to get ID token):');
      process.stdout.write(customToken);
      process.exit(0);
    }

    const data = await res.json();
    process.stdout.write(data.idToken);
  } catch (err) {
    console.error('Error generating token:', err.message);
    process.exit(1);
  }
}

main();
