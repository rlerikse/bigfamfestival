import { api } from './api';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system';
import { User } from '../contexts/AuthContext';

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
    const token = await SecureStore.getItemAsync('userToken');
    
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    const response = await api.put<User>(`/users/profile`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    return response.data;
  } catch (error: any) {
    console.error('Update profile error:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || 'Failed to update user profile'
    );
  }
};

/**
 * Upload profile picture
 */
export const uploadProfilePicture = async (
  userId: string,
  imageUri: string
): Promise<string> => {
  try {
    const token = await SecureStore.getItemAsync('userToken');
    
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    // First, get the signed URL for upload
    const getUploadUrlResponse = await api.get('/storage/upload-url', {
      params: {
        contentType: 'image/jpeg',
        extension: 'jpg',
        directory: 'profile-pictures',
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    const { uploadUrl, fileUrl } = getUploadUrlResponse.data;
    
    // Upload the image to the signed URL
    await FileSystem.uploadAsync(uploadUrl, imageUri, {
      httpMethod: 'PUT',
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: {
        'Content-Type': 'image/jpeg',
      },
    });
    
    // Update the user profile with the new image URL
    await updateUserProfile(userId, { profilePictureUrl: fileUrl });
    
    return fileUrl;
  } catch (error: any) {
    console.error('Upload profile picture error:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || 'Failed to upload profile picture'
    );
  }
};

/**
 * Mark or update campsite location
 */
export const updateCampsiteLocation = async (
  latitude: number,
  longitude: number,
  sharedWithFriends: boolean
): Promise<void> => {
  try {
    const token = await SecureStore.getItemAsync('userToken');
    
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    await api.post('/campsites', {
      location_lat: latitude,
      location_long: longitude,
      shared_with_friends: sharedWithFriends,
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error: any) {
    console.error('Update campsite error:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || 'Failed to update campsite location'
    );
  }
};

/**
 * Remove campsite location
 */
export const removeCampsiteLocation = async (): Promise<void> => {
  try {
    const token = await SecureStore.getItemAsync('userToken');
    
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    await api.delete('/campsites', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error: any) {
    console.error('Remove campsite error:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || 'Failed to remove campsite location'
    );
  }
};
