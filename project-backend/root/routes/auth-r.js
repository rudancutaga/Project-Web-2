const express = require('express');
const authController = require('../controllers/auth-c.js');
const { protect } = require('../../middlewares/auth-mw.js');
const { validate } = require('../../middlewares/validate-mw.js');
const {
  signupSchema,
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
} = require('../../validators/auth-schema.js');

const router = express.Router();

router.post('/signup', validate(signupSchema), authController.signup);
router.post('/login', validate(loginSchema), authController.login);
router.post(
  '/refresh-token',
  validate(refreshTokenSchema),
  authController.refresh
);
router.post('/logout', validate(logoutSchema), authController.logout);
router.post('/logout-all', protect, authController.logoutAll);
router.get('/me', protect, authController.me);

module.exports = router;
