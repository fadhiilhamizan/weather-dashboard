import {
  Sun,
  Droplets,
  Wind,
  Gauge,
  Eye,
  Thermometer,
  Moon,
  Leaf,
} from 'lucide-react';
import SunArc from './SunArc.jsx';
import MoonPhase from './MoonPhase.jsx';
import {
  formatSpeed,
  formatPercent,
  formatVisibility,
  formatTemp,
  degToCompass,
  uvCategory,
} from '../utils/formatters.js';

function Stat({ icon: Icon, label, value, sub, accent = false, className = '' }) {
  return (
    <div className={`glass glass-sheen flex flex-col gap-2 rounded-2xl p-4 ${className}`}>
      <div className="flex items-center gap-1.5 text-[color:var(--text-faint)]">
        <Icon className="h-4 w-4" strokeWidth={2} />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="tnum text-2xl font-semibold text-[color:var(--text-strong)]">{value}</div>
      {sub && (
        <div
          className="text-xs font-medium"
          style={{ color: accent ? 'var(--accent)' : 'var(--text-soft)' }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

/**
 * The "today's details" grid. These cover the brief's required current-weather
 * fields (feels-like lives in the hero; UV, humidity, wind all live here) plus a
 * few that make the dashboard feel complete: pressure, visibility, dew point,
 * sun times and — when available — air quality.
 */
export default function Highlights({ data }) {
  const { current, units, location, airQuality } = data;
  const tz = location.timezone;
  const uv = uvCategory(current.uvi);

  const stats = [
    { icon: Sun, label: 'UV Index', value: current.uvi, sub: uv.label, accent: true },
    {
      icon: Droplets,
      label: 'Humidity',
      value: formatPercent(current.humidity),
      sub: `Dew pt ${formatTemp(current.dewPoint)}`,
    },
    {
      icon: Wind,
      label: 'Wind',
      value: formatSpeed(current.windSpeed, units),
      sub: `From ${degToCompass(current.windDeg)}`,
    },
    { icon: Gauge, label: 'Pressure', value: `${current.pressure}`, sub: 'hPa' },
    { icon: Eye, label: 'Visibility', value: formatVisibility(current.visibility, units) },
    { icon: Thermometer, label: 'Dew Point', value: formatTemp(current.dewPoint) },
  ];
  if (airQuality) {
    stats.push({
      icon: Leaf,
      label: 'Air Quality',
      value: airQuality.label,
      sub: `AQI ${airQuality.aqi}/5`,
    });
  }

  // Stretch the final card to fill the trailing gap so wide layouts never leave
  // an empty cell. Seven cards (with air quality) tile 4+3 → last spans 2 on lg
  // and goes full-width on the narrower grids; six cards only need the lg fill.
  const fillLast = airQuality
    ? 'col-span-2 sm:col-span-3 lg:col-span-2'
    : 'lg:col-span-3';

  return (
    <section>
      <h2 className="mb-3 px-1 text-sm font-semibold uppercase tracking-wide text-[color:var(--text-soft)]">
        Today's details
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Stat key={s.label} {...s} className={i === stats.length - 1 ? fillLast : ''} />
        ))}
      </div>

      {/* Sun and moon share a full-width row: sun takes two thirds, moon the
          rest, so neither leaves an empty cell beside it on wide screens. */}
      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SunArc sunrise={current.sunrise} sunset={current.sunset} now={current.dt} tz={tz} />
        </div>
        <div className="glass glass-sheen flex flex-col gap-2 rounded-2xl p-4 lg:col-span-1">
          <div className="flex items-center gap-1.5 text-[color:var(--text-faint)]">
            <Moon className="h-4 w-4" strokeWidth={2} />
            <span className="text-xs font-medium uppercase tracking-wide">Moon</span>
          </div>
          <div className="flex flex-1 items-center">
            <MoonPhase date={new Date(current.dt * 1000)} />
          </div>
        </div>
      </div>
    </section>
  );
}
