import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { FirestoreService } from '../config/firestore/firestore.service';
import { CreateEventDto } from '../auth/dto/create-event.dto';
import { UpdateEventDto } from '../auth/dto/update-event.dto';
import { Event, EventArtistCacheEntry } from './event.interface';
import { ArtistsService } from '../artists/artists.service';
import { computeFestivalDay, rangesOverlap } from './festival-day.util';

const DEFAULT_BLOCK_TYPE = 'artist_set' as const;

@Injectable()
export class EventsService {
  private readonly collection = 'events';
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private readonly firestoreService: FirestoreService,
    private readonly artistsService: ArtistsService,
  ) {}

  /**
   * Build the denormalized artistsCache array from the current Artist records
   * for the given artist slugs/IDs. Source of truth remains the Artist doc —
   * this is a read-time snapshot cached onto the Event for N+1-free lineups.
   */
  private async buildArtistsCache(
    artistIds: string[],
  ): Promise<EventArtistCacheEntry[]> {
    const entries = await Promise.all(
      artistIds.map(async (id) => {
        try {
          const artist = await this.artistsService.findOne(id);
          if (!artist) return null;
          const entry: EventArtistCacheEntry = {
            id: artist.slug ?? artist.id ?? id,
            name: artist.name,
          };
          if (artist.imageUrl) entry.imageUrl = artist.imageUrl;
          if (artist.bio) entry.bio = artist.bio;
          if (artist.genres) entry.genres = artist.genres;
          return entry;
        } catch {
          // Artist not found — skip rather than fail the event save
          return null;
        }
      }),
    );
    return entries.filter((e): e is EventArtistCacheEntry => e !== null);
  }

  /**
   * Hard-reject (issue #167) any event whose time range overlaps an existing
   * event on the same stage + festivalDay. Checked against festivalDay (not raw
   * `date`) so cross-midnight conflicts are caught — e.g. an 11pm–1am block and
   * a 12:30am–2am block on the same festival night conflict despite differing
   * calendar `date` values.
   *
   * @param excludeId event id to ignore (the event being updated).
   */
  private async assertNoOverlap(
    stage: string,
    festivalDay: string,
    startTime: string,
    endTime: string,
    excludeId?: string,
  ): Promise<void> {
    const peers = await this.queryCompound<Event>(this.collection, [
      { field: 'stage', operator: '==', value: stage },
      { field: 'festivalDay', operator: '==', value: festivalDay },
    ]);

    for (const peer of peers) {
      if (peer.id === excludeId) continue;
      if (!peer.startTime || !peer.endTime) continue;
      if (rangesOverlap(startTime, endTime, peer.startTime, peer.endTime)) {
        throw new BadRequestException(
          `Time conflict on stage "${stage}": overlaps "${peer.name}" ` +
            `(${peer.startTime}–${peer.endTime}) on festival day ${festivalDay}.`,
        );
      }
    }
  }

  /**
   * Create a new event
   */
  async create(createEventDto: CreateEventDto): Promise<Event> {
    const artistsCache = createEventDto.artists?.length
      ? await this.buildArtistsCache(createEventDto.artists)
      : [];

    // Server-computed schedule fields (issue #166). festivalDay is derived,
    // never accepted from the client; blockType defaults to artist_set.
    const festivalDay = computeFestivalDay(
      createEventDto.date,
      createEventDto.startTime,
    );
    const blockType = createEventDto.blockType ?? DEFAULT_BLOCK_TYPE;

    // Reject overlapping same-stage/same-festivalDay events (#167).
    await this.assertNoOverlap(
      createEventDto.stage,
      festivalDay,
      createEventDto.startTime,
      createEventDto.endTime,
    );

    const { id, data } = await this.firestoreService.create<
      CreateEventDto & {
        artistsCache: EventArtistCacheEntry[];
        festivalDay: string;
        blockType:
          | typeof DEFAULT_BLOCK_TYPE
          | NonNullable<CreateEventDto['blockType']>;
      }
    >(this.collection, {
      ...createEventDto,
      blockType,
      festivalDay,
      artistsCache,
    });

    return { id, ...data } as Event;
  }

  /**
   * Find an event by ID
   */
  async findById(id: string): Promise<Event | null> {
    const eventData = await this.firestoreService.get<Omit<Event, 'id'>>(
      this.collection,
      id,
    );

    if (!eventData) {
      throw new NotFoundException('Event not found');
    }

    return { id, ...eventData } as Event;
  }
  async queryCompound<T>(
    collection: string,
    conditions: Array<{ field: string; operator: string; value: any }>,
  ): Promise<T[]> {
    const collectionRef = this.firestoreService.collection(collection);
    let query: FirebaseFirestore.Query = collectionRef;

    conditions.forEach((condition) => {
      query = query.where(
        condition.field,
        condition.operator as FirebaseFirestore.WhereFilterOp,
        condition.value,
      );
    });

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as T));
  }
  /**
   * Find all events with optional filtering
   */
  async findAll(stage?: string, date?: string): Promise<Event[]> {
    let events: Event[];

    if (stage && date) {
      // Filter by both stage and date
      events = await this.queryCompound<Event>(this.collection, [
        { field: 'stage', operator: '==', value: stage },
        { field: 'date', operator: '==', value: date },
      ]);
    } else if (stage) {
      // Filter by stage only
      events = await this.firestoreService.query<Event>(
        this.collection,
        'stage',
        '==',
        stage,
      );
    } else if (date) {
      // Filter by date only
      events = await this.firestoreService.query<Event>(
        this.collection,
        'date',
        '==',
        date,
      );
    } else {
      // No filter, return all events
      events = await this.firestoreService.getAll<Event>(this.collection);
    }

    // Only return current year (2026) events — 2025 events are archived
    events = events.filter((e) => !e.year || e.year === 2026);

    // Sort events by date and start time with error handling
    return events.sort((a, b) => {
      try {
        // Ensure date and startTime exist and are strings
        const dateA = a.date || '';
        const dateB = b.date || '';
        const startTimeA = a.startTime || '';
        const startTimeB = b.startTime || '';

        // First compare by date
        const dateComparison = dateA.localeCompare(dateB);
        if (dateComparison !== 0) return dateComparison;

        // If same date, compare by start time
        return startTimeA.localeCompare(startTimeB);
      } catch (error) {
        this.logger.error('Error sorting events:', error);
        return 0; // Keep original order if sorting fails
      }
    });
  }

  /**
   * Update an event
   */
  async update(id: string, updateEventDto: UpdateEventDto): Promise<Event> {
    const event = await this.findById(id);

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Strip undefined/null values — Firestore rejects undefined
    const cleanData: Record<string, unknown> = Object.fromEntries(
      Object.entries(updateEventDto).filter(
        ([_, v]) => v !== undefined && v !== null,
      ),
    );

    // Refresh the artist cache whenever the artists array changes (or is present)
    if (updateEventDto.artists) {
      cleanData.artistsCache = await this.buildArtistsCache(
        updateEventDto.artists,
      );
    }

    // Recompute festivalDay if date or startTime changed. festivalDay is
    // always derived server-side (issue #166) — never trusted from the client
    // even if a stray value is sent.
    const timingChanged =
      updateEventDto.date !== undefined ||
      updateEventDto.startTime !== undefined;
    const nextDate = updateEventDto.date ?? event.date;
    const nextStart = updateEventDto.startTime ?? event.startTime;
    const nextEnd = updateEventDto.endTime ?? event.endTime;
    const nextStage = updateEventDto.stage ?? event.stage;
    const nextFestivalDay = timingChanged
      ? computeFestivalDay(nextDate, nextStart)
      : event.festivalDay ?? computeFestivalDay(nextDate, nextStart);

    if (timingChanged) {
      cleanData.festivalDay = nextFestivalDay;
    }

    // Re-check overlap (#167) whenever stage or any time field changes.
    if (
      updateEventDto.stage !== undefined ||
      updateEventDto.date !== undefined ||
      updateEventDto.startTime !== undefined ||
      updateEventDto.endTime !== undefined
    ) {
      await this.assertNoOverlap(
        nextStage,
        nextFestivalDay,
        nextStart,
        nextEnd,
        id,
      );
    }

    if (Object.keys(cleanData).length === 0) {
      return event;
    }

    await this.firestoreService.update<Event>(this.collection, id, cleanData);

    // Return updated event
    return { ...event, ...cleanData };
  }

  /**
   * Delete an event
   */
  async remove(id: string): Promise<void> {
    const event = await this.findById(id);

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    await this.firestoreService.delete(this.collection, id);
  }

  /**
   * Find events by artist
   */
  async findByArtist(artistId: string): Promise<Event[]> {
    const events = await this.firestoreService.query<Event>(
      this.collection,
      'artists',
      'array-contains',
      artistId,
    );

    return events;
  }

  /**
   * Refresh artistsCache on every event that references the given artist slug/ID.
   * Called by ArtistsService whenever an artist is edited, so admins never need
   * to manually re-save events for the cache to reflect artist changes.
   */
  async refreshArtistsCacheForArtist(artistId: string): Promise<void> {
    const events = await this.findByArtist(artistId);
    for (const event of events) {
      const artistsCache = await this.buildArtistsCache(event.artists);
      await this.firestoreService.update<Event>(this.collection, event.id, {
        artistsCache,
      });
    }
  }

  /**
   * Backfill `festivalDay` (computed) and `blockType` (default 'artist_set')
   * onto existing events that predate the Schedule Editor (issue #166).
   * Idempotent: only writes docs missing/stale on either field, so it is safe
   * to run repeatedly. Returns a small summary for operational visibility.
   */
  async backfillScheduleFields(): Promise<{
    scanned: number;
    updated: number;
    skipped: number;
  }> {
    const events = await this.firestoreService.getAll<Event>(this.collection);
    let updated = 0;
    let skipped = 0;

    for (const event of events) {
      const patch: Record<string, unknown> = {};

      if (!event.blockType) {
        patch.blockType = DEFAULT_BLOCK_TYPE;
      }

      // Only compute when we have the inputs; malformed legacy docs are skipped
      // rather than throwing and aborting the whole backfill.
      if (event.date && event.startTime) {
        try {
          const expected = computeFestivalDay(event.date, event.startTime);
          if (event.festivalDay !== expected) {
            patch.festivalDay = expected;
          }
        } catch (err) {
          this.logger.warn(
            `backfill: skipping festivalDay for event ${event.id}: ${
              (err as Error).message
            }`,
          );
        }
      }

      if (Object.keys(patch).length === 0) {
        skipped++;
        continue;
      }

      await this.firestoreService.update<Event>(
        this.collection,
        event.id,
        patch,
      );
      updated++;
    }

    this.logger.log(
      `backfillScheduleFields: scanned=${events.length} updated=${updated} skipped=${skipped}`,
    );
    return { scanned: events.length, updated, skipped };
  }

  /**
   * Get unique stages from all events
   */
  async getUniqueStages(): Promise<string[]> {
    const events = await this.firestoreService.getAll<Event>(this.collection);
    const uniqueStages = Array.from(new Set(events.map((event) => event.stage)))
      .filter((stage) => stage && stage.trim() !== '') // Filter out empty/null stages
      .sort(); // Sort alphabetically
    return uniqueStages;
  }

  /**
   * Get all genres from Firestore
   */
  async getAllGenres(): Promise<{ id: string; tag: string }[]> {
    return this.firestoreService.getAll('genres');
  }
}
