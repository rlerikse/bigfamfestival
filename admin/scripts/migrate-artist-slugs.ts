/**
 * Migration script: 
 * 1. Fetch all events and artists from prod API
 * 2. Map event imageUrls to their associated artists
 * 3. Generate slugs from artist names
 * 4. Output the migration plan
 * 
 * Run: npx tsx scripts/migrate-artist-slugs.ts
 */

const API_BASE = 'https://bigfam-api-production-292369452544.us-central1.run.app/api/v1';

interface Artist {
  id: string;
  name: string;
  bio?: string;
  genre?: string;
  imageUrl?: string;
}

interface Event {
  id: string;
  name: string;
  artists: string[];
  imageUrl?: string;
  stage?: string;
  date?: string;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')  // remove special chars
    .replace(/\s+/g, '-')      // spaces to hyphens
    .replace(/-+/g, '-')       // collapse multiple hyphens
    .replace(/^-|-$/g, '');    // trim leading/trailing hyphens
}

async function main() {
  console.log('Fetching artists...');
  const artistsRes = await fetch(`${API_BASE}/artists`);
  const artists: Artist[] = await artistsRes.json();
  console.log(`Found ${artists.length} artists\n`);

  console.log('Fetching events...');
  const eventsRes = await fetch(`${API_BASE}/events`);
  const eventsData = await eventsRes.json();
  // Handle both array and paginated response
  const events: Event[] = Array.isArray(eventsData) ? eventsData : (eventsData.events || eventsData.data || []);
  console.log(`Found ${events.length} events\n`);

  // Build artist ID → image mapping from events
  const artistImageMap = new Map<string, string[]>();
  
  for (const event of events) {
    if (event.imageUrl && event.artists?.length) {
      for (const artistId of event.artists) {
        if (!artistImageMap.has(artistId)) {
          artistImageMap.set(artistId, []);
        }
        artistImageMap.get(artistId)!.push(event.imageUrl);
      }
    }
  }

  console.log('=== MIGRATION PLAN ===\n');
  
  // Check for slug collisions
  const slugs = new Map<string, string[]>();
  for (const artist of artists) {
    const slug = slugify(artist.name);
    if (!slugs.has(slug)) {
      slugs.set(slug, []);
    }
    slugs.get(slug)!.push(artist.name);
  }
  
  const collisions = [...slugs.entries()].filter(([, names]) => names.length > 1);
  if (collisions.length > 0) {
    console.log('⚠️  SLUG COLLISIONS:');
    for (const [slug, names] of collisions) {
      console.log(`  ${slug} → ${names.join(', ')}`);
    }
    console.log('');
  }

  console.log('ARTIST MIGRATIONS:');
  for (const artist of artists) {
    const slug = slugify(artist.name);
    const eventImages = artistImageMap.get(artist.id) || [];
    const existingImage = artist.imageUrl;
    
    console.log(`\n  ${artist.name}`);
    console.log(`    Current ID:  ${artist.id}`);
    console.log(`    New slug:    ${slug}`);
    console.log(`    Has image:   ${existingImage ? '✅ ' + existingImage : '❌ none'}`);
    
    if (eventImages.length > 0) {
      console.log(`    Event images (${eventImages.length}):`);
      // Dedupe
      const unique = [...new Set(eventImages)];
      for (const img of unique) {
        console.log(`      → ${img}`);
      }
      if (!existingImage && unique.length > 0) {
        console.log(`    🔧 WILL SET imageUrl to: ${unique[0]}`);
      }
    } else {
      console.log(`    Event images: none found`);
    }
  }

  console.log('\n\nEVENT ARTIST REFERENCE UPDATES:');
  for (const event of events) {
    if (event.artists?.length) {
      const oldIds = event.artists;
      const newSlugs = oldIds.map(id => {
        const artist = artists.find(a => a.id === id);
        return artist ? slugify(artist.name) : `UNKNOWN:${id}`;
      });
      
      const changed = oldIds.some((id, i) => id !== newSlugs[i]);
      if (changed) {
        console.log(`  ${event.name}: [${oldIds.join(', ')}] → [${newSlugs.join(', ')}]`);
      }
    }
  }

  // Output JSON for the actual migration
  const migrationData = {
    artists: artists.map(a => ({
      oldId: a.id,
      newSlug: slugify(a.name),
      name: a.name,
      imageUrl: a.imageUrl || (artistImageMap.get(a.id)?.[0]) || null,
      bio: a.bio || null,
      genre: a.genre || null,
    })),
    eventUpdates: events
      .filter(e => e.artists?.length)
      .map(e => ({
        eventId: e.id,
        oldArtists: e.artists,
        newArtists: e.artists.map(id => {
          const artist = artists.find(a => a.id === id);
          return artist ? slugify(artist.name) : id;
        }),
      })),
  };

  const outPath = './scripts/migration-plan.json';
  const fs = await import('fs');
  fs.writeFileSync(outPath, JSON.stringify(migrationData, null, 2));
  console.log(`\n\n✅ Migration plan saved to ${outPath}`);
}

main().catch(console.error);
