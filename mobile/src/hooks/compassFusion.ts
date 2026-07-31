/**
 * compassFusion — tilt-compensated, gyro-smoothed compass heading.
 *
 * Standalone from useDirectionalTracking.ts so the vector math can be unit
 * tested in isolation and reused elsewhere (e.g. if another screen ever
 * needs a raw device heading without the friend-bearing logic).
 *
 * Pipeline:
 *  1. Accelerometer gives the gravity vector → device pitch/roll (tilt).
 *  2. Magnetometer gives the raw 3-axis magnetic field vector, which is
 *     rotated by the tilt above so it reads as if the phone were held
 *     perfectly flat — this is what actually fixes the "heading changes when
 *     you tilt the screen" bug (Robert's #159 report, filmed 2026-07-30):
 *     the previous single-sensor reading had no tilt compensation at all.
 *  3. The resulting tilt-compensated heading is still noisy (magnetic
 *     interference is common on festival grounds — metal barricades, PA
 *     speakers, generators), so it's blended with the integrated Gyroscope
 *     yaw rate via a complementary filter: fast/responsive from the gyro,
 *     drift-corrected toward the magnetometer's absolute reading over time.
 *     This kills jitter without introducing the lag a pure low-pass filter
 *     on the magnetometer alone would cause.
 */

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

function toDeg(rad: number) {
  return (rad * 180) / Math.PI;
}

/** Normalize an angle in degrees to the [0, 360) range. */
export function normalizeDeg(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/** Shortest signed angular difference (b - a), in degrees, range (-180, 180]. */
export function signedAngularDiff(a: number, b: number): number {
  let diff = (b - a) % 360;
  if (diff > 180) diff -= 360;
  if (diff <= -180) diff += 360;
  return diff;
}

/**
 * Tilt-compensated compass heading from raw accelerometer + magnetometer
 * vectors. Standard aerospace/robotics formulation (e.g. Freescale AN4248,
 * ST AN4508) — pitch/roll are derived from gravity, then used to rotate the
 * magnetic field vector into the horizontal plane before computing heading,
 * so the result is invariant to how the phone is tilted.
 *
 * @param accel Accelerometer reading (g's) — includes gravity.
 * @param mag Magnetometer reading (µT), same device-local axes as accel.
 * @returns Heading in degrees, 0-360, 0 = magnetic north, clockwise-positive.
 */
export function tiltCompensatedHeading(accel: Vec3, mag: Vec3): number {
  // Normalize gravity vector.
  const gMag = Math.sqrt(accel.x * accel.x + accel.y * accel.y + accel.z * accel.z) || 1;
  const ax = accel.x / gMag;
  const ay = accel.y / gMag;
  const az = accel.z / gMag;

  // Pitch (rotation about X) and roll (rotation about Y) from gravity.
  const pitch = Math.asin(-ax);
  const roll = Math.atan2(ay, az);

  // Rotate the magnetometer reading into the horizontal (world) plane using
  // pitch/roll, canceling out the effect of device tilt.
  const cosRoll = Math.cos(roll);
  const sinRoll = Math.sin(roll);
  const cosPitch = Math.cos(pitch);
  const sinPitch = Math.sin(pitch);

  const xh = mag.x * cosPitch + mag.z * sinPitch;
  const yh =
    mag.x * sinRoll * sinPitch + mag.y * cosRoll - mag.z * sinRoll * cosPitch;

  const heading = toDeg(Math.atan2(-yh, xh));
  return normalizeDeg(heading);
}

/**
 * Complementary filter combining a fast/low-latency gyro-integrated heading
 * with a slow/absolute magnetometer-derived heading. Corrects gyro drift
 * over time while staying responsive frame-to-frame (unlike averaging the
 * magnetometer alone, which lags behind fast turns).
 *
 * @param prevHeading Previous fused heading estimate, degrees.
 * @param gyroYawRateDeg Instantaneous yaw rate from the gyroscope, deg/s
 *   (positive = clockwise, matching our heading convention).
 * @param dtSeconds Time since the previous sample, seconds.
 * @param magHeading Tilt-compensated magnetometer heading for this sample.
 * @param alpha Weight given to the gyro-integrated estimate (0-1). Higher =
 *   more responsive/smooth but drifts further from true north over time;
 *   lower = snaps to the magnetometer faster but is noisier. 0.98 is a
 *   standard starting point for a ~100ms sample interval.
 */
export function complementaryFilter(
  prevHeading: number,
  gyroYawRateDeg: number,
  dtSeconds: number,
  magHeading: number,
  alpha = 0.98
): number {
  const gyroEstimate = normalizeDeg(prevHeading + gyroYawRateDeg * dtSeconds);
  // Blend along the shortest angular path so we don't average across the
  // 359°/0° wraparound incorrectly.
  const diff = signedAngularDiff(gyroEstimate, magHeading);
  const fused = normalizeDeg(gyroEstimate + (1 - alpha) * diff);
  return fused;
}
