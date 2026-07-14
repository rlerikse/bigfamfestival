/**
 * Seed stage and infrastructure locations into Firestore.
 * Run: npx tsx scripts/seed-map-locations.ts
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as path from 'path';
import * as fs from 'fs';

// Try to use service account if available, otherwise use default credentials
const serviceAccountPath = path.resolve(__dirname, '../bigfam-serviceaccount.json');
if (fs.existsSync(serviceAccountPath)) {
  initializeApp({ credential: cert(serviceAccountPath) });
} else {
  initializeApp({ projectId: 'bigfamfestival' });
}

const db = getFirestore();

const STAGE_LOCATIONS: Record<string, { lat: number; lng: number; name: string; color: string }> = {
  apogee: { lat: 42.05700, lng: -84.25720, name: 'Apogee', color: '#EF4444' },
  bayou: { lat: 42.06050, lng: -84.25675, name: 'The Bayou', color: '#EF4444' },
  sanctuary: { lat: 42.05920, lng: -84.25700, name: 'The Sanctuary', color: '#EF4444' },
  gallery: { lat: 42.05950, lng: -84.25800, name: 'The Gallery', color: '#EF4444' },
};

const INFRASTRUCTURE_POIS = [
  { id: 'front-gate', name: 'Front Gate / Check-In', category: 'info', lat: 42.05600, lng: -84.25815, color: '#FF6B35', icon: '🚪' },
  { id: 'medical', name: 'Medical', category: 'medical', lat: 42.05880, lng: -84.25680, color: '#DC2626', icon: '🏥' },
  { id: 'the-cantina', name: 'The Cantina', category: 'food', lat: 42.05800, lng: -84.25750, color: '#F59E0B', icon: '🍹' },
  { id: 'hq', name: 'HQ', category: 'info', lat: 42.05810, lng: -84.25630, color: '#6B7280', icon: 'ℹ️' },
];

async function seed() {
  console.log('Seeding stage locations...');
  
  // Write stages config doc
  await db.doc('config/mapStages').set({
    stages: STAGE_LOCATIONS,
    updatedAt: new Date().toISOString(),
  });
  console.log(`  ✓ ${Object.keys(STAGE_LOCATIONS).length} stages written to config/mapStages`);

  // Write infrastructure POIs
  const batch = db.batch();
  for (const poi of INFRASTRUCTURE_POIS) {
    const ref = db.collection('mapPOIs').doc(poi.id);
    batch.set(ref, { ...poi, updatedAt: new Date().toISOString() }, { merge: true });
  }
  await batch.commit();
  console.log(`  ✓ ${INFRASTRUCTURE_POIS.length} POIs written to mapPOIs`);

  console.log('Done!');
}

seed().catch(console.error);
