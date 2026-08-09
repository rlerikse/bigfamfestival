# ADR-017: Pure Logic Helpers for Jest Testability Under Expo SDK 54

**Status**: ✅ Accepted
**Date**: 2026-08-09

## Context

Under Expo SDK 54, importing any module that transitively pulls in
`@expo/vector-icons` or `expo-image` into a Jest test fails — Jest's transform
cannot parse the `.ttf` font asset those packages require, throwing
`SyntaxError: Invalid or unexpected token`. This happens on **import alone**,
before any component is rendered. It blocks unit-testing logic that lives inside
React Native screen/components such as `mobile/src/screens/ScheduleScreen.tsx`
and `mobile/src/components/HorizontalScheduleView.tsx`. It is the same root cause
behind `mobile/src/__tests__/SafeText.test.tsx`'s `describe.skip`.

## Decision

Extract logic that needs unit coverage into **pure, side-effect-free modules**
under `mobile/src/utils/` (e.g. `scheduleUtils.ts`) that have **zero**
react-native / expo imports. Unit tests import only those pure modules — never
the component. When a caller or spec expects the symbol to originate from the
component, **re-export** the helper from the component (the implementation still
lives in the pure util).

This was applied deliberately in:
- **BFF-124** — `clampVerticalOffset` in `scheduleUtils.ts`, tested by
  `HorizontalScheduleView.test.ts` (imports only the util).
- **BFF-128** — `deriveGenreOptions` in `scheduleUtils.ts`, tested by
  `scheduleUtils.genre.test.ts` (imports only the util).

## Consequences

- Logic becomes unit-testable without fighting the Expo/Jest transform, and the
  separation of pure logic from presentation improves testability generally.
- Trade-off: component-level render/integration coverage remains gapped for
  icon-bearing components (documented via `describe.skip`), and some helpers live
  in `utils/` rather than beside their component.
- **Revisit** if the underlying Expo SDK 54 Jest transform issue is resolved
  (e.g. a `jest-expo` preset upgrade or a font-asset transformer), after which
  logic could once again be co-located with components and tested in place.

## Evidence

- BFF-124 implementation (`489ab6f`); BFF-128 implementation (`df05bcb`).
- Precedent: `mobile/src/__tests__/SafeText.test.tsx` `describe.skip`.
