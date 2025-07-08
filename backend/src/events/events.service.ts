import { Injectable, NotFoundException } from '@nestjs/common';
import { FirestoreService } from '../config/firestore/firestore.service';
import { CreateEventDto } from '../auth/dto/create-event.dto';
import { UpdateEventDto } from '../auth/dto/update-event.dto';
import { Event } from './event.interface';

@Injectable()
export class EventsService {
  private readonly collection = 'events';

  constructor(private readonly firestoreService: FirestoreService) {}

  /**
   * Create a new event
   */
  async create(createEventDto: CreateEventDto): Promise<Event> {
    const { id, data } = await this.firestoreService.create<CreateEventDto>(
      this.collection,
      createEventDto,
    );

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

    // Sort events by date and start time
    return events.sort((a, b) => {
      // First compare by date
      const dateComparison = a.date.localeCompare(b.date);
      if (dateComparison !== 0) return dateComparison;

      // If same date, compare by start time
      return a.startTime.localeCompare(b.startTime);
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

    await this.firestoreService.update<Event>(
      this.collection,
      id,
      updateEventDto,
    );

    // Return updated event
    return { ...event, ...updateEventDto };
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
   * Get unique stages from all events
   */
  async getUniqueStages(): Promise<string[]> {
    const events = await this.firestoreService.getAll<Event>(this.collection);
    const uniqueStages = Array.from(new Set(events.map((event) => event.stage)))
      .filter((stage) => stage && stage.trim() !== '') // Filter out empty/null stages
      .sort(); // Sort alphabetically
    return uniqueStages;
  }
}
