import { FieldValue } from '@google-cloud/firestore';

export interface Artist {
  id?: string;
  name: string;
  bio?: string;
  genre: string;
  imageUrl?: string;
  createdAt: Date | FieldValue;
  updatedAt: Date | FieldValue;
}
