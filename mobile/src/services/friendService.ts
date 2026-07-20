/**
 * friendService.ts
 *
 * Mobile service for all friends & social API calls.
 * Talks to backend /friends/* endpoints — no direct Firestore reads.
 */

import api from './api';
import { getIdToken } from './firebaseAuthService';

// ─── Types ────────────────────────────────────────────────────────────────────

export type FriendRequestStatus = 'pending' | 'accepted' | 'declined';

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: FriendRequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface FriendEntry {
  userId: string;
  name: string;
  profilePictureUrl?: string;
  addedAt: string;
}

export interface UserSearchResult {
  id: string;
  name: string;
  profilePictureUrl?: string;
}

export interface FriendCampsite {
  userId: string;
  name: string;
  profilePictureUrl?: string;
  lat: number;
  lng: number;
}

export interface FriendLocation extends FriendCampsite {
  updatedAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function authHeaders(): Promise<Record<string, string>> {
  try {
    const token = await getIdToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

// ─── User Lookup ──────────────────────────────────────────────────────────────

/**
 * Search for users by display name or email prefix.
 * Returns up to 20 results excluding yourself.
 */
export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  if (!query || query.trim().length < 2) return [];
  const headers = await authHeaders();
  const response = await api.get<UserSearchResult[]>('/friends/search', {
    params: { q: query.trim() },
    headers,
  });
  return response.data;
}

// ─── Friend Requests ──────────────────────────────────────────────────────────

/**
 * Send a friend request to another user.
 */
export async function sendFriendRequest(toUserId: string): Promise<FriendRequest> {
  const headers = await authHeaders();
  const response = await api.post<FriendRequest>('/friends/requests', { toUserId }, { headers });
  return response.data;
}

/**
 * Get all pending incoming friend requests.
 */
export async function getIncomingRequests(): Promise<FriendRequest[]> {
  const headers = await authHeaders();
  const response = await api.get<FriendRequest[]>('/friends/requests/incoming', { headers });
  return response.data;
}

/**
 * Get all pending outgoing friend requests.
 */
export async function getOutgoingRequests(): Promise<FriendRequest[]> {
  const headers = await authHeaders();
  const response = await api.get<FriendRequest[]>('/friends/requests/outgoing', { headers });
  return response.data;
}

/**
 * Accept a pending incoming request.
 */
export async function acceptFriendRequest(requestId: string): Promise<FriendRequest> {
  const headers = await authHeaders();
  const response = await api.patch<FriendRequest>(
    `/friends/requests/${requestId}`,
    { status: 'accepted' },
    { headers },
  );
  return response.data;
}

/**
 * Decline a pending incoming request.
 */
export async function declineFriendRequest(requestId: string): Promise<FriendRequest> {
  const headers = await authHeaders();
  const response = await api.patch<FriendRequest>(
    `/friends/requests/${requestId}`,
    { status: 'declined' },
    { headers },
  );
  return response.data;
}

/**
 * Cancel an outgoing request (sender only).
 */
export async function cancelFriendRequest(requestId: string): Promise<void> {
  const headers = await authHeaders();
  await api.delete(`/friends/requests/${requestId}`, { headers });
}

// ─── Friends List ─────────────────────────────────────────────────────────────

/**
 * Get the current user's friend list.
 */
export async function getFriends(): Promise<FriendEntry[]> {
  const headers = await authHeaders();
  const response = await api.get<FriendEntry[]>('/friends', { headers });
  return response.data;
}

/**
 * Remove a friend (mutual unfriend).
 */
export async function removeFriend(friendId: string): Promise<void> {
  const headers = await authHeaders();
  await api.delete(`/friends/${friendId}`, { headers });
}

// ─── Friend Location / Campsite ───────────────────────────────────────────────

/**
 * Get campsite locations for friends who have enabled campsite sharing.
 */
export async function getFriendCampsites(): Promise<FriendCampsite[]> {
  const headers = await authHeaders();
  const response = await api.get<FriendCampsite[]>('/friends/campsites', { headers });
  return response.data;
}

/**
 * Get live locations for friends who have enabled location sharing.
 */
export async function getFriendLocations(): Promise<FriendLocation[]> {
  const headers = await authHeaders();
  const response = await api.get<FriendLocation[]>('/friends/locations', { headers });
  return response.data;
}
