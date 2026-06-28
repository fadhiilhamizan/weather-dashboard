import { CloudOff, SearchX, WifiOff, RotateCw } from 'lucide-react';

/**
 * The friendly error panel the brief asks for. Picks an icon and a short,
 * human explanation based on the error code, and offers a retry. Never a blank
 * white screen.
 */
const PRESETS = {
  CITY_NOT_FOUND: {
    icon: SearchX,
    title: "We couldn't find that place",
    hint: 'Check the spelling or try a nearby larger city.',
  },
  NETWORK: {
    icon: WifiOff,
    title: 'Connection problem',
    hint: 'You appear to be offline. Check your connection and try again.',
  },
  default: {
    icon: CloudOff,
    title: 'Something went wrong',
    hint: 'We hit a snag fetching the forecast. Please try again in a moment.',
  },
};

export default function ErrorState({ error, onRetry }) {
  const preset = PRESETS[error?.code] || PRESETS.default;
  const Icon = preset.icon;

  return (
    <div className="glass glass-sheen animate-fade-up flex flex-col items-center gap-4 rounded-3xl px-6 py-14 text-center">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background: 'var(--glass-bg-strong)' }}
      >
        <Icon className="h-8 w-8 text-[color:var(--text-strong)]" strokeWidth={1.5} />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-[color:var(--text-strong)]">{preset.title}</h2>
        <p className="mt-1 max-w-sm text-sm text-[color:var(--text-soft)]">
          {error?.message || preset.hint}
        </p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-[#0b1f3a] transition-transform hover:scale-[1.02]"
          style={{ background: 'var(--accent)' }}
        >
          <RotateCw className="h-4 w-4" />
          Try again
        </button>
      )}
    </div>
  );
}
