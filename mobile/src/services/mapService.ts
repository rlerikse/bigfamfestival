import { api } from './api';
import { AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import NetInfo from '@react-native-community/netinfo';

// POI interface (Point Of Interest)
export interface POI {
  id: string;
  type: 'stage' | 'vendor' | 'facility' | 'campsite' | 'friend_campsite' | 'friend_location';
  name: string;
  location: {
    lat: number;
    long: number;
  };
  description?: string;
  userId?: string;
  profilePictureUrl?: string;
}

/**
 * Fetch all POIs (Points of Interest) for the map
 */
export const getPOIs = async (): Promise<POI[]> => {
  try {
    // Check for token
    const token = await SecureStore.getItemAsync('userToken');
    
    if (!token) {
      // eslint-disable-next-line
      console.log('No auth token found, returning mock data');
      return await getMockPOIs();
    }
    
    // Check network connectivity
    const netInfo = await NetInfo.fetch();
    
    // Use cached data if offline
    if (!netInfo.isConnected) {
      const cachedData = await getCachedPOIs();
      if (cachedData) {
        return cachedData;
      }
      // eslint-disable-next-line
      console.log('Offline without cache, returning mock data');
      return await getMockPOIs();
    }
    
    try {
      // Fetch from API if online
      const response = await api.get<POI[]>('/map/pois', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Cache the data for offline use
      await cachePOIs(response.data);
      
      return response.data;
      
    } catch (apiError: unknown) {
      const axiosError = apiError as AxiosError;
      // If the endpoint isn't implemented yet (404)
      if (axiosError.response?.status === 404) {
        // eslint-disable-next-line
        console.log('API endpoint not implemented, using mock data');
        const mockData = await getMockPOIs();
        await cachePOIs(mockData); // Cache mock data for offline use
        return mockData;
      }
      
      // For other API errors, try cache or throw
      throw apiError;
    }
  } catch (error: unknown) {
    const err = error as { response?: { data?: unknown }; message: string };
    console.error('Error fetching POIs:', err.response?.data || err.message);
    
    // Attempt to use cached data as fallback
    const cachedData = await getCachedPOIs();
    if (cachedData) {
      return cachedData;
    }
    
    // Return mock data as last resort
    // eslint-disable-next-line
    console.log('Returning mock data as fallback');
    return await getMockPOIs();
  }
};

/**
 * Get embedded navigation directions from the current location to a destination
 */
export const getNavigation = async (destination: { lat: number; long: number }): Promise<unknown> => {
  try {
    const token = await SecureStore.getItemAsync('userToken');
    
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    const response = await api.get('/navigation', {
      params: {
        destination: `${destination.lat},${destination.long}`,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    return response.data;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { message?: string; [key: string]: unknown } }; message?: string };
      console.error('Navigation error:', axiosError.response?.data || axiosError.message);
      throw new Error(axiosError.response?.data?.message || 'Failed to get navigation directions');
    } else if (error instanceof Error) {
      console.error('Navigation error:', error.message);
      throw new Error(error.message);
    } else {
      console.error('Navigation error occurred');
      throw new Error('Failed to get navigation directions');
    }
  }
};

/**
 * Cache POI data locally for offline access
 */
const cachePOIs = async (pois: POI[]): Promise<void> => {
  try {
    await SecureStore.setItemAsync('cached_pois', JSON.stringify(pois));
    await SecureStore.setItemAsync('pois_cache_timestamp', Date.now().toString());
  } catch (error) {
    console.error('Error caching POIs:', error);
  }
};

/**
 * Get cached POI data (if available and not expired)
 */
const getCachedPOIs = async (): Promise<POI[] | null> => {
  try {
    const cachedData = await SecureStore.getItemAsync('cached_pois');
    const timestampStr = await SecureStore.getItemAsync('pois_cache_timestamp');
    
    if (!cachedData || !timestampStr) {
      return null;
    }
    
    // Check if cache is expired (24 hours)
    const timestamp = parseInt(timestampStr);
    const now = Date.now();
    const cacheAge = now - timestamp;
    const cacheExpiryTime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    if (cacheAge > cacheExpiryTime) {
      return null;
    }
    
    return JSON.parse(cachedData) as POI[];
  } catch (error) {
    console.error('Error getting cached POIs:', error);
    return null;
  }
};

/**
 * Generate mock POI data for development/demo purposes
 */
const getMockPOIs = async (): Promise<POI[]> => {
  // Try to use the user's current location as base if available, otherwise use default
  let baseLat = 42.3314;
  let baseLong = -83.0458;
  
  // Try to get last known user location if available
  try {
    const lastLocationStr = await SecureStore.getItemAsync('last_known_location');
    if (lastLocationStr) {
      const lastLocation = JSON.parse(lastLocationStr);
      baseLat = lastLocation.latitude;
      baseLong = lastLocation.longitude;
    }
  } catch (error) {
    // eslint-disable-next-line
    console.log('Could not get last location, using defaults');
  }

  // Mock POI data
  return [
    {
      id: 'stage-1',
      type: 'stage',
      name: 'Main Stage',
      location: { lat: baseLat, long: baseLong },
      description: 'North Field, near entrance',
    },
    {
      id: 'stage-2',
      type: 'stage',
      name: 'Stage A',
      location: { lat: baseLat + 0.002, long: baseLong + 0.001 },
      description: 'East side of the festival grounds',
    },
    {
      id: 'stage-3',
      type: 'stage',
      name: 'Stage B',
      location: { lat: baseLat - 0.001, long: baseLong + 0.003 },
      description: 'South Field, by the forest',
    },
    {
      id: 'vendor-1',
      type: 'vendor',
      name: 'Food Truck Alley',
      location: { lat: baseLat + 0.001, long: baseLong - 0.001 },
      description: 'Various food options and drinks',
    },
    {
      id: 'vendor-2',
      type: 'vendor',
      name: 'Craft Marketplace',
      location: { lat: baseLat - 0.0015, long: baseLong - 0.002 },
      description: 'Local crafts and festival merchandise',
    },
    {
      id: 'facility-1',
      type: 'facility',
      name: 'First Aid Tent',
      location: { lat: baseLat + 0.0005, long: baseLong + 0.002 },
      description: 'Medical assistance available 24/7',
    },
    {
      id: 'facility-2',
      type: 'facility',
      name: 'Water Station',
      location: { lat: baseLat - 0.002, long: baseLong + 0.0015 },
      description: 'Free water refill station',
    },
    {
      id: 'facility-3',
      type: 'facility',
      name: 'Restrooms',
      location: { lat: baseLat + 0.003, long: baseLong - 0.0025 },
      description: 'Clean facilities with hand washing stations',
    }
  ];
};

/**
 * Get What3Words address for a location (mock implementation)
 */
export const getWhat3WordsAddress = async (_lat: number, _lng: number): Promise<string> => {
  // In a real app, this would call the What3Words API
  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock response - in a real app, call the What3Words API
    const words = [
      'table', 'chair', 'lamp', 'plant', 'book', 'pen', 'phone', 'laptop', 
      'window', 'door', 'room', 'wall', 'floor', 'ceiling', 'desk', 'shelf',
      'apple', 'banana', 'cherry', 'orange', 'grape', 'lemon', 'peach', 'plum'
    ];
    
    const w1 = words[Math.floor(Math.random() * words.length)];
    const w2 = words[Math.floor(Math.random() * words.length)];
    const w3 = words[Math.floor(Math.random() * words.length)];
    
    return `${w1}.${w2}.${w3}`;
  } catch (error) {
    console.error('Error getting What3Words address:', error);
    throw new Error('Failed to get What3Words address');
  }
};