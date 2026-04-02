const AchievementSchemas = {
  Achievement: {
    type: 'object',
    required: ['id', 'title', 'description', 'unlocked'],
    properties: {
      id: { type: 'string' },
      db_id: { type: 'integer', format: 'int32', nullable: true },
      title: { type: 'string' },
      description: { type: 'string' },
      unlocked: { type: 'boolean' },
      earned_at: { type: 'string', format: 'date-time', nullable: true },
    },
    example: {
      id: 'analyst',
      db_id: 3,
      title: 'Analyst',
      description: 'De lai it nhat 2 danh gia game.',
      unlocked: true,
      earned_at: '2026-04-02T08:15:00.000Z',
    },
  },
  UserProgressSummary: {
    type: 'object',
    required: [
      'total_sessions',
      'finished_sessions',
      'saved_sessions',
      'rating_count',
      'unique_games',
      'wins',
      'high_score',
      'achievements',
    ],
    properties: {
      total_sessions: { type: 'integer', format: 'int32' },
      finished_sessions: { type: 'integer', format: 'int32' },
      saved_sessions: { type: 'integer', format: 'int32' },
      rating_count: { type: 'integer', format: 'int32' },
      unique_games: { type: 'integer', format: 'int32' },
      wins: { type: 'integer', format: 'int32' },
      high_score: { type: 'integer', format: 'int32' },
      achievements: {
        type: 'array',
        items: { $ref: '#/components/schemas/Achievement' },
      },
    },
    example: {
      total_sessions: 8,
      finished_sessions: 5,
      saved_sessions: 2,
      rating_count: 3,
      unique_games: 4,
      wins: 6,
      high_score: 140,
      achievements: [
        {
          id: 'first-session',
          db_id: 1,
          title: 'First Session',
          description: 'Hoan thanh it nhat 1 van choi.',
          unlocked: true,
          earned_at: '2026-04-02T08:15:00.000Z',
        },
      ],
    },
  },
};

module.exports = AchievementSchemas;
