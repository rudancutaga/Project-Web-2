const adminService = require('../services/admin-s.js');

async function stats(req, res) {
  try {
    const data = await adminService.getDashboardStats();
    return res.ok(data);
  } catch (err) {
    return res.error(err);
  }
}

async function listUsers(req, res) {
  try {
    const users = await adminService.listUsers(req.query);
    return res.ok({ users });
  } catch (err) {
    return res.error(err);
  }
}

async function updateUser(req, res) {
  try {
    const user = await adminService.updateUser(Number(req.params.id), req.body, req.user.id);
    return res.ok({ user });
  } catch (err) {
    return res.error(err);
  }
}

async function listGames(req, res) {
  try {
    const games = await adminService.listGames(req.query);
    return res.ok({ games });
  } catch (err) {
    return res.error(err);
  }
}

async function createGame(req, res) {
  try {
    const game = await adminService.createGame(req.body);
    return res.created({ game });
  } catch (err) {
    return res.error(err);
  }
}

async function updateGame(req, res) {
  try {
    const game = await adminService.updateGame(req.params.id, req.body);
    return res.ok({ game });
  } catch (err) {
    return res.error(err);
  }
}

module.exports = {
  stats,
  listUsers,
  updateUser,
  listGames,
  createGame,
  updateGame,
};
