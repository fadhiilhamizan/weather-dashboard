import {
  Umbrella,
  ShieldAlert,
  Sprout,
  Wind,
  ThermometerSun,
  ThermometerSnowflake,
  Sparkles,
} from 'lucide-react';
import { uvCategory } from '../utils/formatters.js';

/**
 * Turns raw numbers into a few plain-language takeaways. The brief suggests the
 * dashboard can be specialised by sector (agriculture, logistics), so alongside
 * everyday advice this surfaces a farming/outdoor-work angle when the data calls
 * for it. Pure function -> easy to reason about and extend.
 */
function buildInsights(data) {
  const { current, hourly = [], daily = [], airQuality, units } = data;
  const out = [];

  // Rain in the next 12 hours -> umbrella / field-work timing.
  const soon = hourly.slice(0, 12);
  const peakPop = soon.reduce((m, h) => Math.max(m, h.pop), 0);
  if (peakPop >= 50) {
    out.push({
      icon: Umbrella,
      title: 'Rain likely soon',
      text: `Up to ${peakPop}% chance of rain in the next 12 hours. Carry an umbrella and plan outdoor or field work around the drier hours.`,
    });
  }

  // UV protection.
  const uv = uvCategory(current.uvi);
  if (current.uvi >= 6) {
    out.push({
      icon: ShieldAlert,
      title: `${uv.label} UV`,
      text: 'Sun protection recommended — sunscreen, a hat, and shade during the middle of the day.',
    });
  }

  // Strong wind -> logistics / spraying caution.
  const windKmh = units === 'imperial' ? current.windSpeed * 1.609 : current.windSpeed * 3.6;
  if (windKmh >= 30) {
    out.push({
      icon: Wind,
      title: 'Windy conditions',
      text: 'Gusty winds may affect deliveries, high-sided vehicles, and crop spraying. Secure loose items outdoors.',
    });
  }

  // Agriculture-friendly conditions: warm, humid, low rain right now.
  const tempC = units === 'imperial' ? (current.temp - 32) * (5 / 9) : current.temp;
  if (current.humidity >= 60 && current.humidity <= 85 && peakPop < 50 && tempC >= 18 && tempC <= 32) {
    out.push({
      icon: Sprout,
      title: 'Good for the field',
      text: 'Comfortable humidity and a low rain risk make for favourable conditions for planting, irrigation, and outdoor work.',
    });
  }

  // Heat / cold flags.
  if (tempC >= 35) {
    out.push({
      icon: ThermometerSun,
      title: 'Heat caution',
      text: 'Stay hydrated and limit strenuous activity during peak afternoon heat.',
    });
  } else if (tempC <= 2) {
    out.push({
      icon: ThermometerSnowflake,
      title: 'Cold conditions',
      text: 'Dress in layers and watch for icy surfaces, especially early morning and overnight.',
    });
  }

  // Air quality.
  if (airQuality && airQuality.aqi >= 4) {
    out.push({
      icon: Wind,
      title: `Air quality: ${airQuality.label}`,
      text: 'Sensitive groups should limit prolonged time outdoors until conditions improve.',
    });
  }

  // Always have something positive to say.
  if (out.length === 0) {
    const dryDays = daily.filter((d) => d.pop < 30).length;
    out.push({
      icon: Sparkles,
      title: 'Settled weather',
      text: `Nothing notable on the radar — ${dryDays} of the next ${daily.length} days look mostly dry. A good window for outdoor plans.`,
    });
  }

  return out.slice(0, 4);
}

export default function Insights({ data }) {
  const insights = buildInsights(data);

  return (
    <section>
      <h2 className="mb-3 px-1 text-sm font-semibold uppercase tracking-wide text-[color:var(--text-soft)]">
        Insights
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {insights.map(({ icon: Icon, title, text }) => (
          <div key={title} className="glass glass-sheen flex gap-3 rounded-2xl p-4">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ background: 'var(--glass-bg-strong)', color: 'var(--accent)' }}
            >
              <Icon className="h-5 w-5" strokeWidth={2} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{title}</p>
              <p className="mt-0.5 text-sm leading-snug text-[color:var(--text-soft)]">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
