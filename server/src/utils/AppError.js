/**
 * An error that carries an HTTP status code and is safe to show to clients.
 * Anything that is NOT an AppError is treated as an unexpected 500 and its
 * details are hidden from the response in production.
 */
export class AppError extends Error {
  constructor(statusCode, message, { code } = {}) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code || 'ERROR';
    this.isOperational = true;
  }

  static badRequest(message, code = 'BAD_REQUEST') {
    return new AppError(400, message, { code });
  }

  static notFound(message, code = 'NOT_FOUND') {
    return new AppError(404, message, { code });
  }

  static upstream(message, code = 'UPSTREAM_ERROR') {
    return new AppError(502, message, { code });
  }
}
