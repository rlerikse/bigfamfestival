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
 */
export async function getArtistsBySlugs(slugs: string[]): Promise<(ArtistProfile | null)[]> {
  return Promise.all(slugs.map(getArtistBySlug));
}

/**
 * Clear the artist cache (e.g., on logout or pull-to-refresh).
 */
export function clearArtistCache() {
  artistCache.clear();
}
