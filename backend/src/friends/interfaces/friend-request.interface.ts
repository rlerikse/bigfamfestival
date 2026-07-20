export type FriendRequestStatus = 'pending' | 'accepted' | 'declined';

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: FriendRequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Lightweight friend record stored in each user's `friends` subcollection.
 * Keyed by the friend's userId.
 */
export interface FriendEntry {
  userId: string;      // the friend's uid
  name: string;        // denormalized for display — updated on profile change
  profilePictureUrl?: string;
  addedAt: Date;
}
