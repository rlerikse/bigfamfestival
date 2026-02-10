import { api } from './api';
import * as SecureStore from 'expo-secure-store';
import { User } from '../contexts/AuthContext';
// import { UserRole } from '../types/user';

interface LoginResponse {
  token: string;
  user: User;
}

interface RegisterResponse {
  token: string;
  user: User;
}

interface RegisterParams {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

/**
 * Log in a user
 */
export const loginUser = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await api.post<LoginResponse>('/auth/login', {
      email,
      password,
    });
    
    return response.data;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Login error:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || 'Login failed. Please check your credentials.'
    );
  }
};

/**
 * Register a new user
 */
export const registerUser = async (params: RegisterParams): Promise<RegisterResponse> => {
  try {
    const response = await api.post<RegisterResponse>('/auth/register', params);
    return response.data;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Registration error:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || 'Registration failed. Please try again.'
    );
  }
};

/**
 * Get the current user's profile
 */
export const getUserProfile = async (token?: string): Promise<User> => {
  try {
    // Use token from parameter or get from secure storage
    const authToken = token || await SecureStore.getItemAsync('userToken');
    
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
    console.error('Get profile error:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || 'Failed to fetch user profile'
    );
  }
};

/**
 * Create user profile in backend after Firebase registration
 * This syncs the Firebase user with our backend database
 */
export const createUserProfile = async (
  uid: string,
  email: string,
  name: string,
  phone?: string
): Promise<User> => {
  try {
    const response = await api.post<User>('/users/profile', {
      uid,
      email,
      name,
      phone,
    });
    return response.data;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Create profile error:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || 'Failed to create user profile'
    );
  }
};
