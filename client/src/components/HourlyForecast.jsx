import { Droplets } from 'lucide-react';
import WeatherIcon from './WeatherIcon.jsx';
import { formatTemp, formatHourLabel, DISPLAY_LOCALE } from '../utils/formatters.js';

/**
 * Next-24-hours strip. Horizontally scrollable on every screen size so it never
 * breaks the layout on a phone (one of the brief's anti-patterns to avoid).
 * Precipitation probability is shown under any hour where it's meaningful.
 */
export default function HourlyForecast({ data }) {
  const { hourly, location } = data;
  const tz = location.timezone;
  if (!hourly?.length) return null;

  return (
    <section className="glass glass-sheen rounded-3xl p-5">
      <h2 className="mb-4 px-1 text-sm font-semibold uppercase tracking-wide text-[color:var(--text-soft)]">
        Next 24 hours
      </h2>
      <div className="scroll-x -mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
        {hourly.map((h, i) => (
          <div
            key={h.dt}
            className="flex w-[68px] shrink-0 flex-col items-center gap-2 rounded-2xl px-2 py-3 transition-all duration-200 hover:scale-105 hover:bg-white/10"
          >
            <span className="tnum text-xs font-medium text-[color:var(--text-soft)]">
              {i === 0 ? 'Now' : formatHourLabel(h.dt, tz, DISPLAY_LOCALE)}
            </span>
            <WeatherIcon
              conditionId={h.condition.id}
              isDay={h.isDay}
              className="h-7 w-7 text-white"
            />
            <span className="tnum text-base font-semibold text-white">{formatTemp(h.temp)}</span>
            <span
              className="tnum flex items-center gap-0.5 text-[11px]"
              style={{ color: h.pop >= 20 ? 'var(--accent)' : 'transparent' }}
              aria-hidden={h.pop < 20}
            >
              <Droplets className="h-3 w-3" />
              {h.pop}%
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
