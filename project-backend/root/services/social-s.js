const db = require('../../db/db.js');
const AppError = require('../../utils/appError.js');
const { getClientGameId, resolveGameId } = require('./game-contract-s.js');

async function listFriends(userId) {
  return db('friendships as f')
    .leftJoin('users as requester', 'requester.id', 'f.requester_id')
    .leftJoin('users as addressee', 'addressee.id', 'f.addressee_id')
    .where(function () {
      this.where('f.requester_id', userId).orWhere('f.addressee_id', userId);
    })
    .andWhere('f.status', 'accepted')
    .select(
      'f.id',
      'f.requester_id',
      'f.addressee_id',
      'f.status',
      'f.created_at',
      'requester.display_name as requester_name',
      'requester.email as requester_email',
      'addressee.display_name as addressee_name',
      'addressee.email as addressee_email'
    )
    .orderBy('f.created_at', 'desc');
}

async function listPendingRequests(userId) {
  return db('friendships as f')
    .leftJoin('users as requester', 'requester.id', 'f.requester_id')
    .leftJoin('users as addressee', 'addressee.id', 'f.addressee_id')
    .where(function () {
      this.where('f.requester_id', userId).orWhere('f.addressee_id', userId);
    })
    .andWhere('f.status', 'pending')
    .select(
      'f.id',
      'f.requester_id',
      'f.addressee_id',
      'f.status',
      'f.created_at',
      'requester.display_name as requester_name',
      'requester.email as requester_email',
      'addressee.display_name as addressee_name',
      'addressee.email as addressee_email'
    )
    .orderBy('f.created_at', 'desc');
}

async function sendRequest(requesterId, addresseeId) {
  if (requesterId === addresseeId) throw new AppError('Cannot friend yourself', 400);
  const existing = await db('friendships')
    .where({ requester_id: requesterId, addressee_id: addresseeId })
    .orWhere({ requester_id: addresseeId, addressee_id: requesterId })
    .first();
  if (existing) return existing;
  const [row] = await db('friendships')
    .insert({ requester_id: requesterId, addressee_id: addresseeId, status: 'pending' })
    .returning('*');
  return row;
}

async function acceptRequest(userId, requesterId) {
  const [row] = await db('friendships')
    .where({ requester_id: requesterId, addressee_id: userId, status: 'pending' })
    .update({ status: 'accepted' }, ['*']);
  if (!row) throw new AppError('Request not found', 404);
  return row;
}

async function listMessages(userId) {
  return db('messages as m')
    .leftJoin('users as sender', 'sender.id', 'm.sender_id')
    .leftJoin('users as receiver', 'receiver.id', 'm.receiver_id')
    .where('m.sender_id', userId)
    .orWhere('m.receiver_id', userId)
    .select(
      'm.id',
      'm.sender_id',
      'm.receiver_id',
      'm.body',
      'm.created_at',
      'sender.display_name as sender_name',
      'receiver.display_name as receiver_name',
      'sender.name as sender_fallback_name',
      'receiver.name as receiver_fallback_name',
      'sender.email as sender_email',
      'receiver.email as receiver_email'
    )
    .orderBy('m.created_at', 'desc')
    .then((messages) =>
      messages.map((message) => ({
        ...message,
        sender_name:
          message.sender_name ||
          message.sender_fallback_name ||
          message.sender_email ||
          null,
        receiver_name:
          message.receiver_name ||
          message.receiver_fallback_name ||
          message.receiver_email ||
          null,
      }))
    );
}

async function sendMessage(senderId, payload) {
  const [message] = await db('messages')
    .insert({ sender_id: senderId, receiver_id: payload.to, body: payload.body })
    .returning('*');
  return message;
}

async function listRankings(userId, options = {}) {
  const scope = options.scope || 'global';
  const gameId = options.gameId ? await resolveGameId(options.gameId) : null;

  let query = db('game_stats as gs')
    .leftJoin('users as u', 'u.id', 'gs.user_id')
    .leftJoin('games as g', 'g.id', 'gs.game_id')
    .select(
      'gs.id',
      'gs.user_id',
      'gs.game_id',
      'gs.total_score',
      'gs.wins',
      'gs.losses',
      'gs.draws',
      'gs.updated_at',
      'u.display_name',
      'u.email',
      'g.name as game_name',
      'g.code as game_code'
    )
    .orderBy('gs.total_score', 'desc')
    .orderBy('gs.wins', 'desc')
    .orderBy('gs.updated_at', 'desc');

  if (gameId) {
    query = query.where('gs.game_id', gameId);
  }

  if (scope === 'self') {
    query = query.where('gs.user_id', userId);
  }

  if (scope === 'friends') {
    query = query.where((builder) => {
      builder
        .whereIn('gs.user_id', function () {
          this.select('requester_id as user_id')
            .from('friendships')
            .where('addressee_id', userId)
            .andWhere('status', 'accepted')
            .union(function () {
              this.select('addressee_id as user_id')
                .from('friendships')
                .where('requester_id', userId)
                .andWhere('status', 'accepted');
            });
        })
        .orWhere('gs.user_id', userId);
    });
  }

  const rows = await query;

  return rows.map((row) => ({
    ...row,
    game_id: getClientGameId(row.game_code || row.game_id),
    display_name: row.display_name || row.email || 'Player',
  }));
}

async function adminStats() {
  const [userCount] = await db('users').count('* as total');
  const [gameCount] = await db('games').count('* as total');
  const [sessionCount] = await db('game_sessions').count('* as total');
  return {
    users: Number(userCount.total || 0),
    games: Number(gameCount.total || 0),
    sessions: Number(sessionCount.total || 0),
  };
}

module.exports = {
  listFriends,
  listPendingRequests,
  sendRequest,
  acceptRequest,
  listMessages,
  sendMessage,
  listRankings,
  adminStats,
};
