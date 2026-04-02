const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const AppError = require('../../utils/appError.js');
const User = require('../models/user.js');
const RefreshToken = require('../models/refresh-tokens.js');
const {
  getSupabaseAdmin,
  getSupabaseAuthClient,
  isSupabaseAuthConfigured,
} = require('../../db/supabase.js');
const {
  syncAuthUserForAppUser,
} = require('./supabase-auth-admin-s.js');

const ACCESS_TOKEN_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '15m';
const REFRESH_TOKEN_EXPIRES_DAYS =
  parseInt(process.env.JWT_REFRESH_EXPIRES_DAYS, 10) || 7;

const signAccessToken = (userId) => {
  return jwt.sign(
    { id: userId, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES }
  );
};

const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const sanitizeUser = (user) => {
  if (!user) return null;
  const nextUser = { ...user };
  delete nextUser.password;
  return nextUser;
};

const assertUserIsActive = (user) => {
  if (user?.is_active === false) {
    throw AppError.forbidden(
      'ACCOUNT_INACTIVE',
      'This account has been disabled.'
    );
  }
};

function isSupabaseEnabled() {
  return isSupabaseAuthConfigured();
}

function getExpiresInFromSession(session) {
  if (!session?.expires_in) {
    return null;
  }

  return `${session.expires_in}s`;
}

function mapSupabaseSessionResult(appUser, session) {
  return {
    user: sanitizeUser(appUser),
    accessToken: session?.access_token || null,
    refreshToken: session?.refresh_token || null,
    accessTokenExpiresIn: getExpiresInFromSession(session),
    refreshTokenExpiresIn: null,
  };
}

function isLikelyUserExistsError(message = '') {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('already registered') ||
    normalized.includes('already been registered') ||
    normalized.includes('already exists') ||
    normalized.includes('duplicate key')
  );
}

function isLikelyInvalidCredentialsError(message = '') {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('invalid login credentials') ||
    normalized.includes('email not confirmed') ||
    normalized.includes('invalid credentials') ||
    normalized.includes('email or password')
  );
}

function isDuplicateConstraintError(error) {
  return (
    error?.code === '23505' ||
    /duplicate key/i.test(error?.message || '')
  );
}

function normalizeSupabaseError(
  error,
  fallbackMessage,
  statusCode = 400,
  code = 'SUPABASE_AUTH_ERROR'
) {
  if (!error) {
    return new AppError(fallbackMessage, statusCode, null, code);
  }

  if (error instanceof AppError) {
    return error;
  }

  const message = error.message || fallbackMessage;

  if (isLikelyUserExistsError(message)) {
    return AppError.badRequest('USER_EXISTS', 'User with this email already exists');
  }

  if (isLikelyInvalidCredentialsError(message) && statusCode === 401) {
    return AppError.unauthorized('INVALID_CREDENTIALS', 'Incorrect email or password');
  }

  return new AppError(message, statusCode, error.details || null, code);
}

async function generateLegacyTokenPair(userId, family = null) {
  const accessToken = signAccessToken(userId);
  const refreshToken = generateRefreshToken();
  const hashedRefreshToken = hashToken(refreshToken);

  const tokenFamily =
    family || crypto.randomBytes(16).toString('hex');

  const expiresAt = new Date();
  expiresAt.setDate(
    expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS
  );

  await RefreshToken.create({
    user_id: userId,
    token: hashedRefreshToken,
    family: tokenFamily,
    expires_at: expiresAt,
  });

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresIn: ACCESS_TOKEN_EXPIRES,
    refreshTokenExpiresIn: `${REFRESH_TOKEN_EXPIRES_DAYS}d`,
  };
}

async function signupLegacy(userData) {
  const existingUser = await User.findByEmail(userData.email);
  if (existingUser) {
    throw AppError.badRequest(
      'USER_EXISTS',
      'User with this email already exists'
    );
  }

  delete userData.passwordConfirm;

  const hashedPassword = await bcrypt.hash(userData.password, 12);

  const newUser = await User.create({
    ...userData,
    password: hashedPassword,
  });

  const tokens = await generateLegacyTokenPair(newUser.id);

  return { user: sanitizeUser(newUser), ...tokens };
}

