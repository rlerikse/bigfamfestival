/**
 * Big Fam Artist Migration Script
 *
 * Migrates artists from UUID-based doc IDs to slug-based doc IDs in prod Firestore.
 * Updates event references and cleans up old docs.
 *
 * Usage: cd /Users/reg/.openclaw/workspace-bigfam/repo/admin && npx tsx scripts/run-migration.ts
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
const MIGRATION_PLAN_PATH = resolve(__dirname, "migration-plan.json");
const PROJECT_ID = "bigfamfestival";
const BATCH_LIMIT = 450; // Stay under Firestore's 500 ops-per-batch limit

// ── Types ────────────────────────────────────────────────────────────────────

interface ArtistPlan {
  oldId: string;
  newSlug: string;
  name: string;
  imageUrl: string | null;
  bio: string | null;
  genre: string | null;
}

interface EventUpdate {
  eventId: string;
  oldArtists: string[];
  newArtists: string[];
}

interface MigrationPlan {
  artists: ArtistPlan[];
  eventUpdates: EventUpdate[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function log(tag: string, msg: string) {
  console.log(`[${tag}] ${msg}`);
}

function logError(tag: string, msg: string) {
  console.error(`[${tag}] ❌ ${msg}`);
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

  // 2. Load migration plan
  log("INIT", `Loading migration plan from ${MIGRATION_PLAN_PATH}`);
  const plan: MigrationPlan = JSON.parse(
    readFileSync(MIGRATION_PLAN_PATH, "utf-8")
  );
  log(
    "INIT",
    `Plan: ${plan.artists.length} artists, ${plan.eventUpdates.length} event updates`
  );

  // Counters
  let artistsCreated = 0;
  let artistsFailed = 0;
  let eventsUpdated = 0;
  let eventsFailed = 0;
  let artistsDeleted = 0;
  let deleteFailed = 0;

  // ── Phase 1: Create new artist docs with slug IDs ──────────────────────

  log("PHASE1", "Creating new artist docs with slug-based IDs...");

  // Process in batches
  for (let i = 0; i < plan.artists.length; i += BATCH_LIMIT) {
    const chunk = plan.artists.slice(i, i + BATCH_LIMIT);
    const batch: WriteBatch = db.batch();

    for (const artist of chunk) {
      try {
        // Read existing doc to preserve all fields
        const oldDocRef = db.collection("artists").doc(artist.oldId);
        const oldDocSnap = await oldDocRef.get();

        if (!oldDocSnap.exists) {
          logError(
            "PHASE1",
            `Source doc artists/${artist.oldId} (${artist.name}) does not exist — skipping`
          );
          artistsFailed++;
          continue;
        }

        const existingData = oldDocSnap.data() || {};

        // Build new doc: all original fields + slug + migration metadata
        const newData: Record<string, any> = {
          ...existingData,
          slug: artist.newSlug,
          migratedFrom: artist.oldId,
          migratedAt: new Date().toISOString(),
        };

        // If the plan has an imageUrl and the original doesn't, use the plan's
        if (artist.imageUrl && !existingData.imageUrl) {
          newData.imageUrl = artist.imageUrl;
        }

        const newDocRef = db.collection("artists").doc(artist.newSlug);
        batch.set(newDocRef, newData);
        log("PHASE1", `[CREATE] artists/${artist.newSlug} (from ${artist.oldId} — ${artist.name})`);
        artistsCreated++;
      } catch (err: any) {
        logError(
          "PHASE1",
          `Failed to prepare artists/${artist.newSlug}: ${err.message}`
        );
        artistsFailed++;
      }
    }

    // Commit this batch
    try {
      await batch.commit();
      log("PHASE1", `Committed batch of ${chunk.length} creates`);
    } catch (err: any) {
      logError("PHASE1", `Batch commit failed: ${err.message}`);
      console.error(
        "\n⛔ Phase 1 batch commit failed. Stopping migration to prevent inconsistencies.\n"
      );
      printSummary(artistsCreated, artistsFailed, eventsUpdated, eventsFailed, artistsDeleted, deleteFailed);
      process.exit(1);
    }
  }

  if (artistsFailed > 0) {
    console.error(
      `\n⛔ Phase 1 had ${artistsFailed} failures. Stopping migration.\n`
    );
    printSummary(artistsCreated, artistsFailed, eventsUpdated, eventsFailed, artistsDeleted, deleteFailed);
    process.exit(1);
  }

  log("PHASE1", `✅ Phase 1 complete: ${artistsCreated} artists created`);

  // ── Phase 2: Update event artist references ────────────────────────────

  log("PHASE2", "Updating event artist references...");

  for (let i = 0; i < plan.eventUpdates.length; i += BATCH_LIMIT) {
    const chunk = plan.eventUpdates.slice(i, i + BATCH_LIMIT);
    const batch: WriteBatch = db.batch();

    for (const evt of chunk) {
      try {
        const eventRef = db.collection("events").doc(evt.eventId);
        batch.update(eventRef, { artists: evt.newArtists });
        log("PHASE2", `[UPDATE] events/${evt.eventId} → artists: [${evt.newArtists.join(", ")}]`);
        eventsUpdated++;
      } catch (err: any) {
        logError(
          "PHASE2",
          `Failed to prepare events/${evt.eventId}: ${err.message}`
        );
        eventsFailed++;
      }
    }

    try {
      await batch.commit();
      log("PHASE2", `Committed batch of ${chunk.length} event updates`);
    } catch (err: any) {
      logError("PHASE2", `Batch commit failed: ${err.message}`);
      console.error(
        "\n⛔ Phase 2 batch commit failed. Stopping migration.\n"
      );
      printSummary(artistsCreated, artistsFailed, eventsUpdated, eventsFailed, artistsDeleted, deleteFailed);
      process.exit(1);
    }
  }

  if (eventsFailed > 0) {
    console.error(
      `\n⛔ Phase 2 had ${eventsFailed} failures. Stopping migration.\n`
    );
    printSummary(artistsCreated, artistsFailed, eventsUpdated, eventsFailed, artistsDeleted, deleteFailed);
    process.exit(1);
  }

  log("PHASE2", `✅ Phase 2 complete: ${eventsUpdated} events updated`);

  // ── Phase 3: Delete old artist docs ────────────────────────────────────

  log("PHASE3", "Deleting old artist docs...");

  for (let i = 0; i < plan.artists.length; i += BATCH_LIMIT) {
    const chunk = plan.artists.slice(i, i + BATCH_LIMIT);
    const batch: WriteBatch = db.batch();

    for (const artist of chunk) {
      try {
        const oldDocRef = db.collection("artists").doc(artist.oldId);
        batch.delete(oldDocRef);
        log("PHASE3", `[DELETE] artists/${artist.oldId} (was ${artist.name})`);
        artistsDeleted++;
      } catch (err: any) {
        logError(
          "PHASE3",
          `Failed to prepare delete artists/${artist.oldId}: ${err.message}`
        );
        deleteFailed++;
      }
    }

    try {
      await batch.commit();
      log("PHASE3", `Committed batch of ${chunk.length} deletes`);
    } catch (err: any) {
      logError("PHASE3", `Batch commit failed: ${err.message}`);
      console.error(
        "\n⛔ Phase 3 batch commit failed. Some old docs may remain.\n"
      );
      printSummary(artistsCreated, artistsFailed, eventsUpdated, eventsFailed, artistsDeleted, deleteFailed);
      process.exit(1);
    }
  }

  log("PHASE3", `✅ Phase 3 complete: ${artistsDeleted} old docs deleted`);

  // ── Summary ────────────────────────────────────────────────────────────

  printSummary(artistsCreated, artistsFailed, eventsUpdated, eventsFailed, artistsDeleted, deleteFailed);
}

function printSummary(
  artistsCreated: number,
  artistsFailed: number,
  eventsUpdated: number,
  eventsFailed: number,
  artistsDeleted: number,
  deleteFailed: number
) {
  console.log("\n" + "═".repeat(60));
  console.log("  MIGRATION SUMMARY");
  console.log("═".repeat(60));
  console.log(`  Artists created:     ${artistsCreated}`);
  console.log(`  Artists failed:      ${artistsFailed}`);
  console.log(`  Events updated:      ${eventsUpdated}`);
  console.log(`  Events failed:       ${eventsFailed}`);
  console.log(`  Old docs deleted:    ${artistsDeleted}`);
  console.log(`  Delete failures:     ${deleteFailed}`);
  console.log("═".repeat(60));

  const totalFailures = artistsFailed + eventsFailed + deleteFailed;
  if (totalFailures === 0) {
    console.log("  ✅ Migration completed successfully!");
  } else {
    console.log(`  ⚠️  Migration completed with ${totalFailures} failure(s)`);
  }
  console.log("═".repeat(60) + "\n");
}

main().catch((err) => {
  console.error("\n💥 Unhandled migration error:", err);
  process.exit(1);
});
