import {
  normalizeDeg,
  signedAngularDiff,
  quantizeHeading,
  tiltCompensatedHeading,
  complementaryFilter,
  unwrapHeading,
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

  it('default alpha stays close to the gyro estimate but drifts toward mag', () => {
    // prev=100, gyro 0 -> gyroEstimate=100; mag=110. With the default alpha
    // (0.92) the fused value moves 8% of the 10° gap toward mag => ~100.8.
    const fused = complementaryFilter(100, 0, 0.1, 110);
    expectAngleClose(fused, 100.8, 1e-9);
  });
});

describe('complementaryFilter — settle-after-stop (stationary deadband)', () => {
  it('does not integrate sub-deadband gyro noise into a phantom rotation', () => {
    // Device held still: mag steady at 90, gyro reads a tiny 0.3°/s of noise
    // (below the 0.5°/s deadband). Heading must not creep away from 90 over
    // many samples — it should settle onto the magnetometer.
    let h = 90;
    for (let i = 0; i < 200; i++) {
      h = complementaryFilter(h, 0.3, 0.1, 90);
    }
    expectAngleClose(h, 90, 1e-6);
  });

  it('still integrates real motion above the deadband', () => {
    // 5°/s is well above the 0.5°/s deadband and must be integrated normally
    // (alpha=1 -> pure gyro): 100 + 5*1 = 105.
    const fused = complementaryFilter(100, 5, 1, 999, 1);
    expectAngleClose(fused, 105, 1e-9);
  });

  it('rejects a constant gyro bias, converging to the magnetometer', () => {
    // Steady-state bias-rejection: mag pinned at 90, but the gyro carries a
    // persistent 1°/s bias (above the deadband, so it IS integrated). The
    // magnetometer correction must dominate so the heading converges to ~90
    // rather than winding away indefinitely. Without enough mag authority
    // (e.g. old alpha=0.98) this would run off.
    let h = 90;
    for (let i = 0; i < 500; i++) {
      h = complementaryFilter(h, 1, 0.1, 90);
    }
    // At equilibrium the per-sample gyro drift (1*0.1=0.1°) is balanced by the
    // mag pull ((1-0.92)*offset). Offset settles near 0.1/0.08 = 1.25°.
    expect(Math.abs(signedAngularDiff(90, h))).toBeLessThan(2);
  });

  it('deadband can be disabled via the parameter', () => {
    // With deadband=0, even tiny rates integrate (alpha=1, pure gyro).
    const fused = complementaryFilter(100, 0.3, 1, 999, 1, 0);
    expectAngleClose(fused, 100.3, 1e-9);
  });
});

describe('unwrapHeading — continuous camera bearing (no full-spin at 0/360 seam)', () => {
  it('advances by the shortest signed step for an in-range move', () => {
    // 10 -> 40 is +30, no seam involved.
    expect(unwrapHeading(10, 10, 40)).toBeCloseTo(40, 9);
  });

  it('unwinds forward across the 359->1 seam by only +2, not -358', () => {
    // Camera was at continuous 359 (normalized 359); new heading 1. Naive
    // normalized diff would be -358 (a full spin the long way); unwrap gives
    // 359 + 2 = 361 so the camera animates a short +2 deg step.
    expect(unwrapHeading(359, 359, 1)).toBeCloseTo(361, 9);
  });

  it('unwinds backward across the 1->359 seam by only -2, not +358', () => {
    expect(unwrapHeading(1, 1, 359)).toBeCloseTo(-1, 9);
  });

  it('keeps accumulating continuously over multiple seam crossings', () => {
    // Simulate a full clockwise rotation past north twice; the continuous
    // bearing should climb monotonically (~+720) with every consecutive pair
    // differing by <=180, never jumping the long way.
    const normalizedPath = [350, 20, 90, 200, 350, 20, 90, 200, 350, 5];
    let prevNorm = normalizedPath[0];
    let unwrapped = prevNorm;
    let prevUnwrapped = unwrapped;
    for (let i = 1; i < normalizedPath.length; i++) {
      unwrapped = unwrapHeading(unwrapped, prevNorm, normalizedPath[i]);
      // No single step exceeds a half turn.
      expect(Math.abs(unwrapped - prevUnwrapped)).toBeLessThanOrEqual(180);
      prevUnwrapped = unwrapped;
      prevNorm = normalizedPath[i];
    }
    // Normalizing the continuous bearing must still equal the final heading.
    expectAngleClose(normalizeDeg(unwrapped), 5, 1e-9);
  });

  it('normalized(unwrapped) always equals the target heading', () => {
    let prevNorm = 0;
    let unwrapped = 0;
    for (let h = 0; h < 360; h += 37) {
      unwrapped = unwrapHeading(unwrapped, prevNorm, h);
      expectAngleClose(normalizeDeg(unwrapped), h, 1e-9);
      prevNorm = h;
    }
  });
});

describe('quantizeHeading — de-jitter for the border radar (friend-marker bounce)', () => {
  it('snaps to the nearest step', () => {
    expect(quantizeHeading(100.4, 2)).toBeCloseTo(100, 9);
    expect(quantizeHeading(101.2, 2)).toBeCloseTo(102, 9);
    expect(quantizeHeading(101.0, 2)).toBeCloseTo(102, 9); // round-half-up
  });

  it('returns an identical value for sub-step jitter (kills per-frame bounce)', () => {
    // A cluster of noisy readings inside one 2° bucket must all map to the same
    // output so the border projection does not move.
    const noisy = [99.1, 99.6, 100.0, 100.4, 100.9];
    const outputs = noisy.map((h) => quantizeHeading(h, 2));
    const unique = new Set(outputs.map((v) => Number(v.toFixed(9))));
    expect(unique.size).toBe(1);
  });

  it('still changes once heading crosses the next step boundary (stays responsive)', () => {
    expect(quantizeHeading(100, 2)).not.toBeCloseTo(quantizeHeading(103, 2), 9);
  });

  it('normalizes and wraps: 359.5 snaps to 0, not 360', () => {
    expectAngleClose(quantizeHeading(359.5, 2), 0, 1e-9);
    expectAngleClose(quantizeHeading(-1, 2), 0, 1e-9);
    // 361 == 1 deg, which snaps up to the 2 deg bucket (not 0).
    expectAngleClose(quantizeHeading(361, 2), 2, 1e-9);
    expectAngleClose(quantizeHeading(360.4, 2), 0, 1e-9);
  });

  it('step <= 0 disables quantization (returns normalized input)', () => {
    expectAngleClose(quantizeHeading(123.456, 0), 123.456, 1e-9);
    expectAngleClose(quantizeHeading(-10, -5), 350, 1e-9);
  });
});