async function loginLegacy(email, password) {
  const user = await User.findByEmail(email);
  if (!user) {
    throw AppError.unauthorized(
      'INVALID_CREDENTIALS',
      'Incorrect email or password'
    );
  }

  assertUserIsActive(user);

  const isPasswordCorrect = await bcrypt.compare(
    password,
    user.password
  );

  if (!isPasswordCorrect) {
    throw AppError.unauthorized(
      'INVALID_CREDENTIALS',
      'Incorrect email or password'
    );
  }

  const tokens = await generateLegacyTokenPair(user.id);

  return { user: sanitizeUser(user), ...tokens };
}

async function refreshTokensLegacy(refreshToken) {
  const hashedToken = hashToken(refreshToken);

  const storedToken =
    await RefreshToken.findByToken(hashedToken);

  if (!storedToken) {
    throw AppError.unauthorized(
      'INVALID_TOKEN',
      'Invalid or expired refresh token'
    );
  }

  if (new Date(storedToken.expires_at) < new Date()) {
    await RefreshToken.revokeById(storedToken.id);
    throw AppError.unauthorized(
      'TOKEN_EXPIRED',
      'Refresh token has expired'
    );
  }

  const user = await User.findById(storedToken.user_id);
  if (!user) {
    await RefreshToken.revokeFamily(storedToken.family);
    throw AppError.unauthorized(
      'USER_NOT_FOUND',
      'User no longer exists'
    );
  }

  assertUserIsActive(user);

  await RefreshToken.revokeById(storedToken.id);

  const tokens = await generateLegacyTokenPair(
    user.id,
    storedToken.family
  );

  return { user: sanitizeUser(user), ...tokens };
}

async function logoutLegacy(refreshToken) {
  if (!refreshToken) {
    return { message: 'Logged out successfully' };
  }

  const hashedToken = hashToken(refreshToken);
  await RefreshToken.revokeByToken(hashedToken);

  return { message: 'Logged out successfully' };
}

async function logoutAllLegacy(userId) {
  await RefreshToken.revokeAllByUserId(userId);
  return { message: 'Logged out from all devices successfully' };
}

function verifyLegacyAccessToken(token) {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (decoded.type !== 'access') {
      throw AppError.unauthorized(
        'INVALID_TOKEN',
        'Invalid token type'
      );
    }

    return {
      provider: 'legacy',
      id: decoded.id,
      tokenType: decoded.type,
    };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw AppError.unauthorized(
        'TOKEN_EXPIRED',
        'Access token has expired'
      );
    }

    if (error.name === 'JsonWebTokenError') {
      throw AppError.unauthorized(
        'INVALID_TOKEN',
        'Invalid access token'
      );
    }

    throw error;
  }
}

async function refetchAppUserForSupabaseUser(supabaseUser) {
  const byAuthUserId = await User.findByAuthUserId(supabaseUser.id);
  if (byAuthUserId) {
    return byAuthUserId;
  }

  if (!supabaseUser.email) {
    return null;
  }

  return User.findByEmail(supabaseUser.email);
}

