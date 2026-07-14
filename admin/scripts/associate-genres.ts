/**
 * Associate existing artists with their genres.
 * 
 * The original UUID-based artist docs had genres subcollections at:
 *   artists/{oldUUID}/genres/{genreId}
 * 
 * After the slug migration, the parent docs were deleted but subcollections persist.
 * This script reads from the old subcollections and writes genres: string[] 
 * on the new slug-based artist docs.
 *
 * Usage: cd /Users/reg/.openclaw/workspace-bigfam/repo/admin && npx tsx scripts/associate-genres.ts
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SERVICE_ACCOUNT_PATH = resolve(
  __dirname,
  "../../backend/bigfam-serviceaccount.json"
);
const MIGRATION_PLAN_PATH = resolve(__dirname, "migration-plan.json");
const PROJECT_ID = "bigfamfestival";
const BATCH_LIMIT = 450;

// ── Init Firebase Admin ──────────────────────────────────────────────────────

const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, "utf-8"));
initializeApp({ credential: cert(serviceAccount), projectId: PROJECT_ID });
const db = getFirestore();

// ── Load migration plan for old→new ID mapping ──────────────────────────────

interface ArtistPlan {
  oldId: string;
  newSlug: string;
  name: string;
}

interface MigrationPlan {
  artists: ArtistPlan[];
}

const plan: MigrationPlan = JSON.parse(readFileSync(MIGRATION_PLAN_PATH, "utf-8"));

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Genre Association Migration ===\n");

  // Step 1: Load master genre list
  console.log("[STEP 1] Loading master genres collection...");
  const genresSnap = await db.collection("genres").get();
  const genreLookup = new Map<string, string>();
  genresSnap.docs.forEach((doc) => {
    const data = doc.data();
    if (data.tag) {
      genreLookup.set(doc.id, data.tag);
    }
  });
  console.log(`  Loaded ${genreLookup.size} genres from master collection.\n`);

  // Step 2: For each artist, read subcollection from OLD UUID doc
  console.log("[STEP 2] Reading genre subcollections from old UUID paths...\n");

  let artistsWithGenres = 0;
  let artistsWithoutGenres = 0;
  let totalGenresAssigned = 0;

  const updates: Array<{ slug: string; name: string; genres: string[] }> = [];

  for (const artist of plan.artists) {
    // Read the subcollection at the OLD path (subcollections survive parent deletion)
    const subcollSnap = await db
      .collection("artists")
      .doc(artist.oldId)
      .collection("genres")
      .get();

    if (subcollSnap.empty) {
      artistsWithoutGenres++;
      continue;
    }

    // Resolve genre IDs to tag names
    const genres: string[] = [];
    for (const genreDoc of subcollSnap.docs) {
      const tag = genreLookup.get(genreDoc.id);
      if (tag) {
        genres.push(tag);
      } else {
        console.warn(`  [WARN] Genre ID "${genreDoc.id}" not found in master list (artist: ${artist.name})`);
      }
    }

    if (genres.length > 0) {
      // Sort for consistency
      genres.sort();
      updates.push({ slug: artist.newSlug, name: artist.name, genres });
      artistsWithGenres++;
      totalGenresAssigned += genres.length;
    }
  }

  console.log(`  Found genres for ${artistsWithGenres} artists`);
  console.log(`  ${artistsWithoutGenres} artists have no genre subcollections`);
  console.log(`  ${totalGenresAssigned} total genre assignments\n`);

  // Step 3: Batch write genres to new slug-based docs
  console.log("[STEP 3] Writing genres to artist docs...\n");

  let batch = db.batch();
  let batchCount = 0;
  let written = 0;

  for (const update of updates) {
    const docRef = db.collection("artists").doc(update.slug);
    batch.update(docRef, { genres: update.genres });
    batchCount++;
    console.log(`  [UPDATE] artists/${update.slug} → genres: ${JSON.stringify(update.genres)}`);

    if (batchCount >= BATCH_LIMIT) {
      await batch.commit();
      console.log(`  [COMMIT] Batch of ${batchCount} written.`);
      written += batchCount;
      batch = db.batch();
      batchCount = 0;
    }
  }

  // Commit remaining
  if (batchCount > 0) {
    await batch.commit();
    written += batchCount;
    console.log(`  [COMMIT] Final batch of ${batchCount} written.`);
  }

  // Summary
  console.log("\n=== COMPLETE ===");
  console.log(`  Artists with genres: ${artistsWithGenres}`);
  console.log(`  Artists without genres: ${artistsWithoutGenres}`);
  console.log(`  Total genre assignments: ${totalGenresAssigned}`);
  console.log(`  Docs updated: ${written}`);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
