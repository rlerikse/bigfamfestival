import { Injectable, NotFoundException } from '@nestjs/common';
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
    try {
      await this.eventsService.findById(createScheduleItemDto.event_id);
    } catch (error) {
      throw new NotFoundException(
        `Event with ID "${createScheduleItemDto.event_id}" not found`,
      );
    }

    const existingItems = await this.firestoreService.query<ScheduleItem>(
      this.collectionName,
      'userId',
      '==',
      userId,
    );

    const existingItem = existingItems.find(
      (item) => item.eventId === createScheduleItemDto.event_id,
    );

    if (existingItem) {
      return existingItem;
    }

    const scheduleItem: Omit<ScheduleItem, 'id'> = {
      userId,
      eventId: createScheduleItemDto.event_id,
      createdAt: new Date(),
    };

    const result = await this.firestoreService.create(
      this.collectionName,
      scheduleItem,
    );

    return {
      id: result.id,
      ...result.data,
    };
  }

  async removeFromSchedule(
    userId: string,
    removeScheduleItemDto: RemoveScheduleItemDto,
  ): Promise<void> {
    // Validate userId
    if (!userId) {
      throw new Error('UserId is required');
    }
    const scheduleItems = await this.firestoreService.query<ScheduleItem>(
      this.collectionName,
      'userId',
      '==',
      userId,
    );

    const itemToRemove = scheduleItems.find(
      (item) => item.eventId === removeScheduleItemDto.event_id,
    );

    if (!itemToRemove) {
      throw new NotFoundException(
        `Event with ID "${removeScheduleItemDto.event_id}" not found in schedule`,
      );
    }

    await this.firestoreService.delete(this.collectionName, itemToRemove.id);
  }

  async getSchedule(userId: string): Promise<Event[]> {
    // Validate userId
    if (!userId) {
      throw new Error('UserId is required');
    }
    const scheduleItems = await this.firestoreService.query<ScheduleItem>(
      this.collectionName,
      'userId',
      '==',
      userId,
    );

    if (scheduleItems.length === 0) {
      return [];
    }

    const eventIds = scheduleItems.map((item) => item.eventId);

    const eventPromises = eventIds.map((id) => this.eventsService.findById(id));
    const eventsWithNulls = await Promise.all(eventPromises);
    const events = eventsWithNulls.filter((event) => event !== null) as Event[];

    // Sort events by date and start time
    return events.sort((a: Event, b: Event) => {
      const dateTimeA = new Date(`${a.date}T${a.startTime}`);
      const dateTimeB = new Date(`${b.date}T${b.startTime}`);
      return dateTimeA.getTime() - dateTimeB.getTime();
    });
  }
}
