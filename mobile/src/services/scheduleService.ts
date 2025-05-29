import { api } from './api';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
      console.log('No auth token found, cannot fetch schedule.');
      // Decide appropriate action: throw error or return empty array
      throw new Error('Authentication token not found'); 
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
      console.log('Offline without cache, cannot fetch schedule.');
      // Decide appropriate action: throw error or return empty array
      throw new Error('Offline and no cached schedule available');
    }
      try {
      // Fetch from API if online - backend uses JWT token to identify the user
      const response = await api.get<ScheduleEvent[]>('/schedule', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Cache the data for offline use
      await cacheSchedule(userId, response.data);
      
      return response.data;
    } catch (apiError: unknown) {
      // REMOVED: 404 fallback to mock data. A 404 should be a real error.
      // The backend should return [] for an empty schedule, not 404.
      console.error('API error fetching schedule:', apiError);
      throw apiError; // Re-throw the original API error
    }
  } catch (error: unknown) {
    console.error('Error fetching schedule:', error);
    
    // Attempt to use cached data as a last resort if specifically intended,
    // otherwise, re-throw or handle as a critical failure.
    // For now, let's re-throw to make issues visible.
    throw error;
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
    
    // Send the request to add to schedule
    await api.post('/schedule', {
      // userId, // Removed: userId is now taken from JWT token on backend
      event_id: eventId,
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    // Update local cache for consistency
    await updateLocalScheduleCache(userId, eventId, 'add');
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
      // Call the new DELETE endpoint for subcollection strategy
      await api.delete(`/schedule/${eventId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Update local cache for consistency
      await updateLocalScheduleCache(userId, eventId, 'remove');    } catch (apiError: unknown) {
      // No special handling for 404 anymore since the endpoint is implemented
      console.error('API error removing from schedule:', apiError);
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
    const cachedScheduleStr = await AsyncStorage.getItem(`schedule_${userId}`);
    let cachedSchedule: ScheduleEvent[] = [];
    
    if (cachedScheduleStr) {
      cachedSchedule = JSON.parse(cachedScheduleStr);
    }
    
    if (action === 'add') {
      // Check if event already exists in the cache
      const eventExists = cachedSchedule.some(event => event.id === eventId);
      
      if (!eventExists) {
        // Fetch the event details from the API
        const token = await SecureStore.getItemAsync('userToken');
        if (!token) {
          console.error('No token found, cannot fetch event details for cache');
          return;
        }
        try {
          const response = await api.get<ScheduleEvent>(`/events/${eventId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const eventToAdd = response.data;
        
          if (eventToAdd) {
            // Add the event to the cached schedule
            cachedSchedule.push(eventToAdd);
            await cacheSchedule(userId, cachedSchedule);
          }
        } catch (fetchError) {
          console.error(`Error fetching event ${eventId} for cache:`, fetchError);
          // Optionally, decide if you still want to add a placeholder or skip caching
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
    const queueStr = await AsyncStorage.getItem('schedule_offline_queue');
    const queue = queueStr ? JSON.parse(queueStr) : [];
    
    // Add new action to queue
    queue.push({
      type: actionType,
      data: actionData,
      timestamp: Date.now()
    });
    
    // Save updated queue
    await AsyncStorage.setItem('schedule_offline_queue', JSON.stringify(queue));
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
    const queueStr = await AsyncStorage.getItem('schedule_offline_queue');
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
      await AsyncStorage.setItem('schedule_offline_queue', JSON.stringify(failedActions));
    } else {
      await AsyncStorage.removeItem('schedule_offline_queue');
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
    await AsyncStorage.setItem(`schedule_${userId}`, JSON.stringify(schedule));
    await AsyncStorage.setItem(`schedule_cache_timestamp_${userId}`, Date.now().toString());
  } catch (error) {
    console.error('Error caching schedule:', error);
  }
};

/**
 * Get cached schedule data (if available and not expired)
 */
const getCachedSchedule = async (userId: string): Promise<ScheduleEvent[] | null> => {
  try {
    const cachedData = await AsyncStorage.getItem(`schedule_${userId}`);
    const timestampStr = await AsyncStorage.getItem(`schedule_cache_timestamp_${userId}`);
    
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
 * Check if an event is in the user's schedule
 * 
 * @param userId The user ID
 * @param eventId The event ID to check
 * @returns Promise that resolves to true if the event is in the user's schedule, false otherwise
 */
export const isEventInSchedule = async (userId: string, eventId: string): Promise<boolean> => {
  try {
    // Try to get the user's schedule (this will use cached data if offline)
    const schedule = await getUserSchedule(userId);
    
    // Check if the event is in the schedule
    return schedule.some(event => event.id === eventId);
  } catch (error) {
    console.error('Error checking if event is in schedule:', error);
    
    // As a fallback, try to check the cached schedule directly
    try {
      const cachedSchedule = await getCachedSchedule(userId);
      if (cachedSchedule) {
        return cachedSchedule.some(event => event.id === eventId);
      }
    } catch (cacheError) {
      console.error('Error checking cached schedule:', cacheError);
    }
    
    // If all fails, assume the event is not in the schedule
    return false;
  }
};