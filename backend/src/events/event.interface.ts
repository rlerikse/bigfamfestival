export interface EventArtistCacheEntry {
  id: string;
  name: string;
  imageUrl?: string;
  bio?: string;
  genres?: string[];
}

export interface Event {
  id: string;
  name: string;
  stage: string;
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
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
