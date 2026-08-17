import Constants from 'expo-constants';
import { Linking, Alert, Platform } from 'react-native';

/**
 * routingService — walking directions via the Mapbox Directions API.
 *
 * Given an origin and destination (lng/lat), returns the route as GeoJSON
 * (for drawing a LineLayer) plus distance/duration for a summary label.
 *
 * Design notes:
 *  - Walking profile: this is an on-foot festival, driving routes make no sense.
 *  - Uses the same public Mapbox token the map render already uses
 *    (expoConfig.extra.mapboxAccessToken). No separate secret.
 *  - Retries transient failures with exponential backoff. Fails soft: the
 *    caller gets null and shows a friendly message rather than crashing.
 */

export interface RouteResult {
  /** GeoJSON LineString geometry of the route, ready for a Mapbox ShapeSource. */
  geojson: GeoJSON.Feature<GeoJSON.LineString>;
  /** Total walking distance in meters. */
  distanceMeters: number;
  /** Estimated walking duration in seconds. */
  durationSeconds: number;
}

export type LngLat = [number, number];

const DIRECTIONS_BASE = 'https://api.mapbox.com/directions/v5/mapbox/walking';
const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 400;
// Beyond this, the destination is off festival grounds — hand off to the
// user's own map app instead of drawing an in-app walking route (which is
// scoped to short on-site distances).
export const EXTERNAL_MAPS_THRESHOLD_METERS = 1609.34; // 1 mile

function getMapboxToken(): string | null {
  // Mirror MapboxProvider's resolution: prefer the manifest's extra value, but
  // fall back to the bundle-inlined EXPO_PUBLIC_ env var. In dev-client builds
  // expoConfig.extra.mapboxAccessToken can come back undefined even when the
  // map renders fine (the provider uses the env fallback) — so directions must
  // check both, or routing breaks while the map works.
  const fromExtra = (Constants.expoConfig?.extra as Record<string, unknown> | undefined)
    ?.mapboxAccessToken;
  const token =
    (typeof fromExtra === 'string' && fromExtra.length > 0 ? fromExtra : undefined) ??
    process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
  return typeof token === 'string' && token.length > 0 ? token : null;
}

const sleep = (ms: number) => new Promise<void>(res => setTimeout(res, ms));

/**
 * Fetch a walking route from origin to destination.
 * Returns null on unrecoverable failure (missing token, no route, network down
 * after retries) — the caller should surface a soft error, never crash.
 */
export async function getWalkingRoute(
  origin: LngLat,
  destination: LngLat
): Promise<RouteResult | null> {
  const token = getMapboxToken();
  if (!token) {
    console.error('[routingService] No Mapbox token available for directions.');
    return null;
  }

  const coords = `${origin[0]},${origin[1]};${destination[0]},${destination[1]}`;
  const url =
    `${DIRECTIONS_BASE}/${coords}` +
    `?geometries=geojson&overview=full&steps=false&access_token=${token}`;

  let lastErr: unknown = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        await sleep(BASE_BACKOFF_MS * 2 ** (attempt - 1));
      }
      const res = await fetch(url);
      if (!res.ok) {
        // 4xx (bad coords/token, or e.g. a walking route too far to compute)
        // won't fix on retry — bail immediately. warn, not error: this is a
        // gracefully-handled, expected failure path (caller shows a friendly
        // Alert), matching the "no route found" case below rather than
        // triggering React Native's disruptive full-screen dev redbox.
        if (res.status >= 400 && res.status < 500) {
          console.warn(`[routingService] Directions API ${res.status} — not retrying.`);
          return null;
        }
        throw new Error(`Directions API responded ${res.status}`);
      }
      const data = await res.json();
      const route = data?.routes?.[0];
      if (!route?.geometry) {
        console.warn('[routingService] No route found between points.');
        return null;
      }
      return {
        geojson: {
          type: 'Feature',
          properties: {},
          geometry: route.geometry as GeoJSON.LineString,
        },
        distanceMeters: typeof route.distance === 'number' ? route.distance : 0,
        durationSeconds: typeof route.duration === 'number' ? route.duration : 0,
      };
    } catch (err) {
      lastErr = err;
      console.warn(
        `[routingService] Directions fetch attempt ${attempt + 1}/${MAX_RETRIES} failed:`,
        err
      );
    }
  }

  console.error('[routingService] Directions failed after retries:', lastErr);
  return null;
}

