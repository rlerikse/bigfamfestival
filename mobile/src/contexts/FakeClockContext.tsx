/**
 * FakeClockContext
 *
 * Provides a "current time" value that the rest of the app reads instead of
 * calling Date.now() directly. In production the value ticks with real time.
 * Admin users can override it via setFakeTime() to smoke-test schedule
 * live-time behaviors (now-bar, auto-scroll, live-event highlighting) without
 * changing the device clock.
 *
 * Usage:
 *   const { now, fakeTime, setFakeTime, isFakeClock } = useFakeClock();
 *
 *   - now         — always use this instead of Date.now() in schedule logic
 *   - fakeTime    — null when real clock, ms epoch when overridden
 *   - setFakeTime — pass a ms epoch to override, or null to revert to real time
 *   - isFakeClock — true when a fake time is active (show indicator)
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

interface FakeClockContextValue {
  /** Current time in ms — real or fake. Use this everywhere instead of Date.now(). */
  now: number;
  /** The active fake time override (ms epoch), or null if using real clock. */
  fakeTime: number | null;
  /** Set a fake time override (ms epoch). Pass null to revert to real clock. */
  setFakeTime: (ts: number | null) => void;
  /** True when a fake time is active. */
  isFakeClock: boolean;
}

const FakeClockContext = createContext<FakeClockContextValue>({
  now: Date.now(),
  fakeTime: null,
  setFakeTime: () => {},
  isFakeClock: false,
});

const TICK_INTERVAL_MS = 10_000; // real-clock tick: every 10s (schedule uses 60s anyway)

export function FakeClockProvider({ children }: { children: React.ReactNode }) {
  const [fakeTime, setFakeTimeState] = useState<number | null>(null);
  const [realNow, setRealNow] = useState(() => Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep real clock ticking when no fake override is active
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (fakeTime === null) {
        setRealNow(Date.now());
      }
    }, TICK_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fakeTime]);

  const setFakeTime = useCallback((ts: number | null) => {
    setFakeTimeState(ts);
    if (ts === null) {
      // Immediately sync real clock on revert
      setRealNow(Date.now());
    }
    if (__DEV__ || process.env.EXPO_PUBLIC_APP_ENV !== 'production') {
      console.log(
        ts !== null
          ? `[FakeClock] Override active: ${new Date(ts).toLocaleString()}`
          : '[FakeClock] Reverted to real clock',
      );
    }
  }, []);

  const now = fakeTime !== null ? fakeTime : realNow;

  return (
    <FakeClockContext.Provider
      value={{ now, fakeTime, setFakeTime, isFakeClock: fakeTime !== null }}
    >
      {children}
    </FakeClockContext.Provider>
  );
}

/** Hook to read and control the fake clock. */
export function useFakeClock(): FakeClockContextValue {
  return useContext(FakeClockContext);
}

/** Convenience hook — just the current time. Drop-in for Date.now(). */
export function useNow(): number {
  return useContext(FakeClockContext).now;
}
