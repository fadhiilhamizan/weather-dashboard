import { useId, useState } from 'react';
import {
  formatHourLabel,
  formatTemp,
  formatPercent,
  formatSpeed,
  DISPLAY_LOCALE,
} from '../utils/formatters.js';

/**
 * Interactive 24-hour chart. No chart library — a single SVG with:
 *   - a metric toggle (temperature / precipitation / wind);
 *   - a smoothed line + area for temp/wind, or bars for precipitation;
 *   - a hover/touch tooltip that snaps to the nearest hour;
 *   - a visually-hidden data table so the same information is available to
 *     screen readers and keyboard users.
 * Colours come from the theme CSS variables, so it re-tints with the living sky.
 *
 * In `mini` mode it renders just the temperature line (no toggle, labels, or
 * interaction) for use as a sparkline in the comparison view.
 */

const W = 720;
const H = 170;
const PAD_X = 24;
const PAD_TOP = 34; // room for value labels above the line
const PAD_BOTTOM = 26; // room for hour labels below

// Catmull-Rom -> cubic Bézier for a smooth line through points.
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

const METRICS = {
  temp: {
    label: 'Temp',
    type: 'line',
    value: (h) => h.temp,
    format: (v) => formatTemp(v),
    domain: (vals) => [Math.min(...vals), Math.max(...vals)],
  },
  precip: {
    label: 'Rain',
    type: 'bar',
    value: (h) => h.pop ?? 0,
    format: (v) => formatPercent(v),
    domain: () => [0, 100],
  },
  wind: {
    label: 'Wind',
    type: 'line',
    value: (h) => h.windSpeed ?? 0,
    format: (v, units) => formatSpeed(v, units),
    domain: (vals) => [0, Math.max(...vals, 1)],
  },
};

