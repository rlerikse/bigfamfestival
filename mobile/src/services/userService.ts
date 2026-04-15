import { api } from './api';
import { getIdToken } from './firebaseAuthService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { User } from '../contexts/AuthContext';
import { storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface UpdateProfileParams {
  name?: string;
  phone?: string;
  shareMyCampsite?: boolean;
  shareMyLocation?: boolean;
  profilePictureUrl?: string;
}

/**
 * Update user profile
 */
export const updateUserProfile = async (
  userId: string,
  data: UpdateProfileParams
): Promise<User> => {
  try {
    const token = await getIdToken();
    
    if (!token) {
      throw new Error('Please sign in to update your profile.');
    }
    
    const response = await api.put<User>(`/users/profile`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    return response.data;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Update profile error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please sign in again.');
    }
    throw new Error(
      error.response?.data?.message || error.message || 'Failed to update user profile'
    );
  }
};

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Upload profile picture directly to Firebase Storage, then update user profile with the URL.
 * Does not require a backend upload-url endpoint.
 *
 * Validates file size (max 5 MB) and type (jpeg/png/webp) before uploading.
 */
export const uploadProfilePicture = async (
  userId: string,
  imageUri: string
): Promise<string> => {
  try {
    const token = await getIdToken();
    if (!token) {
      throw new Error('Please sign in to upload a profile picture.');
    }

    // Read the image as a blob
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Validate file size
    if (blob.size > MAX_AVATAR_SIZE_BYTES) {
      throw new Error('Image is too large. Please choose a photo under 5 MB.');
    }

    // Validate file type
    const mimeType = blob.type || 'image/jpeg';
    if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
      throw new Error('Unsupported image format. Please use JPEG, PNG, or WebP.');
    }

    // Upload to Firebase Storage: profile-pictures/<userId>.jpg
    const storageRef = ref(storage, `profile-pictures/${userId}.jpg`);
    await uploadBytes(storageRef, blob, { contentType: mimeType });

    // Get the public download URL
    const downloadUrl = await getDownloadURL(storageRef);

    // Persist the URL to the backend user profile
    await updateUserProfile(userId, { profilePictureUrl: downloadUrl });

    return downloadUrl;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Upload profile picture error:', error.message);
    throw new Error(error.message || 'Failed to upload profile picture');
  }
};

/**
 * Mark a user's campsite at the specified location
 * 
 * @param userId The ID of the user 
 * @param latitude The latitude of the campsite
 * @param longitude The longitude of the campsite
 * @param sharedWithFriends Whether to share the campsite with friends
 * @returns Promise that resolves when campsite is marked
 */
export const markCampsite = async (
  userId: string,
  latitude: number,
  longitude: number,
  sharedWithFriends: boolean
): Promise<void> => {
  try {
    // Check for token
    const token = await getIdToken();
    
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    // Check network connectivity
    const netInfo = await NetInfo.fetch();
    
    // If offline, queue the request for later synchronization
    if (!netInfo.isConnected) {
      await queueOfflineAction('markCampsite', {
        userId,
        latitude,
        longitude,
        sharedWithFriends
      });
      return;
    }
    
    // Send the campsite data to the backend
    await api.post('/campsites', {
      location_lat: latitude,
      location_long: longitude,
      shared_with_friends: sharedWithFriends
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    // Update user profile to reflect campsite sharing preference
    if (sharedWithFriends) {
      await api.put('/users/profile', {
        shareMyCampsite: true
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
  } catch (error: any) {
    console.error('Mark campsite error:', error.response?.data || error.message);
    
    // If the API request failed but we're online, queue for later retry
    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected) {
      await queueOfflineAction('markCampsite', {
        userId,
        latitude,
        longitude,
        sharedWithFriends
      });
    }
    
    throw new Error(
      error.response?.data?.message || 'Failed to mark campsite location'
    );
  }
};

/**
 * Remove a user's campsite
 * 
 * @param userId The ID of the user
 * @returns Promise that resolves when campsite is removed
 */
export const removeCampsite = async (userId: string): Promise<void> => {
  try {
    // Check for token
    const token = await getIdToken();
    
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    // Check network connectivity
    const netInfo = await NetInfo.fetch();
    
    // If offline, queue the request for later synchronization
    if (!netInfo.isConnected) {
      await queueOfflineAction('removeCampsite', { userId });
      return;
    }
    
    // Send the request to remove the campsite
    await api.delete(`/campsites/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    // Update user profile to reflect campsite sharing preference
    await api.put('/users/profile', {
      shareMyCampsite: false
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error: any) {
    console.error('Remove campsite error:', error.response?.data || error.message);
    
    // If the API request failed but we're online, queue for later retry
    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected) {
      await queueOfflineAction('removeCampsite', { userId });
    }
    
    throw new Error(
      error.response?.data?.message || 'Failed to remove campsite location'
    );
  }
};

/**
 * Queue an action to be performed when back online
 * 
 * @param actionType The type of action to queue
 * @param actionData The data for the action
 */
const queueOfflineAction = async (
  actionType: 'markCampsite' | 'removeCampsite',
  actionData: any
): Promise<void> => {
  try {
    // Get existing queue
    const queueStr = await AsyncStorage.getItem('offline_action_queue');
    const queue = queueStr ? JSON.parse(queueStr) : [];
    
    // Add new action to queue
    queue.push({
      type: actionType,
      data: actionData,
      timestamp: Date.now()
    });
    
    // Save updated queue
    await AsyncStorage.setItem('offline_action_queue', JSON.stringify(queue));
    
    // Queued action for later synchronization when online
  } catch (error) {
    console.error('Error queueing offline action:', error);
  }
};

/**
 * Process all queued offline actions
 * This would typically be called when the app detects it's back online
 */
export const processCampsiteOfflineQueue = async (): Promise<void> => {
  try {
    // Check if we're online
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      return; // Still offline, cannot process queue
    }
    
    // Get the queue
    const queueStr = await AsyncStorage.getItem('offline_action_queue');
    if (!queueStr) {
      return; // No queued actions
    }
    
    const queue = JSON.parse(queueStr);
    if (queue.length === 0) {
      return; // Empty queue
    }

    // Process each queued offline action
    const failedActions = [];
    
    for (const action of queue) {
      try {
        if (action.type === 'markCampsite') {
          const { userId, latitude, longitude, sharedWithFriends } = action.data;
          await markCampsite(userId, latitude, longitude, sharedWithFriends);
        } else if (action.type === 'removeCampsite') {
          const { userId } = action.data;
          await removeCampsite(userId);
        }
      } catch (error) {
        console.error(`Failed to process queued action ${action.type}:`, error);
        failedActions.push(action);
      }
    }
    
    // Update the queue with only failed actions
    if (failedActions.length > 0) {
      await AsyncStorage.setItem('offline_action_queue', JSON.stringify(failedActions));
    } else {
      await AsyncStorage.removeItem('offline_action_queue');
    }

    // Completed processing offline queue
  } catch (error) {
    console.error('Error processing offline queue:', error);
  }
};
