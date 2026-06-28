import { moonPhase } from '../utils/moon.js';

/**
 * A small SVG moon showing the current phase. The lit region is drawn as a
 * single path: a semicircular limb joined to the terminator ellipse, which is
 * concave for a crescent (illumination < 0.5) and convex for a gibbous moon.
 */
function litPath(R, illumination, waxing) {
  const rx = Math.abs(2 * illumination - 1) * R; // terminator ellipse x-radius
  const limbSweep = waxing ? 1 : 0; // which side is lit
  const termSweep = illumination < 0.5 ? limbSweep : 1 - limbSweep;
  return `M 0 ${-R} A ${R} ${R} 0 0 ${limbSweep} 0 ${R} A ${rx} ${R} 0 0 ${termSweep} 0 ${-R} Z`;
}

export default function MoonPhase({ date = new Date(), label = true }) {
  const { illumination, waxing, label: name } = moonPhase(date);
  const R = 16;

  return (
    <div className="flex items-center gap-3">
      <svg viewBox="-20 -20 40 40" className="h-12 w-12 shrink-0" role="img" aria-label={name}>
        {/* Dark disc */}
        <circle r={R} fill="rgba(255,255,255,0.10)" stroke="var(--glass-border)" strokeWidth="1" />
        {/* Lit region */}
        <path d={litPath(R, illumination, waxing)} fill="#e8eefc" />
      </svg>
      {label && (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[color:var(--text-strong)]">{name}</p>
          <p className="tnum text-xs text-[color:var(--text-soft)]">
            {Math.round(illumination * 100)}% illuminated
          </p>
        </div>
      )}
    </div>
  );
}
