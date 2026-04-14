/**
 * Admin API service — wraps all /admin/* endpoints
 * All calls require admin role (enforced server-side via RBAC)
 */
import { api } from './api';
import { getIdToken } from './firebaseAuthService';

// ── Types ──────────────────────────────────────────────────────────────────

export interface AdminStats {
  totalUsers: number;
  totalEvents: number;
  totalNotifications: number;
  usersByRole: Record<string, number>;
}

export interface AdminUser {
  id: string;
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  ticketType?: string;
  notificationsEnabled?: boolean;
  profilePictureUrl?: string;
  createdAt?: string;
  userGroups?: string[];
}

export interface AdminUserListResponse {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminShift {
  id: string;
  userId: string;
  userName: string;
  role: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  stage?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminEvent {
  id: string;
  name: string;
  stage: string;
  date: string;
  startTime: string;
  endTime: string;
  description?: string;
  imageUrl?: string;
  genres?: string[];
  artists?: string[];
  createdBy?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────

const authHeaders = async () => {
  const token = await getIdToken();
  return { Authorization: `Bearer ${token}` };
};

// ── Stats ──────────────────────────────────────────────────────────────────

export const getAdminStats = async (): Promise<AdminStats> => {
  const headers = await authHeaders();
  const res = await api.get('/admin/stats', { headers });
  return res.data;
};

// ── Users ──────────────────────────────────────────────────────────────────

export const listAdminUsers = async (params?: {
  search?: string;
  role?: string;
  page?: number;
  limit?: number;
}): Promise<AdminUserListResponse> => {
  const headers = await authHeaders();
  const res = await api.get('/admin/users', { headers, params });
  return res.data;
};

export const getAdminUser = async (id: string): Promise<AdminUser> => {
  const headers = await authHeaders();
  const res = await api.get(`/admin/users/${id}`, { headers });
  return res.data;
};

export const updateAdminUser = async (
  id: string,
  dto: Partial<Pick<AdminUser, 'name' | 'phone' | 'role' | 'notificationsEnabled' | 'ticketType' | 'userGroups'>>
): Promise<AdminUser> => {
  const headers = await authHeaders();
  const res = await api.patch(`/admin/users/${id}`, dto, { headers });
  return res.data;
};

// ── Events ─────────────────────────────────────────────────────────────────

export const createAdminEvent = async (
  dto: Omit<AdminEvent, 'id' | 'createdBy'>
): Promise<AdminEvent> => {
  const headers = await authHeaders();
  const res = await api.post('/admin/events', dto, { headers });
  return res.data;
};

export const updateAdminEvent = async (
  id: string,
  dto: Partial<Omit<AdminEvent, 'id' | 'createdBy'>>
): Promise<AdminEvent> => {
  const headers = await authHeaders();
  const res = await api.patch(`/admin/events/${id}`, dto, { headers });
  return res.data;
};

export const deleteAdminEvent = async (id: string): Promise<void> => {
  const headers = await authHeaders();
  await api.delete(`/admin/events/${id}`, { headers });
};

// ── Shifts ─────────────────────────────────────────────────────────────────

export const listAdminShifts = async (params?: {
  date?: string;
  role?: string;
}): Promise<AdminShift[]> => {
  const headers = await authHeaders();
  const res = await api.get('/admin/shifts', { headers, params });
  return res.data;
};

export const createAdminShift = async (
  dto: Omit<AdminShift, 'id' | 'createdAt' | 'updatedAt'>
): Promise<AdminShift> => {
  const headers = await authHeaders();
  const res = await api.post('/admin/shifts', dto, { headers });
  return res.data;
};

export const updateAdminShift = async (
  id: string,
  dto: Partial<Omit<AdminShift, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<AdminShift> => {
  const headers = await authHeaders();
  const res = await api.patch(`/admin/shifts/${id}`, dto, { headers });
  return res.data;
};

export const deleteAdminShift = async (id: string): Promise<void> => {
  const headers = await authHeaders();
  await api.delete(`/admin/shifts/${id}`, { headers });
};

// ── Schedule (admin bypass) ────────────────────────────────────────────────

export const getAdminUserSchedule = async (userId: string): Promise<{ eventIds: string[] }> => {
  const headers = await authHeaders();
  const res = await api.get(`/admin/schedule/${userId}`, { headers });
  return res.data;
};

export const setAdminUserSchedule = async (
  userId: string,
  eventIds: string[]
): Promise<void> => {
  const headers = await authHeaders();
  await api.put(`/admin/schedule/${userId}`, { eventIds }, { headers });
};
