import { AppError } from '../utils/AppError.js';
import { config } from '../config.js';

/** 404 for any unmatched route. */
export function notFoundHandler(req, res) {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found.` },
  });
}

/**
 * The single place every error funnels through. Operational errors (AppError)
 * are shown to the client; anything else is logged and reported as a generic
 * 500 so we never leak internals or stack traces in production.
 */
// eslint-disable-next-line no-unused-vars -- Express needs the 4-arg signature.
export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message },
    });
  }

  console.error('[unexpected error]', err);

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong on our end.',
      ...(config.isProduction ? {} : { detail: err.message }),
    },
  });
}
