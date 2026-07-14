/**
 * Genre Flattening Migration
 *
 * Reads the top-level `genres` collection to build a lookup map,
 * then for each artist reads their `genres` subcollection (if any),
 * resolves genre IDs to tag names, merges with any existing `genres` array
 * on the artist doc, and writes the final deduplicated sorted `genres: string[]`.
 *
 * Non-destructive: subcollection docs are NOT deleted.
 *
 * Usage: cd /Users/reg/.openclaw/workspace-bigfam/repo/admin && npx tsx scripts/migrate-genres.ts
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, WriteBatch } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Config ───────────────────────────────────────────────────────────────────

const SERVICE_ACCOUNT_PATH = resolve(
  __dirname,
  "../../backend/bigfam-serviceaccount.json"
);
const PROJECT_ID = "bigfamfestival";
const BATCH_LIMIT = 500;

// ── Helpers ──────────────────────────────────────────────────────────────────

function log(tag: string, msg: string) {
  console.log(`[${tag}] ${msg}`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Init Firebase Admin
  log("INIT", `Loading service account from ${SERVICE_ACCOUNT_PATH}`);
  const serviceAccount = JSON.parse(
    readFileSync(SERVICE_ACCOUNT_PATH, "utf-8")
  );
  const app = initializeApp({
    credential: cert(serviceAccount),
    projectId: PROJECT_ID,
  });
  const db = getFirestore(app);

  // 2. Load ALL genres from top-level collection → lookup map
  log("INIT", "Loading top-level genres collection...");
  const genresSnap = await db.collection("genres").get();
  const genreLookup = new Map<string, string>();
  for (const doc of genresSnap.docs) {
    const data = doc.data();
    if (data.tag) {
      genreLookup.set(doc.id, data.tag);
    }
  }
  log("INIT", `Loaded ${genreLookup.size} genres into lookup map`);

  // 3. Process all artists
  log("MIGRATE", "Reading all artist docs...");
  const artistsSnap = await db.collection("artists").get();
  log("MIGRATE", `Found ${artistsSnap.size} artist docs`);

  let updated = 0;
  let hadSubcollection = 0;
  let hadExistingArray = 0;
  let skipped = 0;

  // Collect updates, then batch-write
  const updates: Array<{ ref: FirebaseFirestore.DocumentReference; genres: string[]; id: string }> = [];

  for (const artistDoc of artistsSnap.docs) {
    const artistData = artistDoc.data();
    const artistId = artistDoc.id;

    // Read subcollection genres
    const subGenresSnap = await db
      .collection("artists")
      .doc(artistId)
      .collection("genres")
      .get();

    const subcollectionTags: string[] = [];
    if (!subGenresSnap.empty) {
      hadSubcollection++;
      for (const subDoc of subGenresSnap.docs) {
        // The subcollection doc ID references the top-level genres collection
        const tag = genreLookup.get(subDoc.id);
        if (tag) {
          subcollectionTags.push(tag);
        } else {
          // Maybe the doc itself has a tag field
          const subData = subDoc.data();
          if (subData.tag) {
            subcollectionTags.push(subData.tag);
          }
        }
      }
    }

    // Get existing genres array on the doc
    const existingGenres: string[] = Array.isArray(artistData.genres)
      ? artistData.genres
      : [];
    if (existingGenres.length > 0) {
      hadExistingArray++;
    }

    // Merge: union of subcollection tags + existing array
    const merged = [...new Set([...existingGenres, ...subcollectionTags])].sort();

    // Only write if we have genres to set and they differ from existing
    const existingSorted = [...existingGenres].sort();
    if (
      merged.length === 0 ||
      (merged.length === existingSorted.length &&
        merged.every((g, i) => g === existingSorted[i]))
    ) {
      skipped++;
      continue;
    }

    updates.push({ ref: artistDoc.ref, genres: merged, id: artistId });
  }

  // 4. Batched writes
  log("MIGRATE", `Preparing ${updates.length} updates in batches of ${BATCH_LIMIT}...`);

  for (let i = 0; i < updates.length; i += BATCH_LIMIT) {
    const chunk = updates.slice(i, i + BATCH_LIMIT);
    const batch: WriteBatch = db.batch();

    for (const { ref, genres, id } of chunk) {
      batch.update(ref, { genres });
      log("UPDATE", `artists/${id} → genres: ${JSON.stringify(genres)}`);
      updated++;
    }

    await batch.commit();
    log("MIGRATE", `Committed batch ${Math.floor(i / BATCH_LIMIT) + 1}`);
  }

  // 5. Summary
  console.log("\n" + "═".repeat(60));
  console.log("  GENRE FLATTENING MIGRATION SUMMARY");
  console.log("═".repeat(60));
  console.log(`  Total artists:              ${artistsSnap.size}`);
  console.log(`  Artists updated:            ${updated}`);
  console.log(`  Artists with subcollection: ${hadSubcollection}`);
  console.log(`  Artists with existing array:${hadExistingArray}`);
  console.log(`  Skipped (no change):        ${skipped}`);
  console.log("═".repeat(60));
  console.log("  ✅ Migration completed successfully!");
  console.log("═".repeat(60) + "\n");
}

main().catch((err) => {
  console.error("\n💥 Unhandled migration error:", err);
  process.exit(1);
});
