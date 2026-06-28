import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { CloudSun, Loader2 } from 'lucide-react';

import SearchBar from './components/SearchBar.jsx';
import UnitToggle from './components/UnitToggle.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';
import ViewTabs from './components/ViewTabs.jsx';
import FavoritesBar from './components/FavoritesBar.jsx';
import WeatherBackground from './components/WeatherBackground.jsx';
import WeatherScene from './components/WeatherScene.jsx';
import CurrentWeather from './components/CurrentWeather.jsx';
import Highlights from './components/Highlights.jsx';
import HourlyForecast from './components/HourlyForecast.jsx';
import DailyForecast from './components/DailyForecast.jsx';
import Insights from './components/Insights.jsx';
import ComparisonView from './components/ComparisonView.jsx';
import AlertBanner from './components/AlertBanner.jsx';
import DemoBanner from './components/DemoBanner.jsx';
import ErrorState from './components/ErrorState.jsx';
import LoadingState from './components/skeletons/LoadingState.jsx';
import Footer from './components/Footer.jsx';

import { useWeather } from './hooks/useWeather.js';
import { useSearchHistory } from './hooks/useSearchHistory.js';
import { useFavorites, placeId } from './hooks/useFavorites.js';
import { useGeolocation } from './hooks/useGeolocation.js';
import { usePersistentState } from './hooks/usePersistentState.js';
import { applySky, clearSky } from './utils/sky.js';
import { readState, writeState } from './utils/url.js';

// The radar map pulls in Leaflet, so it's code-split and only loaded on demand.
const MapView = lazy(() => import('./components/MapView.jsx'));

// First-load city when the URL carries no location. The locate button opts into
// GPS; deep links (?q= / ?lat=&lon=) override this default.
const DEFAULT_QUERY = { kind: 'city', q: 'London' };

