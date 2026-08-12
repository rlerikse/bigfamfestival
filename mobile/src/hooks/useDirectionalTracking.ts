import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { Accelerometer, Gyroscope } from 'expo-sensors';
import type { LngLat } from '../services/routingService';
import {
  complementaryFilter,
  createCircularMedianFilter,
  signedAngularDiff,
} from './compassFusion';

/**
 * useDirectionalTracking — "hot/cold" per-friend focus mode.
 *
 * Given the user's live position + a target friend's coordinate, this hook:
 *  - Derives a fast, accurate device heading by fusing the high-rate gyroscope
 *    (~60Hz, responsive but drifts) with the OS's calibrated true-north compass
 *    (expo-location watchHeadingAsync, accurate but only ~7Hz on Android) as the
 *    absolute anchor. The gyro yaw rate is projected onto gravity (from the
 *    accelerometer) so it's correct regardless of how the phone is tilted/held.
 *  - Computes the great-circle bearing from user → target (haversine-based).
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

// Accel + gyro sample interval. ~60Hz gives the gyro enough resolution to track
// fast turns smoothly between the OS compass's slow (~7Hz on Android) updates.
const SENSOR_INTERVAL_MS = 16;
// Complementary-filter weight on the gyro-integrated estimate. High (0.98) =
// mostly gyro frame-to-frame (fast, smooth) with the OS heading gently
// correcting drift; the gyro rest-deadband keeps a still device from creeping.
const FUSION_ALPHA = 0.98;
// Cap how often we push a heading update to React (the map camera + HUD
// re-project on each). The gyro runs at ~60Hz but ~30Hz output is plenty smooth
// and halves re-renders.
const OUTPUT_MIN_INTERVAL_MS = 33;
// Don't emit a heading state update for changes smaller than this — a steadily
// held heading then stays rock-steady instead of micro-bouncing.
const HEADING_EMIT_DEADBAND_DEG = 0.75;

export interface DirectionalTrackingState {
  /** Device compass heading in degrees (0-360, 0 = true north, from the OS). */
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

  const wasLockedRef = useRef(false);
  const hasTarget = targetCoords !== null;

  // Fused heading estimate (gyro-integrated, OS-corrected) and its live inputs.
  const fusedHeadingRef = useRef<number | null>(null);
  const latestOsHeadingRef = useRef<number | null>(null);
  const latestAccelRef = useRef({ x: 0, y: 0, z: 1 });
  const lastGyroTsRef = useRef<number | null>(null);
  const lastOutputAtRef = useRef(0);
  const lastEmittedHeadingRef = useRef<number | null>(null);
  // Median prefilter to reject isolated OS-compass spikes (a single sample
  // jumping ~150°+ from magnetic interference) before it anchors the fusion.
  const osMedianRef = useRef(createCircularMedianFilter(5));

  // Gyro-assisted heading fusion. The OS compass (watchHeadingAsync) is accurate
  // and true-north but slow (~7Hz on Android) and noisy (~13° jitter measured on
  // device), so filtering it alone is either laggy or jittery. Instead we run
  // the gyroscope at ~60Hz for instant responsiveness and use the (de-spiked) OS
  // heading only as a slow absolute anchor to cancel gyro drift. The gyro's yaw
  // rate is projected onto the gravity vector (from the accelerometer) so it's
  // the rotation about TRUE vertical regardless of how the phone is held — no
  // flat-vs-upright assumption. Output is throttled + deadbanded to keep React
  // re-renders (map camera / HUD) sane.
  useEffect(() => {
    if (!hasTarget && !needsHeading) return;
    const osMedian = osMedianRef.current;
    osMedian.reset();
    fusedHeadingRef.current = null;
    latestOsHeadingRef.current = null;
    lastGyroTsRef.current = null;
    lastOutputAtRef.current = 0;
    lastEmittedHeadingRef.current = null;

    Accelerometer.setUpdateInterval(SENSOR_INTERVAL_MS);
    Gyroscope.setUpdateInterval(SENSOR_INTERVAL_MS);

    const accelSub = Accelerometer.addListener((a) => {
      latestAccelRef.current = a;
    });

    const gyroSub = Gyroscope.addListener(({ x, y, z }) => {
      const os = latestOsHeadingRef.current;
      if (os == null) return; // wait for the first OS heading to anchor the fusion

      const now = Date.now();
      const lastTs = lastGyroTsRef.current;
      const dt = lastTs != null ? Math.min((now - lastTs) / 1000, 0.1) : SENSOR_INTERVAL_MS / 1000;
      lastGyroTsRef.current = now;

      // Yaw rate about world-vertical = gyro · gravity-unit-vector (rad/s).
      // Negated to match our clockwise-positive compass convention (reduces to
      // the flat-phone case where gravity ≈ +z and yaw ≈ -gyro.z).
      const a = latestAccelRef.current;
      const gMag = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z) || 1;
      const yawRateDeg = (-(x * a.x + y * a.y + z * a.z) / gMag) * (180 / Math.PI);

      const prev = fusedHeadingRef.current ?? os;
      const fused = complementaryFilter(prev, yawRateDeg, dt, os, FUSION_ALPHA);
      fusedHeadingRef.current = fused;

      // Throttle + deadband the state update to bound re-renders.
      if (now - lastOutputAtRef.current < OUTPUT_MIN_INTERVAL_MS) return;
      const lastEmitted = lastEmittedHeadingRef.current;
      if (
        lastEmitted !== null &&
        Math.abs(signedAngularDiff(lastEmitted, fused)) < HEADING_EMIT_DEADBAND_DEG
      ) {
        return; // sub-threshold wobble — hold steady
      }
      lastOutputAtRef.current = now;
      lastEmittedHeadingRef.current = fused;
      setHeading(fused);
    });

    // Slow absolute anchor: OS true-north compass, de-spiked. Only updates the
    // reference the gyro loop corrects toward — it never drives output directly
    // (except the very first sample, to seed the estimate with no startup lag).
    let headingSub: { remove: () => void } | null = null;
    let cancelled = false;
    (async () => {
      try {
        const s = await Location.watchHeadingAsync(({ trueHeading, magHeading }) => {
          const raw = trueHeading != null && trueHeading >= 0 ? trueHeading : magHeading;
          if (raw == null || raw < 0) return;
          const os = osMedian.push(raw);
          latestOsHeadingRef.current = os;
          if (fusedHeadingRef.current == null) {
            fusedHeadingRef.current = os;
            setHeading(os);
          }
        });
        if (cancelled) s.remove();
        else headingSub = s;
      } catch {
        // OS heading unavailable — gyro loop stays idle (it needs the anchor).
      }
    })();

    return () => {
      cancelled = true;
      accelSub.remove();
      gyroSub.remove();
      headingSub?.remove();
      headingSub = null;
      osMedian.reset();
      fusedHeadingRef.current = null;
      latestOsHeadingRef.current = null;
      lastGyroTsRef.current = null;
      lastEmittedHeadingRef.current = null;
    };
  }, [hasTarget, needsHeading]);


  useEffect(() => {
    if (!targetCoords || !userCoords) {
      wasLockedRef.current = false;
      // Bail if already idle so an unstable targetCoords/userCoords reference
      // (e.g. a caller passing a fresh [lng,lat] array each render) can't spin
      // this effect into a setState-per-render loop.
      setState((prev) =>
        prev.targetBearing === null &&
        prev.angularDelta === null &&
        prev.closeness === 0 &&
        prev.isLocked === false &&
        prev.heading === heading
          ? prev
          : { heading, targetBearing: null, angularDelta: null, closeness: 0, isLocked: false }
      );
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

    // Only commit a new state object when a value actually changed. This makes
    // the effect a no-op re-render when targetCoords is a new-but-equal array
    // each render (React bails on the returned prev), preventing an infinite
    // "Maximum update depth exceeded" loop while tracking a friend.
    setState((prev) =>
      prev.heading === heading &&
      prev.targetBearing === bearing &&
      prev.angularDelta === delta &&
      prev.closeness === closeness &&
      prev.isLocked === isLocked
        ? prev
        : { heading, targetBearing: bearing, angularDelta: delta, closeness, isLocked }
    );
  }, [heading, userCoords, targetCoords]);

  return state;
}
