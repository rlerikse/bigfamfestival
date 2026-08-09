import { clampVerticalOffset, SCHEDULE_ROW_HEIGHT } from '../utils/scheduleUtils';

/**
 * Unit coverage for BFF-124 (#187): vertical-scroll clamp helper.
 *
 * `@testing-library/react-native`'s `render()` is currently broken for this
 * class of component in this repo (see `SafeText.test.tsx`, `describe.skip`,
 * post-Expo-SDK-54 regression). Even *importing* HorizontalScheduleView.tsx
 * (without rendering) fails under this repo's Jest config because it pulls
 * in `@expo/vector-icons`'s font assets, which aren't transformable here.
 * So `clampVerticalOffset` is imported from `scheduleUtils.ts` (a plain,
 * side-effect-free module HorizontalScheduleView.tsx itself imports from,
 * and which also re-exports it) — no `render()`, no component queries, no
 * react-native/expo import chain. Following the established precedent
 * (`compassFusion.test.ts`, `friendLocationStream.test.ts`).
 */

const ROW_HEIGHT = SCHEDULE_ROW_HEIGHT;

describe('clampVerticalOffset', () => {
  it('returns 0 when there are zero stages, regardless of saved offset', () => {
    expect(clampVerticalOffset(500, 0, 400)).toBe(0);
    expect(clampVerticalOffset(0, 0, 400)).toBe(0);
  });

  it('passes through an in-range saved offset unchanged', () => {
    const stageCount = 5;
    const viewportHeight = 300;
    const maxScrollY = ROW_HEIGHT * stageCount - viewportHeight; // 240
    expect(clampVerticalOffset(100, stageCount, viewportHeight)).toBe(100);
    expect(clampVerticalOffset(maxScrollY, stageCount, viewportHeight)).toBe(maxScrollY);
  });

  it('clamps a saved offset above the reduced-content maximum', () => {
    const stageCount = 5;
    const viewportHeight = 300;
    const maxScrollY = ROW_HEIGHT * stageCount - viewportHeight; // 240
    expect(clampVerticalOffset(9999, stageCount, viewportHeight)).toBe(maxScrollY);
  });

  it('clamps to 0 when the viewport is taller than the content (no scroll range)', () => {
    const stageCount = 2;
    const viewportHeight = 500; // content height (216) < viewport
    expect(clampVerticalOffset(50, stageCount, viewportHeight)).toBe(0);
  });

  it('clamps negative saved offsets to 0', () => {
    expect(clampVerticalOffset(-50, 5, 300)).toBe(0);
  });

  it('treats null/undefined/non-finite saved offsets as 0', () => {
    expect(clampVerticalOffset(null, 5, 300)).toBe(0);
    expect(clampVerticalOffset(undefined, 5, 300)).toBe(0);
    expect(clampVerticalOffset(NaN, 5, 300)).toBe(0);
  });
});
