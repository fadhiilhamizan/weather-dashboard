import {
  Sun,
  Droplets,
  Wind,
  Gauge,
  Eye,
  Thermometer,
  Sunrise,
  Sunset,
  Leaf,
} from 'lucide-react';
import {
  formatSpeed,
  formatPercent,
  formatVisibility,
  formatTemp,
  formatTime,
  degToCompass,
  uvCategory,
  DISPLAY_LOCALE,
} from '../utils/formatters.js';

function Stat({ icon: Icon, label, value, sub, accent = false }) {
  return (
    <div className="glass glass-sheen flex flex-col gap-2 rounded-2xl p-4">
      <div className="flex items-center gap-1.5 text-[color:var(--text-faint)]">
        <Icon className="h-4 w-4" strokeWidth={2} />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="tnum text-2xl font-semibold text-white">{value}</div>
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

  return (
    <section>
      <h2 className="mb-3 px-1 text-sm font-semibold uppercase tracking-wide text-[color:var(--text-soft)]">
        Today's details
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Stat
          icon={Sun}
          label="UV Index"
          value={current.uvi}
          sub={uv.label}
          accent
        />
        <Stat icon={Droplets} label="Humidity" value={formatPercent(current.humidity)} sub={`Dew pt ${formatTemp(current.dewPoint)}`} />
        <Stat
          icon={Wind}
          label="Wind"
          value={formatSpeed(current.windSpeed, units)}
          sub={`From ${degToCompass(current.windDeg)}`}
        />
        <Stat icon={Gauge} label="Pressure" value={`${current.pressure}`} sub="hPa" />
        <Stat
          icon={Eye}
          label="Visibility"
          value={formatVisibility(current.visibility, units)}
        />
        <Stat icon={Thermometer} label="Dew Point" value={formatTemp(current.dewPoint)} />
        <Stat icon={Sunrise} label="Sunrise" value={formatTime(current.sunrise, tz, DISPLAY_LOCALE)} />
        <Stat icon={Sunset} label="Sunset" value={formatTime(current.sunset, tz, DISPLAY_LOCALE)} />
        {airQuality && (
          <Stat
            icon={Leaf}
            label="Air Quality"
            value={airQuality.label}
            sub={`AQI ${airQuality.aqi}/5`}
          />
        )}
      </div>
    </section>
  );
}
