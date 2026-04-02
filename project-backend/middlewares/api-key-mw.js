const AppError = require('../utils/appError.js');

const API_KEY_HEADER = 'x-api-key';
const DEFAULT_API_KEY = 'boardverse-dev-key';

function getConfiguredApiKey() {
  return String(
    process.env.API_KEY ||
      process.env.APP_API_KEY ||
      DEFAULT_API_KEY
  ).trim();
}

function readApiKeyFromRequest(req) {
  const headerValue = req.headers?.[API_KEY_HEADER];

  if (Array.isArray(headerValue)) {
    return String(headerValue[0] || '').trim();
  }

  return String(headerValue || '').trim();
}

function requireApiKey(req, res, next) {
  try {
    const expectedApiKey = getConfiguredApiKey();
    const providedApiKey = readApiKeyFromRequest(req);

    if (!expectedApiKey) {
      return next();
    }

    if (providedApiKey !== expectedApiKey) {
      return next(
        AppError.unauthorized(
          'INVALID_API_KEY',
          'Missing or invalid API key.'
        )
      );
    }

    req.apiKeyVerified = true;
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  API_KEY_HEADER,
  DEFAULT_API_KEY,
  getConfiguredApiKey,
  requireApiKey,
};
