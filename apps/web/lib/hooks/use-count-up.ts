'use client';

import { useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

/**
 * Animated number counter using requestAnimationFrame.
 * Returns `target` instantly for reduced-motion users.
 *
 * @param target - The final number to count up to
 * @param duration - Animation duration in milliseconds (default: 1200)
 */
export function useCountUp(target: number, duration = 1200): number {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const [value, setValue] = useState(shouldReduceMotion ? target : 0);
  const startTime = useRef<number | null>(null);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    if (shouldReduceMotion) {
      setValue(target);
      return;
    }

    if (target === 0) {
      setValue(0);
      return;
    }

    startTime.current = null;

    function step(timestamp: number) {
      if (startTime.current === null) {
        startTime.current = timestamp;
      }

      const elapsed = timestamp - startTime.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic for a decelerating feel
      const eased = 1 - (1 - progress) ** 3;

      setValue(Math.round(eased * target));

      if (progress < 1) {
        rafId.current = requestAnimationFrame(step);
      }
    }

    rafId.current = requestAnimationFrame(step);

    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [target, duration, shouldReduceMotion]);

  return value;
}
