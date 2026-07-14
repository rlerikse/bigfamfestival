/**
 * Event interface for festival events
 */
export interface Event {
    id: string;
    name: string;
    stage: string;
    genre?: string; // Event genre/category
    genres?: string[]; // Array of genre tags (populated by backend from artists)
    date: string;  // YYYY-MM-DD format
    startTime: string;  // HH:MM format
    endTime: string;  // HH:MM format
    artists: string[];  // Array of artist IDs
    description?: string;
    imageUrl?: string;
    createdBy?: string;  // Admin user ID
    createdAt?: string;  // Firestore timestamp
    updatedAt?: string;  // Firestore timestamp
  }
  
  /**
   * Schedule event interface (event that's part of a user's schedule)
   */
  export interface ScheduleEvent extends Event {
    userNotes?: string;
  }

  /**
   * Upcoming show/concert — extends Event with show-specific fields.
   * Sourced from Firestore `events` collection. All new fields are optional
   * for backward compatibility with existing festival events.
   */
  export interface UpcomingShow extends Event {
    /** ISO 8601 datetime string for doors open time, e.g. '2026-04-25T20:00:00-04:00' */
    doorsTime?: string;
    /** URL to event flyer image (remote or local asset path) */
    flyerUrl?: string;
    /** Ticket purchase URL */
    ticketUrl?: string;
    /** Facebook event URL */
    facebookUrl?: string;
    /** Support act display string, e.g. 'with support from Mfinity' */
    supportAct?: string;
    /** Venue name override (if different from stage) */
    venueName?: string;
    /** City/state string, e.g. 'Pontiac, MI' */
    venueCity?: string;
  }