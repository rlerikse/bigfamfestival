import { Injectable, NotFoundException } from '@nestjs/common';
import { FirestoreService } from '../config/firestore/firestore.service';
import { Artist } from './interfaces/artist.interface';
import { FieldValue } from '@google-cloud/firestore';

@Injectable()
export class ArtistsService {
  private readonly collection = 'artists';

  constructor(private readonly firestoreService: FirestoreService) {}

  async create(
    artistData: Omit<Artist, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Artist> {
    const artistToCreate: Omit<Artist, 'id'> = {
      ...artistData,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    const createdDoc = await this.firestoreService.create(
      this.collection,
      artistToCreate,
    );
    const newArtist = await this.findOne(createdDoc.id);
    if (!newArtist) {
      throw new Error('Failed to retrieve artist after creation');
    }
    return newArtist;
  }

  async findAll(): Promise<Artist[]> {
    return this.firestoreService.getAll<Artist>(this.collection);
  }

  async findOne(id: string): Promise<Artist | null> {
    const artist = await this.firestoreService.get<Artist>(this.collection, id);
    if (!artist) {
      throw new NotFoundException(`Artist with ID "${id}" not found`);
    }
    return artist;
  }

  async findByName(name: string): Promise<Artist | null> {
    const artists = await this.firestoreService.query<Artist>(
      this.collection,
      'name',
      '==',
      name,
    );
    if (artists.length === 0) {
      return null;
    }
    return artists[0];
  }
}
