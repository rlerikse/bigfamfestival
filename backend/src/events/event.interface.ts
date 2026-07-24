export interface EventArtistCacheEntry {
  id: string;
  name: string;
  imageUrl?: string;
  bio?: string;
  genres?: string[];
}

/**
 * Block type for the Schedule Editor. Defaults to 'artist_set' for all
 * existing events (no migration required — applied at read/write time).
 */
export type EventBlockType = 'artist_set' | 'workshop' | 'setup' | 'special';

export interface Event {
  id: string;
  name: string;
  stage: string;
  date: string; // YYYY-MM-DD format (real wall-clock date)
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  // Type of schedule block. Defaults to 'artist_set'.
  blockType?: EventBlockType;
  // Festival day (06:00->06:00 boundary), computed server-side from
  // date+startTime. SEPARATE from `date` so mobile push timing (which relies
  // on real date/startTime) is unaffected. See festival-day.util.ts.
  festivalDay?: string; // YYYY-MM-DD format
  artists: string[]; // Array of artist IDs
  // Denormalized cache of artist display data (name/image/bio/genres) for
  // N+1-free mobile lineup rendering. Source of truth is always the Artist
  // record — this is refreshed on event save and whenever the referenced
  // Artist is edited. Never edit bio/genres here directly.
  artistsCache?: EventArtistCacheEntry[];
  description?: string;
  imageUrl?: string;
  year?: number;
  createdBy: string; // Admin user ID
  createdAt?: Date;
  updatedAt?: Date;
}
