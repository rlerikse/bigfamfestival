import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import NetInfo from '@react-native-community/netinfo';

import { API_URL } from '../config/constants';

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_URL, // Use the URL from constants.ts which takes care of dev/prod
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to handle offline state and add auth token
api.interceptors.request.use(
  async (config) => {
    // Check network connectivity
    const netInfo = await NetInfo.fetch();
    
    if (!netInfo.isConnected) {
      throw new Error('No internet connection. Please try again when you\'re online.');
    }
    
    // Add auth token if available (except for auth endpoints)
    if (!config.url?.includes('/auth/')) {
      const token = await SecureStore.getItemAsync('accessToken');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
        
        // Debug logging for requests to notifications endpoints
        if (__DEV__ && config.url?.includes('/notifications')) {
          console.log(`Setting Authorization header: Bearer ${token.substring(0, 10)}...`);
          
          try {
            // Decode JWT to check user role
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              console.log('JWT payload:', payload);
            }
          } catch (err) {
            console.log('Error decoding JWT token:', err);
          }
        }
      } else {
        // Debug log if no token found
        if (__DEV__ && config.url?.includes('/notifications')) {
          console.warn('No auth token found for request to:', config.url);
        }
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    // Debug server responses for notifications
    if (__DEV__ && response.config.url?.includes('/notifications')) {
      // eslint-disable-next-line no-console
      console.log(`Response from ${response.config.url}:`, {
        status: response.status,
        statusText: response.statusText,
        data: response.data ? 'Data received' : 'No data',
      });
    }
    return response;
  },
  async (error) => {
    // Handle network errors
    if (!error.response) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Network error details:', {
          message: error.message,
          baseURL: api.defaults.baseURL,
          config: error.config,
        });
      }
      throw new Error(`Network error. Please check your internet connection. API: ${API_URL}`);
    }
    
    // Detailed logging for notification endpoint errors
    if (__DEV__ && error.config?.url?.includes('/notifications')) {
      // eslint-disable-next-line no-console
      console.error('Notification API error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.config.headers,
        // Also log the request data for debugging
        requestData: error.config.data ? JSON.parse(error.config.data) : null,
      });
      
      // If it's a 401 or 403, check the token
      if (error.response.status === 401 || error.response.status === 403) {
        const token = await SecureStore.getItemAsync('accessToken');
        if (token) {
          try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
              atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
            );
            // eslint-disable-next-line no-console
            console.log('Token payload:', JSON.parse(jsonPayload));
          } catch (err) {
            // eslint-disable-next-line no-console
            console.log('Error decoding token:', err);
          }
        }
      }
    }
    
    // Handle authentication errors
    if (error.response.status === 401) {
      await SecureStore.deleteItemAsync('userToken');
      await SecureStore.deleteItemAsync('accessToken');
    }
    
    return Promise.reject(error);
  }
);

// Updated function to check API health with correct endpoint
export const checkApiHealth = async (): Promise<{isHealthy: boolean, message?: string}> => {
  try {
    // Use the correct health endpoint
    const response = await api.get('/health');
    return { 
      isHealthy: response.status === 200,
      message: `API connected successfully to ${API_URL}`
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('API health check failed:', errorMessage);
    
    // Return detailed error for debugging
    return { 
      isHealthy: false, 
      message: `Connection failed: ${errorMessage}` 
    };
  }
};

export default api;