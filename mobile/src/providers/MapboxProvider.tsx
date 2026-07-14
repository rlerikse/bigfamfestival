import React, { useEffect } from 'react';
import Mapbox from '@rnmapbox/maps';
import Constants from 'expo-constants';

const MAPBOX_TOKEN = Constants.expoConfig?.extra?.mapboxAccessToken
  ?? process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;

/**
 * Initializes the Mapbox SDK with the access token.
 * Wrap your app with this provider once at the root.
 */
export function MapboxProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (MAPBOX_TOKEN) {
      Mapbox.setAccessToken(MAPBOX_TOKEN);
    } else if (__DEV__) {
      console.warn(
        '[MapboxProvider] No access token found. Set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN.'
      );
    }
  }, []);

  return <>{children}</>;
}
