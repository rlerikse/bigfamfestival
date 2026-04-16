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
      shareMySchedule: userData.shareMySchedule ?? true,
      ticketType: userData.ticketType ?? 'need-ticket',
      notificationsEnabled: userData.notificationsEnabled ?? true,
      createdAt: now,
      updatedAt: now,
    };

    await this.firestoreService.set(this.collection, id, data);
    return { id, ...data } as User;
  }

  /**
   * Find a user by ID, with email fallback for pre-migration users.
   * If no doc exists for the given ID but one exists for the email,
   * migrates the old doc to the new ID (Auth UID), sets custom claims,
   * and returns it.
   */
  async findById(id: string, email?: string): Promise<User | null> {
    const userData = await this.firestoreService.get<Omit<User, 'id'>>(
      this.collection,
      id,
    );

    if (userData) {
      return { id, ...userData } as User;
    }

    // Fallback: look up by email for pre-migration users whose doc ID
    // doesn't match their Firebase Auth UID
    if (email) {
      const byEmail = await this.findByEmail(email);
      if (byEmail && byEmail.id !== id) {
        // Migrate: copy old doc to new ID (Auth UID), preserve all data
        const { id: oldId, ...data } = byEmail;
        await this.firestoreService.set(this.collection, id, {
          ...data,
          updatedAt: new Date(),
        });

        // Sync role to Firebase Auth custom claims so RBAC guard works
        if (data.role) {
          try {
            const admin = await import('firebase-admin');
            await admin.auth().setCustomUserClaims(id, { role: data.role });
          } catch (e) {
            // Non-fatal — custom claims will be set on next opportunity
            console.warn('Failed to set custom claims during migration:', e.message);
          }
        }

        return { id, ...data } as User;
      }
    }

    throw new NotFoundException('User not found');
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
      updateData,
    );

    // Sync role to Firebase Auth custom claims if role changed
    if ('role' in updateData && updateData.role) {
      try {
        const adminSdk = await import('firebase-admin');
        await adminSdk.auth().setCustomUserClaims(id, { role: updateData.role });
      } catch (e) {
        console.warn('Failed to sync role to custom claims:', e.message);
      }
    }

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
