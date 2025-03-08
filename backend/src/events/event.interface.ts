export interface Event {
  id: string;
  name: string;
  stage: string;
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  artists: string[]; // Array of artist IDs
  description?: string;
  imageUrl?: string;
  createdBy: string; // Admin user ID
  createdAt?: Date;
  updatedAt?: Date;
}
