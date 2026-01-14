/**
 * Debug tools specifically for notifications
 * These utilities should only be used during development and testing
 */

import { Alert } from 'react-native';
import { api } from '../services/api';

/**
 * Checks if there are any push tokens registered in the system
 * This is useful to debug if notifications can be sent at all
 */
export const checkPushTokenCount = async (): Promise<void> => {
  if (!__DEV__) {
    console.warn('Debug tools should only be used in development');
    return;
  }

  try {
    Alert.alert('Checking', 'Querying registered push tokens...');
    
    // Make a request to the special debug endpoint to count tokens
    // We need to add this endpoint to the backend
    const response = await api.get('/notifications/debug/token-count');
    
    if (response.data.count === 0) {
      Alert.alert(
        'No Push Tokens Found',
        'There are no push tokens registered in the system. Users need to grant notification permissions and register their device tokens before notifications can be sent.'
      );
    } else {
      Alert.alert(
        'Push Tokens Found',
        `Found ${response.data.count} registered device tokens.\n\nTokens by platform:\nAndroid: ${response.data.android || 0}\niOS: ${response.data.ios || 0}\nWeb: ${response.data.web || 0}\nUnknown: ${response.data.unknown || 0}`
      );
    }
  } catch (error) {
    console.error('Error checking token count:', error);
    
    // If the endpoint doesn't exist, suggest adding it
    Alert.alert(
      'Error Checking Tokens',
      'The token count debug endpoint is not available. You may need to add this endpoint to your backend.'
    );
  }
};

/**
 * Checks Firebase Cloud Messaging (FCM) configuration on the backend
 */
export const checkFcmConfig = async (): Promise<void> => {
  if (!__DEV__) {
    console.warn('Debug tools should only be used in development');
    return;
  }

  try {
    Alert.alert('Checking', 'Verifying FCM configuration...');
    
    // Make a request to a debug endpoint to verify FCM config
    // We need to add this endpoint to the backend
    const response = await api.get('/notifications/debug/fcm-config');
    
    if (response.data.isConfigured) {
      Alert.alert(
        'FCM Configured',
        'Firebase Cloud Messaging is properly configured on the backend.'
      );
    } else {
      Alert.alert(
        'FCM Configuration Issue',
        `Firebase Cloud Messaging is not properly configured: ${response.data.message || 'Unknown error'}`
      );
    }
  } catch (error) {
    console.error('Error checking FCM config:', error);
    
    // If the endpoint doesn't exist, suggest adding it
    Alert.alert(
      'Error Checking FCM',
      'The FCM configuration debug endpoint is not available. You may need to add this endpoint to your backend.'
    );
  }
};