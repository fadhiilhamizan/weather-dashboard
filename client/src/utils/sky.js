import { categorize } from './weatherCodes.js';

/**
 * The "living sky" engine.
 *
 * Given the current condition code and whether it's daytime, return the three
 * gradient stops and the accent colour that define the entire UI's palette.
 * applySky() writes them to CSS variables on <html>, and because every glass
 * surface and accent is derived from those variables, the whole interface
 * re-tints in a single, eased transition.
 */

const PALETTES = {
  clear: {
    day: { from: '#2f80ed', via: '#56ccf2', to: '#9bd4f5', accent: '#ffd66b' },
    night: { from: '#0b1026', via: '#1b2350', to: '#2d2a6e', accent: '#c7b3ff' },
  },
  'clouds-few': {
    day: { from: '#4a7fb5', via: '#7ba7cf', to: '#aac4dc', accent: '#fde68a' },
    night: { from: '#161d30', via: '#28324a', to: '#3a4763', accent: '#cbd5e1' },
  },
  clouds: {
    day: { from: '#54657a', via: '#7d8ea0', to: '#a6b4c2', accent: '#e2e8f0' },
    night: { from: '#1a2233', via: '#2b3548', to: '#3b4761', accent: '#cbd5e1' },
  },
  rain: {
    day: { from: '#3a5068', via: '#55718c', to: '#7d97ad', accent: '#7dd3fc' },
    night: { from: '#101826', via: '#1f2c3b', to: '#314556', accent: '#60a5fa' },
  },
  drizzle: {
    day: { from: '#4a6076', via: '#6a849b', to: '#93a9bd', accent: '#93c5fd' },
    night: { from: '#131c2b', via: '#22303f', to: '#33485c', accent: '#7dd3fc' },
  },
  thunderstorm: {
    day: { from: '#2a2f44', via: '#3d4360', to: '#534a73', accent: '#fbbf24' },
    night: { from: '#10121f', via: '#222539', to: '#352f52', accent: '#fbbf24' },
  },
  snow: {
    day: { from: '#6989a8', via: '#9db6cc', to: '#cdddea', accent: '#e0f2fe' },
    night: { from: '#20293a', via: '#36465c', to: '#51637b', accent: '#bae6fd' },
  },
  atmosphere: {
    day: { from: '#6b7a86', via: '#93a1ab', to: '#bcc6cd', accent: '#cbd5e1' },
    night: { from: '#222a31', via: '#3a444d', to: '#586470', accent: '#cbd5e1' },
  },
};

export function skyFor(conditionId, isDay) {
  const category = categorize(conditionId);
  const palette = PALETTES[category] || PALETTES.clear;
  return palette[isDay ? 'day' : 'night'];
}

// sRGB relative luminance (0 = black, 1 = white) of a #rrggbb colour, used to
// decide whether the sky is light enough to need dark text for WCAG contrast.
function relLuminance(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return 0;
  const n = parseInt(m[1], 16);
  const channel = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const r = channel((n >> 16) & 255);
  const g = channel((n >> 8) & 255);
  const b = channel(n & 255);
  return 0.2126 * r + 0.7152 * g + 0.4722 * b;
}

// Text/border variables for the two contrast tones. On bright (daytime, clear)
// skies we switch to dark text so labels and headings meet WCAG AA; on dark
// (night / stormy / overcast) skies the default light text stays.
const DARK_TEXT = {
  '--text-strong': '#0a2236',
  '--text-soft': 'rgba(10,34,54,0.76)',
  '--text-faint': 'rgba(10,34,54,0.52)',
  '--glass-border': 'rgba(10,34,54,0.16)',
};
const LIGHT_TEXT = {
  '--text-strong': '#ffffff',
  '--text-soft': 'rgba(255,255,255,0.78)',
  '--text-faint': 'rgba(255,255,255,0.55)',
  '--glass-border': 'rgba(255,255,255,0.28)',
};

const TEXT_PROPS = Object.keys(LIGHT_TEXT);

/** Write the palette to CSS variables on the document root. */
export function applySky(conditionId, isDay) {
  if (typeof document === 'undefined') return;
  const sky = skyFor(conditionId, isDay);
  const root = document.documentElement;
  root.style.setProperty('--sky-from', sky.from);
  root.style.setProperty('--sky-via', sky.via);
  root.style.setProperty('--sky-to', sky.to);
  root.style.setProperty('--accent', sky.accent);

  // On darker (night / stormy / overcast) skies, soften the glass a touch so it
  // doesn't glare. Pure cosmetic.
  const darkGlass = !isDay || ['thunderstorm', 'clouds', 'rain'].includes(categorize(conditionId));
  root.style.setProperty('--glass-bg', darkGlass ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.16)');

  // Contrast: bright skies -> dark text, dark skies -> light text.
  const bright = relLuminance(sky.via) > 0.3;
  const tone = bright ? DARK_TEXT : LIGHT_TEXT;
  for (const prop of TEXT_PROPS) root.style.setProperty(prop, tone[prop]);
}

/**
 * Remove the inline sky variables so a fixed CSS theme (data-theme="dark"|
 * "light") can take over. applySky() writes inline styles on <html>, which beat
 * the stylesheet, so they must be cleared when leaving living-sky mode.
 */
export function clearSky() {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  for (const prop of ['--sky-from', '--sky-via', '--sky-to', '--accent', '--glass-bg', ...TEXT_PROPS]) {
    root.style.removeProperty(prop);
  }
}
