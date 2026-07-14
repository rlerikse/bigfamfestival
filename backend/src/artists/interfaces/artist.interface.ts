import { FieldValue } from '@google-cloud/firestore';

export interface Artist {
  id?: string;
  slug?: string;
  name: string;
  bio?: string;
  genre?: string;     // legacy single genre
  genres?: string[];  // flattened genre array
  imageUrl?: string;
  userId?: string;    // linked Firebase Auth user ID
  userDisplayName?: string; // cached for display
  soundcloudUrl?: string;
  spotifyUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  websiteUrl?: string;
  year?: number;
  createdAt: Date | FieldValue;
  updatedAt: Date | FieldValue;
}
