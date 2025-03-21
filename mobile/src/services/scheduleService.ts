import { api } from './api';
import * as SecureStore from 'expo-secure-store';
import { ScheduleEvent } from '../types/event';

/**
 * Get user's schedule
 */
export const getUserSchedule = async (userId: string): Promise<ScheduleEvent[]> => {
  try {
    const token = await SecureStore.getItemAsync('userToken');
    
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    const response = await api.get<ScheduleEvent[]>(`/schedule/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    return response.data;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Get schedule error:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || 'Failed to fetch schedule'
    );
  }
};

/**
 * Add an event to user's schedule
 */
export const addToSchedule = async (userId: string, eventId: string): Promise<void> => {
  try {
    const token = await SecureStore.getItemAsync('userToken');
    
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    await api.post('/schedule', {
      userId,
      event_id: eventId,
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Add to schedule error:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || 'Failed to add event to schedule'
    );
  }
};

/**
 * Remove an event from user's schedule
 */
export const removeFromSchedule = async (userId: string, eventId: string): Promise<void> => {
  try {
    const token = await SecureStore.getItemAsync('userToken');
    
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    await api.delete(`/schedule`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        userId,
        event_id: eventId,
      },
    });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Remove from schedule error:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || 'Failed to remove event from schedule'
    );
  }
};