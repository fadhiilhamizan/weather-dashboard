import { useEffect, useRef, useState } from 'react';
import { Search, MapPin, LocateFixed, Loader2, X, Clock } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce.js';
import { searchCities } from '../api/weatherApi.js';

/**
 * Smart city search (a "must-have" from the brief):
 *   - Debounced autocomplete that hits the backend's /geocode proxy.
 *   - A geolocation button that uses the browser's GPS.
 *   - Recent searches surfaced when the box is focused and empty.
 *
 * Keyboard: ArrowUp/Down to move through suggestions, Enter to choose, Esc to close.
 */
export default function SearchBar({
  onSelectPlace,
  onUseLocation,
  geoLoading = false,
  history = [],
  onSelectHistory,
  onRemoveHistory,
  onClearHistory,
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const debounced = useDebounce(query.trim(), 350);
  const rootRef = useRef(null);
  const reqId = useRef(0);

  // Fetch suggestions when the debounced query is long enough.
  useEffect(() => {
    if (debounced.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    const id = ++reqId.current;
    setLoading(true);
    searchCities(debounced)
      .then(({ data }) => {
        if (id !== reqId.current) return; // a newer request superseded this one
        setResults(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (id === reqId.current) setResults([]);
      })
      .finally(() => {
        if (id === reqId.current) setLoading(false);
      });
  }, [debounced]);

  // Close the dropdown when clicking outside.
  useEffect(() => {
    function onDocClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const showingHistory = query.trim().length < 2;
  const items = showingHistory ? history : results;

  function choosePlace(place) {
    onSelectPlace({
      lat: place.lat,
      lon: place.lon,
      name: place.name,
      country: place.country,
      state: place.state,
    });
    setQuery('');
    setResults([]);
    setOpen(false);
    setActive(-1);
  }

  function chooseHistory(entry) {
    onSelectHistory(entry);
    setQuery('');
    setOpen(false);
    setActive(-1);
  }

  function onKeyDown(e) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (active >= 0 && items[active]) {
        showingHistory ? chooseHistory(items[active]) : choosePlace(items[active]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActive(-1);
    }
  }

  const placeLabel = (p) =>
    [p.name, p.state, p.country].filter(Boolean).join(', ');

  return (
    <div ref={rootRef} className="relative w-full">
      <div className="glass glass-sheen flex items-center gap-2 rounded-full px-4 py-2.5">
        <Search className="h-5 w-5 shrink-0 text-[color:var(--text-faint)]" strokeWidth={2} aria-hidden="true" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search for a city…"
          aria-label="Search for a city"
          autoComplete="off"
          className="tnum w-full bg-transparent text-base text-[color:var(--text-strong)] placeholder:text-[color:var(--text-faint)] focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            aria-label="Clear search"
            className="rounded-full p-1 text-[color:var(--text-faint)] hover:text-[color:var(--text-strong)]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <span className="h-6 w-px bg-white/20" aria-hidden="true" />
        <button
          type="button"
          onClick={onUseLocation}
          disabled={geoLoading}
          aria-label="Use my location"
          title="Use my location"
          className="rounded-full p-1 text-[color:var(--text-soft)] transition-colors hover:text-[color:var(--text-strong)] disabled:opacity-60"
        >
          {geoLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <LocateFixed className="h-5 w-5" />
          )}
        </button>
      </div>

      {open && (items.length > 0 || loading) && (
        <div className="glass glass-strong absolute z-20 mt-2 w-full overflow-hidden rounded-2xl p-1.5">
          {showingHistory && history.length > 0 && (
            <div className="flex items-center justify-between px-3 pb-1 pt-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--text-faint)]">
                Recent
              </span>
              <button
                type="button"
                onClick={onClearHistory}
                className="text-xs text-[color:var(--text-faint)] hover:text-[color:var(--text-strong)]"
              >
                Clear
              </button>
            </div>
          )}

          {loading && !showingHistory && (
            <div className="flex items-center gap-2 px-3 py-3 text-sm text-[color:var(--text-soft)]">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching…
            </div>
          )}

          <ul role="listbox">
            {items.map((item, i) => {
              const isActive = i === active;
              if (showingHistory) {
                return (
                  <li key={item.id}>
                    <div
                      className={[
                        'group flex items-center gap-2 rounded-xl px-3 py-2 text-sm',
                        isActive ? 'bg-white/15' : 'hover:bg-white/10',
                      ].join(' ')}
                    >
                      <Clock className="h-4 w-4 shrink-0 text-[color:var(--text-faint)]" />
                      <button
                        type="button"
                        onClick={() => chooseHistory(item)}
                        onMouseEnter={() => setActive(i)}
                        className="flex-1 truncate text-left text-[color:var(--text-strong)]"
                      >
                        {placeLabel(item)}
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveHistory(item.id)}
                        aria-label={`Remove ${item.name}`}
                        className="rounded p-0.5 text-[color:var(--text-faint)] opacity-0 transition-opacity hover:text-[color:var(--text-strong)] group-hover:opacity-100"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                );
              }
              return (
                <li key={`${item.lat},${item.lon}-${i}`}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => choosePlace(item)}
                    onMouseEnter={() => setActive(i)}
                    className={[
                      'flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-[color:var(--text-strong)]',
                      isActive ? 'bg-white/15' : 'hover:bg-white/10',
                    ].join(' ')}
                  >
                    <MapPin className="h-4 w-4 shrink-0 text-[color:var(--text-faint)]" />
                    <span className="truncate">{placeLabel(item)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
