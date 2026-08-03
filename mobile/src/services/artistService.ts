import { api } from './api';

export interface ArtistProfile {
  id: string;
  name: string;
  slug?: string;
  bio?: string;
  imageUrl?: string;
  genres?: string[];
  soundcloudUrl?: string;
  spotifyUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  websiteUrl?: string;
  userId?: string;
  userDisplayName?: string;
}

// In-memory cache to avoid refetching during a session
const artistCache = new Map<string, ArtistProfile>();

/**
 * Fetch a single artist by slug (or ID).
 * Caches results in memory for the app session.
 */
export async function getArtistBySlug(slug: string): Promise<ArtistProfile | null> {
  if (artistCache.has(slug)) {
    return artistCache.get(slug)!;
  }

  try {
    const response = await api.get(`/artists/${slug}`);
    const artist = response.data as ArtistProfile;
    artistCache.set(slug, artist);
    return artist;
  } catch (err) {
    console.warn(`[ArtistService] Failed to fetch artist "${slug}":`, err);
    return null;
  }
}

/**
 * Fetch multiple artists by slug array.
 * Returns in same order as input; nulls for any that fail.
 *
 * Concurrency is capped (rather than firing all requests at once via a
 * single Promise.all) because on cold Schedule load this can be called
 * with 70+ unique artist slugs simultaneously. On a real device over a
 * dev tunnel (higher latency, lower connection concurrency headroom than
 * a local machine), firing that many parallel requests at once caused
 * many of them to time out/fail silently -- resulting in ALL event cards
 * falling back to the local placeholder logo on first load, then loading
 * correctly on a manual refresh (once some responses were cached and
 * contention was lower). It also adds real CPU/network contention on the
 * JS thread right at Schedule mount time, which can contribute to scroll
 * jank immediately after load.
 */
const ARTIST_FETCH_CONCURRENCY = 8;

export async function getArtistsBySlugs(slugs: string[]): Promise<(ArtistProfile | null)[]> {
  const results: (ArtistProfile | null)[] = new Array(slugs.length).fill(null);
  let nextIndex = 0;

  async function worker() {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const i = nextIndex++;
      if (i >= slugs.length) return;
      results[i] = await getArtistBySlug(slugs[i]);
    }
  }

  const workerCount = Math.min(ARTIST_FETCH_CONCURRENCY, slugs.length);
  await Promise.all(Array.from({ length: workerCount }, worker));

  return results;
}

/**
 * Clear the artist cache (e.g., on logout or pull-to-refresh).
 */
export function clearArtistCache() {
  artistCache.clear();
}
