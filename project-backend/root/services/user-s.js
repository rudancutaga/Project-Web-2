const User = require('../models/user.js');
const AppError = require('../../utils/appError.js');
const authService = require('./auth-s.js');
const { syncAuthUserForAppUser } = require('./supabase-auth-admin-s.js');
const { listUserAchievements } = require('./achievement-s.js');

function sanitizeUser(user) {
  if (!user) return null;
  const nextUser = { ...user };
  delete nextUser.password;
  return nextUser;
}

exports.list = async function list(query = '') {
  const users = await User.all();
  const normalizedQuery = query.trim().toLowerCase();

  return users
    .filter((user) => user.is_active !== false)
    .filter((user) => {
      if (!normalizedQuery) {
        return true;
      }

      return [user.name, user.display_name, user.email]
        .filter(Boolean)
        .some((value) =>
          value.toLowerCase().includes(normalizedQuery)
        );
    })
    .map((user) => {
      return sanitizeUser(user);
    });
};

exports.signup = async function signup(userData) {
  const result = await authService.signup(userData);

  return {
    user: result.user,
    token: result.accessToken,
    refreshToken: result.refreshToken,
    expiresIn: {
      accessToken: result.accessTokenExpiresIn,
      refreshToken: result.refreshTokenExpiresIn,
    },
  };
};

exports.updateProfile = async function updateProfile(userId, payload) {
  const currentUser = await User.findById(userId);

  if (!currentUser) {
    throw AppError.notFound('USER_NOT_FOUND', 'User not found');
  }

  const nextPayload = {};

  ['name', 'display_name', 'bio', 'avatar_url'].forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      nextPayload[field] = payload[field];
    }
  });

  const updatedUser = await User.updateById(userId, nextPayload);

  try {
    await syncAuthUserForAppUser(updatedUser);
  } catch (error) {
    await User.updateById(userId, {
      name: currentUser.name,
      display_name: currentUser.display_name,
      bio: currentUser.bio,
      avatar_url: currentUser.avatar_url,
    });

    throw error;
  }

  return sanitizeUser(updatedUser);
};

exports.login = async function login(email, password) {
  const result = await authService.login(email, password);

  return {
    user: result.user,
    token: result.accessToken,
    refreshToken: result.refreshToken,
    expiresIn: {
      accessToken: result.accessTokenExpiresIn,
      refreshToken: result.refreshTokenExpiresIn,
    },
  };
};

exports.getProgress = async function getProgress(userId) {
  return listUserAchievements(userId);
};