export default function App() {
  const weather = useWeather();
  const history = useSearchHistory();
  const favorites = useFavorites();
  const geo = useGeolocation();
  const [units, setUnits] = usePersistentState('atmosfer:units', 'metric');
  // Two themes: 'light' (living sky) and 'dark'. Older saved values like 'sky'
  // are treated as light below.
  const [theme, setTheme] = usePersistentState('atmosfer:theme', 'light');
  const [view, setView] = useState(() => readState().view);
  const darkMode = theme === 'dark';

  // Remembers what's on screen so flipping units (or retrying) re-fetches the
  // same place, and so view/URL changes keep the same location.
  const lastQuery = useRef(null);
  const didInit = useRef(false);

  async function runQuery(query, unitsArg) {
    try {
      const data =
        query.kind === 'coords'
          ? await weather.loadByCoords({ lat: query.lat, lon: query.lon, units: unitsArg })
          : await weather.loadByCity({ query: query.q, units: unitsArg });
      if (data?.location?.name) history.add(data.location);
    } catch {
      /* status machine surfaces the error; nothing else to do here */
    }
  }

  // Load a place and reflect it in the URL (so the view is shareable).
  function go(query, { push = true, nextView = view } = {}) {
    lastQuery.current = query;
    writeState({ query, view: nextView }, { replace: !push });
    runQuery(query, units);
  }

  // Pick a place from search results, history, or favourites (all carry coords).
  function selectPlace(place) {
    go({ kind: 'coords', lat: place.lat, lon: place.lon }, { nextView: 'detailed' });
    setView('detailed');
  }

  // GPS button.
  async function useMyLocation() {
    try {
      const { lat, lon } = await geo.locate();
      go({ kind: 'coords', lat, lon }, { nextView: 'detailed' });
      setView('detailed');
    } catch {
      /* geo.error holds a friendly message; the button just stops spinning */
    }
  }

  function changeView(next) {
    setView(next);
    writeState({ query: lastQuery.current, view: next });
  }

  // Map click → load weather for that point without leaving the map.
  function pickFromMap(lat, lon) {
    go({ kind: 'coords', lat, lon }, { nextView: 'map' });
  }

  function retry() {
    if (lastQuery.current) runQuery(lastQuery.current, units);
  }

  // First load: honour the URL, else the default city.
  useEffect(() => {
    const { query } = readState();
    const initial = query || DEFAULT_QUERY;
    lastQuery.current = initial;
    writeState({ query: initial, view }, { replace: true });
    runQuery(initial, units);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Browser back/forward: re-read the URL and re-load if the place changed.
  useEffect(() => {
    function onPop() {
      const st = readState();
      setView(st.view);
      const q = st.query || DEFAULT_QUERY;
      if (JSON.stringify(q) !== JSON.stringify(lastQuery.current)) {
        lastQuery.current = q;
        runQuery(q, units);
      }
    }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [units]);

  // Re-fetch the active place whenever units change (skip the initial mount).
  useEffect(() => {
    if (!didInit.current) {
      didInit.current = true;
      return;
    }
    if (lastQuery.current) runQuery(lastQuery.current, units);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [units]);

  // Reflect the chosen theme on <html> so the CSS theme block applies.
  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light';
  }, [darkMode]);

  // Living sky (light theme): re-tint the whole UI to match the current
  // condition + day/night. Dark mode clears the inline vars so the neutral
  // stylesheet palette wins.
  useEffect(() => {
    if (darkMode) {
      clearSky();
      return;
    }
    const cur = weather.data?.current;
    if (cur) applySky(cur.condition.id, cur.isDay);
  }, [weather.data, darkMode]);

  const { status, data, error, demo } = weather;

  // Favourites: identify the place on screen so the hero star and saved-bar can
  // show the active state.
  const activeId = data?.location ? placeId(data.location) : null;
  const isFavorite = activeId ? favorites.has(activeId) : false;
  const toggleFavorite = () => {
    if (data?.location?.name) favorites.toggle(data.location);
  };

  const statusMessage =
    status === 'loading'
      ? 'Loading weather…'
      : status === 'error'
        ? `Error: ${error?.message || 'something went wrong'}`
        : status === 'success' && data
          ? `Showing weather for ${data.location?.name || 'your location'}.`
          : '';

  return (
    <div className="relative min-h-full">
      {/* Background stack (behind everything): weather scene, soft glow, and
          condition-driven animated particles, layered over the sky gradient. */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        {data?.current && !darkMode && (
          <WeatherScene conditionId={data.current.condition.id} isDay={data.current.isDay} />
        )}
        <div
          className="absolute -top-1/4 left-1/4 h-[55vh] w-[55vh] rounded-full opacity-25 blur-3xl"
          style={{ background: 'var(--accent)' }}
        />
        <div className="absolute -bottom-1/4 right-1/4 h-[50vh] w-[50vh] rounded-full bg-white opacity-10 blur-3xl" />
        {data?.current && (
          <WeatherBackground
            conditionId={data.current.condition.id}
            isDay={data.current.isDay}
            theme={darkMode ? 'dark' : 'light'}
          />
        )}
      </div>

      {/* Screen-reader status announcements. */}
      <div className="sr-only" role="status" aria-live="polite">
        {statusMessage}
      </div>

      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:py-8">
        {/* Header */}
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl shadow-lg shadow-black/10" style={{ background: 'var(--accent)' }}>
              <CloudSun className="h-5 w-5 text-[#0b1f3a]" strokeWidth={2.25} />
            </span>
            <span className="font-display text-xl font-extrabold tracking-tight text-[color:var(--text-strong)]">
              Atmosfer
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle theme={darkMode ? 'dark' : 'light'} onChange={setTheme} />
            <UnitToggle units={units} onChange={setUnits} />
          </div>
        </header>

        {/* Search */}
        <div className="mb-3">
          <SearchBar
            onSelectPlace={selectPlace}
            onUseLocation={useMyLocation}
            geoLoading={geo.loading}
            history={history.history}
            onSelectHistory={selectPlace}
            onRemoveHistory={history.remove}
            onClearHistory={history.clear}
          />
        </div>
        {geo.error && (
          <p className="mb-3 px-1 text-xs text-[color:var(--accent)]">{geo.error}</p>
        )}

        {/* Saved locations */}
        <FavoritesBar
          favorites={favorites.favorites}
          activeId={activeId}
          onSelect={selectPlace}
          onRemove={favorites.remove}
        />

        {/* View switcher */}
        <div className="mb-5">
          <ViewTabs view={view} onChange={changeView} />
        </div>

        {/* Body */}
        <main className="space-y-6">
          {view === 'compare' && (
            <ComparisonView favorites={favorites.favorites} units={units} onSelect={selectPlace} />
          )}

          {view === 'map' && (
            <Suspense
              fallback={
                <div className="flex items-center justify-center gap-2 py-16 text-[color:var(--text-soft)]">
                  <Loader2 className="h-5 w-5 animate-spin" /> Loading map…
                </div>
              }
            >
              <MapView lat={data?.location?.lat} lon={data?.location?.lon} onPickLocation={pickFromMap} />
            </Suspense>
          )}

          {view === 'detailed' && (
            <>
              {demo && status === 'success' && <DemoBanner />}

              {status === 'loading' && <LoadingState />}

              {status === 'error' && <ErrorState error={error} onRetry={retry} />}

              {status === 'success' && data && (
                <>
                  <AlertBanner alerts={data.alerts} />
                  {/* Staggered entrance: each card eases up just after the previous.
                      The 24-hour forecast sits above the details grid. */}
                  {[
                    <CurrentWeather
                      key="current"
                      data={data}
                      isFavorite={isFavorite}
                      onToggleFavorite={toggleFavorite}
                    />,
                    <HourlyForecast key="hourly" data={data} />,
                    <Highlights key="highlights" data={data} />,
                    <DailyForecast key="daily" data={data} />,
                    <Insights key="insights" data={data} />,
                  ].map((card, i) => (
                    <div
                      key={card.key}
                      className="animate-fade-up"
                      style={{ animationDelay: `${i * 90}ms` }}
                    >
                      {card}
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </main>

        <Footer demo={demo} />
      </div>
    </div>
  );
}