async function ensureAppUserFromSupabaseUser(supabaseUser, options = {}) {
  if (!supabaseUser?.id) {
    throw AppError.unauthorized(
      'INVALID_TOKEN',
      'Supabase user is missing.'
    );
  }

  let appUser = await User.findByAuthUserId(supabaseUser.id);
  let shouldSyncAuthUser = false;
  const existingByEmail = supabaseUser.email
    ? await User.findByEmail(supabaseUser.email)
    : null;

  if (!appUser && existingByEmail) {
    if (
      existingByEmail.auth_user_id &&
      existingByEmail.auth_user_id !== supabaseUser.id
    ) {
      throw AppError.badRequest(
        'AUTH_LINK_CONFLICT',
        'This email is already linked to another authentication account.'
      );
    }

    try {
      appUser = await User.updateById(existingByEmail.id, {
        auth_user_id: supabaseUser.id,
        email: supabaseUser.email || existingByEmail.email,
      });
      shouldSyncAuthUser = true;
    } catch (error) {
      if (!isDuplicateConstraintError(error)) {
        throw error;
      }

      appUser = await refetchAppUserForSupabaseUser(supabaseUser);
    }
  }

  if (!appUser) {
    const fallbackName =
      options.name ||
      supabaseUser.user_metadata?.name ||
      supabaseUser.user_metadata?.display_name ||
      (supabaseUser.email ? supabaseUser.email.split('@')[0] : 'User');

    try {
      appUser = await User.create({
        name: fallbackName,
        email: supabaseUser.email,
        password: null,
        display_name:
          supabaseUser.user_metadata?.display_name ||
          fallbackName,
        role: 'client',
        is_active: true,
        auth_user_id: supabaseUser.id,
      });
      shouldSyncAuthUser = true;
    } catch (error) {
      if (!isDuplicateConstraintError(error)) {
        throw error;
      }

      appUser = await refetchAppUserForSupabaseUser(supabaseUser);
    }
  }

  if (appUser && !appUser.auth_user_id) {
    try {
      appUser = await User.updateById(appUser.id, {
        auth_user_id: supabaseUser.id,
        email: supabaseUser.email || appUser.email,
      });
      shouldSyncAuthUser = true;
    } catch (error) {
      if (!isDuplicateConstraintError(error)) {
        throw error;
      }

      appUser = await refetchAppUserForSupabaseUser(supabaseUser);
    }
  }

  if (!appUser) {
    throw AppError.badRequest(
      'APP_USER_SYNC_FAILED',
      'Unable to map the Supabase account to an application user.'
    );
  }

  assertUserIsActive(appUser);

  if (shouldSyncAuthUser) {
    await syncAuthUserForAppUser(appUser);
  }

  return appUser;
}

async function signInThroughSupabase(email, password) {
  const supabaseAuth = getSupabaseAuthClient();
  const { data, error } = await supabaseAuth.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data?.session || !data?.user) {
    throw normalizeSupabaseError(
      error,
      'Supabase login failed',
      401,
      'SUPABASE_LOGIN_FAILED'
    );
  }

  const appUser = await ensureAppUserFromSupabaseUser(data.user);

  return mapSupabaseSessionResult(appUser, data.session);
}

async function migrateLegacyUserToSupabase(email, password) {
  const existingUser = await User.findByEmail(email);

  if (!existingUser || existingUser.auth_user_id) {
    return null;
  }

  assertUserIsActive(existingUser);

  if (!existingUser.password) {
    return null;
  }

  const isPasswordCorrect = await bcrypt.compare(
    password,
    existingUser.password
  );

  if (!isPasswordCorrect) {
    return null;
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name: existingUser.name,
      display_name: existingUser.display_name,
      app_user_id: existingUser.id,
      role: existingUser.role,
    },
  });

  if (error && !isLikelyUserExistsError(error.message)) {
    throw normalizeSupabaseError(
      error,
      'Failed to migrate user to Supabase Auth',
      400,
      'SUPABASE_USER_MIGRATION_FAILED'
    );
  }

  return signInThroughSupabase(email, password);
}

async function signupWithSupabase(userData) {
  const existingUser = await User.findByEmail(userData.email);
  if (existingUser) {
    throw AppError.badRequest(
      'USER_EXISTS',
      'User with this email already exists'
    );
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: userData.email,
    password: userData.password,
    email_confirm: true,
    user_metadata: {
      name: userData.name,
      display_name: userData.name,
      role: 'client',
    },
  });

  if (error || !data?.user) {
    throw normalizeSupabaseError(
      error,
      'Supabase signup failed',
      400,
      'SUPABASE_SIGNUP_FAILED'
    );
  }

  return signInThroughSupabase(userData.email, userData.password);
}

async function loginWithSupabase(email, password) {
  try {
    return await signInThroughSupabase(email, password);
  } catch (error) {
    if (!(error instanceof AppError) || error.statusCode !== 401) {
      throw error;
    }

    const migrated = await migrateLegacyUserToSupabase(email, password);
    if (migrated) {
      return migrated;
    }

    throw error;
  }
}

async function refreshTokensWithSupabase(refreshToken) {
  const supabaseAuth = getSupabaseAuthClient();
  const { data, error } = await supabaseAuth.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error || !data?.session || !data?.user) {
    throw normalizeSupabaseError(
      error,
      'Invalid or expired refresh token',
      401,
      'SUPABASE_REFRESH_FAILED'
    );
  }

  const appUser = await ensureAppUserFromSupabaseUser(data.user);
  return mapSupabaseSessionResult(appUser, data.session);
}