/** Human-friendly route summary, e.g. "0.4 mi · 6 min walk" (or km, per Settings toggle). */
export function formatRouteSummary(r: RouteResult, unit: 'mi' | 'km' = 'mi'): string {
  const mins = Math.max(1, Math.round(r.durationSeconds / 60));
  if (unit === 'km') {
    const km = r.distanceMeters / 1000;
    const distStr = km < 0.1 ? `${Math.round(r.distanceMeters)} m` : `${km.toFixed(1)} km`;
    return `${distStr} · ${mins} min walk`;
  }
  const miles = r.distanceMeters / 1609.34;
  const distStr = miles < 0.1
    ? `${Math.round(r.distanceMeters * 3.28084)} ft`
    : `${miles.toFixed(1)} mi`;
  return `${distStr} · ${mins} min walk`;
}

/** Bounding box [ [minLng,minLat], [maxLng,maxLat] ] of a route, for camera fit. */
export function routeBounds(r: RouteResult): { ne: LngLat; sw: LngLat } {
  const coords = r.geojson.geometry.coordinates as LngLat[];
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  for (const [lng, lat] of coords) {
    if (lng < minLng) minLng = lng;
    if (lat < minLat) minLat = lat;
    if (lng > maxLng) maxLng = lng;
    if (lat > maxLat) maxLat = lat;
  }
  return { ne: [maxLng, maxLat], sw: [minLng, minLat] };
}

/**
 * Hand off directions to the user's own map app (Google Maps, Waze, or the
 * platform's native Maps) — used when a destination is beyond
 * EXTERNAL_MAPS_THRESHOLD_METERS, i.e. off festival grounds, where an in-app
 * walking route doesn't make sense. Detects which apps are actually
 * installed via Linking.canOpenURL and lets the user pick when more than one
 * is available; opens directly when there's only one option.
 */
export async function openExternalDirections(destination: LngLat, label: string): Promise<void> {
  const [lng, lat] = destination;

  const googleMapsUrl = Platform.OS === 'ios'
    ? `comgooglemaps://?daddr=${lat},${lng}&directionsmode=walking`
    : `google.navigation:q=${lat},${lng}&mode=w`;
  const wazeUrl = `waze://?ll=${lat},${lng}&navigate=yes`;
  const nativeMapsUrl = Platform.OS === 'ios'
    ? `maps://?daddr=${lat},${lng}&dirflg=w`
    : `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(label)})`;
  const webFallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;

  const candidates = [
    { name: 'Google Maps', url: googleMapsUrl },
    { name: 'Waze', url: wazeUrl },
    { name: Platform.OS === 'ios' ? 'Apple Maps' : 'Maps', url: nativeMapsUrl },
  ];

  const available: { name: string; url: string }[] = [];
  for (const app of candidates) {
    try {
      if (await Linking.canOpenURL(app.url)) available.push(app);
    } catch {
      // canOpenURL throws on some Android versions for unqueried schemes —
      // treat as not installed rather than crashing the picker.
    }
  }

  const open = (url: string) => Linking.openURL(url).catch(() => Linking.openURL(webFallbackUrl).catch(() => {}));

  if (available.length === 0) {
    open(webFallbackUrl);
    return;
  }
  if (available.length === 1) {
    open(available[0].url);
    return;
  }

  Alert.alert(
    'Get Directions',
    `Open directions to ${label} in:`,
    [
      ...available.map(app => ({ text: app.name, onPress: () => open(app.url) })),
      { text: 'Cancel', style: 'cancel' as const },
    ]
  );
}
