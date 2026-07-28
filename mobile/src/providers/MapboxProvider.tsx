import React from 'react';
import Mapbox from '@rnmapbox/maps';
import Constants from 'expo-constants';

const MAPBOX_TOKEN =
  Constants.expoConfig?.extra?.mapboxAccessToken ??
  process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;

/**
 * Register the Mapbox access token at MODULE LOAD time.
 *
 * This intentionally runs synchronously when the module is first imported
 * (App.tsx imports this provider at the top level, before the React tree
 * renders). Setting the token inside a useEffect instead races the native
 * SDK's tile/telemetry initialization in release builds — the native side
 * comes up before the effect commits, logs "Telemetry service not started,
 * missing token", never authenticates tile requests, and the map renders
 * blank/black even though the token is valid. Setting it here guarantees the
 * token is present before any MapView mounts.
 */
if (MAPBOX_TOKEN) {
  Mapbox.setAccessToken(MAPBOX_TOKEN);
} else if (__DEV__) {
  // eslint-disable-next-line no-console
  console.warn(
    '[MapboxProvider] No access token found. Set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN.'
  );
}

/**
 * Kept as a thin wrapper so the existing <MapboxProvider> usage in App.tsx
 * continues to work. Token registration happens at module load (above).
 */
export function MapboxProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
