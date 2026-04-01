const express = require('express');
const userController = require('../controllers/user-c.js');
const { protect } = require('../../middlewares/auth-mw.js');
const { validate } = require('../../middlewares/validate-mw.js');
const {
  signupSchema,
  loginSchema,
} = require('../../validators/auth-schema.js');
const { updateProfileSchema } = require('../../validators/user-schema.js');

const router = express.Router();

router.get('/', protect, userController.list);
router.get('/me/progress', protect, userController.getProgress);
router.patch('/me', protect, validate(updateProfileSchema), userController.updateProfile);
router.post('/signup', validate(signupSchema), userController.signup);
router.post('/login', validate(loginSchema), userController.login);

module.exports = router;
