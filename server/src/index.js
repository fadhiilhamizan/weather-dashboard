import { createApp } from './app.js';
import { config } from './config.js';

const app = createApp();

const server = app.listen(config.port, () => {
  const mode = config.weather.demoMode ? 'DEMO MODE (no API key — serving mock data)' : 'LIVE';
  console.log(`\n  Atmosfer API running on http://localhost:${config.port}`);
  console.log(`  Mode: ${mode}`);
  console.log(`  Allowed origins: ${config.corsOrigins.join(', ')}\n`);
});

// Graceful shutdown.
const shutdown = (signal) => {
  console.log(`\n${signal} received, shutting down...`);
  server.close(() => process.exit(0));
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
