import { useId } from 'react';
import { categorize } from '../utils/weatherCodes.js';

/**
 * A full-bleed SVG "scene" behind the UI that reflects the current weather: a
 * sun or moon for clear skies, a hazy disc through thin cloud, and layered hill
 * silhouettes along the horizon. It's intentionally low-contrast so the glass
 * cards stay readable, and it tints with the living-sky palette (fills are white
 * / var(--accent) over the body gradient). Pairs with WeatherBackground, which
 * adds the moving particles (rain, snow, stars…).
 *
 * Self-contained vector art — no image assets, no network — so it scales
 * crisply on any screen and works offline.
 */
export default function WeatherScene({ conditionId, isDay }) {
  const id = useId();
  const category = categorize(conditionId);

  const clearDay = category === 'clear' && isDay;
  const clearNight = category === 'clear' && !isDay;
  const hazyDay = ['clouds-few', 'atmosphere'].includes(category) && isDay;
  const stormy = ['rain', 'drizzle', 'thunderstorm', 'snow', 'clouds'].includes(category);

  return (
    <svg
      className="h-full w-full"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`${id}-sun`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.9" />
          <stop offset="40%" stopColor="var(--accent)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-moon`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Sun / moon disc */}
      {(clearDay || hazyDay) && (
        <g opacity={hazyDay ? 0.55 : 1}>
          <circle cx="1120" cy="240" r="300" fill={`url(#${id}-sun)`} />
          <circle cx="1120" cy="240" r="92" fill="var(--accent)" opacity="0.85" />
        </g>
      )}
      {clearNight && (
        <g>
          <circle cx="1140" cy="220" r="260" fill={`url(#${id}-moon)`} />
          <circle cx="1140" cy="220" r="70" fill="#ffffff" opacity="0.85" />
          <circle cx="1170" cy="200" r="70" fill="var(--sky-via)" opacity="0.9" />
        </g>
      )}

      {/* Horizon hills — three layers for depth. */}
      <path
        d="M0 720 C 240 660, 420 700, 660 690 C 900 680, 1100 640, 1440 700 L1440 900 L0 900 Z"
        fill="#ffffff"
        opacity={stormy ? 0.05 : 0.08}
      />
      <path
        d="M0 790 C 280 740, 520 790, 760 770 C 1040 748, 1240 800, 1440 770 L1440 900 L0 900 Z"
        fill="#ffffff"
        opacity={stormy ? 0.07 : 0.11}
      />
      <path
        d="M0 850 C 320 820, 600 860, 900 840 C 1160 824, 1320 858, 1440 842 L1440 900 L0 900 Z"
        fill="#0b1f3a"
        opacity="0.12"
      />
    </svg>
  );
}
