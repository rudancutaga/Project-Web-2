const userService = require('../services/user-s.js');

const list = async (req, res, next) => {
    try {
        const users = await userService.list(req.query.q || '');
        return res.ok({ users });
    } catch (error) {
        next(error);
    }
};

const signup = async (req, res, next) => {
    try {
        const { user, token, refreshToken, expiresIn } = await userService.signup(req.body);
        return res.created({ user, token, refreshToken, expiresIn });
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const { user, token, refreshToken, expiresIn } = await userService.login(email, password);
        return res.ok({ user, token, refreshToken, expiresIn });
    } catch (error) {
        next(error);
    }
};

const updateProfile = async (req, res, next) => {
    try {
        const user = await userService.updateProfile(req.user.id, req.body);
        return res.ok({ user });
    } catch (error) {
        next(error);
    }
};

const getProgress = async (req, res, next) => {
    try {
        const progress = await userService.getProgress(req.user.id);
        return res.ok({ progress });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    list,
    signup,
    login,
    updateProfile,
    getProgress,
};
