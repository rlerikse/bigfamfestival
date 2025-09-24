/**
 * Debug tools for development mode
 * These utilities should only be used during development and testing
 */

import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import { UserRole } from '../types/user';

/**
 * Helper to decode a JWT token and extract its payload
 */
export const decodeJwt = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error('Error decoding JWT:', err);
    return null;
  }
};

/**
 * Displays current user token information
 * This is useful for debugging authentication issues
 */
export const showTokenDebugInfo = async (): Promise<void> => {
  if (!__DEV__) {
    console.warn('Debug tools should only be used in development');
    return;
  }

  try {
    const token = await SecureStore.getItemAsync('accessToken');
    
    if (!token) {
      Alert.alert('Debug Info', 'No access token found in secure storage');
      return;
    }
    
    const decoded = decodeJwt(token);
    
    if (!decoded) {
      Alert.alert('Debug Info', `Token found but couldn't be decoded: ${token.substring(0, 15)}...`);
      return;
    }
    
    Alert.alert(
      'Token Debug Info',
      `Subject: ${decoded.sub || 'N/A'}\n` +
      `Role: ${decoded.role || 'N/A'}\n` +
      `Email: ${decoded.email || 'N/A'}\n` +
      `Expires: ${new Date(decoded.exp * 1000).toLocaleString() || 'N/A'}\n` +
      `Issued: ${new Date(decoded.iat * 1000).toLocaleString() || 'N/A'}`
    );
  } catch (error) {
    Alert.alert('Debug Error', `Error checking token: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Displays the stored role in the token vs. the role in the user object
 * This helps identify discrepancies between the token and the stored user data
 */
export const compareRoles = async (currentUserRole: UserRole | undefined): Promise<void> => {
  if (!__DEV__) {
    console.warn('Debug tools should only be used in development');
    return;
  }

  try {
    const token = await SecureStore.getItemAsync('accessToken');
    
    if (!token) {
      Alert.alert('Role Comparison', 'No token found.\nCurrent user role: ' + (currentUserRole || 'none'));
      return;
    }
    
    const decoded = decodeJwt(token);
    
    if (!decoded) {
      Alert.alert('Role Comparison', 'Token could not be decoded.\nCurrent user role: ' + (currentUserRole || 'none'));
      return;
    }
    
    const tokenRole = decoded.role;
    
    Alert.alert(
      'Role Comparison',
      `Token role: ${tokenRole || 'none'}\nUser object role: ${currentUserRole || 'none'}\n\n${tokenRole === currentUserRole ? '✅ Roles match' : '❌ Role mismatch'}`
    );
  } catch (error) {
    Alert.alert('Debug Error', `Error comparing roles: ${error instanceof Error ? error.message : String(error)}`);
  }
};