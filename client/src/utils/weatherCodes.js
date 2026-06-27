/**
 * Maps OpenWeather condition codes to a small set of visual categories. Both
 * the icon component and the sky/gradient logic key off these categories, so a
 * new condition only has to be classified once.
 *
 * Reference: https://openweathermap.org/weather-conditions
 */
export function categorize(id) {
  if (id >= 200 && id < 300) return 'thunderstorm';
  if (id >= 300 && id < 400) return 'drizzle';
  if (id >= 500 && id < 600) return 'rain';
  if (id >= 600 && id < 700) return 'snow';
  if (id >= 700 && id < 800) return 'atmosphere'; // mist, fog, haze, dust...
  if (id === 800) return 'clear';
  if (id === 801 || id === 802) return 'clouds-few';
  if (id >= 803 && id < 900) return 'clouds';
  return 'clear';
}

/** Title-cases the provider's description, e.g. "light rain" -> "Light Rain". */
export function titleCase(text = '') {
  return text
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}
