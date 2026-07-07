import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, MousePointerClick, CloudRain } from 'lucide-react';

/**
 * Interactive weather map. A choice of keyless base styles (street, satellite,
 * terrain, dark) with an optional live precipitation radar overlay from
 * RainViewer. A marker sits on the current location; clicking anywhere recenters
 * and asks the parent to load weather for that point.
 *
 * Lazy-loaded by App (React.lazy) so Leaflet is code-split out of the main
 * bundle and only fetched when the Map view is opened.
 */
const BASE_STYLES = [
  {
    key: 'street',
    label: 'Street',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
  },
  {
    key: 'satellite',
    label: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri, Maxar, Earthstar Geographics',
    maxZoom: 19,
  },
  {
    key: 'terrain',
    label: 'Terrain',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '© OpenTopoMap (CC-BY-SA)',
    maxZoom: 17,
  },
  {
    key: 'dark',
    label: 'Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap contributors © CARTO',
    maxZoom: 20,
    subdomains: 'abcd',
  },
];

export default function MapView({ lat, lon, onPickLocation }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const baseLayerRef = useRef(null);
  const radarLayerRef = useRef(null);
  const radarOnRef = useRef(true);

  const [style, setStyle] = useState('dark');
  const [radarOn, setRadarOn] = useState(true);
  const [radarError, setRadarError] = useState(false);
  const [radarReady, setRadarReady] = useState(false);

  // Keep a ref in sync so the async radar fetch reads the latest toggle state.
  radarOnRef.current = radarOn;

  // Create the map once. The base layer itself is added by the style effect
  // below (which also runs on mount), so it isn't duplicated here.
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return undefined;

    const map = L.map(containerRef.current, {
      center: [lat ?? 51.5, lon ?? -0.12],
      zoom: 6,
      scrollWheelZoom: true,
    });
    mapRef.current = map;

    // Marker for the active location.
    markerRef.current = L.circleMarker([lat ?? 51.5, lon ?? -0.12], {
      radius: 8,
      color: '#ffffff',
      weight: 2,
      fillColor: '#2f80ed',
      fillOpacity: 0.9,
    }).addTo(map);

    // Click to choose a new point.
    map.on('click', (e) => {
      onPickLocation?.(e.latlng.lat, e.latlng.lng);
    });

    // RainViewer precipitation radar overlay (latest frame). Kept above the base
    // layer via zIndex so switching base styles never hides it.
    fetch('https://api.rainviewer.com/public/weather-maps.json')
      .then((r) => r.json())
      .then((meta) => {
        const frames = meta?.radar?.past || [];
        const last = frames[frames.length - 1];
        if (!meta?.host || !last) {
          setRadarError(true);
          return;
        }
        const layer = L.tileLayer(`${meta.host}${last.path}/256/{z}/{x}/{y}/2/1_1.png`, {
          opacity: 0.6,
          zIndex: 5,
          attribution: '© RainViewer',
        });
        radarLayerRef.current = layer;
        setRadarReady(true);
        if (radarOnRef.current) layer.addTo(map);
      })
      .catch(() => setRadarError(true));

    return () => {
      map.remove();
      mapRef.current = null;
      baseLayerRef.current = null;
      radarLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swap the base tile layer whenever the chosen style changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const s = BASE_STYLES.find((x) => x.key === style) || BASE_STYLES[0];
    if (baseLayerRef.current) map.removeLayer(baseLayerRef.current);
    baseLayerRef.current = L.tileLayer(s.url, {
      attribution: s.attribution,
      maxZoom: s.maxZoom,
      subdomains: s.subdomains ?? 'abc',
      zIndex: 1,
    }).addTo(map);
  }, [style]);

  // Show / hide the radar overlay on toggle.
  useEffect(() => {
    const map = mapRef.current;
    const layer = radarLayerRef.current;
    if (!map || !layer) return;
    if (radarOn && !map.hasLayer(layer)) layer.addTo(map);
    if (!radarOn && map.hasLayer(layer)) map.removeLayer(layer);
  }, [radarOn, radarReady]);

  // Recenter + move the marker when the active location changes.
  useEffect(() => {
    if (!mapRef.current || lat == null || lon == null) return;
    mapRef.current.setView([lat, lon], Math.max(mapRef.current.getZoom(), 7));
    markerRef.current?.setLatLng([lat, lon]);
  }, [lat, lon]);

  return (
    <div className="glass glass-sheen overflow-hidden rounded-3xl p-1.5">
      <div className="relative">
        <div
          ref={containerRef}
          className="h-[60vh] min-h-[360px] w-full overflow-hidden rounded-2xl"
          role="application"
          aria-label="Weather map"
        />

        {/* Prominent, unmissable hint that the map is interactive. Non-blocking
            (pointer-events-none) so taps under it still register on the map. */}
        <div className="pointer-events-none absolute inset-x-0 top-3 z-[500] flex justify-center px-3">
          <div
            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-lg"
            style={{
              background: 'var(--accent)',
              color: '#0b1f3a',
            }}
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0b1f3a] opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#0b1f3a]" />
            </span>
            <MousePointerClick className="h-4 w-4" strokeWidth={2.5} />
            <span>Tap anywhere on the map to load weather there</span>
          </div>
        </div>

        {/* View controls: base style switcher + radar toggle. */}
        <div className="absolute right-3 top-14 z-[500] flex flex-col items-end gap-2">
          <div className="glass flex flex-wrap justify-end gap-1 rounded-2xl p-1 shadow-lg">
            <span className="flex items-center gap-1 px-1.5 text-[color:var(--text-faint)]">
              <Layers className="h-3.5 w-3.5" />
            </span>
            {BASE_STYLES.map((s) => {
              const active = s.key === style;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setStyle(s.key)}
                  aria-pressed={active}
                  className="rounded-xl px-2.5 py-1 text-xs font-semibold transition-all duration-200"
                  style={
                    active
                      ? { background: 'var(--accent)', color: '#0b1f3a' }
                      : { color: 'var(--text-soft)' }
                  }
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          {!radarError && (
            <button
              type="button"
              onClick={() => setRadarOn((v) => !v)}
              aria-pressed={radarOn}
              className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-lg transition-all duration-200"
              style={{
                color: radarOn ? '#0b1f3a' : 'var(--text-soft)',
                background: radarOn ? 'var(--accent)' : undefined,
              }}
            >
              <CloudRain className="h-3.5 w-3.5" strokeWidth={2.5} />
              Radar {radarOn ? 'on' : 'off'}
            </button>
          )}
        </div>
      </div>

      <p className="flex items-center gap-1.5 px-3 py-2 text-xs text-[color:var(--text-soft)]">
        <MousePointerClick className="h-3.5 w-3.5 shrink-0 text-[color:var(--accent)]" />
        {radarError
          ? 'Radar overlay unavailable — tap the map to load weather for any point.'
          : 'Tap the map to load weather for any point · precipitation radar by RainViewer.'}
      </p>
    </div>
  );
}
