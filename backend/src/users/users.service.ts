import { Injectable, NotFoundException } from '@nestjs/common';
import { FirestoreService } from '../config/firestore/firestore.service';
import { User } from './interfaces/user.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly collection = 'users';

  constructor(private readonly firestoreService: FirestoreService) {}

  /**
   * Create a new user
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    const { id, data } = await this.firestoreService.create<CreateUserDto>(
      this.collection,
      createUserDto,
    );

    return { id, ...data } as User;
  }

  /**
   * Create a user with a specific ID (e.g., Firebase UID)
   */
  async createWithId(id: string, userData: Partial<User>): Promise<User> {
    const now = new Date();
    const data = {
      ...userData,
      shareMyCampsite: userData.shareMyCampsite ?? false,
      shareMyLocation: userData.shareMyLocation ?? false,
      ticketType: userData.ticketType ?? 'need-ticket',
      notificationsEnabled: userData.notificationsEnabled ?? true,
      createdAt: now,
      updatedAt: now,
    };

    await this.firestoreService.set(this.collection, id, data);
    return { id, ...data } as User;
  }

  /**
   * Find a user by ID
   */
  async findById(id: string): Promise<User | null> {
    const userData = await this.firestoreService.get<Omit<User, 'id'>>(
      this.collection,
      id,
    );

    if (!userData) {
      throw new NotFoundException('User not found');
    }

    return { id, ...userData } as User;
  }

  /**
   * Find a user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const users = await this.firestoreService.query<User>(
      this.collection,
      'email',
      '==',
      email,
    );

    return users.length ? users[0] : null;
  }

  /**
   * Update a user
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Convert DTO to plain object for Firestore
    const updateData = { ...updateUserDto };

    await this.firestoreService.update<User>(
      this.collection,
      id,
      updateData, // Use the plain object here
    );

    // Return updated user
    return { ...user, ...updateData };
  }

  /**
   * Delete a user
   */
  async remove(id: string): Promise<void> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.firestoreService.delete(this.collection, id);
  }

  /**
   * Update user's ticket type
   */
  async updateTicketType(id: string, ticketType: string): Promise<User> {
    return this.update(id, { ticketType });
  }
  /**
   * Update user's Expo push notification token
   */
  async updatePushToken(id: string, expoPushToken: string): Promise<User> {
    return this.update(id, { expoPushToken });
  }
  /**
   * Toggle user's notification settings
   */
  async toggleNotifications(id: string, enabled: boolean): Promise<User> {
    return this.update(id, { notificationsEnabled: enabled });
  }
  /**
   * Update user groups (for targeted notifications)
   */
  async updateUserGroups(id: string, userGroups: string[]): Promise<User> {
    return this.update(id, { userGroups });
  }
}
