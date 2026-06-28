/**
 * URL <-> app state, using the History API directly (no router dependency).
 *
 * The active location and view are reflected in the query string so a view can
 * be bookmarked and shared, and the browser back/forward buttons work:
 *   ?q=Tokyo            — a city search
 *   ?lat=..&lon=..      — explicit coordinates (GPS / map click)
 *   ?view=compare|map   — the active view (omitted for the default "detailed")
 */

export const VIEWS = ['detailed', 'compare', 'map'];

/** Parse the current location.search into { query, view }. */
export function readState(search = window.location.search) {
  const params = new URLSearchParams(search);

  const view = VIEWS.includes(params.get('view')) ? params.get('view') : 'detailed';

  let query = null;
  const q = params.get('q');
  const lat = Number.parseFloat(params.get('lat'));
  const lon = Number.parseFloat(params.get('lon'));
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    query = { kind: 'coords', lat, lon };
  } else if (q && q.trim()) {
    query = { kind: 'city', q: q.trim() };
  }

  return { query, view };
}

/** Build the query string for a { query, view } state. */
export function buildSearch({ query, view } = {}) {
  const params = new URLSearchParams();
  if (query?.kind === 'city' && query.q) {
    params.set('q', query.q);
  } else if (query?.kind === 'coords') {
    params.set('lat', query.lat.toFixed(4));
    params.set('lon', query.lon.toFixed(4));
  }
  if (view && view !== 'detailed') params.set('view', view);
  const s = params.toString();
  return s ? `?${s}` : window.location.pathname;
}

/** Push or replace the URL to reflect { query, view } without reloading. */
export function writeState(state, { replace = false } = {}) {
  const url = buildSearch(state);
  if (replace) window.history.replaceState(state, '', url);
  else window.history.pushState(state, '', url);
}
