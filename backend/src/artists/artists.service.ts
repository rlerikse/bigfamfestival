import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { FirestoreService } from '../config/firestore/firestore.service';
import { Artist } from './interfaces/artist.interface';
import { UpdateArtistDto } from './dto/update-artist.dto';
import { FieldValue } from '@google-cloud/firestore';

@Injectable()
export class ArtistsService {
  private readonly collection = 'artists';

  constructor(private readonly firestoreService: FirestoreService) {}

  /**
   * Generate a URL-friendly slug from an artist name.
   * Lowercase, spaces → hyphens, strip non-alphanumeric (except hyphens).
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  async create(
    artistData: Omit<Artist, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Artist> {
    const slug = artistData.slug || this.generateSlug(artistData.name);
    const artistToCreate: Omit<Artist, 'id'> = {
      ...artistData,
      slug,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    // Use the slug as the Firestore document ID
    await this.firestoreService.set(this.collection, slug, artistToCreate);
    const newArtist = await this.findOne(slug);
    if (!newArtist) {
      throw new Error('Failed to retrieve artist after creation');
    }
    return newArtist;
  }

  async findAll(): Promise<Artist[]> {
    const artists = await this.firestoreService.getAll<Artist>(this.collection);
    // Only return current year (2026) artists — 2025 artists are archived
    return artists.filter((a) => !a.year || a.year === 2026);
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

  /**
   * Update an artist. If the slug changes, creates a new doc at the new slug
   * and deletes the old one (Firestore doesn't support renaming doc IDs).
   * Also updates any event references from old slug to new slug.
   */
  async update(currentSlug: string, updateData: UpdateArtistDto): Promise<Artist> {
    // Verify the artist exists
    const existing = await this.firestoreService.get<Artist>(this.collection, currentSlug);
    if (!existing) {
      throw new NotFoundException(`Artist with slug "${currentSlug}" not found`);
    }

    const newSlug = updateData.slug && updateData.slug !== currentSlug
      ? updateData.slug
      : null;

    // If slug is changing, check the new slug isn't taken
    if (newSlug) {
      const conflict = await this.firestoreService.get<Artist>(this.collection, newSlug);
      if (conflict) {
        throw new ConflictException(`Artist with slug "${newSlug}" already exists`);
      }
    }

    // Build update payload (strip undefined fields)
    const payload: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (updateData.name !== undefined) payload.name = updateData.name;
    if (updateData.bio !== undefined) payload.bio = updateData.bio;
    if (updateData.genre !== undefined) payload.genre = updateData.genre;
    if (updateData.genres !== undefined) payload.genres = updateData.genres;
    if (updateData.imageUrl !== undefined) payload.imageUrl = updateData.imageUrl;
    if (updateData.userId !== undefined) payload.userId = updateData.userId;
    if (updateData.userDisplayName !== undefined) payload.userDisplayName = updateData.userDisplayName;
    if (updateData.soundcloudUrl !== undefined) payload.soundcloudUrl = updateData.soundcloudUrl;
    if (updateData.spotifyUrl !== undefined) payload.spotifyUrl = updateData.spotifyUrl;
    if (updateData.facebookUrl !== undefined) payload.facebookUrl = updateData.facebookUrl;
    if (updateData.instagramUrl !== undefined) payload.instagramUrl = updateData.instagramUrl;

    if (newSlug) {
      // Slug rename: create new doc, update event refs, delete old doc
      payload.slug = newSlug;
      const newDoc = { ...existing, ...payload };
      delete (newDoc as Record<string, unknown>).id; // id is derived from doc path

      await this.firestoreService.set(this.collection, newSlug, newDoc);

      // Update event references
      await this.updateEventReferences(currentSlug, newSlug);

      // Delete old doc
      await this.firestoreService.delete(this.collection, currentSlug);

      return await this.findOne(newSlug);
    } else {
      // Simple update in place
      if (updateData.slug) payload.slug = updateData.slug;
      await this.firestoreService.update(this.collection, currentSlug, payload);
      return await this.findOne(currentSlug);
    }
  }

  /**
   * When an artist slug changes, update all events that reference the old slug.
   */
  private async updateEventReferences(oldSlug: string, newSlug: string): Promise<void> {
    const events = await this.firestoreService.query<{ id?: string; artists: string[] }>(
      'events',
      'artists',
      'array-contains',
      oldSlug,
    );

    for (const event of events) {
      if (!event.id) continue;
      const updatedArtists = event.artists.map((a) => a === oldSlug ? newSlug : a);
      await this.firestoreService.update('events', event.id, { artists: updatedArtists });
    }
  }

  async delete(slug: string): Promise<void> {
    const existing = await this.firestoreService.get<Artist>(this.collection, slug);
    if (!existing) {
      throw new NotFoundException(`Artist with slug "${slug}" not found`);
    }
    await this.firestoreService.delete(this.collection, slug);
  }
}
