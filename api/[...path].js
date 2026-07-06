// Vercel serverless entry point.
//
// This wraps the existing Express app (server/src/app.js) so the whole backend
// runs as a single serverless function on Vercel — no separate host needed.
// Vercel routes every /api/* request here; Express does its own internal
// routing on the original URL, so all existing endpoints work unchanged.
import { createApp } from '../server/src/app.js';

const app = createApp();

// Vercel's Node runtime invokes the default export as (req, res). An Express
// app is exactly such a handler, so we can export it directly.
export default app;
