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