import { useEffect, useState } from 'react';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import NetInfo from '@react-native-community/netinfo';
import { checkApiHealth } from '../services/api';
import { Asset } from 'expo-asset';
import { Image as ExpoImage } from 'expo-image';
import { Image } from 'react-native';

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
            console.log('[STARTUP] Checking API health...');
            const healthResult = await checkApiHealth();
            if (healthResult.isHealthy) {
              console.log('[STARTUP] ✅ API connection successful!');
            } else {
              console.warn('[STARTUP] ⚠️ API health check failed:', healthResult.message);
            }
          } catch (error) {
            console.error('[STARTUP] ❌ API health check error:', error);
            // Continue loading the app even if the API is unreachable
          }
        } else {
          console.warn('[STARTUP] ⚠️ No network connection detected');
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
        // Preload commonly used images to avoid pop-in when screens mount
        
        // Separate critical UI images (like the logo) to load first
        const criticalImages = [
          // App logo is highest priority - visible immediately in nav bar
          require('../assets/images/bf-logo-trans.png'),
        ];
        
        // Secondary images that should load, but aren't as time-critical
        const secondaryImages = [
          require('../assets/images/grass-seamless.png'),
          require('../assets/images/tree-3.png'),
          require('../assets/images/tent.png'),
          require('../assets/images/bff25_CampingMap.png'),
          require('../assets/images/gates-open-in.png'),
          require('../assets/images/apogee-logo-trans.png'),
          require('../assets/images/bayou-logo-trans.png'),
          require('../assets/images/gallery-logo-trans.png'),
        ];
        // All images combined (keeping this for reference or future use)
        // const imagesToCache = [...criticalImages, ...secondaryImages];

        // First load critical images synchronously to ensure they're available immediately
        // Start with the logo which is visible right away
        for (const criticalImg of criticalImages) {
          try {
            // Load with Asset API
            await Asset.fromModule(criticalImg).downloadAsync();
            
            // Also load with expo-image for its caching system
            const criticalUri = Image.resolveAssetSource(criticalImg).uri;
            await ExpoImage.prefetch(criticalUri);
          } catch (err) {
            console.warn('Error preloading critical image:', err);
            // Continue even if there's an error with one image
          }
        }
        
        // Then load the rest of the images in parallel
        // Use both Expo Asset API and expo-image caching for comprehensive caching
        const cacheImagesWithAsset = secondaryImages.map((img) => Asset.fromModule(img).downloadAsync());
        
        // Also use expo-image's prefetch mechanism for its own caching system
        const imageModules = secondaryImages.map(img => Image.resolveAssetSource(img).uri);
        const cacheImagesWithExpoImage = imageModules.map(uri => ExpoImage.prefetch(uri));
        
        // Wait for all secondary images to complete loading
        await Promise.all([...cacheImagesWithAsset, ...cacheImagesWithExpoImage]);
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
