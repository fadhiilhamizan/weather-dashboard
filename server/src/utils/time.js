/**
 * Time helpers.
 *
 * Weather providers return everything as Unix timestamps (UTC seconds) plus a
 * `timezone_offset` (seconds east of UTC for the *queried location*). These
 * helpers convert those into the location's local wall-clock values so the UI
 * can say "sunset is at 18:04" using the city's clock, not the server's.
 *
 * Every function here is pure and deterministic, which makes them easy to unit
 * test (see tests/time.test.js).
 */

const MS = 1000;

/**
 * Shift a UTC Unix timestamp by an offset and return a Date whose *UTC* getters
 * read as the location's local time. Internal helper.
 */
function shifted(unixSeconds, offsetSeconds = 0) {
  return new Date((unixSeconds + offsetSeconds) * MS);
}

/** Day of week at the location: 0 = Sunday ... 6 = Saturday. */
export function localWeekday(unixSeconds, offsetSeconds = 0) {
  return shifted(unixSeconds, offsetSeconds).getUTCDay();
}

/** Hour of day (0–23) at the location. */
export function localHour(unixSeconds, offsetSeconds = 0) {
  return shifted(unixSeconds, offsetSeconds).getUTCHours();
}

/**
 * A stable "YYYY-MM-DD" key in the location's timezone, used to bucket hourly
 * data into days.
 */
export function localDateKey(unixSeconds, offsetSeconds = 0) {
  const d = shifted(unixSeconds, offsetSeconds);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Is it daytime at the given moment? True when `dt` falls between sunrise and
 * sunset. Used to pick day vs night icons and background themes.
 */
export function isDaytime(dt, sunrise, sunset) {
  if (!Number.isFinite(sunrise) || !Number.isFinite(sunset)) return true;
  return dt >= sunrise && dt < sunset;
}
