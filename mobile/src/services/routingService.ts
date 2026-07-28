import Constants from 'expo-constants';

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

function getMapboxToken(): string | null {
  const token =
    (Constants.expoConfig?.extra as Record<string, unknown> | undefined)?.mapboxAccessToken;
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
        // 4xx (bad coords/token) won't fix on retry — bail immediately.
        if (res.status >= 400 && res.status < 500) {
          console.error(`[routingService] Directions API ${res.status} — not retrying.`);
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

/** Human-friendly route summary, e.g. "0.4 mi · 6 min walk". */
export function formatRouteSummary(r: RouteResult): string {
  const miles = r.distanceMeters / 1609.34;
  const distStr = miles < 0.1
    ? `${Math.round(r.distanceMeters * 3.28084)} ft`
    : `${miles.toFixed(1)} mi`;
  const mins = Math.max(1, Math.round(r.durationSeconds / 60));
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
