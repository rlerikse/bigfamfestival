import React from 'react';
import { SafeAreaView, StyleSheet, View, Text } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import TopNavBar from '../components/TopNavBar';
import { useTheme } from '../contexts/ThemeContext';

// Big Fam Festival coordinates (Boughton House, Northamptonshire, UK)
const FESTIVAL_CENTER: [number, number] = [-0.6595, 52.3227];
const DEFAULT_ZOOM = 15;

export default function MapScreen() {
  const { isDark } = useTheme();

  return (
    <SafeAreaView style={styles.container}>
      <TopNavBar whiteIcons={true} />
      <View style={styles.mapContainer}>
        <Mapbox.MapView
          style={styles.map}
          styleURL={isDark ? Mapbox.StyleURL.Dark : Mapbox.StyleURL.Outdoors}
          compassEnabled={true}
        >
          <Mapbox.Camera
            defaultSettings={{
              centerCoordinate: FESTIVAL_CENTER,
              zoomLevel: DEFAULT_ZOOM,
            }}
          />
        </Mapbox.MapView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});