export default function HourlyChart({ hourly, tz, units = 'metric', mini = false }) {
  const gradId = useId();
  const [metricKey, setMetricKey] = useState('temp');
  const [hover, setHover] = useState(null);

  if (!hourly?.length) return null;

  // In mini mode we always show temperature with no chrome.
  const metric = mini ? METRICS.temp : METRICS[metricKey];
  const windAvailable = hourly.some((h) => h.windSpeed != null);

  const values = hourly.map(metric.value);
  const [dMin, dMaxRaw] = metric.domain(values);
  const dMax = dMaxRaw === dMin ? dMin + 1 : dMaxRaw;

  const innerW = W - PAD_X * 2;
  const plotH = H - PAD_TOP - PAD_BOTTOM;
  const baseY = H - PAD_BOTTOM;

  const points = hourly.map((h, i) => ({
    x: PAD_X + (i / (hourly.length - 1)) * innerW,
    y: PAD_TOP + (1 - (metric.value(h) - dMin) / (dMax - dMin)) * plotH,
    v: metric.value(h),
    dt: h.dt,
  }));

  const line = smoothPath(points);
  const area = `${line} L ${points[points.length - 1].x} ${baseY} L ${points[0].x} ${baseY} Z`;

  const labelStep = 4;
  const idxMin = values.indexOf(Math.min(...values));
  const idxMax = values.indexOf(Math.max(...values));
  const barW = Math.max((innerW / hourly.length) * 0.55, 3);

  function onMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const xView = ((e.clientX - rect.left) / rect.width) * W;
    const ratio = (xView - PAD_X) / innerW;
    const idx = Math.max(0, Math.min(hourly.length - 1, Math.round(ratio * (hourly.length - 1))));
    setHover(idx);
  }

  const hoverPt = hover != null ? points[hover] : null;
  // Keep the tooltip label inside the viewport horizontally.
  const tipX = hoverPt ? Math.max(46, Math.min(W - 46, hoverPt.x)) : 0;

  const fmt = (v) => metric.format(v, units);

  const svg = (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="block w-full touch-none"
      role="img"
      aria-label={`24-hour ${metric.label} graph`}
      onPointerMove={mini ? undefined : onMove}
      onPointerLeave={mini ? undefined : () => setHover(null)}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {metric.type === 'bar' ? (
        points.map((p) => (
          <rect
            key={p.dt}
            x={p.x - barW / 2}
            y={p.y}
            width={barW}
            height={Math.max(baseY - p.y, 0)}
            rx={Math.min(barW / 2, 3)}
            fill="var(--accent)"
            opacity={hover == null || points[hover].dt === p.dt ? 0.85 : 0.4}
          />
        ))
      ) : (
        <>
          <path d={area} fill={`url(#${gradId})`} />
          <path
            d={line}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={mini ? 2 : 2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </>
      )}

      {/* High / low markers (line metrics only, not in mini mode). */}
      {!mini &&
        metric.type === 'line' &&
        [idxMin, idxMax].map((i) => (
          <g key={`mk-${i}`}>
            <circle cx={points[i].x} cy={points[i].y} r="3.5" fill="var(--accent)" />
            <text
              x={points[i].x}
              y={points[i].y - 12}
              textAnchor="middle"
              className="tnum"
              fill="var(--text-strong)"
              fontSize="15"
              fontWeight="700"
            >
              {fmt(points[i].v)}
            </text>
          </g>
        ))}

      {/* Hour labels along the bottom. */}
      {!mini &&
        points.map((p, i) =>
          i % labelStep === 0 || i === points.length - 1 ? (
            <text
              key={`hr-${p.dt}`}
              x={p.x}
              y={H - 8}
              textAnchor="middle"
              className="tnum"
              fill="var(--text-faint)"
              fontSize="12"
            >
              {i === 0 ? 'Now' : formatHourLabel(p.dt, tz, DISPLAY_LOCALE)}
            </text>
          ) : null
        )}

      {/* Hover guide + tooltip. */}
      {hoverPt && (
        <g pointerEvents="none">
          <line
            x1={hoverPt.x}
            y1={PAD_TOP - 6}
            x2={hoverPt.x}
            y2={baseY}
            stroke="var(--text-faint)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          {metric.type === 'line' && (
            <circle cx={hoverPt.x} cy={hoverPt.y} r="4.5" fill="var(--accent)" stroke="#fff" strokeWidth="1.5" />
          )}
          <g transform={`translate(${tipX}, 12)`}>
            <text textAnchor="middle" className="tnum" fill="var(--text-strong)" fontSize="15" fontWeight="700">
              {fmt(hoverPt.v)}
            </text>
            <text y="15" textAnchor="middle" className="tnum" fill="var(--text-faint)" fontSize="11">
              {hover === 0 ? 'Now' : formatHourLabel(hoverPt.dt, tz, DISPLAY_LOCALE)}
            </text>
          </g>
        </g>
      )}
    </svg>
  );

  if (mini) return svg;

  return (
    <div>
      {/* Metric toggle */}
      <div className="mb-2 flex justify-end">
        <div className="glass inline-flex items-center rounded-full p-0.5" role="group" aria-label="Chart metric">
          {Object.entries(METRICS).map(([key, m]) => {
            if (key === 'wind' && !windAvailable) return null;
            const active = key === metricKey;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setMetricKey(key)}
                aria-pressed={active}
                className={[
                  'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                  active ? 'text-[#0b1f3a]' : 'text-[color:var(--text-soft)] hover:text-[color:var(--text-strong)]',
                ].join(' ')}
                style={active ? { background: 'var(--accent)' } : undefined}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {svg}

      {/* Accessible data table — same numbers, for screen readers / keyboard. */}
      <table className="sr-only">
        <caption>{`Hourly ${metric.label.toLowerCase()} for the next 24 hours`}</caption>
        <thead>
          <tr>
            <th scope="col">Time</th>
            <th scope="col">{metric.label}</th>
          </tr>
        </thead>
        <tbody>
          {hourly.map((h, i) => (
            <tr key={h.dt}>
              <td>{i === 0 ? 'Now' : formatHourLabel(h.dt, tz, DISPLAY_LOCALE)}</td>
              <td>{fmt(metric.value(h))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
