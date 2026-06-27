import { Router } from 'express';
import { config } from '../config.js';
import { cache } from '../services/cache.service.js';
import {
  getByCoords,
  getByCity,
  getGeocode,
  getReverse,
} from '../controllers/weather.controller.js';

const router = Router();

// Health / status — handy for uptime checks and for the frontend to detect
// demo mode and show a banner.
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    demoMode: config.weather.demoMode,
    cache: cache.stats(),
    uptimeSeconds: Math.round(process.uptime()),
  });
});

router.get('/weather', getByCoords);
router.get('/weather/city', getByCity);
router.get('/geocode', getGeocode);
router.get('/reverse', getReverse);

export default router;
