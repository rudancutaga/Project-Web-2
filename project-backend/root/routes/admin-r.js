const express = require('express');
const { protect, restrictTo } = require('../../middlewares/auth-mw.js');
const adminController = require('../controllers/admin-c.js');
const { validate } = require('../../middlewares/validate-mw.js');
const { gameIdParamSchema, updateGameSchema } = require('../../validators/game-schema.js');
const {
  createAdminGameSchema,
  listAdminGamesQuerySchema,
  listAdminUsersQuerySchema,
  updateAdminUserSchema,
  userIdParamSchema,
} = require('../../validators/admin-schema.js');

const router = express.Router();

router.use(protect, restrictTo('admin'));
router.get('/stats', adminController.stats);
router.get('/users', validate(listAdminUsersQuerySchema, 'query'), adminController.listUsers);
router.patch('/users/:id', validate(userIdParamSchema, 'params'), validate(updateAdminUserSchema), adminController.updateUser);
router.get('/games', validate(listAdminGamesQuerySchema, 'query'), adminController.listGames);
router.post('/games', validate(createAdminGameSchema), adminController.createGame);
router.patch('/games/:id', validate(gameIdParamSchema, 'params'), validate(updateGameSchema), adminController.updateGame);

module.exports = router;
