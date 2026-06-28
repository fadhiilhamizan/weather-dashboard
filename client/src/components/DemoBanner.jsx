import { useState } from 'react';
import { FlaskConical, X } from 'lucide-react';

/**
 * Friendly heads-up that the backend is serving realistic sample data because
 * no OpenWeather key is configured. Keeps the demo honest without getting in
 * the way — it can be dismissed.
 */
export default function DemoBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="glass flex items-center gap-3 rounded-2xl px-4 py-3 text-sm">
      <FlaskConical className="h-4 w-4 shrink-0" style={{ color: 'var(--accent)' }} />
      <p className="flex-1 text-[color:var(--text-soft)]">
        <span className="font-semibold text-[color:var(--text-strong)]">Demo mode.</span> Showing realistic sample data —
        add an OpenWeather API key on the server for live weather.
      </p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="rounded-full p-1 text-[color:var(--text-faint)] hover:text-[color:var(--text-strong)]"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
