const authService = require('../services/auth-s.js');

async function signup(req, res) {
  try {
    const result = await authService.signup(req.body);

    return res.create({
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: {
        accessToken: result.accessTokenExpiresIn,
        refreshToken: result.refreshTokenExpiresIn,
      },
    });
  } catch (error) {
    return res.error(error);
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    return res.ok({
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: {
        accessToken: result.accessTokenExpiresIn,
        refreshToken: result.refreshTokenExpiresIn,
      },
    });
  } catch (error) {
    return res.error(error);
  }
}

async function refresh(req, res) {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshTokens(refreshToken);

    return res.ok({
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: {
        accessToken: result.accessTokenExpiresIn,
        refreshToken: result.refreshTokenExpiresIn,
      },
    });
  } catch (error) {
    return res.error(error);
  }
}

async function logout(req, res) {
  try {
    const { refreshToken } = req.body;
    const accessToken = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null;
    const result = await authService.logout(refreshToken, accessToken);
    return res.ok(result);
  } catch (error) {
    return res.error(error);
  }
}

async function logoutAll(req, res) {
  try {
    const userId = req.user.id;
    const result = await authService.logoutAll(userId, req.authAccessToken);
    return res.ok(result);
  } catch (error) {
    return res.error(error);
  }
}

async function me(req, res) {
  try {
    const user = { ...req.user };
    delete user.password;

    return res.ok({ user });
  } catch (error) {
    return res.error(error);
  }
}

module.exports = {
  signup,
  login,
  refresh,
  logout,
  logoutAll,
  me,
};
