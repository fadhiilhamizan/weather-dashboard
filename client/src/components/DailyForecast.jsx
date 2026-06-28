import { Droplets } from 'lucide-react';
import WeatherIcon from './WeatherIcon.jsx';
import { titleCase } from '../utils/weatherCodes.js';
import { formatTemp, formatDay, DISPLAY_LOCALE } from '../utils/formatters.js';

/**
 * 5–7 day outlook. Each row carries a little range bar whose filled segment is
 * positioned relative to the whole week's low and high, so you can read the
 * trend at a glance rather than just the numbers.
 */
export default function DailyForecast({ data }) {
  const { daily, location } = data;
  const tz = location.timezone;
  if (!daily?.length) return null;

  const weekMin = Math.min(...daily.map((d) => d.tempMin));
  const weekMax = Math.max(...daily.map((d) => d.tempMax));
  const span = Math.max(weekMax - weekMin, 1);

  return (
    <section className="glass glass-sheen rounded-3xl p-5">
      <h2 className="mb-2 px-1 text-sm font-semibold uppercase tracking-wide text-[color:var(--text-soft)]">
        {daily.length}-day forecast
      </h2>
      <ul className="divide-y divide-white/10">
        {daily.map((d, i) => {
          const left = ((d.tempMin - weekMin) / span) * 100;
          const width = ((d.tempMax - d.tempMin) / span) * 100;
          return (
            <li key={d.dt} className="grid grid-cols-[3rem_1.75rem_1fr_auto] items-center gap-3 rounded-xl px-1 py-3 transition-colors hover:bg-white/10 sm:grid-cols-[4.5rem_2rem_1fr_9rem]">
              <span className="text-sm font-medium text-[color:var(--text-strong)]">
                {i === 0 ? 'Today' : formatDay(d.dt, tz, DISPLAY_LOCALE)}
              </span>

              <WeatherIcon
                conditionId={d.condition.id}
                isDay={true}
                animate
                className="h-6 w-6 text-[color:var(--text-strong)]"
                title={titleCase(d.condition.description)}
              />

              <span className="tnum flex items-center gap-1 text-xs" style={{ color: d.pop >= 20 ? 'var(--accent)' : 'var(--text-faint)' }}>
                <Droplets className="h-3 w-3" />
                {d.pop}%
              </span>

              <div className="flex items-center gap-2">
                <span className="tnum w-8 text-right text-sm text-[color:var(--text-soft)]">
                  {formatTemp(d.tempMin)}
                </span>
                <div className="relative hidden h-1.5 flex-1 rounded-full bg-white/15 sm:block">
                  <div
                    className="absolute top-0 h-full rounded-full"
                    style={{
                      left: `${left}%`,
                      width: `${Math.max(width, 6)}%`,
                      background: 'linear-gradient(90deg, var(--text-soft), var(--accent))',
                    }}
                  />
                </div>
                <span className="tnum w-8 text-right text-sm font-semibold text-[color:var(--text-strong)]">
                  {formatTemp(d.tempMax)}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
