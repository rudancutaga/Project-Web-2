/**
 * Seed synchronized demo data for the 7-game frontend catalog.
 */
const bcrypt = require('bcrypt');

exports.seed = async function (knex) {
  await knex.raw(`
    TRUNCATE TABLE
      game_moves,
      game_sessions,
      ratings,
      game_stats,
      user_achievements,
      achievements,
      messages,
      friendships,
      refresh_tokens,
      media,
      games,
      users
    RESTART IDENTITY CASCADE
  `);

  const passwordHash = bcrypt.hashSync('password123', 10);

  const [admin, alice, bob, charlie, diana, eva] = await knex('users')
    .insert([
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: passwordHash,
        role: 'admin',
        display_name: 'Admin',
        bio: 'Quan tri vien danh cho BoardVerse.',
        is_active: true,
      },
      {
        name: 'Alice',
        email: 'alice@example.com',
        password: passwordHash,
        role: 'client',
        display_name: 'Alice',
        bio: 'Nguoi choi yeu thich caro va memory.',
        is_active: true,
      },
      {
        name: 'Bob',
        email: 'bob@example.com',
        password: passwordHash,
        role: 'client',
        display_name: 'Bob',
        bio: 'Nguoi choi nghien match-3 va snake.',
        is_active: true,
      },
      {
        name: 'Charlie',
        email: 'charlie@example.com',
        password: passwordHash,
        role: 'client',
        display_name: 'Charlie',
        bio: 'Tap trung vao memory va bang ve tu do.',
        is_active: true,
      },
      {
        name: 'Diana',
        email: 'diana@example.com',
        password: passwordHash,
        role: 'client',
        display_name: 'Diana',
        bio: 'Nguoi choi thich game toc do nhu snake va caro hang 4.',
        is_active: true,
      },
      {
        name: 'Eva',
        email: 'eva@example.com',
        password: passwordHash,
        role: 'client',
        display_name: 'Eva',
        bio: 'Thu nghiem cac game de danh gia UX va save/load.',
        is_active: true,
      },
    ])
    .returning('*');

  const achievements = await knex('achievements')
    .insert([
      {
        code: 'first-session',
        name: 'First Session',
        description: 'Hoan thanh it nhat 1 van choi.',
      },
      {
        code: 'board-hopper',
        name: 'Board Hopper',
        description: 'Trai nghiem toi thieu 3 tro choi khac nhau.',
      },
      {
        code: 'analyst',
        name: 'Analyst',
        description: 'De lai it nhat 2 danh gia game.',
      },
      {
        code: 'archivist',
        name: 'Archivist',
        description: 'Luu 3 save slot khac nhau.',
      },
      {
        code: 'winner',
        name: 'Winner',
        description: 'Thang 3 van doi khang voi may.',
      },
    ])
    .returning('*');

  const achievementMap = Object.fromEntries(
    achievements.map((achievement) => [achievement.code, achievement])
  );

  const games = await knex('games')
    .insert([
      {
        code: 'GOMOKU5',
        name: 'Caro hang 5',
        description:
          'Dat 5 quan lien tiep tren ban co rong, doi thu may se danh nuoc ngau nhien hop le.',
        board_size: 10,
        enabled: true,
      },
      {
        code: 'GOMOKU4',
        name: 'Caro hang 4',
        description: 'Bien the nho hon cua caro, thang khi tao duoc 4 quan lien tiep.',
        board_size: 7,
        enabled: true,
      },
      {
        code: 'TTT',
        name: 'Tic-tac-toe',
        description:
          'Phien ban 3x3 kinh dien, phu hop de test nhanh toan bo control va luong save/load.',
        board_size: 3,
        enabled: true,
      },
      {
        code: 'SNAKE',
        name: 'Ran san moi',
        description:
          'Ran tu dong di chuyen. Left va Right dung de re huong, Enter bat dau hoac tam dung.',
        board_size: 8,
        enabled: true,
      },
      {
        code: 'MATCH3',
        name: 'Ghep hang 3',
        description:
          'Chon hai o ke nhau de doi cho. Tao thanh 3 mau giong nhau de an diem.',
        board_size: 6,
        enabled: true,
      },
      {
        code: 'MEMORY',
        name: 'Co tri nho',
        description:
          'Lat tung the de tim cap giong nhau, ghi nho vi tri cang nhanh cang tot.',
        board_size: 4,
        enabled: true,
      },
      {
        code: 'DRAW',
        name: 'Bang ve tu do',
        description:
          'To mau tung o tren ban co. Back hoan tac, Hint/Help doi brush va hien meo ve nhanh.',
        board_size: 8,
        enabled: true,
      },
    ])
    .returning('*');

  const gameMap = Object.fromEntries(games.map((game) => [game.code, game]));

  await knex('friendships').insert([
    { requester_id: alice.id, addressee_id: bob.id, status: 'accepted' },
    { requester_id: admin.id, addressee_id: alice.id, status: 'pending' },
    { requester_id: admin.id, addressee_id: bob.id, status: 'accepted' },
    { requester_id: charlie.id, addressee_id: alice.id, status: 'accepted' },
    { requester_id: diana.id, addressee_id: bob.id, status: 'accepted' },
    { requester_id: eva.id, addressee_id: admin.id, status: 'pending' },
  ]);

  await knex('messages').insert([
    { sender_id: alice.id, receiver_id: bob.id, body: 'Toi vua save mot van memory, vao xem thu nhe.' },
    { sender_id: bob.id, receiver_id: alice.id, body: 'Ok, toi se vao sau khi choi xong match-3.' },
    { sender_id: admin.id, receiver_id: alice.id, body: 'Dashboard moi da dong bo du 7 game roi.' },
    { sender_id: admin.id, receiver_id: bob.id, body: 'Nho test ranking cua snake va free-draw giup toi.' },
    { sender_id: charlie.id, receiver_id: alice.id, body: 'Memory cua minh vua dat diem cao, xem ranking giup nha.' },
    { sender_id: diana.id, receiver_id: bob.id, body: 'Snake loop da on hon roi, toi dang test them tren HTTPS.' },
    { sender_id: eva.id, receiver_id: admin.id, body: 'Profile backend da cap nhat duoc display name va bio.' },
  ]);

  await knex('ratings').insert([
    {
      game_id: gameMap.GOMOKU5.id,
      user_id: admin.id,
      stars: 5,
      comment: 'Board lon, rat hop de demo control pad.',
    },
    {
      game_id: gameMap.GOMOKU5.id,
      user_id: alice.id,
      stars: 5,
      comment: 'Cam giac choi caro muot va ro rang.',
    },
    {
      game_id: gameMap.GOMOKU4.id,
      user_id: alice.id,
      stars: 4,
      comment: 'Nhip nhanh hon ban caro hang 5, de vao van.',
    },
    {
      game_id: gameMap.GOMOKU4.id,
      user_id: bob.id,
      stars: 4,
      comment: 'Hop de choi nhanh trong luc nghi giai.',
    },
    {
      game_id: gameMap.TTT.id,
      user_id: alice.id,
      stars: 5,
      comment: 'Nhanh, de demo, rat hop cho bai nop.',
    },
    {
      game_id: gameMap.TTT.id,
      user_id: bob.id,
      stars: 4,
      comment: 'UI de nhin, thao tac on.',
    },
    {
      game_id: gameMap.SNAKE.id,
      user_id: admin.id,
      stars: 4,
      comment: 'Dieu huong on, rat de test keyboard loop.',
    },
    {
      game_id: gameMap.SNAKE.id,
      user_id: bob.id,
      stars: 5,
      comment: 'Rat cuon, score tang nhanh va de stress test.',
    },
    {
      game_id: gameMap.MATCH3.id,
      user_id: admin.id,
      stars: 4,
      comment: 'Hieu ung doi cho va tinh diem rat on.',
    },
    {
      game_id: gameMap.MATCH3.id,
      user_id: bob.id,
      stars: 5,
      comment: 'Day la game toi quay lai nhieu nhat.',
    },
    {
      game_id: gameMap.MEMORY.id,
      user_id: alice.id,
      stars: 5,
      comment: 'Lat the nhanh va de nhin.',
    },
    {
      game_id: gameMap.MEMORY.id,
      user_id: admin.id,
      stars: 4,
      comment: 'Hint ho tro rat tot khi demo.',
    },
    {
      game_id: gameMap.DRAW.id,
      user_id: admin.id,
      stars: 4,
      comment: 'Brush doi mau nhanh, hop de trinh dien.',
    },
    {
      game_id: gameMap.DRAW.id,
      user_id: bob.id,
      stars: 4,
      comment: 'Ve nghich vui, luu session kha tien.',
    },
    {
      game_id: gameMap.MEMORY.id,
      user_id: charlie.id,
      stars: 5,
      comment: 'Rat hop de test save/load va gameplay theo nhip ngan.',
    },
    {
      game_id: gameMap.DRAW.id,
      user_id: charlie.id,
      stars: 4,
      comment: 'Bang ve de su dung, mau brush thay doi kha ro.',
    },
    {
      game_id: gameMap.GOMOKU4.id,
      user_id: diana.id,
      stars: 5,
      comment: 'Board gon, choi nhanh, rat hop de benchmark UI.',
    },
    {
      game_id: gameMap.SNAKE.id,
      user_id: diana.id,
      stars: 4,
      comment: 'Toc do tot, control trai phai kha de cam.',
    },
    {
      game_id: gameMap.TTT.id,
      user_id: eva.id,
      stars: 5,
      comment: 'Flow ngan, rat hop de check route va session.',
    },
    {
      game_id: gameMap.MATCH3.id,
      user_id: eva.id,
      stars: 4,
      comment: 'Swap va tinh diem on dinh, de quan sat thong ke.',
    },
  ]);

  await knex('game_stats').insert([
    { game_id: gameMap.GOMOKU5.id, user_id: admin.id, total_score: 220, wins: 11, losses: 4, draws: 2 },
    { game_id: gameMap.GOMOKU5.id, user_id: alice.id, total_score: 260, wins: 13, losses: 5, draws: 1 },
    { game_id: gameMap.GOMOKU5.id, user_id: bob.id, total_score: 180, wins: 8, losses: 7, draws: 2 },

    { game_id: gameMap.GOMOKU4.id, user_id: alice.id, total_score: 170, wins: 9, losses: 3, draws: 2 },
    { game_id: gameMap.GOMOKU4.id, user_id: bob.id, total_score: 162, wins: 8, losses: 4, draws: 3 },

    { game_id: gameMap.TTT.id, user_id: admin.id, total_score: 88, wins: 5, losses: 4, draws: 3 },
    { game_id: gameMap.TTT.id, user_id: alice.id, total_score: 130, wins: 9, losses: 2, draws: 1 },
    { game_id: gameMap.TTT.id, user_id: bob.id, total_score: 96, wins: 6, losses: 5, draws: 2 },

    { game_id: gameMap.SNAKE.id, user_id: admin.id, total_score: 145, wins: 6, losses: 2, draws: 0 },
    { game_id: gameMap.SNAKE.id, user_id: bob.id, total_score: 205, wins: 10, losses: 3, draws: 0 },

    { game_id: gameMap.MATCH3.id, user_id: admin.id, total_score: 150, wins: 7, losses: 2, draws: 1 },
    { game_id: gameMap.MATCH3.id, user_id: bob.id, total_score: 225, wins: 11, losses: 2, draws: 1 },

    { game_id: gameMap.MEMORY.id, user_id: admin.id, total_score: 118, wins: 4, losses: 1, draws: 0 },
    { game_id: gameMap.MEMORY.id, user_id: alice.id, total_score: 210, wins: 9, losses: 1, draws: 0 },
    { game_id: gameMap.MEMORY.id, user_id: charlie.id, total_score: 184, wins: 8, losses: 2, draws: 0 },

    { game_id: gameMap.DRAW.id, user_id: admin.id, total_score: 130, wins: 5, losses: 2, draws: 0 },
    { game_id: gameMap.DRAW.id, user_id: bob.id, total_score: 168, wins: 7, losses: 2, draws: 0 },
    { game_id: gameMap.DRAW.id, user_id: charlie.id, total_score: 142, wins: 6, losses: 2, draws: 0 },

    { game_id: gameMap.GOMOKU4.id, user_id: diana.id, total_score: 188, wins: 10, losses: 3, draws: 1 },
    { game_id: gameMap.SNAKE.id, user_id: diana.id, total_score: 176, wins: 8, losses: 2, draws: 0 },

    { game_id: gameMap.TTT.id, user_id: eva.id, total_score: 110, wins: 7, losses: 3, draws: 1 },
    { game_id: gameMap.MATCH3.id, user_id: eva.id, total_score: 172, wins: 8, losses: 3, draws: 1 },
  ]);

  const [
    tttFinished,
    gomoku5Finished,
    snakeActive,
    match3Saved,
    memorySaved,
    drawFinished,
    memoryFinishedCharlie,
    gomoku4ActiveDiana,
    tttSavedEva,
  ] =
    await knex('game_sessions')
      .insert([
        {
          game_id: gameMap.TTT.id,
          owner_id: admin.id,
          status: 'finished',
          settings: {
            gameId: 'tic-tac-toe',
            score: 120,
            winner: 'player',
            runtime: {
              engine: 'gomoku',
              board: ['X', 'X', 'X', 'O', 'O', '', '', '', ''],
              ended: true,
              winner: 'player',
              isDraw: false,
              score: 120,
            },
          },
        },
        {
          game_id: gameMap.GOMOKU5.id,
          owner_id: alice.id,
          status: 'finished',
          settings: {
            gameId: 'gomoku-5',
            score: 200,
            winner: 'player',
            runtime: {
              engine: 'gomoku',
              ended: true,
              winner: 'player',
              isDraw: false,
              score: 200,
            },
          },
        },
        {
          game_id: gameMap.SNAKE.id,
          owner_id: bob.id,
          status: 'active',
          settings: {
            gameId: 'snake',
            score: 75,
            runtime: {
              engine: 'snake',
              running: true,
              ended: false,
              score: 75,
              direction: 'right',
            },
          },
        },
        {
          game_id: gameMap.MATCH3.id,
          owner_id: admin.id,
          status: 'saved',
          settings: {
            gameId: 'match-3',
            score: 92,
            runtime: {
              engine: 'match3',
              ended: false,
              score: 92,
              selectedIndex: null,
            },
          },
        },
        {
          game_id: gameMap.MEMORY.id,
          owner_id: alice.id,
          status: 'saved',
          settings: {
            gameId: 'memory',
            score: 66,
            runtime: {
              engine: 'memory',
              ended: false,
              score: 66,
              matchedIndices: [0, 1, 2, 3],
            },
          },
        },
        {
          game_id: gameMap.DRAW.id,
          owner_id: bob.id,
          status: 'finished',
          settings: {
            gameId: 'free-draw',
            score: 110,
            winner: 'player',
            runtime: {
              engine: 'draw',
              ended: true,
              score: 110,
            },
          },
        },
        {
          game_id: gameMap.MEMORY.id,
          owner_id: charlie.id,
          status: 'finished',
          settings: {
            gameId: 'memory',
            score: 140,
            winner: 'player',
            runtime: {
              engine: 'memory',
              ended: true,
              score: 140,
              matchedIndices: [0, 1, 2, 3, 4, 5, 6, 7],
            },
          },
        },
        {
          game_id: gameMap.GOMOKU4.id,
          owner_id: diana.id,
          status: 'active',
          settings: {
            gameId: 'gomoku-4',
            score: 54,
            runtime: {
              engine: 'gomoku',
              ended: false,
              score: 54,
              cursorIndex: 12,
            },
          },
        },
        {
          game_id: gameMap.TTT.id,
          owner_id: eva.id,
          status: 'saved',
          settings: {
            gameId: 'tic-tac-toe',
            score: 40,
            runtime: {
              engine: 'gomoku',
              board: ['X', '', '', '', 'O', '', '', '', ''],
              ended: false,
              score: 40,
            },
          },
        },
      ])
      .returning('*');

  await knex('game_moves').insert([
    {
      session_id: tttFinished.id,
      move_no: 0,
      payload: { index: 0, value: 'X', board: ['X', '', '', '', '', '', '', '', ''] },
      score_delta: 10,
    },
    {
      session_id: tttFinished.id,
      move_no: 1,
      payload: { index: 3, value: 'O', board: ['X', '', '', 'O', '', '', '', '', ''] },
      score_delta: 0,
    },
    {
      session_id: tttFinished.id,
      move_no: 2,
      payload: { index: 1, value: 'X', board: ['X', 'X', '', 'O', '', '', '', '', ''] },
      score_delta: 10,
    },
    {
      session_id: tttFinished.id,
      move_no: 3,
      payload: { index: 4, value: 'O', board: ['X', 'X', '', 'O', 'O', '', '', '', ''] },
      score_delta: 0,
    },
    {
      session_id: tttFinished.id,
      move_no: 4,
      payload: { index: 2, value: 'X', board: ['X', 'X', 'X', 'O', 'O', '', '', '', ''] },
      score_delta: 50,
    },
    {
      session_id: gomoku5Finished.id,
      move_no: 0,
      payload: { index: 44, value: 'X' },
      score_delta: 10,
    },
    {
      session_id: gomoku5Finished.id,
      move_no: 1,
      payload: { index: 45, value: 'O' },
      score_delta: 0,
    },
    {
      session_id: match3Saved.id,
      move_no: 0,
      payload: { swap: [7, 8], matched: [6, 7, 8] },
      score_delta: 24,
    },
    {
      session_id: memorySaved.id,
      move_no: 0,
      payload: { reveal: [0, 5], matched: false },
      score_delta: 0,
    },
    {
      session_id: drawFinished.id,
      move_no: 0,
      payload: { paint: [0, 1, 2], tone: 'cyan' },
      score_delta: 12,
    },
    {
      session_id: memoryFinishedCharlie.id,
      move_no: 0,
      payload: { reveal: [2, 9], matched: true },
      score_delta: 18,
    },
    {
      session_id: gomoku4ActiveDiana.id,
      move_no: 0,
      payload: { index: 12, value: 'X' },
      score_delta: 8,
    },
    {
      session_id: tttSavedEva.id,
      move_no: 0,
      payload: { index: 4, value: 'O', board: ['', '', '', '', 'O', '', '', '', ''] },
      score_delta: 5,
    },
  ]);

  await knex('user_achievements').insert([
    { user_id: admin.id, achievement_id: achievementMap['first-session'].id },
    { user_id: admin.id, achievement_id: achievementMap['board-hopper'].id },
    { user_id: admin.id, achievement_id: achievementMap.analyst.id },
    { user_id: admin.id, achievement_id: achievementMap.winner.id },

    { user_id: alice.id, achievement_id: achievementMap['first-session'].id },
    { user_id: alice.id, achievement_id: achievementMap['board-hopper'].id },
    { user_id: alice.id, achievement_id: achievementMap.analyst.id },

    { user_id: bob.id, achievement_id: achievementMap['first-session'].id },
    { user_id: bob.id, achievement_id: achievementMap.analyst.id },
    { user_id: bob.id, achievement_id: achievementMap.winner.id },

    { user_id: charlie.id, achievement_id: achievementMap['first-session'].id },
    { user_id: diana.id, achievement_id: achievementMap['first-session'].id },
    { user_id: eva.id, achievement_id: achievementMap['first-session'].id },
  ]);
};
