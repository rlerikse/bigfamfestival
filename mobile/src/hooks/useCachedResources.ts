import { useEffect, useState } from 'react';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import NetInfo from '@react-native-community/netinfo';
import { checkApiHealth } from '../services/api';

/**
 * Hook to load resources and data needed before rendering the app
 */
export default function useCachedResources() {
  const [isLoadingComplete, setLoadingComplete] = useState(false);

  // Load any resources or data needed prior to rendering the app
  useEffect(() => {
    async function loadResourcesAndDataAsync() {
      try {
        // Load fonts
        await Font.loadAsync({
          ...Ionicons.font,
          'space-mono': require('../assets/fonts/SpaceMono-Regular.ttf'),
        });

        // Check network connectivity
        const netInfo = await NetInfo.fetch();
        
        // Check if server is reachable when online
        if (netInfo.isConnected) {
          try {
            await checkApiHealth();
          } catch (error) {
            console.warn('API health check failed:', error);
            // Continue loading the app even if the API is unreachable
          }
        }

        // Verify token if exists
        const token = await SecureStore.getItemAsync('userToken');
        if (token) {
          try {
            // Validate token (optional)
            // You might want to implement a lightweight validation method
          } catch (error) {
            console.warn('Token validation failed:', error);
            // Clear invalid tokens
            await SecureStore.deleteItemAsync('userToken');
          }
        }

        // Load additional fonts or other assets here
      } catch (e) {
        // Log error but don't prevent app from loading
        console.warn('Error loading resources:', e);
      } finally {
        setLoadingComplete(true);
      }
    }

    loadResourcesAndDataAsync();
  }, []);

  return isLoadingComplete;
}
