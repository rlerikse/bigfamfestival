import axios from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import NetInfo from '@react-native-community/netinfo';

// ...existing code...
const isProduction = !__DEV__;
const PROD_API_URL = 'https://bigfam-api-production-292369452544.us-central1.run.app/api/v1';
const DEV_API_URL = 'http://192.168.50.244:8080/api/v1';

// Fixed the logic: __DEV__ is true in development
const isDevelopment = __DEV__;
const API_URL = isDevelopment ? DEV_API_URL : PROD_API_URL;

// Create axios instance with default config
export const api = axios.create({
  baseURL: PROD_API_URL, // Use production for now since it's working
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
      if (__DEV__) {
        console.error('Network error details:', {
          message: error.message,
          baseURL: api.defaults.baseURL,
          config: error.config,
        });
      }
      throw new Error(`Network error. Please check your internet connection. API: ${API_URL}`);
    }
    
    // Handle authentication errors
    if (error.response.status === 401) {
      await SecureStore.deleteItemAsync('userToken');
    }
    
    return Promise.reject(error);
  }
);

// Updated function to check API health with correct endpoint
export const checkApiHealth = async (): Promise<{isHealthy: boolean, message?: string}> => {
  try {
    // ✅ Use the correct health endpoint
    const response = await api.get('/health');
    return { 
      isHealthy: response.status === 200,
      message: `API connected successfully to ${PROD_API_URL}`
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('API health check failed:', errorMessage);
    
    if (__DEV__) {
      console.info('API connection details:', {
        url: PROD_API_URL,
        isDevelopment: __DEV__,
        timeoutMs: api.defaults.timeout
      });
    }
    
    return { 
      isHealthy: false, 
      message: `Connection failed: ${errorMessage}` 
    };
  }
};

export default api;