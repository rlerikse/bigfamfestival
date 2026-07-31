/**
 * friendService.ts
 *
 * Mobile service for all friends & social API calls.
 * Talks to backend /friends/* endpoints — no direct Firestore reads.
 */

import api from './api';
import { getIdToken } from './firebaseAuthService';
import EventSource from 'react-native-sse';
import { API_URL } from '../config/constants';

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
  console.log(`[Friends] Searching users: "${query.trim()}"`);
  const headers = await authHeaders();
  const response = await api.get<UserSearchResult[]>('/friends/search', {
    params: { q: query.trim() },
    headers,
  });
  console.log(`[Friends] Search returned ${response.data.length} result(s)`);
  return response.data;
}

// ─── Friend Requests ──────────────────────────────────────────────────────────

/**
 * Send a friend request to another user.
 */
export async function sendFriendRequest(toUserId: string): Promise<FriendRequest> {
  console.log(`[Friends] Sending friend request to userId: ${toUserId}`);
  const headers = await authHeaders();
  const response = await api.post<FriendRequest>('/friends/requests', { toUserId }, { headers });
  console.log(`[Friends] Friend request sent — requestId: ${response.data.id}, status: ${response.data.status}`);
  return response.data;
}

/**
 * Get all pending incoming friend requests.
 */
export async function getIncomingRequests(): Promise<FriendRequest[]> {
  console.log('[Friends] Fetching incoming friend requests...');
  const headers = await authHeaders();
  const response = await api.get<FriendRequest[]>('/friends/requests/incoming', { headers });
  console.log(`[Friends] Incoming requests: ${response.data.length} pending`);
  return response.data;
}

/**
 * Get all pending outgoing friend requests.
 */
export async function getOutgoingRequests(): Promise<FriendRequest[]> {
  console.log('[Friends] Fetching outgoing friend requests...');
  const headers = await authHeaders();
  const response = await api.get<FriendRequest[]>('/friends/requests/outgoing', { headers });
  console.log(`[Friends] Outgoing requests: ${response.data.length} pending`);
  return response.data;
}

/**
 * Accept a pending incoming request.
 */
export async function acceptFriendRequest(requestId: string): Promise<FriendRequest> {
  console.log(`[Friends] Accepting request: ${requestId}`);
  const headers = await authHeaders();
  const response = await api.patch<FriendRequest>(
    `/friends/requests/${requestId}`,
    { status: 'accepted' },
    { headers },
  );
  console.log(`[Friends] Request accepted — now friends with userId: ${response.data.fromUserId}`);
  return response.data;
}

/**
 * Decline a pending incoming request.
 */
export async function declineFriendRequest(requestId: string): Promise<FriendRequest> {
  console.log(`[Friends] Declining request: ${requestId}`);
  const headers = await authHeaders();
  const response = await api.patch<FriendRequest>(
    `/friends/requests/${requestId}`,
    { status: 'declined' },
    { headers },
  );
  console.log(`[Friends] Request declined: ${requestId}`);
  return response.data;
}

/**
 * Cancel an outgoing request (sender only).
 */
export async function cancelFriendRequest(requestId: string): Promise<void> {
  console.log(`[Friends] Cancelling outgoing request: ${requestId}`);
  const headers = await authHeaders();
  await api.delete(`/friends/requests/${requestId}`, { headers });
  console.log(`[Friends] Request cancelled: ${requestId}`);
}

// ─── Friends List ─────────────────────────────────────────────────────────────

/**
 * Get the current user's friend list.
 */
export async function getFriends(): Promise<FriendEntry[]> {
  console.log('[Friends] Fetching friend list...');
  const headers = await authHeaders();
  const response = await api.get<FriendEntry[]>('/friends', { headers });
  console.log(`[Friends] Friend list loaded — ${response.data.length} friend(s)`);
  return response.data;
}

/**
 * Remove a friend (mutual unfriend).
 */
export async function removeFriend(friendId: string): Promise<void> {
  console.log(`[Friends] Removing friend: ${friendId}`);
  const headers = await authHeaders();
  await api.delete(`/friends/${friendId}`, { headers });
  console.log(`[Friends] Friend removed: ${friendId}`);
}

// ─── Friend Location / Campsite ───────────────────────────────────────────────

/**
 * Get campsite locations for friends who have enabled campsite sharing.
 */
export async function getFriendCampsites(): Promise<FriendCampsite[]> {
  console.log('[Friends] Fetching friend campsites...');
  const headers = await authHeaders();
  const response = await api.get<FriendCampsite[]>('/friends/campsites', { headers });
  console.log(`[Friends] Friend campsites loaded — ${response.data.length} sharing campsite`);
  return response.data;
}

/**
 * Get live locations for friends who have enabled location sharing.
 */
export async function getFriendLocations(): Promise<FriendLocation[]> {
  console.log('[Friends] Fetching friend live locations...');
  const headers = await authHeaders();
  const response = await api.get<FriendLocation[]>('/friends/locations', { headers });
  console.log(`[Friends] Friend locations loaded — ${response.data.length} sharing location`);
  return response.data;
}

/**
 * Upload the current user's own live location to the backend.
 * The server only persists it when the user has shareMyLocation=true.
 */
export async function uploadMyLocation(lat: number, lng: number): Promise<void> {
  const headers = await authHeaders();
  await api.post('/friends/location', { lat, lng }, { headers });
}

// ─── Realtime friend locations (SSE) ────────────────────────────────────────

export interface FriendLocationSubscription {
  /** Tear down the stream and stop reconnect attempts. */
  close: () => void;
}

/**
 * Subscribe to realtime friend location updates via Server-Sent Events
 * (GET /friends/locations/stream). Replaces polling GET /friends/locations on
 * a timer: the server pushes the caller's opted-in friend locations on connect
 * and whenever they change, reusing the exact same permission/opt-in logic as
 * the polled endpoint.
 *
 * Auth: uses react-native-sse (not the stock EventSource) specifically because
 * it can attach the Authorization: Bearer header the backend guard requires.
 *
 * Resilience: on error the caller's onError runs so the screen can fall back to
 * polling; the underlying EventSource also auto-reconnects. Always call
 * `close()` on unmount.
 *
 * @param onData   Called with the latest friend-location array on every push.
 * @param onError  Optional; called when the stream errors (e.g. token/network).
 */
export async function subscribeFriendLocations(
  onData: (locations: FriendLocation[]) => void,
  onError?: (err: unknown) => void,
): Promise<FriendLocationSubscription> {
  const token = await getIdToken();
  const url = `${API_URL}/friends/locations/stream`;

  const es = new EventSource(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    // Firebase ID tokens are short-lived; the lib reconnects on drop, and the
    // screen-level fallback covers a hard failure.
    pollingInterval: 0, // rely on server push, not client re-poll
  });

  es.addEventListener('message', (event) => {
    if (!event.data) return;
    try {
      const parsed = JSON.parse(event.data);
      if (parsed && typeof parsed === 'object' && 'error' in parsed) {
        console.warn('[Friends] SSE stream reported error:', parsed.message);
        onError?.(new Error(String(parsed.message ?? 'stream_error')));
        return;
      }
      onData(parsed as FriendLocation[]);
    } catch (err) {
      console.warn('[Friends] Failed to parse SSE location payload', err);
      onError?.(err);
    }
  });

  es.addEventListener('error', (event) => {
    console.warn('[Friends] SSE connection error', event);
    onError?.(event);
  });

  return {
    close: () => {
      es.removeAllEventListeners();
      es.close();
    },
  };
}
