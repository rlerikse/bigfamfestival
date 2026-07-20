/**
 * Migration: BFF-S5-07 — POI Category Split
 *
 * Maps old category values in the `mapPOIs` Firestore collection
 * to the new 5-category schema confirmed by Robert.
 *
 * Old values:  vendor | facility | campsite | food | water | bathrooms | medical | vendors | info | parking | shuttle
 * New values:  stage | food_vendor | beverage_vendor | shop_and_service | staff_and_medical
 *
 * Run with:
 *   npx ts-node -r tsconfig-paths/register backend/scripts/migrate-poi-categories.ts
 *
 * Requires GOOGLE_APPLICATION_CREDENTIALS or Firebase Admin SDK initialized
 * with service account credentials.
 *
 * Set DRY_RUN=true to preview changes without writing.
 */

import * as admin from 'firebase-admin';

const DRY_RUN = process.env.DRY_RUN !== 'false';

// Mapping from old category values → new category values
const CATEGORY_MAP: Record<string, string> = {
  // Old mobile POI types
  vendor: 'food_vendor',
  facility: 'staff_and_medical',
  campsite: 'staff_and_medical', // campsite entries were staff/info zones

  // Old admin POI categories
  food: 'food_vendor',
  beverage: 'beverage_vendor',
  water: 'staff_and_medical',
  bathrooms: 'staff_and_medical',
  medical: 'staff_and_medical',
  vendors: 'shop_and_service',
  info: 'staff_and_medical',
  parking: 'staff_and_medical',
  shuttle: 'staff_and_medical',

  // Already-correct values (pass through)
  stage: 'stage',
  food_vendor: 'food_vendor',
  beverage_vendor: 'beverage_vendor',
  shop_and_service: 'shop_and_service',
  staff_and_medical: 'staff_and_medical',
};

// Emoji defaults for new categories
const CATEGORY_EMOJI: Record<string, string> = {
  stage: '🎵',
  food_vendor: '🍔',
  beverage_vendor: '🍺',
  shop_and_service: '🛒',
  staff_and_medical: '🏥',
};

// Color defaults for new categories
const CATEGORY_COLOR: Record<string, string> = {
  stage: '#EF4444',
  food_vendor: '#F59E0B',
  beverage_vendor: '#3B82F6',
  shop_and_service: '#8B5CF6',
  staff_and_medical: '#DC2626',
};

async function migrate() {
  if (!admin.apps.length) {
    admin.initializeApp();
  }

  const db = admin.firestore();
  const collectionRef = db.collection('mapPOIs');
  const snapshot = await collectionRef.get();

  console.log(`\n🔍 Found ${snapshot.size} POI documents\n`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'LIVE (writing to Firestore)'}\n`);

  const stats: Record<string, number> = {
    migrated: 0,
    alreadyCorrect: 0,
    unknown: 0,
  };

  const batch = db.batch();
  let batchCount = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const oldCategory: string = data.category || data.type || '';
    const newCategory = CATEGORY_MAP[oldCategory];

    if (!newCategory) {
      console.warn(`  ⚠️  Unknown category "${oldCategory}" on doc ${docSnap.id} — SKIPPING`);
      stats.unknown++;
      continue;
    }

    const alreadyCorrect =
      oldCategory === newCategory &&
      data.icon === CATEGORY_EMOJI[newCategory] &&
      data.color === CATEGORY_COLOR[newCategory];

    if (alreadyCorrect) {
      stats.alreadyCorrect++;
      continue;
    }

    const updates: Record<string, unknown> = {
      category: newCategory,
      icon: CATEGORY_EMOJI[newCategory],
      color: CATEGORY_COLOR[newCategory],
    };

    // Also migrate `type` field if present (mobile schema)
    if (data.type && data.type !== newCategory) {
      updates.type = newCategory;
    }

    console.log(`  📝 ${docSnap.id}: "${oldCategory}" → "${newCategory}" [${data.name || '(unnamed)'}]`);

    if (!DRY_RUN) {
      batch.update(docSnap.ref, updates);
      batchCount++;

      // Firestore batch limit is 500
      if (batchCount >= 490) {
        await batch.commit();
        console.log('  ✅ Committed batch of 490');
        batchCount = 0;
      }
    }

    stats.migrated++;
  }

  if (!DRY_RUN && batchCount > 0) {
    await batch.commit();
    console.log(`  ✅ Committed final batch of ${batchCount}`);
  }

  console.log('\n--- Migration Summary ---');
  console.log(`  Migrated:       ${stats.migrated}`);
  console.log(`  Already correct: ${stats.alreadyCorrect}`);
  console.log(`  Unknown/skipped: ${stats.unknown}`);
  if (DRY_RUN) {
    console.log('\n⚠️  DRY RUN — no changes written. Set DRY_RUN=false to apply.');
  } else {
    console.log('\n✅ Migration complete.');
  }
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
