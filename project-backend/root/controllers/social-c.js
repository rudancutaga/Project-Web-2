const socialService = require('../services/social-s.js');

async function listFriends(req, res) {
  try {
    const [friends, pendingRequests] = await Promise.all([
      socialService.listFriends(req.user.id),
      socialService.listPendingRequests(req.user.id),
    ]);
    return res.ok({ friends, pendingRequests });
  } catch (err) {
    return res.error(err);
  }
}

async function sendRequest(req, res) {
  try {
    const result = await socialService.sendRequest(req.user.id, Number(req.params.userId));
    return res.created(result);
  } catch (err) {
    return res.error(err);
  }
}

async function acceptRequest(req, res) {
  try {
    const result = await socialService.acceptRequest(req.user.id, Number(req.params.userId));
    return res.ok(result);
  } catch (err) {
    return res.error(err);
  }
}

async function listMessages(req, res) {
  try {
    const messages = await socialService.listMessages(req.user.id);
    return res.ok({ messages });
  } catch (err) {
    return res.error(err);
  }
}

async function sendMessage(req, res) {
  try {
    const message = await socialService.sendMessage(req.user.id, req.body);
    return res.created({ message });
  } catch (err) {
    return res.error(err);
  }
}

async function listRankings(req, res) {
  try {
    const rankings = await socialService.listRankings(req.user.id, {
      scope: req.query.scope,
      gameId: req.query.gameId,
    });
    return res.ok({ rankings });
  } catch (err) {
    return res.error(err);
  }
}

module.exports = {
  listFriends,
  sendRequest,
  acceptRequest,
  listMessages,
  sendMessage,
  listRankings,
};
