import { FieldValue } from '@google-cloud/firestore';

export interface Campsite {
  id?: string; // Firestore document ID
  userId: string;
  location_lat: number;
  location_long: number;
  shared_with_friends: boolean;
  createdAt: Date | FieldValue;
  updatedAt: Date | FieldValue;
}
