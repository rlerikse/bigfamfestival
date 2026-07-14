import { api } from './api';
import { getIdToken } from './firebaseAuthService';
import { User } from '../contexts/AuthContext';

/**
 * Get the current user's profile
 */
export const getUserProfile = async (token?: string): Promise<User> => {
  try {
    // Use token from parameter or get from Firebase Auth
    const authToken = token || await getIdToken();
    
    if (!authToken) {
      throw new Error('Authentication token not found');
    }
    
    const response = await api.get<User>('/users/profile', {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    
    return response.data;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Get profile error:', error.response?.data || error.responseData || error.message);
    // Preserve the HTTP status so callers can distinguish 404 (not found) from other errors.
    // Note: api.ts interceptor wraps errors — .response is stripped, but .statusCode is set.
    const err = new Error(
      error.response?.data?.message || error.message || 'Failed to fetch user profile'
    ) as any;
    err.statusCode = error.response?.status ?? error.statusCode;
    err.responseData = error.response?.data ?? error.responseData;
    throw err;
  }
};

/**
 * Create user profile in backend after Firebase registration.
 * The Firebase ID token is used for auth — the backend extracts the UID from it.
 *
 * Tries POST /auth/register first (canonical endpoint), falls back to
 * POST /users/profile for backward compatibility.
 */
export const createUserProfile = async (
  token: string,
  profileData: { name: string; email: string; phone?: string; role?: string; profilePictureUrl?: string },
): Promise<User> => {
  const headers = { Authorization: `Bearer ${token}` };

  try {
    const response = await api.post<User>('/auth/register', profileData, { headers });
    return response.data;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    // If /auth/register returns 404 (old backend), fall back to /users/profile
    const status = error?.response?.status ?? error?.statusCode;
    if (status === 404) {
      try {
        const fallback = await api.post<User>('/users/profile', profileData, { headers });
        return fallback.data;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (fbErr: any) {
        console.error('Create profile fallback error:', fbErr.response?.data || fbErr.message);
        throw new Error(
          fbErr.response?.data?.message || 'Failed to create user profile'
        );
      }
    }
    console.error('Create profile error:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || 'Failed to create user profile'
    );
  }
};
