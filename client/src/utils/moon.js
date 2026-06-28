/**
 * Moon phase from a date — a pure astronomical approximation, no API needed.
 *
 * Based on the mean synodic month and a known new-moon epoch. Accurate to about
 * a day, which is plenty for a "tonight's moon" indicator.
 */

const SYNODIC = 29.530588853; // days between new moons
const NEW_MOON_EPOCH = Date.UTC(2000, 0, 6, 18, 14) / 86400000; // in days

const LABELS = [
  'New Moon',
  'Waxing Crescent',
  'First Quarter',
  'Waxing Gibbous',
  'Full Moon',
  'Waning Gibbous',
  'Last Quarter',
  'Waning Crescent',
];

/**
 * @param {Date} [date]
 * @returns {{ phase:number, illumination:number, waxing:boolean, label:string }}
 *   phase: 0..1 through the cycle (0 = new, 0.5 = full);
 *   illumination: 0..1 fraction of the disc lit;
 *   waxing: true while growing toward full.
 */
export function moonPhase(date = new Date()) {
  const days = date.getTime() / 86400000 - NEW_MOON_EPOCH;
  const phase = ((days / SYNODIC) % 1 + 1) % 1;
  const illumination = (1 - Math.cos(2 * Math.PI * phase)) / 2;
  const waxing = phase < 0.5;
  // 8 named phases, each a 1/8 slice centred on its canonical point.
  const idx = Math.round(phase * 8) % 8;
  return { phase, illumination, waxing, label: LABELS[idx] };
}
