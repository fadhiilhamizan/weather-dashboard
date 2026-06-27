/**
 * Formatting helpers.
 *
 * All functions are pure so they can be unit tested (see tests/formatters.test.js).
 * Anything involving dates accepts an explicit timezone and locale so it can be
 * tested deterministically and so times render in the *searched city's* clock,
 * not the viewer's.
 */

/**
 * Locale used for all human-readable dates/times in the UI. en-GB gives an
 * unambiguous day-month order ("27 June 2026") and 24-hour clock, which suits
 * an international audience. Times are still rendered in the searched city's
 * timezone — only the language/format comes from here.
 */
export const DISPLAY_LOCALE = 'en-GB';

export const unitSymbol = (units) => (units === 'imperial' ? '°F' : '°C');
export const speedUnit = (units) => (units === 'imperial' ? 'mph' : 'm/s');

/** "31°" — degree only; pair with unitSymbol() where the unit matters. */
export function formatTemp(value) {
  if (value == null || Number.isNaN(value)) return '--°';
  return `${Math.round(value)}°`;
}

export function formatSpeed(value, units) {
  if (value == null || Number.isNaN(value)) return `-- ${speedUnit(units)}`;
  return `${Math.round(value)} ${speedUnit(units)}`;
}

export function formatPercent(value) {
  if (value == null || Number.isNaN(value)) return '--%';
  return `${Math.round(value)}%`;
}

/** Metres -> "10 km" (metric) or "6.2 mi" (imperial). */
export function formatVisibility(metres, units) {
  if (metres == null) return '--';
  if (units === 'imperial') {
    const miles = metres / 1609.344;
    return `${miles.toFixed(1)} mi`;
  }
  return `${Math.round(metres / 1000)} km`;
}

/** 0–360° -> 16-point compass abbreviation. */
export function degToCompass(deg) {
  if (deg == null || Number.isNaN(deg)) return '--';
  const points = [
    'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
  ];
  const index = Math.round((((deg % 360) + 360) % 360) / 22.5) % 16;
  return points[index];
}

/** UV index -> { level, label } banding (WHO scale). */
export function uvCategory(uvi) {
  const v = uvi ?? 0;
  if (v < 3) return { level: 'low', label: 'Low' };
  if (v < 6) return { level: 'moderate', label: 'Moderate' };
  if (v < 8) return { level: 'high', label: 'High' };
  if (v < 11) return { level: 'very-high', label: 'Very High' };
  return { level: 'extreme', label: 'Extreme' };
}

function intl(unixSeconds, timeZone, locale, options) {
  const date = new Date(unixSeconds * 1000);
  return new Intl.DateTimeFormat(locale, { timeZone, ...options }).format(date);
}

/** "14:30" in 24h time, in the location's timezone. */
export function formatTime(unixSeconds, timeZone, locale) {
  return intl(unixSeconds, timeZone, locale, {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
}

/** "14:00" — hour-only label for the hourly strip. */
export function formatHourLabel(unixSeconds, timeZone, locale) {
  return intl(unixSeconds, timeZone, locale, { hour: '2-digit', hourCycle: 'h23' }) + ':00';
}

/** "Sat" — short weekday for the daily list. */
export function formatDay(unixSeconds, timeZone, locale) {
  return intl(unixSeconds, timeZone, locale, { weekday: 'short' });
}

/** "Saturday, 27 June 2026" — used in the hero. */
export function formatFullDate(unixSeconds, timeZone, locale) {
  return intl(unixSeconds, timeZone, locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
