/**
 * Wraps an async route handler so any rejected promise is forwarded to the
 * Express error middleware instead of crashing the process or hanging.
 */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
