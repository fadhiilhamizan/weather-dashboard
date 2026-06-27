import { useState } from 'react';
import { AlertTriangle, ChevronDown } from 'lucide-react';

/**
 * Surfaces any severe-weather alerts the provider returns. Collapsed to the
 * event name by default; tap to read the full advisory. Hidden entirely when
 * there are no alerts.
 */
export default function AlertBanner({ alerts = [] }) {
  const [open, setOpen] = useState(false);
  if (!alerts.length) return null;

  const primary = alerts[0];

  return (
    <div
      className="glass animate-fade-up rounded-2xl p-4"
      style={{ borderColor: 'rgba(251, 191, 36, 0.5)', background: 'rgba(251, 191, 36, 0.14)' }}
      role="alert"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 text-left"
        aria-expanded={open}
      >
        <AlertTriangle className="h-5 w-5 shrink-0" style={{ color: 'var(--accent)' }} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{primary.event}</p>
          {primary.sender && (
            <p className="truncate text-xs text-[color:var(--text-soft)]">{primary.sender}</p>
          )}
        </div>
        {alerts.length > 1 && (
          <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold text-white">
            +{alerts.length - 1}
          </span>
        )}
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[color:var(--text-soft)] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="mt-3 space-y-3 border-t border-white/15 pt-3">
          {alerts.map((a, i) => (
            <div key={`${a.event}-${i}`}>
              <p className="text-sm font-semibold text-white">{a.event}</p>
              <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-[color:var(--text-soft)]">
                {a.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
