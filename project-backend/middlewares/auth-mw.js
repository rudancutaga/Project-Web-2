const AppError = require('../utils/appError.js');
const User = require('../root/models/user.js');
const { verifyAccessToken } = require('../root/services/auth-s.js');

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(
        AppError.unauthorized(
          'NO_TOKEN',
          'You are not logged in! Please log in to get access.'
        )
      );
    }

    const decoded = await verifyAccessToken(token);
    const currentUser = decoded.provider === 'supabase'
      ? await User.findByAuthUserId(decoded.authUserId)
      : await User.findById(decoded.id);

    if (!currentUser) {
      return next(
        AppError.unauthorized(
          'USER_NOT_FOUND',
          'The user belonging to this token does not exist.'
        )
      );
    }

    if (currentUser.is_active === false) {
      return next(
        AppError.forbidden(
          'ACCOUNT_INACTIVE',
          'This account has been disabled.'
        )
      );
    }

    req.authAccessToken = token;
    req.authUser = decoded.user || null;
    req.user = currentUser;
    next();
  } catch (error) {
    next(error);
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        AppError.forbidden(
          'FORBIDDEN',
          'You do not have permission to perform this action.'
        )
      );
    }

    next();
  };
};

const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = await verifyAccessToken(token);
        const currentUser = decoded.provider === 'supabase'
          ? await User.findByAuthUserId(decoded.authUserId)
          : await User.findById(decoded.id);

        if (currentUser && currentUser.is_active !== false) {
          req.authAccessToken = token;
          req.authUser = decoded.user || null;
          req.user = currentUser;
        }
      } catch (err) {
      }
    }

    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  protect,
  restrictTo,
  optionalAuth,
};
