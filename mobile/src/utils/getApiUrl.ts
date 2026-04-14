import Constants from 'expo-constants';

/**
 * Gets the appropriate API URL for the current environment.
 *
 * Source of truth: app.config.js `extra.apiUrl`
 * That value is set based on APP_ENV at build time.
 *
 * Override for local device testing:
 *   EXPO_PUBLIC_API_URL=http://192.168.x.x:8080/api/v1 npx expo start
 */
export const getApiUrl = (): string => {
  // Explicit env var always wins (useful for local device testing)
  const envOverride = process.env.EXPO_PUBLIC_API_URL;
  if (envOverride) {
    if (__DEV__) console.log('[API] Using EXPO_PUBLIC_API_URL override:', envOverride);
    return envOverride;
  }

  // Pull from app.config.js (set at build time)
  const configUrl = Constants.expoConfig?.extra?.apiUrl;
  if (configUrl) {
    if (__DEV__) console.log('[API] Using app.config.js apiUrl:', configUrl);
    return configUrl;
  }

  // Should not reach here in a properly configured build
  const fallback = 'http://localhost:8080/api/v1';
  console.warn('[API] No apiUrl found in config — falling back to localhost. Set APP_ENV or EXPO_PUBLIC_API_URL.');
  return fallback;
};
