import { Injectable, Logger } from '@nestjs/common';
import { FirestoreService } from '../config/firestore/firestore.service';
import { UsersService } from '../users/users.service';
import { EventsService } from '../events/events.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ShiftsService } from '../shifts/shifts.service';
import { ScheduleService } from '../schedule/schedule.service';
import { AdminUpdateUserDto } from '../users/dto/admin-update-user.dto';
import { CreateEventDto } from '../auth/dto/create-event.dto';
import { UpdateEventDto } from '../auth/dto/update-event.dto';
import { CreateShiftDto } from '../shifts/dto/create-shift.dto';
import { UpdateShiftDto } from '../shifts/dto/update-shift.dto';
import { Event } from '../events/event.interface';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly firestoreService: FirestoreService,
    private readonly usersService: UsersService,
    private readonly eventsService: EventsService,
    private readonly notificationsService: NotificationsService,
    private readonly shiftsService: ShiftsService,
    private readonly scheduleService: ScheduleService,
  ) {}

  // ── Stats ──────────────────────────────────────────────────────────

  async getStats(): Promise<{
    totalUsers: number;
    totalEvents: number;
    totalNotifications: number;
    usersByRole: Record<string, number>;
  }> {
    const [users, events, notifications] = await Promise.all([
      this.firestoreService.getAll<{ role?: string }>('users'),
      this.firestoreService.getAll('events'),
      this.firestoreService.getAll('notifications'),
    ]);

    const usersByRole: Record<string, number> = {};
    for (const user of users) {
      const role = user.role || 'attendee';
      usersByRole[role] = (usersByRole[role] || 0) + 1;
    }

    return {
      totalUsers: users.length,
      totalEvents: events.length,
      totalNotifications: notifications.length,
      usersByRole,
    };
  }

  // ── User Management ────────────────────────────────────────────────

  async listUsers(
    search?: string,
    role?: string,
    page = 1,
    limit = 20,
  ): Promise<{
    users: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // TODO: move filtering to Firestore query when user count exceeds 1K
    let users = await this.firestoreService.getAll<any>('users');

    // Filter by role
    if (role) {
      users = users.filter((u) => u.role === role);
    }

    // Filter by search (name or email, case-insensitive)
    if (search) {
      const q = search.toLowerCase();
      users = users.filter(
        (u) =>
          (u.name && u.name.toLowerCase().includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q)),
      );
    }

    // Sort by name
    users.sort((a, b) =>
      (a.name || '').localeCompare(b.name || ''),
    );

    const total = users.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginatedUsers = users.slice(start, start + limit);

    return { users: paginatedUsers, total, page, limit, totalPages };
  }

  async getUser(id: string) {
    return this.usersService.findById(id);
  }

  async updateUser(id: string, dto: AdminUpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  // ── Event Management ───────────────────────────────────────────────

  async createEvent(dto: CreateEventDto) {
    return this.eventsService.create(dto);
  }

  async updateEvent(id: string, dto: UpdateEventDto) {
    return this.eventsService.update(id, dto);
  }

  async deleteEvent(id: string) {
    return this.eventsService.remove(id);
  }

  // ── Shift Management ──────────────────────────────────────────────

  async listShifts(filters?: { date?: string; role?: string }) {
    return this.shiftsService.findAll(filters);
  }

  async createShift(dto: CreateShiftDto) {
    return this.shiftsService.create(dto);
  }

  async updateShift(id: string, dto: UpdateShiftDto) {
    return this.shiftsService.update(id, dto);
  }

  async deleteShift(id: string) {
    return this.shiftsService.remove(id);
  }

  // ── Schedule Management ────────────────────────────────────────────

  async getUserSchedule(userId: string): Promise<Event[]> {
    return this.scheduleService.getSchedule(userId);
  }

  async setUserSchedule(
    userId: string,
    eventIds: string[],
  ): Promise<Event[]> {
    // Clear existing schedule
    const existing = await this.scheduleService.getSchedule(userId);
    await Promise.all(
      existing.map((e) =>
        this.scheduleService.removeFromSchedule(userId, { event_id: e.id }),
      ),
    );

    // Add new events
    await Promise.all(
      eventIds.map((id) =>
        this.scheduleService.addToSchedule(userId, { event_id: id }),
      ),
    );

    return this.scheduleService.getSchedule(userId);
  }

  async addToUserSchedule(userId: string, eventId: string) {
    return this.scheduleService.addToSchedule(userId, {
      event_id: eventId,
    });
  }

  async removeFromUserSchedule(userId: string, eventId: string) {
    return this.scheduleService.removeFromSchedule(userId, {
      event_id: eventId,
    });
  }
}
