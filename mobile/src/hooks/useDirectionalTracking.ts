import { useEffect, useRef, useState } from 'react';
import { Magnetometer } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import type { LngLat } from '../services/routingService';

/**
 * useDirectionalTracking — "hot/cold" per-friend focus mode.
 *
 * Given the user's live position + a target friend's coordinate, this hook:
 *  - Reads the device magnetometer to derive a compass heading.
 *  - Computes the great-circle bearing from user → target (haversine-based).
 *  - Smooths both with a short moving average to kill jitter.
 *  - Returns the angular delta (0° = dead-on, 180° = facing directly away)
 *    plus a 0..1 "closeness" value for driving the red→green gradient.
 *  - Fires a single haptic pulse the moment the user crosses into the
 *    "locked in" threshold (~15°) from outside it, then arms again once they
 *    drift back out — so it's a single pulse per lock event, not a spam.
 *
 * This is purely a focus overlay: it does NOT replace the friend-radar HUD.
 * The screen calling this hook should keep rendering the full radar layer
 * underneath and simply add the gradient border while a target is selected.
 */

const LOCK_THRESHOLD_DEG = 15;
const SMOOTHING_SAMPLES = 5;
const UPDATE_INTERVAL_MS = 100;

export interface DirectionalTrackingState {
  /** Smoothed device heading in degrees (0-360, 0 = magnetic north). */
  heading: number;
  /** Smoothed bearing from user to target, in degrees. */
  targetBearing: number | null;
  /** Absolute angular delta between heading and target bearing (0-180). */
  angularDelta: number | null;
  /** 0 (facing directly away) .. 1 (dead-on target) for gradient intensity. */
  closeness: number;
  /** True while within the lock threshold. */
  isLocked: boolean;
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}
function toDeg(rad: number) {
  return (rad * 180) / Math.PI;
}

/** Great-circle initial bearing from origin to destination, in degrees (0-360). */
export function computeBearing(origin: LngLat, dest: LngLat): number {
  const [lon1, lat1] = origin.map(toRad) as [number, number];
  const [lon2, lat2] = dest.map(toRad) as [number, number];
  const dLon = lon2 - lon1;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const bearing = toDeg(Math.atan2(y, x));
  return (bearing + 360) % 360;
}

/** Shortest signed angular difference between two headings, magnitude 0-180. */
function angularDiff(a: number, b: number): number {
  let diff = Math.abs(a - b) % 360;
  if (diff > 180) diff = 360 - diff;
  return diff;
}

/** Circular moving average — avoids the 359°/1° wraparound bug of a naive mean. */
function circularAverage(samples: number[]): number {
  if (samples.length === 0) return 0;
  let sumSin = 0;
  let sumCos = 0;
  for (const s of samples) {
    sumSin += Math.sin(toRad(s));
    sumCos += Math.cos(toRad(s));
  }
  const avg = toDeg(Math.atan2(sumSin, sumCos));
  return (avg + 360) % 360;
}

/**
 * @param userCoords Live user position, or null if unknown.
 * @param targetCoords Selected friend's position, or null if no active target
 *   (tracking mode inactive — hook returns neutral/idle state).
 * @param needsHeading Whether the caller needs a live heading stream even with
 *   no active target — e.g. the friend-radar HUD needs heading to position
 *   border icons for any visible friend. Pass `false` (default) when there's
 *   nothing to point at yet, so the magnetometer doesn't run and drain battery
 *   for no reason.
 */
export function useDirectionalTracking(
  userCoords: LngLat | null,
  targetCoords: LngLat | null,
  needsHeading = false
): DirectionalTrackingState {
  const [heading, setHeading] = useState(0);
  const [state, setState] = useState<DirectionalTrackingState>({
    heading: 0,
    targetBearing: null,
    angularDelta: null,
    closeness: 0,
    isLocked: false,
  });

  const headingSamplesRef = useRef<number[]>([]);
  const wasLockedRef = useRef(false);
  const hasTarget = targetCoords !== null;

  // Subscribe to the magnetometer while a target is active, OR when the caller
  // explicitly needs a live heading regardless (e.g. the friend-radar HUD, but
  // only while there are actually friends to point at — gated by the caller
  // passing `needsHeading` based on friend count, so we're not streaming
  // sensor reads at 10Hz for nothing).
  useEffect(() => {
    if (!hasTarget && !needsHeading) return;

    Magnetometer.setUpdateInterval(UPDATE_INTERVAL_MS);
    const sub = Magnetometer.addListener(({ x, y }) => {
      // Screen-up heading from raw magnetometer x/y. Good enough for a
      // festival wayfinding gradient (not aviation-grade nav).
      let angle = toDeg(Math.atan2(y, x));
      angle = (angle + 360) % 360;
      // Magnetometer axes → compass heading offset; empirically 90° works
      // for portrait phone-flat-in-hand orientation on iOS/Android.
      const compassHeading = (angle + 90) % 360;

      const samples = headingSamplesRef.current;
      samples.push(compassHeading);
      if (samples.length > SMOOTHING_SAMPLES) samples.shift();
      setHeading(circularAverage(samples));
    });

    return () => {
      sub.remove();
      headingSamplesRef.current = [];
    };
  }, [hasTarget, needsHeading]);

  useEffect(() => {
    if (!targetCoords || !userCoords) {
      wasLockedRef.current = false;
      setState({ heading, targetBearing: null, angularDelta: null, closeness: 0, isLocked: false });
      return;
    }

    const bearing = computeBearing(userCoords, targetCoords);
    const delta = angularDiff(heading, bearing);
    const closeness = Math.max(0, 1 - delta / 180);
    const isLocked = delta <= LOCK_THRESHOLD_DEG;

    if (isLocked && !wasLockedRef.current) {
      // Single pulse on the moment of crossing into lock — not repeated
      // while the user holds the lock.
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    }
    wasLockedRef.current = isLocked;

    setState({ heading, targetBearing: bearing, angularDelta: delta, closeness, isLocked });
  }, [heading, userCoords, targetCoords]);

  return state;
}
