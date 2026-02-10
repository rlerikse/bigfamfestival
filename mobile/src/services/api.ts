import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';

import { API_URL } from '../config/constants';
import { getIdToken } from './firebaseAuthService';

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to check if error is retryable
const isRetryableError = (error: AxiosError): boolean => {
  if (!error.response) {
    // Network errors are retryable
    return true;
  }
  
  const status = error.response.status;
  // Retry on 5xx errors and 429 (rate limit)
  return status >= 500 || status === 429;
};

// Helper function to retry request
const retryRequest = async (
  config: InternalAxiosRequestConfig,
  retryCount: number = 0
): Promise<any> => {
  try {
    return await axios(config);
  } catch (error) {
    const axiosError = error as AxiosError;
    
    if (retryCount < MAX_RETRIES && isRetryableError(axiosError)) {
      const delayMs = RETRY_DELAY * Math.pow(2, retryCount); // Exponential backoff
      await delay(delayMs);
      return retryRequest(config, retryCount + 1);
    }
    
    throw error;
  }
};

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_URL, // Use the URL from constants.ts which takes care of dev/prod
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Log the API URL being used (development only)
if (__DEV__) {
  console.log('[API] ===========================================');
  console.log('[API] Base URL configured:', API_URL);
  console.log('[API] Platform:', Platform.OS);
  console.log('[API] Development mode:', __DEV__);
  console.log('[API] ===========================================');
}

// Request interceptor to handle offline state and add auth token
api.interceptors.request.use(
  async (config) => {
    // Check network connectivity
    const netInfo = await NetInfo.fetch();
    
    if (!netInfo.isConnected) {
      throw new Error('No internet connection. Please try again when you\'re online.');
    }
    
    // Log request in development
    if (__DEV__) {
      const fullUrl = `${config.baseURL || ''}${config.url || ''}`;
      console.log(`[API] → ${config.method?.toUpperCase()} ${fullUrl}`);
    }
    
    // Add auth token if available (except for auth endpoints)
    if (!config.url?.includes('/auth/')) {
      try {
        const token = await getIdToken();
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
          
          // Debug logging for requests to notifications endpoints
          if (__DEV__ && config.url?.includes('/notifications')) {
            // eslint-disable-next-line no-console
            console.log(`Setting Authorization header: Bearer ${token.substring(0, 10)}...`);
          }
        } else {
          // Debug log if no token found
          if (__DEV__ && config.url?.includes('/notifications')) {
            console.warn('No Firebase auth token found for request to:', config.url);
          }
        }
      } catch (err) {
        // User not authenticated, continue without token
        if (__DEV__) {
          console.log('[API] No authenticated user, proceeding without token');
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
    // Log successful responses in development
    if (__DEV__) {
      const fullUrl = `${response.config.baseURL || ''}${response.config.url || ''}`;
      console.log(`[API] ← ${response.config.method?.toUpperCase()} ${fullUrl} [${response.status}]`);
    }
    
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
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Handle network errors
    if (!error.response) {
      // Check network connectivity
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        const networkError = new Error('No internet connection. Please check your network and try again.');
        (networkError as any).isNetworkError = true;
        (networkError as any).isOffline = true;
        return Promise.reject(networkError);
      }
      
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('[API] Network error details:', {
          message: error.message,
          baseURL: api.defaults.baseURL,
          url: error.config?.url,
          fullURL: error.config ? `${error.config.baseURL}${error.config.url}` : 'unknown',
        });
      }
      
      // Create a more user-friendly error
      const networkError = new Error(`Unable to connect to server at ${api.defaults.baseURL}. Please check your internet connection and try again.`);
      (networkError as any).isNetworkError = true;
      return Promise.reject(networkError);
    }
    
    // Handle rate limiting (429)
    if (error.response.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      const message = retryAfter 
        ? `Too many requests. Please try again in ${retryAfter} seconds.`
        : 'Too many requests. Please try again later.';
      const rateLimitError = new Error(message);
      (rateLimitError as any).isRateLimit = true;
      (rateLimitError as any).retryAfter = retryAfter;
      return Promise.reject(rateLimitError);
    }
    
    // Detailed logging for notification endpoint errors
    if (__DEV__ && originalRequest?.url?.includes('/notifications')) {
      // eslint-disable-next-line no-console
      console.error('Notification API error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: originalRequest.headers,
        // Also log the request data for debugging
        requestData: originalRequest.data ? JSON.parse(originalRequest.data) : null,
      });
      
      // If it's a 401 or 403, log for debugging
      if (error.response.status === 401 || error.response.status === 403) {
        const token = await getIdToken();
        if (token && __DEV__) {
          console.log('[API] Auth error with active Firebase token - token may be expired');
        }
      }
    }
    
    // Handle authentication errors
    if (error.response.status === 401) {
      // Firebase Auth manages token lifecycle - token refresh is automatic
      const authError = new Error('Your session has expired. Please log in again.');
      (authError as any).isAuthError = true;
      (authError as any).requiresLogin = true;
      return Promise.reject(authError);
    }
    
    // Handle server errors (5xx) - these might be retryable
    if (error.response.status >= 500) {
      const responseData = error.response.data as { message?: string } | undefined;
      const serverError = new Error(
        responseData?.message || 
        'Server error. Please try again later.'
      );
      (serverError as any).isServerError = true;
      (serverError as any).statusCode = error.response.status;
      return Promise.reject(serverError);
    }
    
    // For other errors, include the error message from the response if available
    const responseData = error.response.data as { message?: string } | undefined;
    const errorMessage = responseData?.message || error.message || 'An error occurred';
    const enhancedError = new Error(errorMessage);
    (enhancedError as any).statusCode = error.response.status;
    (enhancedError as any).responseData = error.response.data;
    
    return Promise.reject(enhancedError);
  }
);

// Updated function to check API health with correct endpoint
export const checkApiHealth = async (): Promise<{isHealthy: boolean, message?: string}> => {
  try {
    if (__DEV__) {
      console.log('[API] Checking health at:', `${API_URL}/health`);
    }
    // Use the correct health endpoint
    const response = await api.get('/health');
    const result = { 
      isHealthy: response.status === 200,
      message: `API connected successfully to ${API_URL}`
    };
    if (__DEV__) {
      console.log('[API] Health check successful:', result);
    }
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const axiosError = error as AxiosError;
    
    if (__DEV__) {
      console.error('[API] Health check failed:', {
        message: errorMessage,
        url: `${API_URL}/health`,
        response: axiosError.response?.status,
        responseData: axiosError.response?.data,
      });
    }
    
    // Return detailed error for debugging
    return { 
      isHealthy: false, 
      message: `Connection failed to ${API_URL}: ${errorMessage}` 
    };
  }
};

export default api;