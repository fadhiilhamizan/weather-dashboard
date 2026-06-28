import {
  Sun,
  Moon,
  Cloud,
  CloudSun,
  CloudMoon,
  CloudRain,
  CloudDrizzle,
  CloudSnow,
  CloudLightning,
  CloudFog,
} from 'lucide-react';
import { categorize } from '../utils/weatherCodes.js';

/**
 * One condition code + day/night flag -> one lucide icon. Keeping this mapping
 * in a single component means the hourly strip, the daily list and the hero all
 * stay visually consistent and a new icon choice only happens in one place.
 */
const ICONS = {
  clear: { day: Sun, night: Moon },
  'clouds-few': { day: CloudSun, night: CloudMoon },
  clouds: { day: Cloud, night: Cloud },
  rain: { day: CloudRain, night: CloudRain },
  drizzle: { day: CloudDrizzle, night: CloudDrizzle },
  thunderstorm: { day: CloudLightning, night: CloudLightning },
  snow: { day: CloudSnow, night: CloudSnow },
  atmosphere: { day: CloudFog, night: CloudFog },
};

// Per-category idle motion. Subtle on purpose — these run forever and may appear
// many times on screen (hourly strip, daily list). Disabled by prefers-reduced-
// motion via the global rule in index.css.
const MOTION = {
  clear: { day: 'animate-spin-slow', night: 'animate-float' },
  'clouds-few': { day: 'animate-drift', night: 'animate-drift' },
  clouds: { day: 'animate-drift', night: 'animate-drift' },
  rain: { day: 'animate-bob', night: 'animate-bob' },
  drizzle: { day: 'animate-bob', night: 'animate-bob' },
  thunderstorm: { day: 'animate-flicker', night: 'animate-flicker' },
  snow: { day: 'animate-bob', night: 'animate-bob' },
  atmosphere: { day: 'animate-float', night: 'animate-float' },
};

export default function WeatherIcon({
  conditionId,
  isDay = true,
  className,
  strokeWidth = 1.75,
  animate = false,
  ...rest
}) {
  const category = categorize(conditionId);
  const set = ICONS[category] || ICONS.clear;
  const Icon = set[isDay ? 'day' : 'night'];
  const motion = animate ? (MOTION[category] || MOTION.clear)[isDay ? 'day' : 'night'] : '';
  return (
    <Icon
      className={[className, motion].filter(Boolean).join(' ')}
      strokeWidth={strokeWidth}
      aria-hidden="true"
      {...rest}
    />
  );
}
