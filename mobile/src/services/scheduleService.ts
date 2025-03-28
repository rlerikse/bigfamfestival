import { api } from './api';
import * as SecureStore from 'expo-secure-store';
import NetInfo from '@react-native-community/netinfo';
import { ScheduleEvent } from '../types/event';

/**
 * Get user's schedule
 * 
 * @param userId The user ID
 * @returns Promise that resolves to the user's schedule events
 */
export const getUserSchedule = async (userId: string): Promise<ScheduleEvent[]> => {
  try {
    // Check for token
    const token = await SecureStore.getItemAsync('userToken');
    
    if (!token) {
      // eslint-disable-next-line no-console
      console.log('No auth token found, returning mock schedule');
      return getMockSchedule();
    }
    
    // Check network connectivity
    const netInfo = await NetInfo.fetch();
    
    // Use cached data if offline
    if (!netInfo.isConnected) {
      const cachedData = await getCachedSchedule(userId);
      if (cachedData) {
        return cachedData;
      }
      // eslint-disable-next-line no-console
      console.log('Offline without cache, returning mock schedule');
      return getMockSchedule();
    }
    
    try {
      // Fetch from API if online
      const response = await api.get<ScheduleEvent[]>(`/schedule/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Cache the data for offline use
      await cacheSchedule(userId, response.data);
      
      return response.data;
    } catch (apiError: unknown) {
      // If the endpoint isn't implemented yet (404)
      const error = apiError as Error & { response?: { status: number } };
      if (error.response?.status === 404) {
        // eslint-disable-next-line no-console
        console.log('API endpoint not implemented, using mock schedule');
        const mockData = getMockSchedule();
        await cacheSchedule(userId, mockData);
        return mockData;
      }
      
      // For other API errors, try cache or throw
      throw apiError;
    }
  } catch (error: unknown) {
    console.error('Error fetching schedule:', error);
    
    // Attempt to use cached data as fallback
    const cachedData = await getCachedSchedule(userId);
    if (cachedData) {
      return cachedData;
    }
    
    // Return mock data as last resort
    // eslint-disable-next-line no-console
    console.log('Returning mock schedule as fallback');
    return getMockSchedule();
  }
};

/**
 * Add an event to user's schedule
 * 
 * @param userId The user ID
 * @param eventId The event ID to add
 */
export const addToSchedule = async (userId: string, eventId: string): Promise<void> => {
  try {
    // Check for token
    const token = await SecureStore.getItemAsync('userToken');
    
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    // Check network connectivity
    const netInfo = await NetInfo.fetch();
    
    // If offline, queue the request for later synchronization
    if (!netInfo.isConnected) {
      await queueOfflineAction('addToSchedule', { userId, eventId });
      
      // Also update local cache immediately for UI consistency
      await updateLocalScheduleCache(userId, eventId, 'add');
      
      return;
    }
    
    try {
      // Send the request to add to schedule
      await api.post('/schedule', {
        userId,
        event_id: eventId,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Update local cache for consistency
      await updateLocalScheduleCache(userId, eventId, 'add');
    } catch (apiError: unknown) {
      // If the endpoint isn't implemented yet (404), just update local cache
      if ((apiError as Error & {response?: {status: number}}).response?.status === 404) {
        // eslint-disable-next-line no-console
        console.log('API endpoint not implemented, updating local cache only');
        await updateLocalScheduleCache(userId, eventId, 'add');
        return;
      }
      
      throw apiError;
    }
  } catch (error: unknown) {
    console.error('Add to schedule error:', 
      error instanceof Error ? error.message : 'Unknown error');
    
    // If the API request failed but we're online, queue for later retry
    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected) {
      await queueOfflineAction('addToSchedule', { userId, eventId });
      
      // Also update local cache for UI consistency
      await updateLocalScheduleCache(userId, eventId, 'add');
    }
    
    // Type guard for error with response property
    const apiError = error as { response?: { data?: { message?: string } } };
    throw new Error(
      apiError.response?.data?.message || 'Failed to add event to schedule'
    );
  }
};

/**
 * Remove an event from user's schedule
 * 
 * @param userId The user ID
 * @param eventId The event ID to remove
 */
export const removeFromSchedule = async (userId: string, eventId: string): Promise<void> => {
  try {
    // Check for token
    const token = await SecureStore.getItemAsync('userToken');
    
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    // Check network connectivity
    const netInfo = await NetInfo.fetch();
    
    // If offline, queue the request for later synchronization
    if (!netInfo.isConnected) {
      await queueOfflineAction('removeFromSchedule', { userId, eventId });
      
      // Also update local cache immediately for UI consistency
      await updateLocalScheduleCache(userId, eventId, 'remove');
      
      return;
    }
    
    try {
      // Send the request to remove from schedule
      await api.delete('/schedule', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          userId,
          event_id: eventId,
        },
      });
      
      // Update local cache for consistency
      await updateLocalScheduleCache(userId, eventId, 'remove');
    } catch (apiError: unknown) {
      // Cast to expected error type
      const typedError = apiError as Error & { response?: { status: number, data?: { message?: string } } };
      
      // If the endpoint isn't implemented yet (404), just update local cache
      if (typedError.response?.status === 404) {
        // eslint-disable-next-line no-console
        console.log('API endpoint not implemented, updating local cache only');
        await updateLocalScheduleCache(userId, eventId, 'remove');
        return;
      }
      
      throw apiError;
    }
  } catch (error: unknown) {
    console.error('Remove from schedule error:', 
      error instanceof Error ? error.message : 'Unknown error');
    
    // If the API request failed but we're online, queue for later retry
    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected) {
      await queueOfflineAction('removeFromSchedule', { userId, eventId });
      
      // Also update local cache for UI consistency
      await updateLocalScheduleCache(userId, eventId, 'remove');
    }
    
    // Type guard for error with response property
    const apiError = error as { response?: { data?: { message?: string } } };
    throw new Error(
      apiError.response?.data?.message || 'Failed to remove event from schedule'
    );
  }
};

/**
 * Update the local schedule cache when adding or removing events
 */
const updateLocalScheduleCache = async (
  userId: string,
  eventId: string,
  action: 'add' | 'remove'
): Promise<void> => {
  try {
    // Get current cached schedule
    const cachedScheduleStr = await SecureStore.getItemAsync(`schedule_${userId}`);
    let cachedSchedule: ScheduleEvent[] = [];
    
    if (cachedScheduleStr) {
      cachedSchedule = JSON.parse(cachedScheduleStr);
    }
    
    if (action === 'add') {
      // Check if event already exists in the cache
      const eventExists = cachedSchedule.some(event => event.id === eventId);
      
      if (!eventExists) {
        // Get the event details from the mock events (in a real app, this would come from the events API)
        const mockEvents = getMockEvents();
        const eventToAdd = mockEvents.find(event => event.id === eventId);
        
        if (eventToAdd) {
          // Add the event to the cached schedule
          cachedSchedule.push(eventToAdd);
          await cacheSchedule(userId, cachedSchedule);
        }
      }
    } else if (action === 'remove') {
      // Remove the event from the cached schedule
      const updatedSchedule = cachedSchedule.filter(event => event.id !== eventId);
      await cacheSchedule(userId, updatedSchedule);
    }
  } catch (error) {
    console.error('Error updating local schedule cache:', error);
  }
};

/**
 * Queue an action to be performed when back online
 */
interface ScheduleActionData {
  userId: string;
  eventId: string;
}

const queueOfflineAction = async (
  actionType: 'addToSchedule' | 'removeFromSchedule',
  actionData: ScheduleActionData
): Promise<void> => {
  try {
    // Get existing queue
    const queueStr = await SecureStore.getItemAsync('schedule_offline_queue');
    const queue = queueStr ? JSON.parse(queueStr) : [];
    
    // Add new action to queue
    queue.push({
      type: actionType,
      data: actionData,
      timestamp: Date.now()
    });
    
    // Save updated queue
    await SecureStore.setItemAsync('schedule_offline_queue', JSON.stringify(queue));
    // eslint-disable-next-line no-console
    console.log(`Queued ${actionType} action for later synchronization`);
  } catch (error) {
    console.error('Error queueing offline action:', error);
  }
};

/**
 * Process all queued offline actions
 * This would typically be called when the app detects it's back online
 */
export const processScheduleOfflineQueue = async (): Promise<void> => {
  try {
    // Check if we're online
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      // eslint-disable-next-line no-console
      console.log('Still offline, cannot process queue');
      return;
    }
    
    // Get the queue
    const queueStr = await SecureStore.getItemAsync('schedule_offline_queue');
    if (!queueStr) {
      return; // No queued actions
    }
    
    const queue = JSON.parse(queueStr);
    if (queue.length === 0) {
      return; // Empty queue
    }
    // eslint-disable-next-line no-console
    console.log(`Processing ${queue.length} queued schedule actions`);
    
    // Process each action
    const failedActions = [];
    
    for (const action of queue) {
      try {
        if (action.type === 'addToSchedule') {
          const { userId, eventId } = action.data;
          await addToSchedule(userId, eventId);
        } else if (action.type === 'removeFromSchedule') {
          const { userId, eventId } = action.data;
          await removeFromSchedule(userId, eventId);
        }
      } catch (error) {
        console.error(`Failed to process queued action ${action.type}:`, error);
        failedActions.push(action);
      }
    }
    
    // Update the queue with only failed actions
    if (failedActions.length > 0) {
      await SecureStore.setItemAsync('schedule_offline_queue', JSON.stringify(failedActions));
    } else {
      await SecureStore.deleteItemAsync('schedule_offline_queue');
    }
    // eslint-disable-next-line no-console
    console.log(`Processed offline queue. ${failedActions.length} actions remaining.`);
  } catch (error) {
    console.error('Error processing offline queue:', error);
  }
};

/**
 * Cache schedule data locally for offline access
 */
const cacheSchedule = async (userId: string, schedule: ScheduleEvent[]): Promise<void> => {
  try {
    await SecureStore.setItemAsync(`schedule_${userId}`, JSON.stringify(schedule));
    await SecureStore.setItemAsync(`schedule_cache_timestamp_${userId}`, Date.now().toString());
  } catch (error) {
    console.error('Error caching schedule:', error);
  }
};

/**
 * Get cached schedule data (if available and not expired)
 */
const getCachedSchedule = async (userId: string): Promise<ScheduleEvent[] | null> => {
  try {
    const cachedData = await SecureStore.getItemAsync(`schedule_${userId}`);
    const timestampStr = await SecureStore.getItemAsync(`schedule_cache_timestamp_${userId}`);
    
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
    
    return JSON.parse(cachedData) as ScheduleEvent[];
  } catch (error) {
    console.error('Error getting cached schedule:', error);
    return null;
  }
};

/**
 * Get mock events (for development/testing)
 */
const getMockEvents = (): ScheduleEvent[] => {
  return [
    {
      id: 'event-1',
      name: 'DJ Nightwave',
      stage: 'Main Stage',
      date: '2025-06-20',
      startTime: '19:30',
      endTime: '21:00',
      artists: ['DJ Nightwave'],
      description: 'Experience the electrifying beats of DJ Nightwave',
    },
    {
      id: 'event-2',
      name: 'Indie Sparks',
      stage: 'Stage A',
      date: '2025-06-20',
      startTime: '18:00',
      endTime: '19:30',
      artists: ['Indie Sparks'],
      description: 'Soulful indie melodies to start your evening',
    },
    {
      id: 'event-3',
      name: 'Rock Revolution',
      stage: 'Stage B',
      date: '2025-06-21',
      startTime: '20:00',
      endTime: '22:00',
      artists: ['Rock Revolution'],
      description: 'Get ready to rock with the most energetic band',
    },
    {
      id: 'event-4',
      name: 'Drum Circle',
      stage: 'Stage C',
      date: '2025-06-22',
      startTime: '16:00',
      endTime: '17:30',
      artists: ['Drum Circle Collective'],
      description: 'Join the community drum circle experience',
    },
    {
      id: 'event-5',
      name: 'Pop Sensation',
      stage: 'Main Stage',
      date: '2025-06-22',
      startTime: '21:00',
      endTime: '23:00',
      artists: ['Pop Sensation'],
      description: 'Chart-topping hits and amazing choreography',
    },
  ];
};

/**
 * Generate mock schedule data for development/testing purposes
 */
const getMockSchedule = (): ScheduleEvent[] => {
  // Return a subset of mock events as the user's schedule
  const allEvents = getMockEvents();
  return [allEvents[0], allEvents[2]]; // DJ Nightwave and Rock Revolution
};