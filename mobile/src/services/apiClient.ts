import axios from 'axios';
import { API_URL } from '../config/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import { Platform } from 'react-native';

// Check for development mode
const isDev = __DEV__;

// We don't need a separate getBaseUrl function anymore

// Create an API client with default configurations
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 second timeout
});

// Update the base URL if needed
const updateApiUrl = async () => {
  try {
    if (isDev && Platform.OS !== 'web') {
      // Check if we're on an emulator
      const networkState = await Network.getNetworkStateAsync();
      
      // Handle Android emulator case
      if (Platform.OS === 'android' && 
          networkState.isConnected &&
          API_URL.includes('localhost')) {
        const newUrl = API_URL.replace('localhost', '10.0.2.2');
        apiClient.defaults.baseURL = newUrl;
        console.log(`Updated API URL to: ${newUrl} for Android emulator`);
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.warn('Error updating API URL:', errorMessage);
  }
};

// Call this function when the app starts
updateApiUrl();

// Interceptor to add auth token to requests
apiClient.interceptors.request.use(
  async (config) => {
    // Get the token from storage
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle responses
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Network errors
    if (!error.response) {
      console.error('Network error or server not running:', error.message);
      // Return a cleaner error object
      return Promise.reject({
        message: 'Unable to connect to the server. Please check your internet connection.',
        isNetworkError: true,
        originalError: error
      });
    }
    
    // Handle 401 Unauthorized errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        
        if (refreshToken) {
          // Make the refresh token request directly without using the intercepted client
          const response = await axios.post(`${apiClient.defaults.baseURL}/auth/refresh`, {
            refreshToken,
          });
          
          const { accessToken } = response.data;
          
          // Update the token in storage
          await AsyncStorage.setItem('accessToken', accessToken);
          
          // Retry the original request with the new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // If refresh fails, clear tokens and redirect to login
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('refreshToken');
        // Navigation to login would be handled by the auth context
        return Promise.reject({
          message: 'Your session has expired. Please log in again.',
          isAuthError: true,
          originalError: refreshError,
          status: 401
        });
      }
    }
    
    // Format other errors for easier handling in components
    const formattedError = {
      message: error.response?.data?.message || 'An unexpected error occurred',
      status: error.response?.status,
      data: error.response?.data,
      originalError: error
    };
    
    return Promise.reject(formattedError);
  }
);

// Helper for checking network connectivity
export const checkConnection = async () => {
  try {
    // Try to ping the API with a short timeout
    const response = await axios.get(`${apiClient.defaults.baseURL}/health`, {
      timeout: 5000
    });
    return {
      connected: response.status === 200,
      status: response.status,
      serverTime: response.headers?.date || new Date().toISOString()
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('API connectivity check failed:', errorMessage);
    return {
      connected: false,
      error: errorMessage
    };
  }
};

// Export the configured API client and helpers
export { apiClient, updateApiUrl };