async function logoutWithSupabase(refreshToken, accessToken) {
  const supabaseAdmin = getSupabaseAdmin();
  let jwt = accessToken || null;

  if (!jwt && refreshToken) {
    try {
      const refreshed = await refreshTokensWithSupabase(refreshToken);
      jwt = refreshed.accessToken;
    } catch (error) {
      return { message: 'Logged out successfully' };
    }
  }

  if (!jwt) {
    return { message: 'Logged out successfully' };
  }

  const { error } = await supabaseAdmin.auth.admin.signOut(jwt, 'local');

  if (error) {
    throw normalizeSupabaseError(
      error,
      'Supabase logout failed',
      400,
      'SUPABASE_LOGOUT_FAILED'
    );
  }

  return { message: 'Logged out successfully' };
}

async function logoutAllWithSupabase(accessToken) {
  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.auth.admin.signOut(accessToken, 'global');

  if (error) {
    throw normalizeSupabaseError(
      error,
      'Supabase global logout failed',
      400,
      'SUPABASE_LOGOUT_ALL_FAILED'
    );
  }

  return { message: 'Logged out from all devices successfully' };
}

async function verifySupabaseAccessToken(token) {
  const supabaseAuth = getSupabaseAuthClient();
  const { data, error } = await supabaseAuth.auth.getUser(token);

  if (error || !data?.user) {
    throw normalizeSupabaseError(
      error,
      'Invalid access token',
      401,
      'SUPABASE_INVALID_TOKEN'
    );
  }

  return {
    provider: 'supabase',
    authUserId: data.user.id,
    email: data.user.email || null,
    user: data.user,
  };
}

async function signup(userData) {
  if (isSupabaseEnabled()) {
    return signupWithSupabase(userData);
  }

  return signupLegacy(userData);
}

async function login(email, password) {
  if (isSupabaseEnabled()) {
    return loginWithSupabase(email, password);
  }

  return loginLegacy(email, password);
}

async function refreshTokens(refreshToken) {
  if (isSupabaseEnabled()) {
    try {
      return await refreshTokensWithSupabase(refreshToken);
    } catch (error) {
      const hashedToken = hashToken(refreshToken);
      const legacyToken = await RefreshToken.findByToken(hashedToken);

      if (!legacyToken) {
        throw error;
      }
    }
  }

  return refreshTokensLegacy(refreshToken);
}

async function logout(refreshToken, accessToken = null) {
  if (isSupabaseEnabled()) {
    try {
      return await logoutWithSupabase(refreshToken, accessToken);
    } catch (error) {
      const hashedToken = refreshToken ? hashToken(refreshToken) : null;
      const legacyToken = hashedToken
        ? await RefreshToken.findByToken(hashedToken)
        : null;

      if (!legacyToken) {
        throw error;
      }
    }
  }

  return logoutLegacy(refreshToken);
}

async function logoutAll(userId, accessToken = null) {
  if (isSupabaseEnabled() && accessToken) {
    try {
      return await logoutAllWithSupabase(accessToken);
    } catch (error) {
      return logoutAllLegacy(userId);
    }
  }

  return logoutAllLegacy(userId);
}

async function verifyAccessToken(token) {
  if (isSupabaseEnabled()) {
    try {
      return await verifySupabaseAccessToken(token);
    } catch (error) {
      if (error instanceof AppError && error.statusCode !== 401) {
        throw error;
      }
    }
  }

  return verifyLegacyAccessToken(token);
}

async function handleTokenReuse(refreshToken) {
  const hashedToken = hashToken(refreshToken);

  const token = await RefreshToken.findByToken(hashedToken);

  if (token) {
    await RefreshToken.revokeFamily(token.family);
  }

  throw AppError.unauthorized(
    'TOKEN_REUSE',
    'Token reuse detected. Please login again.'
  );
}

module.exports = {
  signup,
  login,
  refreshTokens,
  logout,
  logoutAll,
  verifyAccessToken,
  handleTokenReuse,
  isSupabaseEnabled,
};
