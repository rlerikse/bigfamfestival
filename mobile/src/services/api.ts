import axios from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import NetInfo from '@react-native-community/netinfo';

// Determine API base URL from environment variables or use default
// const API_URL = Constants?.expoConfig?.extra?.apiUrl || 'https://bigfam-api-production-292369452544.us-central1.run.app';
const API_URL = 'http://192.168.106.135:8080/api/v1'; // <-- Changed to local backend

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000, // 15 seconds
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
      const token = await SecureStore.getItemAsync('userToken');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
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
    return response;
  },
  async (error) => {
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error);
      throw new Error('Network error. Please check your internet connection.');
    }
    
    // Handle authentication errors
    if (error.response.status === 401) {
      // Clear stored token if unauthorized
      await SecureStore.deleteItemAsync('userToken');
      // Could trigger logout here if needed
    }
    
    return Promise.reject(error);
  }
);

// Function to check API health
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await api.get('/health');
    return response.status === 200;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
};

export default api;
