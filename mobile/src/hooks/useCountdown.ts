// src/hooks/useCountdown.ts
import React, { useState } from 'react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const calculateTimeLeft = (targetDate: Date): TimeLeft | null => {
  const difference = +targetDate - +new Date();
  if (difference <= 0) {
    return null;
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
};

export const useCountdown = (targetDate: Date, onFinish?: () => void) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() => calculateTimeLeft(targetDate));


  React.useEffect(() => {
    let frameId: number;
    let finished = false;
    let prevDisplay: string | null = null;

    const tick = () => {
      if (finished) return;
      const newTimeLeft = calculateTimeLeft(targetDate);

      // Only update state if the display value actually changes
      const display = newTimeLeft
        ? `${newTimeLeft.days}:${newTimeLeft.hours}:${newTimeLeft.minutes}:${newTimeLeft.seconds}`
        : 'done';
      if (display !== prevDisplay) {
        setTimeLeft(newTimeLeft);
        prevDisplay = display;
      }

      if (!newTimeLeft) {
        finished = true;
        if (onFinish) onFinish();
        return;
      }
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => {
      finished = true;
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [targetDate, onFinish]);

  return timeLeft;
};
