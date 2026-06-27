import { useEffect, useRef } from 'react';
import { CloudSun } from 'lucide-react';

import SearchBar from './components/SearchBar.jsx';
import UnitToggle from './components/UnitToggle.jsx';
import CurrentWeather from './components/CurrentWeather.jsx';
import Highlights from './components/Highlights.jsx';
import HourlyForecast from './components/HourlyForecast.jsx';
import DailyForecast from './components/DailyForecast.jsx';
import Insights from './components/Insights.jsx';
import AlertBanner from './components/AlertBanner.jsx';
import DemoBanner from './components/DemoBanner.jsx';
import ErrorState from './components/ErrorState.jsx';
import LoadingState from './components/skeletons/LoadingState.jsx';
import Footer from './components/Footer.jsx';

import { useWeather } from './hooks/useWeather.js';
import { useSearchHistory } from './hooks/useSearchHistory.js';
import { useGeolocation } from './hooks/useGeolocation.js';
import { usePersistentState } from './hooks/usePersistentState.js';
import { applySky } from './utils/sky.js';

// Sensible default so the dashboard has something to show on first load without
// nagging for location permission. The locate button opts into GPS on demand.
const DEFAULT_CITY = 'Surabaya';

export default function App() {
  const weather = useWeather();
  const history = useSearchHistory();
  const geo = useGeolocation();
  const [units, setUnits] = usePersistentState('atmosfer:units', 'metric');

  // Remembers what's on screen so flipping units (or retrying) re-fetches the
  // same place. Kept in a ref because it shouldn't itself trigger a render.
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

  // Pick a place from search results or recent history (both carry coordinates).
  function selectPlace(place) {
    const query = { kind: 'coords', lat: place.lat, lon: place.lon };
    lastQuery.current = query;
    runQuery(query, units);
  }

  // GPS button.
  async function useMyLocation() {
    try {
      const { lat, lon } = await geo.locate();
      const query = { kind: 'coords', lat, lon };
      lastQuery.current = query;
      runQuery(query, units);
    } catch {
      /* geo.error holds a friendly message; the button just stops spinning */
    }
  }

  function retry() {
    if (lastQuery.current) runQuery(lastQuery.current, units);
  }

  // First load: default city, no permission prompt.
  useEffect(() => {
    const query = { kind: 'city', q: DEFAULT_CITY };
    lastQuery.current = query;
    runQuery(query, units);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch the active place whenever units change (skip the initial mount).
  useEffect(() => {
    if (!didInit.current) {
      didInit.current = true;
      return;
    }
    if (lastQuery.current) runQuery(lastQuery.current, units);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [units]);

  // Living sky: re-tint the whole UI to match the current condition + day/night.
  useEffect(() => {
    const cur = weather.data?.current;
    if (cur) applySky(cur.condition.id, cur.isDay);
  }, [weather.data]);

  const { status, data, error, demo } = weather;

  return (
    <div className="relative min-h-full">
      {/* Soft atmospheric glow layered over the sky gradient. */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -top-1/4 left-1/4 h-[55vh] w-[55vh] rounded-full opacity-25 blur-3xl"
          style={{ background: 'var(--accent)' }}
        />
        <div className="absolute -bottom-1/4 right-1/4 h-[50vh] w-[50vh] rounded-full bg-white opacity-10 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:py-8">
        {/* Header */}
        <header className="mb-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <CloudSun className="h-7 w-7 text-white" strokeWidth={1.75} />
            <span className="font-display text-xl font-bold tracking-tight text-white">Atmosfer</span>
          </div>
          <UnitToggle units={units} onChange={setUnits} />
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

        {/* Body */}
        <main className="space-y-6">
          {demo && status === 'success' && <DemoBanner />}

          {status === 'loading' && <LoadingState />}

          {status === 'error' && <ErrorState error={error} onRetry={retry} />}

          {status === 'success' && data && (
            <>
              <AlertBanner alerts={data.alerts} />
              <CurrentWeather data={data} />
              <Highlights data={data} />
              <HourlyForecast data={data} />
              <DailyForecast data={data} />
              <Insights data={data} />
            </>
          )}
        </main>

        <Footer demo={demo} />
      </div>
    </div>
  );
}
