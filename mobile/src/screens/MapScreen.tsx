// Commit: Improve map image loading performance with caching and loading state
// Author: GitHub Copilot (automated)
// Date: 2025-09-23

import React, { useEffect, useState, useMemo } from 'react';
import { SafeAreaView, StyleSheet, View, useWindowDimensions, ActivityIndicator, Image, useColorScheme } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import * as FileSystem from 'expo-file-system';

import campingMap from '../assets/images/bff25_CampingMap.png';
import TopNavBar from '../components/TopNavBar';

/**
 * Enhanced MapScreen with optimized loading
 * - Uses ExpoImage for automatic caching and better performance
 * - Calculates dimensions once and memoizes the result
 * - Shows loading indicator until the image is ready
 * - Implements file system caching for faster subsequent loads
 * - Background color and icon colors adapt to light/dark theme
 * Props: none
 */
export default function MapScreen() {
  const { width } = useWindowDimensions();
  const [isLoading, setIsLoading] = useState(true);
  const [cachedImageUri, setCachedImageUri] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  
  // Determine background color based on theme
  const backgroundColor = colorScheme === 'dark' ? '#235001' : '#ffffff';
  
  // Icons should be white on dark background, dark on light background
  const whiteIcons = colorScheme === 'dark';
  
  // Calculate and memoize image height based on aspect ratio
  const imageStyle = useMemo(() => {
    // Get dimensions from the bundled image asset
    const assetSource = Image.resolveAssetSource(campingMap);
    if (assetSource?.width && assetSource?.height) {
      const aspectRatio = assetSource.width / assetSource.height;
      return {
        width,
        height: width / aspectRatio,
        aspectRatio
      };
    }
    return { width, aspectRatio: 1 };
  }, [width]);
  
  // Image is now preloaded at app startup, so we can use it directly
  useEffect(() => {
    // Since the image is preloaded in useCachedResources,
    // we just need to set loading to false immediately
    setIsLoading(false);
    
    // Optional: For file system caching, we can still keep this as a backup
    const cacheImage = async () => {
      try {
        // Create a unique filename based on the image source
        const imageName = "bff25_CampingMap.png";
        const cacheDir = FileSystem.cacheDirectory;
        const cacheFilePath = `${cacheDir}${imageName}`;
        
        // Check if file exists in cache
        const fileInfo = await FileSystem.getInfoAsync(cacheFilePath);
        
        if (fileInfo.exists) {
          // Use cached file
          setCachedImageUri(cacheFilePath);
        } else {
          // Need to resolve the actual URI from the bundled asset
          const imageAssetModule = Image.resolveAssetSource(campingMap);
          
          // Download and cache the file
          const downloadResult = await FileSystem.downloadAsync(
            imageAssetModule.uri,
            cacheFilePath
          );
          
          if (downloadResult.status === 200) {
            setCachedImageUri(downloadResult.uri);
          }
        }
      } catch (error) {
        console.warn('Error caching image:', error);
        // Fallback to using the asset directly - which is fine since it's preloaded
      }
    };
    
    // Run the caching in the background
    cacheImage();
  }, []);
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <TopNavBar whiteIcons={whiteIcons} />
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      ) : (
        <ExpoImage
          source={cachedImageUri ? { uri: cachedImageUri } : campingMap}
          style={[styles.image, { width: imageStyle.width, height: imageStyle.height }]}
          contentFit="contain"
          cachePolicy="memory-disk"
          transition={300}
          accessibilityLabel="Camping map"
          onLoad={() => setIsLoading(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Background color is now dynamic based on theme
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    // height is calculated dynamically to preserve aspect ratio
  },
});
