import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { FirestoreService } from '../config/firestore/firestore.service';
import { EventsService } from '../events/events.service';
import {
  ScheduleItem,
  CreateScheduleItemDto,
  RemoveScheduleItemDto,
} from './interfaces/schedule.interface';
import { Event } from '../events/event.interface';

@Injectable()
export class ScheduleService {
  private readonly collectionName = 'schedules';
  private readonly logger = new Logger(ScheduleService.name);

  constructor(
    private readonly firestoreService: FirestoreService,
    private readonly eventsService: EventsService,
  ) {}

  async addToSchedule(
    userId: string,
    createScheduleItemDto: CreateScheduleItemDto,
  ): Promise<ScheduleItem> {
    // Validate userId
    if (!userId) {
      throw new Error('UserId is required');
    }
    // Ensure event exists
    await this.eventsService.findById(createScheduleItemDto.event_id);

    // Reference the user's schedule document and items subcollection
    const userScheduleDoc = this.firestoreService.db
      .collection(this.collectionName)
      .doc(userId);
    const itemsCollection = userScheduleDoc.collection('items');
    const itemDocRef = itemsCollection.doc(createScheduleItemDto.event_id);
    const docSnapshot = await itemDocRef.get();

    if (docSnapshot.exists) {
      const data = docSnapshot.data();
      if (!data) {
        throw new NotFoundException(
          `Scheduled item for event ID "${createScheduleItemDto.event_id}" not found`,
        );
      }
      return {
        id: docSnapshot.id,
        userId,
        eventId: data.eventId,
        createdAt: data.createdAt.toDate(),
      };
    }

    const now = new Date();
    const scheduleItem: Omit<ScheduleItem, 'id'> = {
      userId,
      eventId: createScheduleItemDto.event_id,
      createdAt: now,
    };

    // Ensure parent document exists (optional merge)
    await userScheduleDoc.set({ userId }, { merge: true });
    // Add to subcollection
    await itemDocRef.set({ ...scheduleItem });

    return { id: itemDocRef.id, ...scheduleItem };
  }

  async removeFromSchedule(
    userId: string,
    removeScheduleItemDto: RemoveScheduleItemDto,
  ): Promise<void> {
    // Validate userId
    if (!userId) {
      throw new Error('UserId is required');
    }
    // Reference the user's schedule items
    const itemDocRef = this.firestoreService.db
      .collection(this.collectionName)
      .doc(userId)
      .collection('items')
      .doc(removeScheduleItemDto.event_id);

    const docSnapshot = await itemDocRef.get();
    if (!docSnapshot.exists) {
      throw new NotFoundException(
        `Event with ID "${removeScheduleItemDto.event_id}" not found in schedule`,
      );
    }
    await itemDocRef.delete();
  }

  async getSchedule(userId: string): Promise<Event[]> {
    // Validate userId
    if (!userId) {
      throw new Error('UserId is required');
    }
    // Reference items subcollection
    const itemsCollection = this.firestoreService.db
      .collection(this.collectionName)
      .doc(userId)
      .collection('items');

    const snapshot = await itemsCollection.get();
    if (snapshot.empty) {
      return [];
    }

    const eventIds = snapshot.docs.map((doc) => doc.id);
    // Fetch events with error handling for missing events
    const eventPromises = eventIds.map(async (id) => {
      try {
        return await this.eventsService.findById(id);
      } catch (error) {
        // Log the missing event but don't fail the entire request
        this.logger.warn(
          `Event with ID ${id} not found in events collection, removing from user schedule`,
        );
        // Optionally, clean up the invalid reference from the user's schedule
        try {
          const itemDocRef = this.firestoreService.db
            .collection(this.collectionName)
            .doc(userId)
            .collection('items')
            .doc(id);
          await itemDocRef.delete();
        } catch (cleanupError) {
          this.logger.error(
            `Failed to clean up invalid event reference ${id}:`,
            cleanupError,
          );
        }
        return null;
      }
    });
    const eventsWithNulls = await Promise.all(eventPromises);
    const events = eventsWithNulls.filter((e): e is Event => e !== null);

    // Sort events by date and start time
    return events.sort((a, b) => {
      const dateTimeA = new Date(`${a.date}T${a.startTime}`);
      const dateTimeB = new Date(`${b.date}T${b.startTime}`);
      return dateTimeA.getTime() - dateTimeB.getTime();
    });
  }
}
