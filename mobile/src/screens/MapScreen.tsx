// Commit: Replace complex map screen with a simple static camping map image
// Author: GitHub Copilot (automated)
// Date: 2025-09-23

import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Image, View, useWindowDimensions } from 'react-native';

import campingMap from '../assets/images/bff25_CampingMap.png';
import TopNavBar from '../components/TopNavBar';

/**
 * Simple MapScreen
 * - Shows the bundled camping map image sized to the device width
 * - Vertically centers the image on the screen
 * Props: none
 */
export default function MapScreen() {
  const { width } = useWindowDimensions();
  const [height, setHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    // Use the imported local asset
    const resolved = Image.resolveAssetSource(campingMap);
    if (resolved && resolved.width && resolved.height) {
      const h = (resolved.height / resolved.width) * width;
      setHeight(h);
    } else {
      // Fallback: leave height undefined so 'contain' will handle it
      setHeight(undefined);
    }
  }, [width]);

  return (
    <SafeAreaView style={styles.container}>
  <TopNavBar whiteIcons={true} />
        <Image
          source={campingMap}
          style={[styles.image, { width, height: height ?? undefined }]}
          resizeMode="contain"
          accessibilityLabel="Camping map"
        />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Force a consistent dark green background regardless of theme
    backgroundColor: '#235001',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  image: {
    // height is calculated dynamically to preserve aspect ratio
  },
});
