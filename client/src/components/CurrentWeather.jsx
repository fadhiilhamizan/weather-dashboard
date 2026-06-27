import { MapPin } from 'lucide-react';
import WeatherIcon from './WeatherIcon.jsx';
import { titleCase } from '../utils/weatherCodes.js';
import {
  unitSymbol,
  formatTemp,
  formatFullDate,
  DISPLAY_LOCALE,
} from '../utils/formatters.js';

/**
 * The hero panel: where you are, what it feels like, and the headline number.
 * The big temperature uses the display face and tabular figures so it stays
 * rock-steady as values update.
 */
export default function CurrentWeather({ data }) {
  const { location, current, units, daily } = data;
  const tz = location.timezone;
  const today = daily?.[0];

  const place = [location.name, location.country].filter(Boolean).join(', ');

  return (
    <section className="glass glass-sheen animate-fade-up rounded-3xl p-6 sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[color:var(--text-soft)]">
            <MapPin className="h-4 w-4 shrink-0" />
            <h1 className="truncate text-lg font-semibold text-white">{place || 'Unknown location'}</h1>
          </div>
          <p className="mt-1 text-sm text-[color:var(--text-faint)]">
            {formatFullDate(current.dt, tz, DISPLAY_LOCALE)}
          </p>

          <div className="mt-5 flex items-start gap-2">
            <span className="tnum font-display text-7xl font-bold leading-none text-white sm:text-8xl">
              {Math.round(current.temp)}
            </span>
            <span className="mt-2 font-display text-3xl font-medium text-[color:var(--text-soft)]">
              {unitSymbol(units)}
            </span>
          </div>

          <p className="mt-3 text-lg font-medium text-white">
            {titleCase(current.condition.description)}
          </p>
          <p className="tnum mt-1 text-sm text-[color:var(--text-soft)]">
            Feels like {formatTemp(current.feelsLike)}
            {today && (
              <>
                {'  ·  '}
                <span className="text-white">H {formatTemp(today.tempMax)}</span>
                {'  '}
                <span>L {formatTemp(today.tempMin)}</span>
              </>
            )}
          </p>
        </div>

        <div className="flex shrink-0 items-center justify-center sm:justify-end">
          <WeatherIcon
            conditionId={current.condition.id}
            isDay={current.isDay}
            className="h-28 w-28 animate-float text-white drop-shadow-[0_8px_24px_rgba(0,0,0,0.25)] sm:h-36 sm:w-36"
            strokeWidth={1.25}
          />
        </div>
      </div>
    </section>
  );
}
