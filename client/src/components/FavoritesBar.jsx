import { Star, X } from 'lucide-react';

/**
 * Horizontal row of saved locations. Each chip loads that place's weather on
 * click; the little × removes it. Hidden entirely when nothing is saved so it
 * never adds empty chrome. Wraps on small screens.
 */
export default function FavoritesBar({ favorites = [], activeId, onSelect, onRemove }) {
  if (!favorites.length) return null;

  return (
    <div className="mb-3" aria-label="Saved locations">
      <div className="mb-1.5 flex items-center gap-1.5 px-1 text-[color:var(--text-faint)]">
        <Star className="h-3.5 w-3.5" />
        <span className="text-xs font-semibold uppercase tracking-wide">Saved</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {favorites.map((f) => {
          const active = f.id === activeId;
          return (
            <div
              key={f.id}
              className={[
                'glass group flex items-center gap-1.5 rounded-full py-1 pl-3 pr-1.5 text-sm transition-all duration-200 hover:scale-105',
                active ? 'ring-1 ring-[color:var(--accent)]' : '',
              ].join(' ')}
            >
              <button
                type="button"
                onClick={() => onSelect(f)}
                className="max-w-[10rem] truncate font-medium text-[color:var(--text-strong)]"
                title={[f.name, f.state, f.country].filter(Boolean).join(', ')}
              >
                {f.name}
              </button>
              <button
                type="button"
                onClick={() => onRemove(f.id)}
                aria-label={`Remove ${f.name} from saved`}
                className="rounded-full p-0.5 text-[color:var(--text-faint)] transition-colors hover:bg-white/15 hover:text-[color:var(--text-strong)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
