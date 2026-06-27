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

export default function WeatherIcon({ conditionId, isDay = true, className, strokeWidth = 1.75, ...rest }) {
  const category = categorize(conditionId);
  const set = ICONS[category] || ICONS.clear;
  const Icon = set[isDay ? 'day' : 'night'];
  return <Icon className={className} strokeWidth={strokeWidth} aria-hidden="true" {...rest} />;
}
