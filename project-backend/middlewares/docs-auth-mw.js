const crypto = require('crypto');
const bcrypt = require('bcrypt');

const AppError = require('../utils/appError.js');
const User = require('../root/models/user.js');
const { verifyAccessToken } = require('../root/services/auth-s.js');

const DOCS_REALM = 'BoardVerse API Docs';
const DEFAULT_DOCS_USERNAME = 'admin@example.com';
const DEFAULT_DOCS_PASSWORD = 'password123';

function challengeDocsAuth(res) {
  res.setHeader('WWW-Authenticate', `Basic realm="${DOCS_REALM}"`);
  return res.status(401).json({
    status: 'error',
    error: {
      code: 'DOCS_AUTH_REQUIRED',
      message: 'Authentication is required to access API docs.',
    },
  });
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left ?? ''));
  const rightBuffer = Buffer.from(String(right ?? ''));

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function getConfiguredDocsCredentials() {
  return {
    username: (process.env.DOCS_USERNAME || DEFAULT_DOCS_USERNAME).trim(),
    password: (process.env.DOCS_PASSWORD || DEFAULT_DOCS_PASSWORD).trim(),
  };
}

async function authenticateBearerToken(token) {
  const decoded = await verifyAccessToken(token);
  const user = decoded.provider === 'supabase'
    ? await User.findByAuthUserId(decoded.authUserId)
    : await User.findById(decoded.id);

  if (!user || user.is_active === false || user.role !== 'admin') {
    throw AppError.forbidden(
      'DOCS_FORBIDDEN',
      'Only active admin accounts can access API docs.'
    );
  }

  return user;
}

async function authenticateBasicCredentials(username, password) {
  const configured = getConfiguredDocsCredentials();

  if (
    safeEqual(username, configured.username) &&
    safeEqual(password, configured.password)
  ) {
    return {
      id: 'docs-basic-auth',
      role: 'admin',
      email: configured.username,
    };
  }

  const user = await User.findByEmail(username);

  if (!user || user.role !== 'admin' || user.is_active === false || !user.password) {
    throw AppError.unauthorized(
      'DOCS_INVALID_CREDENTIALS',
      'Invalid API docs credentials.'
    );
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);

  if (!isPasswordCorrect) {
    throw AppError.unauthorized(
      'DOCS_INVALID_CREDENTIALS',
      'Invalid API docs credentials.'
    );
  }

  return user;
}

async function docsAuth(req, res, next) {
  try {
    const authorization = req.headers.authorization || '';

    if (authorization.startsWith('Bearer ')) {
      req.docsUser = await authenticateBearerToken(
        authorization.slice('Bearer '.length).trim()
      );
      return next();
    }

    if (authorization.startsWith('Basic ')) {
      const encoded = authorization.slice('Basic '.length).trim();
      const decoded = Buffer.from(encoded, 'base64').toString('utf8');
      const separatorIndex = decoded.indexOf(':');

      if (separatorIndex === -1) {
        return challengeDocsAuth(res);
      }

      const username = decoded.slice(0, separatorIndex);
      const password = decoded.slice(separatorIndex + 1);

      req.docsUser = await authenticateBasicCredentials(username, password);
      return next();
    }

    return challengeDocsAuth(res);
  } catch (error) {
    return challengeDocsAuth(res);
  }
}

module.exports = {
  docsAuth,
};
