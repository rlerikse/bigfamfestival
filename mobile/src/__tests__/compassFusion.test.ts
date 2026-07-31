import {
  normalizeDeg,
  signedAngularDiff,
  tiltCompensatedHeading,
  complementaryFilter,
  Vec3,
} from '../hooks/compassFusion';

/**
 * Permanent unit coverage for the compass sensor-fusion math (#159).
 *
 * Equivalent to the 15 tests Cypress wrote during QA (which lived only in a
 * throwaway clone). Covers the five areas flagged on the merge gate:
 *   - angle wraparound (normalizeDeg / signedAngularDiff)
 *   - div-by-zero guards (zero-magnitude gravity vector)
 *   - gravity-magnitude invariance (heading independent of |accel|)
 *   - complementary filter across the 359°/0° seam
 *   - alpha = 0 / alpha = 1 boundary behavior
 */

// Helper: assert two headings are equal within a small angular tolerance,
// accounting for the 360° wraparound (359.9 ≈ 0.1).
function expectAngleClose(actual: number, expected: number, tol = 1e-6) {
  const diff = Math.abs(signedAngularDiff(expected, actual));
  expect(diff).toBeLessThanOrEqual(tol);
}

describe('normalizeDeg — angle wraparound', () => {
  it('leaves in-range angles unchanged', () => {
    expect(normalizeDeg(0)).toBe(0);
    expect(normalizeDeg(180)).toBe(180);
    expect(normalizeDeg(359)).toBe(359);
  });

  it('wraps 360 back to 0', () => {
    expect(normalizeDeg(360)).toBe(0);
  });

  it('wraps angles above 360', () => {
    expect(normalizeDeg(370)).toBe(10);
    expect(normalizeDeg(720 + 45)).toBe(45);
  });

  it('wraps negative angles into [0,360)', () => {
    expect(normalizeDeg(-1)).toBe(359);
    expect(normalizeDeg(-90)).toBe(270);
    expect(normalizeDeg(-360)).toBe(0);
    expect(normalizeDeg(-450)).toBe(270);
  });

  it('always returns a value in [0, 360)', () => {
    for (let d = -1000; d <= 1000; d += 37) {
      const n = normalizeDeg(d);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(360);
    }
  });
});

describe('signedAngularDiff — shortest-path wraparound', () => {
  it('returns 0 for identical angles', () => {
    expect(signedAngularDiff(90, 90)).toBe(0);
  });

  it('is positive for a clockwise (increasing) step', () => {
    expect(signedAngularDiff(10, 40)).toBe(30);
  });

  it('is negative for a counter-clockwise step', () => {
    expect(signedAngularDiff(40, 10)).toBe(-30);
  });

  it('takes the short way across the 359°/0° seam', () => {
    // 350 -> 10 is +20 the short way, not -340.
    expect(signedAngularDiff(350, 10)).toBe(20);
    // 10 -> 350 is -20 the short way.
    expect(signedAngularDiff(10, 350)).toBe(-20);
  });

  it('resolves the 180° boundary deterministically to +180', () => {
    // Exactly opposite: pick +180 (range is (-180, 180]).
    expect(signedAngularDiff(0, 180)).toBe(180);
    expect(signedAngularDiff(180, 0)).toBe(180);
  });

  it('always returns a value in (-180, 180]', () => {
    for (let a = 0; a < 360; a += 23) {
      for (let b = 0; b < 360; b += 29) {
        const d = signedAngularDiff(a, b);
        expect(d).toBeGreaterThan(-180);
        expect(d).toBeLessThanOrEqual(180);
      }
    }
  });
});

describe('tiltCompensatedHeading — div-by-zero guard', () => {
  it('does not return NaN/Infinity for a zero-magnitude gravity vector', () => {
    const accel: Vec3 = { x: 0, y: 0, z: 0 };
    const mag: Vec3 = { x: 1, y: 0, z: 0 };
    const h = tiltCompensatedHeading(accel, mag);
    expect(Number.isFinite(h)).toBe(true);
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThan(360);
  });

  it('does not produce NaN when all sensor inputs are zero', () => {
    const h = tiltCompensatedHeading({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 });
    expect(Number.isFinite(h)).toBe(true);
  });
});

