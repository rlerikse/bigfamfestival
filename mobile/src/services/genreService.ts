// src/services/genreService.ts
import firestore, { collection, getDocs, doc, getDoc } from '../utils/firebaseCompat';
import { ScheduleEvent } from '../types/event';

interface Genre {
  id: string;
  tag: string;
}

interface Artist {
  id: string;
  name: string;
  genres?: string[]; // Direct array approach
  // ... other fields
}

/**
 * Service for handling genre-related operations with Firestore
 */
class GenreService {
  /**
   * Populate genres for events by fetching from artists' data
   * @param events Array of events to populate with genres
   * @returns Events with populated genres arrays
   */
  async populateEventGenres(events: ScheduleEvent[]): Promise<ScheduleEvent[]> {
    if (!events || events.length === 0) {
      return events;
    }

    try {
      // Process events in parallel for better performance
      const eventsWithGenres = await Promise.all(
        events.map(event => this.populateSingleEventGenres(event))
      );

      return eventsWithGenres;
    } catch (error) {
      console.warn('Error populating event genres:', error);
      return events; // Return original events if genre population fails
    }
  }

  /**
   * Populate genres for a single event
   * @param event Single event to populate with genres
   * @returns Event with populated genres array
   */
  private async populateSingleEventGenres(event: ScheduleEvent): Promise<ScheduleEvent> {
    if (!event.artists || event.artists.length === 0) {
      return { ...event, genres: [] };
    }

    try {
      const allGenres: string[] = [];

      // Fetch genres for each artist in parallel
      const artistGenresPromises = event.artists.map(artistId => 
        this.getArtistGenres(artistId)
      );

      const artistGenresArrays = await Promise.all(artistGenresPromises);
      
      // Flatten and combine all genres
      artistGenresArrays.forEach(genres => {
        if (genres && genres.length > 0) {
          allGenres.push(...genres);
        }
      });

      // Remove duplicates and sort
      const uniqueGenres = Array.from(new Set(allGenres)).sort();

      return {
        ...event,
        genres: uniqueGenres
      };
    } catch (error) {
      console.warn(`Error populating genres for event ${event.id}:`, error);
      return { ...event, genres: [] };
    }
  }

  /**
   * Get genres for a specific artist
   * Tries both subcollection approach and direct array approach
   * @param artistId Artist ID
   * @returns Array of genre tags
   */
  private async getArtistGenres(artistId: string): Promise<string[]> {
    try {
      // First, try to get the artist document
      const artistDoc = await getDoc(doc(firestore, 'artists', artistId));
      
      if (!artistDoc.exists()) {
        console.warn(`Artist ${artistId} not found`);
        return [];
      }

      const artistData = artistDoc.data() as Artist;

      // Method 1: Check if artist has genres array directly
      if (artistData.genres && Array.isArray(artistData.genres)) {
        return artistData.genres;
      }

      // Method 2: Try subcollection approach
      return await this.getArtistGenresFromSubcollection(artistId);

    } catch (error) {
      console.warn(`Error fetching genres for artist ${artistId}:`, error);
      return [];
    }
  }

  /**
   * Get artist genres from subcollection approach
   * @param artistId Artist ID
   * @returns Array of genre tags from subcollection
   */
  private async getArtistGenresFromSubcollection(artistId: string): Promise<string[]> {
    try {
      // Get artist's genres subcollection
      const genresCollection = collection(firestore, 'artists', artistId, 'genres');
      const genresSnapshot = await getDocs(genresCollection);

      if (genresSnapshot.empty) {
        return [];
      }

      const genrePromises = genresSnapshot.docs.map(async (genreDoc) => {
        try {
          // Look up the genre in the main genres collection
          const genreId = genreDoc.id;
          const genreDocRef = doc(firestore, 'genres', genreId);
          const genreDataDoc = await getDoc(genreDocRef);
          
          if (genreDataDoc.exists()) {
            const genreData = genreDataDoc.data() as Genre;
            return genreData.tag;
          }
          
          return null;
        } catch (error) {
          console.warn(`Error fetching genre data for ${genreDoc.id}:`, error);
          return null;
        }
      });

      const genreTags = await Promise.all(genrePromises);
      return genreTags.filter(tag => tag !== null) as string[];

    } catch (error) {
      console.warn(`Error fetching subcollection genres for artist ${artistId}:`, error);
      return [];
    }
  }

  /**
   * Cache genres for better performance (optional enhancement)
   */
  private genreCache = new Map<string, string[]>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  /**
   * Get artist genres with caching
   */
  private async getArtistGenresWithCache(artistId: string): Promise<string[]> {
    const now = Date.now();
    
    // Check cache
    if (this.genreCache.has(artistId) && 
        this.cacheExpiry.has(artistId) && 
        this.cacheExpiry.get(artistId)! > now) {
      return this.genreCache.get(artistId)!;
    }

    // Fetch fresh data
    const genres = await this.getArtistGenres(artistId);
    
    // Update cache
    this.genreCache.set(artistId, genres);
    this.cacheExpiry.set(artistId, now + this.CACHE_DURATION);

    return genres;
  }

  /**
   * Clear the genre cache
   */
  clearCache(): void {
    this.genreCache.clear();
    this.cacheExpiry.clear();
  }
}

// Export singleton instance
export const genreService = new GenreService();
export default genreService;
