// src/components/WayfinderHUD.tsx
/**
 * WayfinderHUD — Live Wayfinder (#159): border-anchored friend-radar ring.
 *
 * Always-visible layer showing every friend (online/sharing/mutual) as a
 * profile-pic icon anchored to the screen border in the direction of their
 * real-world bearing, with a distance label (mi/km per Settings toggle).
 *
 * Per Robert's ruling this COEXISTS with the hot/cold directional tracking
 * mode (see DirectionalGradientBorder + useDirectionalTracking) — this radar
 * ring keeps rendering for ALL friends regardless of whether one is currently
 * selected for tracking. MapScreen renders both layers stacked together.
 */
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import OptimizedImage from './OptimizedImage';
import { computeBearing } from '../hooks/useDirectionalTracking';
import type { LngLat } from '../services/routingService';

export interface WayfinderFriend {
  userId: string;
  name: string;
  profilePictureUrl?: string;
  lat: number;
  lng: number;
}

interface Props {
  /** Current user position (lng, lat), or null if unavailable — HUD hides itself. */
  userCoords: LngLat | null;
  /** Live device compass heading in degrees, shared with the tracking hook so the
   *  radar ring and the hot/cold border rotate in sync from one sensor read. */
  heading: number;
  /** All friends to show on the border radar (always visible, independent of tracking). */
  friends: WayfinderFriend[];
  /** userId of the friend currently in hot/cold tracking mode, if any — used only
   *  to highlight that one icon's ring color, never to hide the others. */
  trackedFriendId?: string | null;
  /** Distance unit for radar labels, from Settings. */
  distanceUnit: 'mi' | 'km';
  /**
   * Current map viewport bounds as `[[rightLon, topLat], [leftLon, bottomLat]]`
   * (matches @rnmapbox/maps `getVisibleBounds()` return shape). When a friend's
   * coordinate already falls inside these bounds, they're visible as a normal
   * on-map marker already — the radar edge-icon for that friend is suppressed
   * so we don't show two icons (edge + on-map) for the same person at once.
   * Pass null while bounds are unknown (radar behaves as before: always show
   * every friend at the edge until we know better).
   */
  visibleBounds?: [[number, number], [number, number]] | null;
  onSelectFriend?: (friend: WayfinderFriend) => void;
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const RADAR_MARGIN = 14;
const ICON_SIZE = 44; // 44px min touch target

const EARTH_RADIUS_M = 6371000;
function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function distanceMeters(a: LngLat, b: LngLat): number {
  const [lon1, lat1] = a.map(toRad) as [number, number];
  const [lon2, lat2] = b.map(toRad) as [number, number];
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

function metersToDisplay(meters: number, unit: 'mi' | 'km'): string {
  if (unit === 'km') {
    const km = meters / 1000;
    return km < 1 ? `${Math.round(meters)} m` : `${km.toFixed(1)} km`;
  }
  const miles = meters / 1609.344;
  return miles < 0.1 ? `${Math.round(meters * 3.28084)} ft` : `${miles.toFixed(1)} mi`;
}

/**
 * Projects a *relative* bearing (target bearing minus current device heading,
 * 0° = straight ahead) onto the rectangular screen border, so radar icons
 * swing around the edge like a real radar as the user turns.
 */
function borderPositionForRelativeBearing(relativeBearingDeg: number): { x: number; y: number } {
  const rad = toRad(relativeBearingDeg);
  const cx = SCREEN_W / 2;
  const cy = SCREEN_H / 2;
  const dx = Math.sin(rad);
  const dy = -Math.cos(rad);

  const halfW = SCREEN_W / 2 - RADAR_MARGIN;
  const halfH = SCREEN_H / 2 - RADAR_MARGIN;
  const scale = Math.min(
    dx !== 0 ? Math.abs(halfW / dx) : Infinity,
    dy !== 0 ? Math.abs(halfH / dy) : Infinity
  );
  return { x: cx + dx * scale, y: cy + dy * scale };
}

export default function WayfinderHUD({
  userCoords,
  heading,
  friends,
  trackedFriendId,
  distanceUnit,
  visibleBounds,
  onSelectFriend,
}: Props) {
  const radarEntries = useMemo(() => {
    if (!userCoords) return [];
    const [[rightLon, topLat], [leftLon, bottomLat]] = visibleBounds ?? [[NaN, NaN], [NaN, NaN]];
    const hasBounds = visibleBounds != null;
    return friends
      .filter((f) => {
        if (!hasBounds) return true; // bounds unknown yet — fall back to always-show
        const withinLon = f.lng >= leftLon && f.lng <= rightLon;
        const withinLat = f.lat >= bottomLat && f.lat <= topLat;
        // If the friend is already inside the current map viewport, they're
        // rendered as a normal on-map marker already — skip the radar edge-icon
        // for them so we don't double up.
        return !(withinLon && withinLat);
      })
      .map((f) => {
        const target: LngLat = [f.lng, f.lat];
        const bearing = computeBearing(userCoords, target);
        const relative = (bearing - heading + 360) % 360;
        const dist = distanceMeters(userCoords, target);
        return {
          friend: f,
          pos: borderPositionForRelativeBearing(relative),
          label: metersToDisplay(dist, distanceUnit),
        };
      });
  }, [userCoords, friends, heading, distanceUnit, visibleBounds]);

  if (!userCoords || radarEntries.length === 0) return null;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      {radarEntries.map(({ friend, pos, label }) => {
        const isTracked = trackedFriendId === friend.userId;
        return (
          <View
            key={friend.userId}
            pointerEvents="box-none"
            style={[styles.radarIcon, { left: pos.x - ICON_SIZE / 2, top: pos.y - ICON_SIZE / 2 }]}
          >
            <TouchableOpacity
              style={[styles.radarIconTouchable, isTracked && styles.radarIconTouchableTracked]}
              onPress={() => onSelectFriend?.(friend)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`${friend.name}, ${label} away`}
            >
              {friend.profilePictureUrl ? (
                <OptimizedImage
                  uri={friend.profilePictureUrl}
                  style={styles.radarIconImage}
                  containerStyle={styles.radarIconImage}
                  contentFit="cover"
                  showLoadingIndicator={false}
                  fallbackIcon="person-circle-outline"
                />
              ) : (
                <View style={[styles.radarIconImage, styles.radarIconFallback]}>
                  <Text style={styles.radarIconInitial}>{friend.name?.trim()?.charAt(0)?.toUpperCase() || '?'}</Text>
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.radarLabel} numberOfLines={1}>
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  radarIcon: {
    position: 'absolute',
    width: ICON_SIZE,
    height: ICON_SIZE + 16,
    alignItems: 'center',
  },
  radarIconTouchable: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    borderWidth: 2,
    borderColor: '#fff',
    overflow: 'hidden',
    backgroundColor: '#222',
  },
  radarIconTouchableTracked: {
    borderColor: '#6BBF59',
    borderWidth: 3,
  },
  radarIconImage: {
    width: '100%',
    height: '100%',
  },
  radarIconFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4C8577',
  },
  radarIconInitial: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  radarLabel: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
});
