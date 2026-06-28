import { Sunrise, Sunset } from 'lucide-react';
import { formatTime, DISPLAY_LOCALE } from '../utils/formatters.js';

/**
 * Sunrise → sunset as an arc, with the sun positioned by the current time of
 * day. Replaces the two separate sunrise/sunset tiles with one richer view that
 * shows, at a glance, how far through the daylight we are.
 */
export default function SunArc({ sunrise, sunset, now, tz }) {
  // Fraction of the way from sunrise (0) to sunset (1), clamped for night.
  const span = Math.max(sunset - sunrise, 1);
  const t = Math.max(0, Math.min(1, (now - sunrise) / span));
  const isDay = now >= sunrise && now < sunset;

  // Point on the semicircle (apex at top-centre). θ sweeps π→0 left→right.
  const theta = Math.PI * (1 - t);
  const sunX = 100 + 80 * Math.cos(theta);
  const sunY = 100 - 80 * Math.sin(theta);

  return (
    <div className="glass glass-sheen flex flex-col gap-1 rounded-2xl p-4">
      <div className="flex items-center gap-1.5 text-[color:var(--text-faint)]">
        <Sunrise className="h-4 w-4" strokeWidth={2} />
        <span className="text-xs font-medium uppercase tracking-wide">Sun</span>
      </div>

      <svg viewBox="0 0 200 116" className="mt-1 w-full" role="img" aria-label="Sunrise and sunset arc">
        {/* Horizon */}
        <line x1="12" y1="100" x2="188" y2="100" stroke="var(--glass-border)" strokeWidth="1" />
        {/* Arc path */}
        <path
          d="M20,100 A80,80 0 0 1 180,100"
          fill="none"
          stroke="var(--text-faint)"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
        {/* Sun */}
        <circle cx={sunX} cy={sunY} r="6.5" fill="var(--accent)" opacity={isDay ? 1 : 0.4} />
        {isDay && <circle cx={sunX} cy={sunY} r="12" fill="var(--accent)" opacity="0.25" />}
      </svg>

      <div className="flex items-center justify-between text-sm">
        <span className="tnum text-[color:var(--text-strong)]">
          {formatTime(sunrise, tz, DISPLAY_LOCALE)}
        </span>
        <Sunset className="h-4 w-4 text-[color:var(--text-faint)]" strokeWidth={2} />
        <span className="tnum text-[color:var(--text-strong)]">
          {formatTime(sunset, tz, DISPLAY_LOCALE)}
        </span>
      </div>
    </div>
  );
}
