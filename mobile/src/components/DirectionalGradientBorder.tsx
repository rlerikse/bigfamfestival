import React from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

/**
 * DirectionalGradientBorder — the "hot/cold" screen-edge overlay for
 * per-friend tracking mode. Sits above the map, below modals/controls.
 *
 * `closeness` (0..1) drives a red→green interpolation on a thick border
 * frame — cold/red when facing away from the target, hot/green when
 * dead-on. This is a focus overlay layered ON TOP of the friend-radar HUD;
 * it never replaces the radar markers (see #159 scope note — both coexist).
 */

interface Props {
  /** 0 (facing away) .. 1 (dead-on target). */
  closeness: number;
  /** Whether the user is currently within the lock threshold. */
  isLocked: boolean;
}

// Simple red → amber → green interpolation.
function colorForCloseness(c: number): string {
  const clamped = Math.max(0, Math.min(1, c));
  if (clamped < 0.5) {
    // red (#EF4444) → amber (#F59E0B)
    const t = clamped / 0.5;
    return lerpColor('#EF4444', '#F59E0B', t);
  }
  // amber (#F59E0B) → green (#6BBF59)
  const t = (clamped - 0.5) / 0.5;
  return lerpColor('#F59E0B', '#6BBF59', t);
}

function lerpColor(a: string, b: string, t: number): string {
  const ah = hexToRgb(a);
  const bh = hexToRgb(b);
  const r = Math.round(ah.r + (bh.r - ah.r) * t);
  const g = Math.round(ah.g + (bh.g - ah.g) * t);
  const bch = Math.round(ah.b + (bh.b - ah.b) * t);
  return `rgb(${r}, ${g}, ${bch})`;
}

function hexToRgb(hex: string) {
  const n = parseInt(hex.replace('#', ''), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export default function DirectionalGradientBorder({ closeness, isLocked }: Props) {
  const color = colorForCloseness(closeness);
  const borderWidth = isLocked ? 14 : 10;
  const { width: screenW, height: screenH } = Dimensions.get('window');

  return (
    <Svg
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      width="100%"
      height="100%"
    >
      <Defs>
        <LinearGradient id="edgeGlow" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={isLocked ? 0.55 : 0.35} />
          <Stop offset="1" stopColor={color} stopOpacity={isLocked ? 0.55 : 0.35} />
        </LinearGradient>
      </Defs>
      {/* Border frame drawn as a stroked rect, rather than four separate
          bars — keeps corners clean and gives a single continuous "pulse"
          feel when isLocked flips the width. Rect inset/sized by
          borderWidth/2 on all sides so the stroke doesn't get clipped
          asymmetrically at the right/bottom screen edges. */}
      <Rect
        x={borderWidth / 2}
        y={borderWidth / 2}
        width={screenW - borderWidth}
        height={screenH - borderWidth}
        fill="none"
        stroke="url(#edgeGlow)"
        strokeWidth={borderWidth}
      />
    </Svg>
  );
}
