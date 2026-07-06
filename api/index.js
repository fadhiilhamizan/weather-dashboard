// Vercel serverless entry point.
//
// This wraps the existing Express app (server/src/app.js) so the whole backend
// runs as a single serverless function on Vercel — no separate host needed.
// vercel.json rewrites every /api/* request to this function; Vercel preserves
// the original URL on req.url, so Express does its own internal routing at any
// depth (e.g. /api/weather/city) and all existing endpoints work unchanged.
import { createApp } from '../server/src/app.js';

const app = createApp();

// Vercel's Node runtime invokes the default export as (req, res). An Express
// app is exactly such a handler, so we can export it directly.
export default app;
