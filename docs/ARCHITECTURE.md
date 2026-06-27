# Architecture

This document explains *why* Atmosfer is structured the way it is. The README
covers how to run it; this one covers the engineering decisions a reviewer is
likely to ask about.

## The one rule: the browser never talks to the weather provider

The whole project is organised around a single constraint from the brief — the
upstream API key must never reach the client. Everything else follows from that.

```
Browser (React)  ──HTTP──▶  Express proxy  ──HTTP──▶  OpenWeather One Call 3.0
     ▲                          │  │                      Geocoding + Air Pollution
     │                          │  └── in-memory TTL cache
     └──── normalised JSON ─────┘      (15 min weather / 24 h geocode)
```

The client only ever knows about *our* API (`/api/...`). It has no idea which
provider sits behind it, what shape that provider's payload has, or whether the
data came from the network, the cache, or the demo generator. That ignorance is
the point: it is what makes the key safe and the provider swappable.

## Request lifecycle (city search)

1. **Client** debounces keystrokes (400 ms) and calls `GET /api/geocode?q=...`
   for autocomplete suggestions.
2. User picks a result; client calls `GET /api/weather?lat&lon&units`.
3. **Rate limiter** (per-IP fixed window) checks the caller is under budget.
4. **Controller** validates `units` and the coordinates, then builds a cache key
   like `weather:-7.250:112.769:metric` (coords rounded to 3 decimals so
   near-identical GPS fixes share a cache entry).
5. **Cache** is consulted via `cache.wrap(key, ttl, producer)`. On a hit the
   producer never runs and the response carries `X-Cache: HIT`.
6. On a miss the **weather service** calls the provider (One Call for
   current/hourly/daily/UV/alerts, plus a non-fatal Air Pollution call for AQI),
   the **transform layer** normalises it, the result is cached, and the response
   carries `X-Cache: MISS`.
7. **Client** renders. It reads `X-Demo-Mode` and `X-Cache` purely to show small
   badges; the actual data shape is identical in every case.

## Layers on the server

| Layer | Folder | Responsibility |
|-------|--------|----------------|
| Routes | `routes/` | URL → controller wiring, nothing else |
| Controllers | `controllers/` | Validate input, choose cache key, set headers |
| Services | `services/` | Talk to the provider, the cache, or the mock generator |
| Transform | `utils/transform.js` | Provider payload → our clean domain shape |
| Middleware | `middleware/` | Rate limiting, 404 + error normalisation |
| Config | `config.js` | Read env once into a typed object; derive `demoMode` |

The dependency direction only ever points inward (routes → controllers →
services → utils). Nothing in `utils` imports from `controllers`, which keeps the
pure, testable code free of HTTP concerns.

## The transform layer (anti-corruption layer)

`utils/transform.js` is deliberately the only place that knows what OpenWeather's
JSON looks like. It maps the raw payload to a stable internal shape:

```
location { name, country, state, lat, lon, timezone, timezoneOffset }
current  { temp, feelsLike, humidity, pressure, uvi, windSpeed, windDeg,
           dewPoint, sunrise, sunset, visibility, condition{…}, isDay }
hourly[] { dt, temp, pop, condition, isDay }            // 24 entries
daily[]  { dt, tempMin, tempMax, pop, uvi, sunrise, sunset, summary, condition }
alerts[] { event, sender, start, end, description, tags }
airQuality { aqi, label, components } | null
```

If we ever switched to WeatherAPI or Open-Meteo, **only this file and the service
call would change** — the controllers, the cache, every React component, and all
the formatters stay exactly as they are. That is the headline portfolio talking
point: a clean seam between "their data" and "our data".

## Caching

A small `TtlCache` class (`services/cache.service.js`) backs everything:

- `get` / `set` with per-entry expiry, plus a `wrap(key, ttl, fn)` helper that
  turns the check-or-fetch dance into one call.
- A background sweeper (`unref`'d so it never holds the process open) evicts
  expired keys, and a `maxEntries` bound stops unbounded growth.
- Weather data uses a 15-minute TTL (per the brief); geocoding uses 24 hours
  because a city's coordinates do not move.

It exposes a `stats()` method that `/api/health` surfaces, and its interface
(`get`/`set`/`wrap`) is intentionally Redis-shaped: swapping the Map for an
`ioredis` client later would not touch any caller.

## Demo mode (the zero-setup improvisation)

If `OPENWEATHER_API_KEY` is blank, `config.js` flips `demoMode` on and the
weather service routes to `services/mock.service.js` instead of the network. The
mock generator produces One-Call-shaped data using a seeded pseudo-random walk
plus a sinusoidal day/night temperature curve, then sends it **through the same
transform layer**. The consequence: the entire app — search, autocomplete,
current conditions, 24-hour and 7-day forecasts, AQI, alerts — runs end to end
with no key, no account, and no signup. Add a real key and the exact same code
path serves live data.

## Frontend state

State is deliberately local — no Redux, no global store, because the app has one
screen and one async resource.

- `useWeather` is a small state machine (`idle → loading → success | error`)
  that owns the current payload, the error, and the demo flag.
- `useSearchHistory` persists the last five places to `localStorage`
  (deduped by coordinates) so they survive a reload.
- `usePersistentState` does the same for the °C/°F unit choice.
- A `lastQuery` ref remembers whether the active view came from a city or from
  coordinates, so toggling units re-fetches the *right* thing.

## Design system in one paragraph

The "living sky" effect (`utils/sky.js`) maps the current weather category and
day/night state to a set of CSS custom properties (`--sky-from/via/to`,
`--accent`, glass tints). Changing those variables animates the whole background
and the frosted-glass cards in one transition, so the UI literally looks like the
weather at the searched location. All of it degrades gracefully under
`prefers-reduced-motion`.
