const db = require('../../db/db.js');
const AppError = require('../../utils/appError.js');

const ACHIEVEMENT_DEFINITIONS = {
  'first-session': {
    name: 'First Session',
    description: 'Hoan thanh it nhat 1 van choi.',
    evaluate: (stats) => stats.finished_sessions >= 1,
  },
  'board-hopper': {
    name: 'Board Hopper',
    description: 'Trai nghiem toi thieu 3 tro choi khac nhau.',
    evaluate: (stats) => stats.unique_games >= 3,
  },
  analyst: {
    name: 'Analyst',
    description: 'De lai it nhat 2 danh gia game.',
    evaluate: (stats) => stats.rating_count >= 2,
  },
  archivist: {
    name: 'Archivist',
    description: 'Luu 3 save slot khac nhau.',
    evaluate: (stats) => stats.saved_sessions >= 3,
  },
  winner: {
    name: 'Winner',
    description: 'Thang 3 van doi khang voi may.',
    evaluate: (stats) => stats.wins >= 3,
  },
};

function toInteger(value) {
  const parsed = Number.parseInt(value ?? 0, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function ensureAchievementDefinitions() {
  const codes = Object.keys(ACHIEVEMENT_DEFINITIONS);
  const existingRows = await db('achievements')
    .whereIn('code', codes)
    .select('*');

  const existingByCode = new Map(
    existingRows.map((row) => [row.code, row])
  );

  const missingRows = codes
    .filter((code) => !existingByCode.has(code))
    .map((code) => ({
      code,
      name: ACHIEVEMENT_DEFINITIONS[code].name,
      description: ACHIEVEMENT_DEFINITIONS[code].description,
    }));

  if (missingRows.length) {
    const insertedRows = await db('achievements')
      .insert(missingRows)
      .returning('*');

    insertedRows.forEach((row) => {
      existingByCode.set(row.code, row);
    });
  }

  return codes
    .map((code) => existingByCode.get(code))
    .filter(Boolean);
}

async function getProgressStats(userId) {
  const [user, sessionOverview, ratingOverview, gameStatsOverview] =
    await Promise.all([
      db('users')
        .where({ id: userId })
        .first('id', 'name', 'display_name', 'email'),
      db('game_sessions as gs')
        .where('gs.owner_id', userId)
        .select(
          db.raw('COUNT(*)::int as total_sessions'),
          db.raw(
            `COUNT(*) FILTER (WHERE gs.status = 'finished')::int as finished_sessions`
          ),
          db.raw(
            `COUNT(*) FILTER (WHERE gs.status = 'saved')::int as saved_sessions`
          ),
          db.raw(
            `COALESCE(MAX(NULLIF(gs.settings->>'score', '')::int), 0)::int as high_score`
          )
        )
        .first(),
      db('ratings')
        .where({ user_id: userId })
        .count('* as rating_count')
        .first(),
      db('game_stats')
        .where({ user_id: userId })
        .select(
          db.raw('COUNT(DISTINCT game_id)::int as unique_games'),
          db.raw('COALESCE(SUM(wins), 0)::int as wins')
        )
        .first(),
    ]);

  if (!user) {
    throw AppError.notFound('USER_NOT_FOUND', 'User not found');
  }

  return {
    total_sessions: toInteger(sessionOverview?.total_sessions),
    finished_sessions: toInteger(sessionOverview?.finished_sessions),
    saved_sessions: toInteger(sessionOverview?.saved_sessions),
    rating_count: toInteger(ratingOverview?.rating_count),
    unique_games: toInteger(gameStatsOverview?.unique_games),
    wins: toInteger(gameStatsOverview?.wins),
    high_score: toInteger(sessionOverview?.high_score),
  };
}

function isAchievementUnlocked(code, stats) {
  const definition = ACHIEVEMENT_DEFINITIONS[code];
  return definition ? definition.evaluate(stats) : false;
}

async function syncUserAchievements(userId, stats, definitions) {
  const unlockedRows = definitions.filter((definition) =>
    isAchievementUnlocked(definition.code, stats)
  );

  if (!unlockedRows.length) {
    return [];
  }

  await db('user_achievements')
    .insert(
      unlockedRows.map((definition) => ({
        user_id: userId,
        achievement_id: definition.id,
      }))
    )
    .onConflict(['user_id', 'achievement_id'])
    .ignore();

  return unlockedRows;
}

async function listUserAchievements(userId) {
  const [definitions, stats] = await Promise.all([
    ensureAchievementDefinitions(),
    getProgressStats(userId),
  ]);

  await syncUserAchievements(userId, stats, definitions);

  const earnedRows = await db('user_achievements')
    .where({ user_id: userId })
    .select('achievement_id', 'earned_at');

  const earnedByAchievementId = new Map(
    earnedRows.map((row) => [row.achievement_id, row])
  );

  const achievements = definitions.map((definition) => {
    const earnedRow = earnedByAchievementId.get(definition.id);
    const unlocked =
      Boolean(earnedRow) ||
      isAchievementUnlocked(definition.code, stats);

    return {
      id: definition.code,
      db_id: definition.id,
      title: definition.name,
      description: definition.description,
      unlocked,
      earned_at: earnedRow?.earned_at || null,
    };
  });

  return {
    ...stats,
    achievements,
  };
}

module.exports = {
  listUserAchievements,
};
