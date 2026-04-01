const express = require('express');
const { protect } = require('../../middlewares/auth-mw.js');
const { validate } = require('../../middlewares/validate-mw.js');
const socialController = require('../controllers/social-c.js');
const { friendActionSchema, sendMessageSchema } = require('../../validators/social-schema.js');

const router = express.Router();

router.get('/friends', protect, socialController.listFriends);
router.post('/friends/:userId/request', protect, validate(friendActionSchema, 'params'), socialController.sendRequest);
router.post('/friends/:userId/accept', protect, validate(friendActionSchema, 'params'), socialController.acceptRequest);
router.get('/messages', protect, socialController.listMessages);
router.post('/messages', protect, validate(sendMessageSchema), socialController.sendMessage);
router.get('/rankings', protect, socialController.listRankings);

module.exports = router;
