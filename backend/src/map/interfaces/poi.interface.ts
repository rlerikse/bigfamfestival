/**
 * POI shape returned by GET /map/pois.
 *
 * This is the contract the mobile app consumes (mobile/src/services/mapService.ts).
 * It intentionally differs from the admin/Firestore storage shape (which uses
 * flat `lat`/`lng` and a `category` field); the service maps storage -> this.
 */
export type PoiType =
  | 'stage'
  | 'infrastructure'
  | 'staff'
  | 'vendors'
  | 'friend_campsite'
  | 'friend_location';

export interface Poi {
  id: string;
  /**
   * POI category driving marker icon/color. Mobile's MapScreen.tsx calls
   * `resolveCategory(poi.category)` — it reads THIS field, not `type` — so it
   * must be present for markers to render. Value is a valid PoiType string.
   */
  category: PoiType;
  /**
   * Same value as `category`. Kept because the mobile `POI` interface + mock
   * data are typed on `type`, and friend-location logic branches on it. Emitting
   * both keeps the storage->mobile contract unambiguous for either reader.
   */
  type: PoiType;
  name: string;
  location: {
    lat: number;
    long: number;
  };
  description?: string;
  /** Marker color (hex) for map rendering; falls back on the mobile side. */
  color?: string;
  /** Emoji icon fallback when no custom marker image is set. */
  icon?: string;
  /** Full HTTPS download URL for a custom marker image; empty => emoji fallback. */
  markerAsset?: string;
}
