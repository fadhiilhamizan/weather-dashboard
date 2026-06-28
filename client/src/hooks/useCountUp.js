import { useEffect, useRef, useState } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Animate a number from its previous value to `target` with a short eased
 * tween (requestAnimationFrame). Returns the current rounded value to render.
 *
 * Respects prefers-reduced-motion by snapping straight to the target. Used for
 * the hero temperature so unit/location changes feel alive without jitter.
 */
export function useCountUp(target, { duration = 700 } = {}) {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const rafRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    if (!Number.isFinite(target) || from === target || prefersReducedMotion()) {
      fromRef.current = target;
      setValue(target);
      return undefined;
    }

    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setValue(Math.round(from + (target - from) * eased));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return value;
}
