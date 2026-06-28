import { Droplets, Wind, Star, Loader2 } from 'lucide-react';
import WeatherIcon from './WeatherIcon.jsx';
import HourlyChart from './HourlyChart.jsx';
import { useMultiWeather } from '../hooks/useMultiWeather.js';
import { titleCase } from '../utils/weatherCodes.js';
import { formatTemp, formatSpeed, formatPercent, unitSymbol } from '../utils/formatters.js';

/**
 * Side-by-side view of the saved locations so several places can be scanned at
 * once. Each card mirrors the hero's headline data plus a temperature
 * sparkline, and clicking it jumps to that place's detailed view.
 */
export default function ComparisonView({ favorites = [], units, onSelect }) {
  const { results, loading } = useMultiWeather(favorites, units);

  if (!favorites.length) {
    return (
      <div className="glass glass-sheen flex flex-col items-center gap-3 rounded-3xl px-6 py-14 text-center">
        <Star className="h-8 w-8 text-[color:var(--accent)]" />
        <p className="text-base font-semibold text-[color:var(--text-strong)]">No saved locations yet</p>
        <p className="max-w-sm text-sm text-[color:var(--text-soft)]">
          Save a few places with the star button and they'll appear here side by side for a quick comparison.
        </p>
      </div>
    );
  }

  if (loading && !results.length) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-[color:var(--text-soft)]">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading your locations…
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {results.map(({ place, status, data }) => {
        if (status !== 'success' || !data) {
          return (
            <div key={place.id} className="glass rounded-3xl p-5 text-sm text-[color:var(--text-soft)]">
              <p className="font-semibold text-[color:var(--text-strong)]">{place.name}</p>
              <p className="mt-2">Couldn't load this location.</p>
            </div>
          );
        }
        const { current, daily, hourly, location } = data;
        const today = daily?.[0];
        return (
          <button
            key={place.id}
            type="button"
            onClick={() => onSelect(place)}
            className="glass glass-sheen group flex flex-col rounded-3xl p-5 text-left transition-all duration-200 hover:scale-[1.02]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-semibold text-[color:var(--text-strong)]">{location.name || place.name}</p>
                <p className="text-xs text-[color:var(--text-faint)]">{location.country || place.country}</p>
              </div>
              <WeatherIcon
                conditionId={current.condition.id}
                isDay={current.isDay}
                animate
                className="h-9 w-9 shrink-0 text-[color:var(--text-strong)]"
              />
            </div>

            <div className="mt-2 flex items-end gap-2">
              <span className="tnum font-display text-4xl font-bold leading-none text-[color:var(--text-strong)]">
                {Math.round(current.temp)}
              </span>
              <span className="mb-1 text-lg text-[color:var(--text-soft)]">{unitSymbol(units)}</span>
            </div>
            <p className="mt-1 truncate text-sm text-[color:var(--text-soft)]">
              {titleCase(current.condition.description)}
            </p>
            {today && (
              <p className="tnum mt-0.5 text-xs text-[color:var(--text-faint)]">
                H {formatTemp(today.tempMax)} · L {formatTemp(today.tempMin)}
              </p>
            )}

            <div className="-mx-1 mt-2 opacity-90">
              <HourlyChart hourly={hourly} tz={location.timezone} units={units} mini />
            </div>

            <div className="mt-2 flex items-center gap-4 text-xs text-[color:var(--text-soft)]">
              <span className="tnum flex items-center gap-1">
                <Droplets className="h-3.5 w-3.5" /> {formatPercent(current.humidity)}
              </span>
              <span className="tnum flex items-center gap-1">
                <Wind className="h-3.5 w-3.5" /> {formatSpeed(current.windSpeed, units)}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
