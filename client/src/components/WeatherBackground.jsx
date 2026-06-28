import { useMemo } from 'react';
import { categorize } from '../utils/weatherCodes.js';

/**
 * Condition-driven animated background. Renders a handful of absolutely-
 * positioned, CSS-animated elements (rain streaks, snow, drifting clouds,
 * stars, lightning) behind the UI. There is no per-frame JavaScript — the
 * motion is entirely CSS keyframes (see index.css, .wx-*), and the whole layer
 * is hidden under prefers-reduced-motion.
 *
 * Only shown in the living-sky theme; the fixed dark/light themes keep a calm,
 * static background so the weather palette isn't competing with neutral chrome.
 */

// Deterministic pseudo-random so particle positions are stable across renders.
function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function buildParticles(category, isDay) {
  const r = rng(category.length * 97 + (isDay ? 13 : 31));
  const rand = (min, max) => min + r() * (max - min);

  if (category === 'rain' || category === 'drizzle') {
    const count = category === 'rain' ? 60 : 36;
    return Array.from({ length: count }, (_, i) => ({
      key: i,
      className: 'wx-rain',
      style: {
        left: `${rand(0, 100)}%`,
        height: `${rand(8, 18)}vh`,
        opacity: rand(0.25, 0.6),
        animationDuration: `${rand(0.5, 1.1)}s`,
        animationDelay: `${rand(0, 2)}s`,
      },
    }));
  }

  if (category === 'snow') {
    return Array.from({ length: 45 }, (_, i) => {
      const size = rand(3, 7);
      return {
        key: i,
        className: 'wx-flake',
        style: {
          left: `${rand(0, 100)}%`,
          width: `${size}px`,
          height: `${size}px`,
          opacity: rand(0.4, 0.9),
          animationDuration: `${rand(6, 13)}s`,
          animationDelay: `${rand(0, 6)}s`,
        },
      };
    });
  }

  if (!isDay && category === 'clear') {
    return Array.from({ length: 70 }, (_, i) => {
      const size = rand(1, 2.6);
      return {
        key: i,
        className: 'wx-star',
        style: {
          left: `${rand(0, 100)}%`,
          top: `${rand(0, 75)}%`,
          width: `${size}px`,
          height: `${size}px`,
          animationDuration: `${rand(2.5, 6)}s`,
          animationDelay: `${rand(0, 5)}s`,
        },
      };
    });
  }

  if (['clouds', 'clouds-few', 'atmosphere', 'thunderstorm'].includes(category)) {
    return Array.from({ length: 5 }, (_, i) => {
      const size = rand(28, 52);
      return {
        key: i,
        className: 'wx-cloud',
        style: {
          top: `${rand(2, 55)}%`,
          width: `${size}vh`,
          height: `${size * 0.5}vh`,
          opacity: rand(0.5, 1),
          animationDuration: `${rand(45, 90)}s`,
          animationDelay: `${-rand(0, 60)}s`,
        },
      };
    });
  }

  return [];
}

export default function WeatherBackground({ conditionId, isDay, theme }) {
  const category = categorize(conditionId);
  const particles = useMemo(
    () => buildParticles(category, isDay),
    [category, isDay]
  );

  // The dark theme keeps a calm, static backdrop; particles are a living-sky
  // (light theme) flourish.
  if (theme === 'dark') return null;

  return (
    <div className="wx-layer" aria-hidden="true">
      {particles.map((p) => (
        <span key={p.key} className={p.className} style={p.style} />
      ))}
      {category === 'thunderstorm' && <span className="wx-flash" />}
    </div>
  );
}
