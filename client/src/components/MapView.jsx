import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * Interactive weather map. OpenStreetMap base tiles with a live precipitation
 * radar overlay from RainViewer (both keyless). A marker sits on the current
 * location; clicking the map recenters and asks the parent to load weather for
 * that point.
 *
 * Lazy-loaded by App (React.lazy) so Leaflet is code-split out of the main
 * bundle and only fetched when the Map view is opened.
 */
export default function MapView({ lat, lon, onPickLocation }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [radarError, setRadarError] = useState(false);

  // Create the map once.
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return undefined;

    const map = L.map(containerRef.current, {
      center: [lat ?? 51.5, lon ?? -0.12],
      zoom: 6,
      scrollWheelZoom: true,
    });
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

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

    // RainViewer precipitation radar overlay (latest frame).
    fetch('https://api.rainviewer.com/public/weather-maps.json')
      .then((r) => r.json())
      .then((meta) => {
        const frames = meta?.radar?.past || [];
        const last = frames[frames.length - 1];
        if (!meta?.host || !last) {
          setRadarError(true);
          return;
        }
        L.tileLayer(`${meta.host}${last.path}/256/{z}/{x}/{y}/2/1_1.png`, {
          opacity: 0.6,
          attribution: '© RainViewer',
        }).addTo(map);
      })
      .catch(() => setRadarError(true));

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recenter + move the marker when the active location changes.
  useEffect(() => {
    if (!mapRef.current || lat == null || lon == null) return;
    mapRef.current.setView([lat, lon], Math.max(mapRef.current.getZoom(), 7));
    markerRef.current?.setLatLng([lat, lon]);
  }, [lat, lon]);

  return (
    <div className="glass glass-sheen overflow-hidden rounded-3xl p-1.5">
      <div
        ref={containerRef}
        className="h-[60vh] min-h-[360px] w-full overflow-hidden rounded-2xl"
        role="application"
        aria-label="Weather radar map"
      />
      <p className="px-3 py-2 text-xs text-[color:var(--text-faint)]">
        {radarError
          ? 'Radar overlay unavailable — showing base map only.'
          : 'Precipitation radar (RainViewer) · tap the map to load weather there.'}
      </p>
    </div>
  );
}
