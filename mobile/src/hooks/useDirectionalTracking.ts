import { useEffect, useRef, useState } from 'react';
import { Accelerometer, Gyroscope, Magnetometer } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import type { LngLat } from '../services/routingService';
import { complementaryFilter, tiltCompensatedHeading, type Vec3 } from './compassFusion';

/**
 * useDirectionalTracking — "hot/cold" per-friend focus mode.
 *
 * Given the user's live position + a target friend's coordinate, this hook:
 *  - Reads accelerometer + magnetometer + gyroscope, fused via a tilt-
 *    compensated compass calc + complementary filter, to derive a stable
 *    compass heading that only changes with yaw (turning left/right) — not
 *    with pitch/roll (tilting the phone up/down), and stays north-referenced
 *    without the gyro-only drift a single-sensor reading would have.
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

  // Latest raw readings from each sensor, updated independently as they
  // arrive (accel/mag/gyro don't necessarily fire in lockstep), plus the
  // fused heading estimate and its last-update timestamp for the
  // complementary filter's dt calculation.
  const latestAccelRef = useRef<Vec3>({ x: 0, y: 0, z: 1 });
  const latestMagRef = useRef<Vec3>({ x: 0, y: 0, z: 0 });
  const fusedHeadingRef = useRef(0);
  const lastGyroTimestampRef = useRef<number | null>(null);

  // Subscribe to Accelerometer + Magnetometer + Gyroscope together while a
  // target is active, OR when the caller explicitly needs a live heading
  // regardless (e.g. the friend-radar HUD, but only while there are actually
  // friends to point at — gated by the caller passing `needsHeading` based on
  // friend count, so we're not streaming sensor reads at 10Hz for nothing).
  //
  // Full accel+mag+gyro sensor fusion (per Robert's #159 follow-up, decided
  // 2026-07-30 19:2x EDT) replaces both the original raw-Magnetometer reading
  // (not tilt-compensated — pitch/roll bled into heading) and the interim
  // DeviceMotion.rotation.alpha fix (fixed the tilt bug but wasn't guaranteed
  // true-north-referenced on iOS). This pipeline:
  //  1. Accelerometer → gravity vector → pitch/roll.
  //  2. Magnetometer → raw field vector, tilt-compensated using that
  //     pitch/roll → absolute magnetic-north heading, immune to tilt.
  //  3. Gyroscope → instantaneous yaw rate, integrated and blended with the
  //     tilt-compensated magnetometer heading via a complementary filter —
  //     smooths out magnetometer jitter/interference (festival grounds have
  //     plenty of metal/speakers/generators) without the lag a magnetometer-
  //     only low-pass filter would introduce.
  // See compassFusion.ts for the vector math itself.
  useEffect(() => {
    if (!hasTarget && !needsHeading) return;

    Accelerometer.setUpdateInterval(UPDATE_INTERVAL_MS);
    Magnetometer.setUpdateInterval(UPDATE_INTERVAL_MS);
    Gyroscope.setUpdateInterval(UPDATE_INTERVAL_MS);

    const accelSub = Accelerometer.addListener(({ x, y, z }) => {
      latestAccelRef.current = { x, y, z };
    });
    const magSub = Magnetometer.addListener(({ x, y, z }) => {
      latestMagRef.current = { x, y, z };
    });
    // Gyroscope is the pacing sensor for the fused estimate: each reading
    // both advances the complementary filter's integrated yaw AND pulls in
    // whatever the latest accel/mag vectors happen to be, since expo-sensors
    // fires each listener independently rather than as a synchronized frame.
    const gyroSub = Gyroscope.addListener(({ z }) => {
      const now = Date.now();
      const last = lastGyroTimestampRef.current;
      const dt = last != null ? Math.min((now - last) / 1000, 0.5) : UPDATE_INTERVAL_MS / 1000;
      lastGyroTimestampRef.current = now;

      // Gyroscope z is rad/s, positive = counter-clockwise about the device's
      // Z axis; negate + convert to deg/s to match our clockwise-positive
      // compass heading convention.
      const yawRateDeg = -(z * 180) / Math.PI;

      const magHeading = tiltCompensatedHeading(latestAccelRef.current, latestMagRef.current);
      const fused = complementaryFilter(fusedHeadingRef.current, yawRateDeg, dt, magHeading);
      fusedHeadingRef.current = fused;

      // The complementary filter already smooths frame-to-frame; a second
      // moving-average pass on top just added phase lag and overshoot on fast
      // turns (Robert's #201 report). Use the fused value directly.
      setHeading(fused);
    });

    return () => {
      accelSub.remove();
      magSub.remove();
      gyroSub.remove();
      lastGyroTimestampRef.current = null;
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
