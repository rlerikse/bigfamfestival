/**
 * POI shape returned by GET /map/pois.
 *
 * This is the contract the mobile app consumes (mobile/src/services/mapService.ts).
 * It intentionally differs from the admin/Firestore storage shape (which uses
 * flat `lat`/`lng` and a `category` field); the service maps storage -> this.
 */
export type PoiType =
  | 'stage'
  | 'food_vendor'
  | 'shop_and_service'
  | 'beverage_vendor'
  | 'staff_and_medical'
  | 'friend_campsite'
  | 'friend_location';

export interface Poi {
  id: string;
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
