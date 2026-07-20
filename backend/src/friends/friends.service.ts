import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { FirestoreService } from '../config/firestore/firestore.service';
import {
  FriendRequest,
  FriendEntry,
} from './interfaces/friend-request.interface';
import { User } from '../users/interfaces/user.interface';

@Injectable()
export class FriendsService {
  private readonly requestsCollection = 'friendRequests';
  private readonly usersCollection = 'users';

  constructor(private readonly firestoreService: FirestoreService) {}

  // ─── User Lookup ──────────────────────────────────────────────────────────

  /**
   * Search for users by display name (case-insensitive prefix).
   * Returns max 20 results, excluding the requester.
   */
  async searchUsers(query: string, requesterId: string): Promise<Partial<User>[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const all = await this.firestoreService.getAll<User & { id: string }>(
      this.usersCollection,
    );

    const q = query.trim().toLowerCase();
    return all
      .filter(
        (u) =>
          u.id !== requesterId &&
          (u.name?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().startsWith(q)),
      )
      .slice(0, 20)
      .map((u) => ({
        id: u.id,
        name: u.name,
        profilePictureUrl: u.profilePictureUrl,
      }));
  }

  // ─── Friend Requests ──────────────────────────────────────────────────────

  /**
   * Send a friend request from fromUserId → toUserId.
   * Rejects if a pending/accepted request already exists in either direction.
   */
  async sendRequest(fromUserId: string, toUserId: string): Promise<FriendRequest> {
    if (fromUserId === toUserId) {
      throw new BadRequestException('Cannot send a friend request to yourself');
    }

    // Check for existing request in either direction
    const existing = await this.firestoreService.query<FriendRequest>(
      this.requestsCollection,
      'status',
      'in',
      ['pending', 'accepted'],
    );

    const duplicate = existing.find(
      (r) =>
        (r.fromUserId === fromUserId && r.toUserId === toUserId) ||
        (r.fromUserId === toUserId && r.toUserId === fromUserId),
    );

    if (duplicate) {
      if (duplicate.status === 'accepted') {
        throw new ConflictException('You are already friends with this user');
      }
      throw new ConflictException('A pending friend request already exists');
    }

    const now = new Date();
    const requestData: Omit<FriendRequest, 'id'> = {
      fromUserId,
      toUserId,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    const { id } = await this.firestoreService.create<Omit<FriendRequest, 'id'>>(
      this.requestsCollection,
      requestData,
    );

    return { id, ...requestData };
  }

  /**
   * Accept or decline a pending friend request.
   * Only the recipient (toUserId) may respond.
   */
  async respondToRequest(
    requestId: string,
    responderId: string,
    status: 'accepted' | 'declined',
  ): Promise<FriendRequest> {
    const requestData = await this.firestoreService.get<Omit<FriendRequest, 'id'>>(
      this.requestsCollection,
      requestId,
    );

    if (!requestData) {
      throw new NotFoundException('Friend request not found');
    }

    if (requestData.toUserId !== responderId) {
      throw new BadRequestException('Only the recipient can respond to this request');
    }

    if (requestData.status !== 'pending') {
      throw new BadRequestException('This request has already been resolved');
    }

    const now = new Date();
    await this.firestoreService.update(this.requestsCollection, requestId, {
      status,
      updatedAt: now,
    });

    const updated: FriendRequest = {
      id: requestId,
      ...requestData,
      status,
      updatedAt: now,
    };

    // If accepted, write a FriendEntry to each user's friends subcollection
    if (status === 'accepted') {
      await this.addFriendEntries(requestData.fromUserId, requestData.toUserId);
    }

    return updated;
  }

  /**
   * Get all pending incoming requests for a user.
   */
  async getIncomingRequests(userId: string): Promise<FriendRequest[]> {
    // Use db directly for compound query
    const db = this.firestoreService.db;
    const snapshot = await db
      .collection(this.requestsCollection)
      .where('toUserId', '==', userId)
      .where('status', '==', 'pending')
      .get();
    const results = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as FriendRequest));
    return results;
  }

  /**
   * Get all pending outgoing requests sent by a user.
   */
  async getOutgoingRequests(userId: string): Promise<FriendRequest[]> {
    const db = this.firestoreService.db;
    const snapshot = await db
      .collection(this.requestsCollection)
      .where('fromUserId', '==', userId)
      .where('status', '==', 'pending')
      .get();
    const results = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as FriendRequest));
    return results;
  }

  /**
   * Cancel an outgoing friend request (sender only).
   */
  async cancelRequest(requestId: string, requesterId: string): Promise<void> {
    const requestData = await this.firestoreService.get<Omit<FriendRequest, 'id'>>(
      this.requestsCollection,
      requestId,
    );

    if (!requestData) {
      throw new NotFoundException('Friend request not found');
    }

    if (requestData.fromUserId !== requesterId) {
      throw new BadRequestException('Only the sender can cancel this request');
    }

    if (requestData.status !== 'pending') {
      throw new BadRequestException('Cannot cancel a request that has been resolved');
    }

    await this.firestoreService.delete(this.requestsCollection, requestId);
  }

  // ─── Friends List ─────────────────────────────────────────────────────────

  /**
   * Get the friend list for a user (from friends subcollection).
   */
  async getFriends(userId: string): Promise<FriendEntry[]> {
    const db = this.firestoreService.db;
    const snapshot = await db
      .collection(this.usersCollection)
      .doc(userId)
      .collection('friends')
      .get();

    return snapshot.docs.map((doc) => ({
      userId: doc.id,
      ...(doc.data() as Omit<FriendEntry, 'userId'>),
    }));
  }

  /**
   * Remove a friend (mutual — removes from both sides).
   */
  async removeFriend(userId: string, friendId: string): Promise<void> {
    const db = this.firestoreService.db;
    const batch = db.batch();

    batch.delete(
      db.collection(this.usersCollection).doc(userId).collection('friends').doc(friendId),
    );
    batch.delete(
      db.collection(this.usersCollection).doc(friendId).collection('friends').doc(userId),
    );

    await batch.commit();
  }

  // ─── Friend Location/Campsite ─────────────────────────────────────────────

  /**
   * Get campsite locations for all friends who have shareMyCampsite=true.
   */
  async getFriendCampsites(
    userId: string,
  ): Promise<Array<{ userId: string; name: string; profilePictureUrl?: string; lat: number; lng: number }>> {
    const friends = await this.getFriends(userId);
    if (friends.length === 0) return [];

    const db = this.firestoreService.db;
    const results: Array<{
      userId: string;
      name: string;
      profilePictureUrl?: string;
      lat: number;
      lng: number;
    }> = [];

    await Promise.all(
      friends.map(async (friend) => {
        try {
          // Check sharing preference
          const userDoc = await db
            .collection(this.usersCollection)
            .doc(friend.userId)
            .get();
          const userData = userDoc.data() as User | undefined;
          if (!userData?.shareMyCampsite) return;

          // Fetch campsite
          const campsiteDoc = await db
            .collection('campsites')
            .doc(friend.userId)
            .get();
          const campsite = campsiteDoc.data();
          if (!campsite?.location_lat || !campsite?.location_long) return;

          results.push({
            userId: friend.userId,
            name: friend.name,
            profilePictureUrl: friend.profilePictureUrl,
            lat: campsite.location_lat,
            lng: campsite.location_long,
          });
        } catch {
          // One friend failing shouldn't break the whole response
        }
      }),
    );

    return results;
  }

  /**
   * Get live locations for all friends who have shareMyLocation=true.
   */
  async getFriendLocations(
    userId: string,
  ): Promise<Array<{ userId: string; name: string; profilePictureUrl?: string; lat: number; lng: number; updatedAt: Date }>> {
    const friends = await this.getFriends(userId);
    if (friends.length === 0) return [];

    const db = this.firestoreService.db;
    const results: Array<{
      userId: string;
      name: string;
      profilePictureUrl?: string;
      lat: number;
      lng: number;
      updatedAt: Date;
    }> = [];

    await Promise.all(
      friends.map(async (friend) => {
        try {
          const userDoc = await db
            .collection(this.usersCollection)
            .doc(friend.userId)
            .get();
          const userData = userDoc.data() as User | undefined;
          if (!userData?.shareMyLocation) return;

          const locationDoc = await db
            .collection('userLocations')
            .doc(friend.userId)
            .get();
          const location = locationDoc.data();
          if (!location?.lat || !location?.lng) return;

          results.push({
            userId: friend.userId,
            name: friend.name,
            profilePictureUrl: friend.profilePictureUrl,
            lat: location.lat,
            lng: location.lng,
            updatedAt: location.updatedAt?.toDate?.() ?? new Date(),
          });
        } catch {
          // One friend failing shouldn't break the whole response
        }
      }),
    );

    return results;
  }

  // ─── Internal ─────────────────────────────────────────────────────────────

  /**
   * Write FriendEntry records to both users' friends subcollections.
   * Called after a request is accepted.
   */
  private async addFriendEntries(userAId: string, userBId: string): Promise<void> {
    const db = this.firestoreService.db;

    const [userADoc, userBDoc] = await Promise.all([
      db.collection(this.usersCollection).doc(userAId).get(),
      db.collection(this.usersCollection).doc(userBId).get(),
    ]);

    const userA = userADoc.data() as User | undefined;
    const userB = userBDoc.data() as User | undefined;

    const now = new Date();
    const batch = db.batch();

    // Write B into A's friends subcollection
    batch.set(
      db.collection(this.usersCollection).doc(userAId).collection('friends').doc(userBId),
      {
        name: userB?.name ?? 'Unknown',
        profilePictureUrl: userB?.profilePictureUrl ?? null,
        addedAt: now,
      },
    );

    // Write A into B's friends subcollection
    batch.set(
      db.collection(this.usersCollection).doc(userBId).collection('friends').doc(userAId),
      {
        name: userA?.name ?? 'Unknown',
        profilePictureUrl: userA?.profilePictureUrl ?? null,
        addedAt: now,
      },
    );

    await batch.commit();
  }
}
