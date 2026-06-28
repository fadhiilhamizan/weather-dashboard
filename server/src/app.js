import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';

import { config } from './config.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import weatherRoutes from './routes/weather.routes.js';

export function createApp() {
  const app = express();

  // Trust the first proxy hop so req.ip is correct behind Render/Heroku/etc.
  app.set('trust proxy', 1);

  // Security headers.
  app.use(helmet());

  // Allow only the configured frontend origin(s).
  app.use(
    cors({
      origin(origin, cb) {
        // Allow non-browser tools (curl, server-to-server) which send no origin.
        if (!origin || config.corsOrigins.includes(origin)) return cb(null, true);
        return cb(new Error(`Origin ${origin} not allowed by CORS`));
      },
      // Let the browser read our custom headers cross-origin (cache + demo info).
      exposedHeaders: ['X-Cache', 'X-Demo-Mode', 'X-Provider', 'X-RateLimit-Remaining', 'X-RateLimit-Reset', 'Retry-After'],
    })
  );

  app.use(compression());
  app.use(express.json());
  if (!config.isProduction) app.use(morgan('dev'));

  // All API traffic is rate limited.
  app.use('/api', rateLimiter, weatherRoutes);

  // Friendly root.
  app.get('/', (req, res) => {
    res.json({
      name: 'Atmosfer API',
      docs: 'See README.md',
      endpoints: ['/api/health', '/api/weather', '/api/weather/city', '/api/geocode', '/api/reverse'],
      demoMode: config.weather.demoMode,
    });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
