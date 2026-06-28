import { useId } from 'react';
import { formatHourLabel, formatTemp, DISPLAY_LOCALE } from '../utils/formatters.js';

/**
 * A responsive SVG line graph of the next-24-hours temperature. No chart
 * library — it's a single <path> for the smoothed line plus an area fill, with
 * sparse hour labels and high/low markers. Colours come from the theme CSS
 * variables so it re-tints with the living sky.
 */

const W = 720;
const H = 170;
const PAD_X = 24;
const PAD_TOP = 34; // room for the temperature labels above the line
const PAD_BOTTOM = 26; // room for the hour labels below

// Build a smooth path through points using a Catmull-Rom -> cubic Bézier.
function smoothPath(points) {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export default function HourlyChart({ hourly, tz }) {
  const gradId = useId();
  if (!hourly?.length) return null;

  const temps = hourly.map((h) => h.temp);
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  const span = Math.max(max - min, 1);

  const innerW = W - PAD_X * 2;
  const plotH = H - PAD_TOP - PAD_BOTTOM;

  const points = hourly.map((h, i) => ({
    x: PAD_X + (i / (hourly.length - 1)) * innerW,
    y: PAD_TOP + (1 - (h.temp - min) / span) * plotH,
    temp: h.temp,
    dt: h.dt,
  }));

  const line = smoothPath(points);
  const area = `${line} L ${points[points.length - 1].x} ${H - PAD_BOTTOM} L ${points[0].x} ${
    H - PAD_BOTTOM
  } Z`;

  // Label every 4th hour to avoid crowding (plus the last).
  const labelStep = 4;
  const idxMin = temps.indexOf(min);
  const idxMax = temps.indexOf(max);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="block w-full"
      role="img"
      aria-label="24-hour temperature graph"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>

      <path d={area} fill={`url(#${gradId})`} />
      <path
        d={line}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />

      {points.map((p, i) => {
        const showLabel = i === idxMin || i === idxMax;
        const showHour = i % labelStep === 0 || i === points.length - 1;
        return (
          <g key={p.dt}>
            {showLabel && (
              <>
                <circle cx={p.x} cy={p.y} r="3.5" fill="var(--accent)" />
                <text
                  x={p.x}
                  y={p.y - 12}
                  textAnchor="middle"
                  className="tnum"
                  fill="var(--text-strong)"
                  fontSize="15"
                  fontWeight="700"
                >
                  {formatTemp(p.temp)}
                </text>
              </>
            )}
            {showHour && (
              <text
                x={p.x}
                y={H - 8}
                textAnchor="middle"
                className="tnum"
                fill="var(--text-faint)"
                fontSize="12"
              >
                {i === 0 ? 'Now' : formatHourLabel(p.dt, tz, DISPLAY_LOCALE)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