describe('tiltCompensatedHeading — gravity-magnitude invariance', () => {
  it('gives the same heading regardless of accelerometer magnitude', () => {
    // Phone flat, gravity straight down (+z). Same orientation, different |g|.
    const mag: Vec3 = { x: 0.4, y: 0.9, z: 0.1 };
    const h1 = tiltCompensatedHeading({ x: 0, y: 0, z: 1 }, mag);
    const h5 = tiltCompensatedHeading({ x: 0, y: 0, z: 5 }, mag);
    const h9_8 = tiltCompensatedHeading({ x: 0, y: 0, z: 9.81 }, mag);
    expectAngleClose(h1, h5);
    expectAngleClose(h1, h9_8);
  });

  it('is invariant to |g| for a tilted device too', () => {
    // Tilted orientation: gravity has x/y components. Scale it up, heading
    // must not change because the vector is normalized internally.
    const accelSmall: Vec3 = { x: 0.2, y: -0.3, z: 0.9 };
    const accelBig: Vec3 = { x: 2.0, y: -3.0, z: 9.0 };
    const mag: Vec3 = { x: 12, y: -34, z: 5 };
    const hSmall = tiltCompensatedHeading(accelSmall, mag);
    const hBig = tiltCompensatedHeading(accelBig, mag);
    expectAngleClose(hSmall, hBig, 1e-4);
  });

  it('returns a valid heading in [0,360) for a flat device', () => {
    const h = tiltCompensatedHeading({ x: 0, y: 0, z: 1 }, { x: 0, y: 1, z: 0 });
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThan(360);
  });
});

describe('complementaryFilter — 359°/0° seam handling', () => {
  it('blends across the wraparound without averaging the long way', () => {
    // prev ~359, mag ~1, no gyro motion. Result should sit near the seam
    // (~0), NOT swing back toward 180 (which naive linear averaging gives).
    const fused = complementaryFilter(359, 0, 0.1, 1, 0.5);
    // Halfway along the SHORT path from 359 to 1 (span +2°) is 0.
    expectAngleClose(fused, 0, 1e-9);
  });

  it('integrates gyro yaw across the seam (359 + 2°/s * 1s -> 1)', () => {
    // alpha=1 -> pure gyro. 359 + 2 = 361 -> normalized 1.
    const fused = complementaryFilter(359, 2, 1, 123 /* mag ignored */, 1);
    expectAngleClose(fused, 1, 1e-9);
  });

  it('always returns a normalized heading in [0,360)', () => {
    for (let prev = 0; prev < 360; prev += 47) {
      const fused = complementaryFilter(prev, 5, 0.1, (prev + 30) % 360, 0.9);
      expect(fused).toBeGreaterThanOrEqual(0);
      expect(fused).toBeLessThan(360);
    }
  });
});

describe('complementaryFilter — alpha boundaries', () => {
  it('alpha = 1 ignores the magnetometer entirely (pure gyro integration)', () => {
    // Gyro says +10°/s for 1s from 100°; mag says something wildly different.
    const fused = complementaryFilter(100, 10, 1, 300, 1);
    expectAngleClose(fused, 110, 1e-9);
  });

  it('alpha = 1 with zero gyro rate holds the previous heading', () => {
    const fused = complementaryFilter(100, 0, 1, 300, 1);
    expectAngleClose(fused, 100, 1e-9);
  });

  it('alpha = 0 snaps fully to the magnetometer heading', () => {
    // With alpha=0 the gyro estimate is fully corrected to magHeading.
    const fused = complementaryFilter(100, 10, 1, 250, 0);
    expectAngleClose(fused, 250, 1e-9);
  });

  it('alpha = 0 snaps to mag even across the seam', () => {
    const fused = complementaryFilter(358, 0, 0.1, 5, 0);
    expectAngleClose(fused, 5, 1e-9);
  });

  it('default alpha (0.98) stays close to the gyro estimate but drifts toward mag', () => {
    // prev=100, gyro 0 -> gyroEstimate=100; mag=110. With alpha 0.98 the
    // fused value moves 2% of the 10° gap toward mag => ~100.2.
    const fused = complementaryFilter(100, 0, 0.1, 110);
    expectAngleClose(fused, 100.2, 1e-9);
  });
});
