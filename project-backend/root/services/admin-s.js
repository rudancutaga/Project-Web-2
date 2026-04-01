const db = require('../../db/db.js');
const AppError = require('../../utils/appError.js');
const gameService = require('./games-s.js');
const {
  decorateGame,
  ensureCatalogGames,
  getClientGameId,
} = require('./game-contract-s.js');
const { syncAuthUserForAppUser } = require('./supabase-auth-admin-s.js');

const SESSION_STATUSES = ['active', 'saved', 'finished', 'abandoned'];

function toInteger(value) {
  const parsed = Number.parseInt(value ?? 0, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toDecimal(value, digits = 1) {
  const parsed = Number.parseFloat(value ?? 0);
  if (!Number.isFinite(parsed)) return 0;
  return Number(parsed.toFixed(digits));
}

function sanitizeUser(row) {
  if (!row) return row;

  const { password, ...user } = row;

  return {
    ...user,
    has_auth_account: Boolean(user.auth_user_id),
    is_active: user.is_active !== false,
    session_count: toInteger(user.session_count),
    total_score: toInteger(user.total_score),
    wins: toInteger(user.wins),
    losses: toInteger(user.losses),
    draws: toInteger(user.draws),
    tracked_games: toInteger(user.tracked_games),
  };
}

function sanitizeGame(row) {
  if (!row) return row;

  const game = decorateGame(row);

  return {
    ...game,
    play_count: game.session_count,
    total_sessions: game.session_count,
    average_rating: toDecimal(game.average_rating),
  };
}

function buildUserStatsSummary() {
  return db('game_stats')
    .select('user_id')
    .sum({ total_score: 'total_score' })
    .sum({ wins: 'wins' })
    .sum({ losses: 'losses' })
    .sum({ draws: 'draws' })
    .count('* as tracked_games')
    .groupBy('user_id')
    .as('user_stats_summary');
}

function buildUserSessionSummary() {
  return db('game_sessions')
    .select('owner_id as user_id')
    .count('* as session_count')
    .max('updated_at as last_session_at')
    .groupBy('owner_id')
    .as('user_session_summary');
}

function buildGameSessionSummary() {
  return db('game_sessions')
    .select('game_id')
    .count('* as session_count')
    .countDistinct({ unique_players: 'owner_id' })
    .max('updated_at as last_played_at')
    .groupBy('game_id')
    .as('game_session_summary');
}

function buildGameRatingSummary() {
  return db('ratings')
    .select('game_id')
    .count('* as rating_count')
    .avg({ average_rating: 'stars' })
    .groupBy('game_id')
    .as('game_rating_summary');
}
async function getDashboardStats() {
  await ensureCatalogGames();

  const [
    userOverview,
    gameOverview,
    sessionOverview,
    ratingOverview,
    friendshipOverview,
    messageOverview,
    sessionStatusRows,
    topGameRows,
    topUserRows,
    recentSessionRows,
    recentUserRows,
  ] = await Promise.all([
    db('users')
      .select(
        db.raw('COUNT(*)::int as total_users'),
        db.raw('COUNT(*) FILTER (WHERE is_active = true)::int as active_users'),
        db.raw('COUNT(*) FILTER (WHERE is_active = false)::int as inactive_users'),
        db.raw(`COUNT(*) FILTER (WHERE role = 'admin')::int as admin_users`),
        db.raw(`COUNT(*) FILTER (WHERE role = 'client')::int as client_users`)
      )
      .first(),
    db('games')
      .select(
        db.raw('COUNT(*)::int as total_games'),
        db.raw('COUNT(*) FILTER (WHERE enabled = true)::int as enabled_games'),
        db.raw('COUNT(*) FILTER (WHERE enabled = false)::int as disabled_games')
      )
      .first(),
    db('game_sessions')
      .select(
        db.raw('COUNT(*)::int as total_sessions'),
        db.raw(`COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE)::int as today_sessions`),
        db.raw(`COUNT(*) FILTER (WHERE status = 'active')::int as active_sessions`),
        db.raw(`COUNT(*) FILTER (WHERE status = 'saved')::int as saved_sessions`),
        db.raw(`COUNT(*) FILTER (WHERE status = 'finished')::int as finished_sessions`),
        db.raw(`COUNT(*) FILTER (WHERE status = 'abandoned')::int as abandoned_sessions`)
      )
      .first(),
    db('ratings')
      .select(
        db.raw('COUNT(*)::int as total_ratings'),
        db.raw('COALESCE(ROUND(AVG(stars)::numeric, 1), 0) as average_rating')
      )
      .first(),
    db('friendships')
      .select(
        db.raw('COUNT(*)::int as total_friendships'),
        db.raw(`COUNT(*) FILTER (WHERE status = 'accepted')::int as accepted_friendships`),
        db.raw(`COUNT(*) FILTER (WHERE status = 'pending')::int as pending_friendships`)
      )
      .first(),
    db('messages')
      .select(db.raw('COUNT(*)::int as total_messages'))
      .first(),
    db('game_sessions')
      .select('status')
      .count('* as total')
      .groupBy('status')
      .orderBy('total', 'desc'),
    db('games as g')
      .leftJoin(buildGameSessionSummary(), 'game_session_summary.game_id', 'g.id')
      .leftJoin(buildGameRatingSummary(), 'game_rating_summary.game_id', 'g.id')
      .select(
        'g.id',
        'g.code',
        'g.name',
        'g.enabled',
        'g.board_size',
        db.raw('COALESCE(game_session_summary.session_count, 0)::int as session_count'),
        db.raw('COALESCE(game_session_summary.unique_players, 0)::int as unique_players'),
        db.raw('COALESCE(game_rating_summary.rating_count, 0)::int as rating_count'),
        db.raw('COALESCE(ROUND(game_rating_summary.average_rating::numeric, 1), 0) as average_rating')
      )
      .orderBy('session_count', 'desc')
      .orderBy('rating_count', 'desc')
      .orderBy('g.created_at', 'desc')
      .limit(5),
    db('users as u')
      .leftJoin(buildUserStatsSummary(), 'user_stats_summary.user_id', 'u.id')
      .leftJoin(buildUserSessionSummary(), 'user_session_summary.user_id', 'u.id')
      .select(
        'u.id',
        'u.name',
        'u.display_name',
        'u.email',
        'u.role',
        'u.is_active',
        db.raw('COALESCE(user_stats_summary.total_score, 0)::int as total_score'),
        db.raw('COALESCE(user_stats_summary.wins, 0)::int as wins'),
        db.raw('COALESCE(user_stats_summary.losses, 0)::int as losses'),
        db.raw('COALESCE(user_stats_summary.draws, 0)::int as draws'),
        db.raw('COALESCE(user_stats_summary.tracked_games, 0)::int as tracked_games'),
        db.raw('COALESCE(user_session_summary.session_count, 0)::int as session_count')
      )
      .orderBy('total_score', 'desc')
      .orderBy('wins', 'desc')
      .orderBy('session_count', 'desc')
      .orderBy('u.created_at', 'desc')
      .limit(5),
    db('game_sessions as gs')
      .leftJoin('games as g', 'g.id', 'gs.game_id')
      .leftJoin('users as u', 'u.id', 'gs.owner_id')
      .select(
        'gs.id',
        'gs.status',
        'gs.updated_at',
        'g.name as game_name',
        'g.code as game_code',
        'u.display_name',
        'u.email'
      )
      .orderBy('gs.updated_at', 'desc')
      .limit(6),
    db('users')
      .select('id', 'name', 'display_name', 'email', 'role', 'is_active', 'created_at')
      .orderBy('created_at', 'desc')
      .limit(6),
  ]);

  const sessionStatusMap = new Map(
    (sessionStatusRows || []).map((row) => [row.status, toInteger(row.total)])
  );

  return {
    overview: {
      total_users: toInteger(userOverview?.total_users),
      active_users: toInteger(userOverview?.active_users),
      inactive_users: toInteger(userOverview?.inactive_users),
      admin_users: toInteger(userOverview?.admin_users),
      client_users: toInteger(userOverview?.client_users),
      total_games: toInteger(gameOverview?.total_games),
      enabled_games: toInteger(gameOverview?.enabled_games),
      disabled_games: toInteger(gameOverview?.disabled_games),
      total_sessions: toInteger(sessionOverview?.total_sessions),
      today_sessions: toInteger(sessionOverview?.today_sessions),
      active_sessions: toInteger(sessionOverview?.active_sessions),
      saved_sessions: toInteger(sessionOverview?.saved_sessions),
      finished_sessions: toInteger(sessionOverview?.finished_sessions),
      abandoned_sessions: toInteger(sessionOverview?.abandoned_sessions),
      total_ratings: toInteger(ratingOverview?.total_ratings),
      average_rating: toDecimal(ratingOverview?.average_rating),
      total_messages: toInteger(messageOverview?.total_messages),
      total_friendships: toInteger(friendshipOverview?.total_friendships),
      accepted_friendships: toInteger(friendshipOverview?.accepted_friendships),
      pending_friendships: toInteger(friendshipOverview?.pending_friendships),
    },
    session_breakdown: SESSION_STATUSES.map((status) => ({
      status,
      total: sessionStatusMap.get(status) || 0,
    })),
    top_games: (topGameRows || []).map(sanitizeGame),
    top_players: (topUserRows || []).map(sanitizeUser),
    recent_sessions: (recentSessionRows || []).map((row) => ({
      ...row,
      game_id: getClientGameId(row.game_code || row.game_name),
      owner_name: row.display_name || row.email || 'Unknown player',
    })),
    recent_users: (recentUserRows || []).map(sanitizeUser),
  };
}
async function listUsers(filters = {}) {
  const query = db('users as u')
    .leftJoin(buildUserStatsSummary(), 'user_stats_summary.user_id', 'u.id')
    .leftJoin(buildUserSessionSummary(), 'user_session_summary.user_id', 'u.id')
    .select(
      'u.id',
      'u.name',
      'u.display_name',
      'u.email',
      'u.auth_user_id',
      'u.role',
      'u.is_active',
      'u.bio',
      'u.avatar_url',
      'u.created_at',
      'u.updated_at',
      db.raw('COALESCE(user_session_summary.session_count, 0)::int as session_count'),
      db.raw('COALESCE(user_session_summary.last_session_at, NULL) as last_session_at'),
      db.raw('COALESCE(user_stats_summary.total_score, 0)::int as total_score'),
      db.raw('COALESCE(user_stats_summary.wins, 0)::int as wins'),
      db.raw('COALESCE(user_stats_summary.losses, 0)::int as losses'),
      db.raw('COALESCE(user_stats_summary.draws, 0)::int as draws'),
      db.raw('COALESCE(user_stats_summary.tracked_games, 0)::int as tracked_games')
    );

  if (filters.q) {
    const searchValue = `%${filters.q}%`;
    query.where((builder) => {
      builder
        .whereILike('u.name', searchValue)
        .orWhereILike('u.display_name', searchValue)
        .orWhereILike('u.email', searchValue);
    });
  }

  if (filters.role && filters.role !== 'all') {
    query.andWhere('u.role', filters.role);
  }

  if (filters.status === 'active') {
    query.andWhere('u.is_active', true);
  }

  if (filters.status === 'inactive') {
    query.andWhere('u.is_active', false);
  }

  const rows = await query
    .orderBy('u.role', 'asc')
    .orderBy('u.is_active', 'desc')
    .orderBy('u.created_at', 'desc');

  return rows.map(sanitizeUser);
}

async function ensureActiveAdminRemains(targetUser, payload) {
  const willBeAdmin = payload.role ?? targetUser.role;
  const willBeActive = payload.is_active ?? targetUser.is_active;
  const isCurrentlyActiveAdmin = targetUser.role === 'admin' && targetUser.is_active !== false;
  const willStopBeingActiveAdmin = isCurrentlyActiveAdmin && (willBeAdmin !== 'admin' || willBeActive === false);

  if (!willStopBeingActiveAdmin) {
    return;
  }

  const [countRow] = await db('users')
    .where({ role: 'admin', is_active: true })
    .count('* as total');

  if (toInteger(countRow?.total) <= 1) {
    throw AppError.badRequest(
      'LAST_ADMIN',
      'At least one active admin account must remain.'
    );
  }
}

async function updateUser(userId, payload, actingAdminId) {
  const currentUser = await db('users').where({ id: userId }).first();

  if (!currentUser) {
    throw AppError.notFound('USER_NOT_FOUND', 'User not found');
  }

  if (Number(actingAdminId) === Number(userId)) {
    if (payload.role && payload.role !== 'admin') {
      throw AppError.badRequest(
        'SELF_ROLE_CHANGE_BLOCKED',
        'You cannot remove your own admin role from this screen.'
      );
    }

    if (payload.is_active === false) {
      throw AppError.badRequest(
        'SELF_DEACTIVATE_BLOCKED',
        'You cannot deactivate your own account.'
      );
    }
  }

  await ensureActiveAdminRemains(currentUser, payload);

  const nextEmail = payload.email ?? currentUser.email;

  if (nextEmail !== currentUser.email) {
    const duplicateUser = await db('users')
      .whereRaw('LOWER(email) = LOWER(?)', [nextEmail])
      .whereNot({ id: userId })
      .first();

    if (duplicateUser) {
      throw AppError.badRequest(
        'USER_EXISTS',
        'User with this email already exists.'
      );
    }
  }

  const nextUserPayload = {
    name: payload.name ?? currentUser.name,
    email: nextEmail,
    display_name: Object.prototype.hasOwnProperty.call(payload, 'display_name')
      ? payload.display_name
      : currentUser.display_name,
    role: payload.role ?? currentUser.role,
    is_active: Object.prototype.hasOwnProperty.call(payload, 'is_active')
      ? payload.is_active
      : currentUser.is_active,
    bio: Object.prototype.hasOwnProperty.call(payload, 'bio')
      ? payload.bio
      : currentUser.bio,
    avatar_url: Object.prototype.hasOwnProperty.call(payload, 'avatar_url')
      ? payload.avatar_url
      : currentUser.avatar_url,
    updated_at: db.fn.now(),
  };

  const [updatedUser] = await db('users')
    .where({ id: userId })
    .update(nextUserPayload, ['*']);

  try {
    await syncAuthUserForAppUser(updatedUser);
  } catch (error) {
    await db('users')
      .where({ id: userId })
      .update({
        name: currentUser.name,
        email: currentUser.email,
        display_name: currentUser.display_name,
        role: currentUser.role,
        is_active: currentUser.is_active,
        bio: currentUser.bio,
        avatar_url: currentUser.avatar_url,
        updated_at: db.fn.now(),
      });

    throw error;
  }

  return sanitizeUser(updatedUser);
}

async function listGames(filters = {}) {
  await ensureCatalogGames();

  const query = db('games as g')
    .leftJoin(buildGameSessionSummary(), 'game_session_summary.game_id', 'g.id')
    .leftJoin(buildGameRatingSummary(), 'game_rating_summary.game_id', 'g.id')
    .select(
      'g.id',
      'g.code',
      'g.name',
      'g.description',
      'g.board_size',
      'g.enabled',
      'g.created_at',
      db.raw('COALESCE(game_session_summary.session_count, 0)::int as session_count'),
      db.raw('COALESCE(game_session_summary.unique_players, 0)::int as unique_players'),
      db.raw('COALESCE(game_session_summary.last_played_at, NULL) as last_played_at'),
      db.raw('COALESCE(game_rating_summary.rating_count, 0)::int as rating_count'),
      db.raw('COALESCE(ROUND(game_rating_summary.average_rating::numeric, 1), 0) as average_rating')
    );

  if (filters.q) {
    const searchValue = `%${filters.q}%`;
    query.where((builder) => {
      builder
        .whereILike('g.name', searchValue)
        .orWhereILike('g.code', searchValue)
        .orWhereILike('g.description', searchValue);
    });
  }

  if (filters.status === 'enabled') {
    query.andWhere('g.enabled', true);
  }

  if (filters.status === 'disabled') {
    query.andWhere('g.enabled', false);
  }

  const rows = await query
    .orderBy('g.enabled', 'desc')
    .orderBy('session_count', 'desc')
    .orderBy('g.created_at', 'desc');

  return rows.map(sanitizeGame);
}

async function createGame(payload) {
  return gameService.create(payload);
}

async function updateGame(gameId, payload) {
  return gameService.update(gameId, payload);
}

module.exports = {
  createGame,
  getDashboardStats,
  listGames,
  listUsers,
  updateGame,
  updateUser,
};

