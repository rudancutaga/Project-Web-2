/**
 * Extended schema for game & social features.
 */
exports.up = async function (knex) {
  // users: add role, display fields, drop unused due_date
  await knex.schema.alterTable('users', (table) => {
    table.string('role').notNullable().defaultTo('client');
    table.string('display_name');
    table.string('avatar_url');
    table.text('bio');
    table.boolean('dark_mode').defaultTo(false);
    table.dropColumn('due_date');
  });

  await knex.schema.createTable('friendships', (table) => {
    table.increments('id').primary();
    table.integer('requester_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('addressee_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.enu('status', ['pending', 'accepted', 'blocked']).defaultTo('pending');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.unique(['requester_id', 'addressee_id']);
  });

  await knex.schema.createTable('messages', (table) => {
    table.increments('id').primary();
    table.integer('sender_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('receiver_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('body').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.index(['receiver_id']);
  });

  await knex.schema.createTable('games', (table) => {
    table.increments('id').primary();
    table.string('code').notNullable().unique();
    table.string('name').notNullable();
    table.text('description');
    table.integer('board_size').defaultTo(3);
    table.boolean('enabled').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('game_sessions', (table) => {
    table.increments('id').primary();
    table.integer('game_id').unsigned().notNullable().references('id').inTable('games').onDelete('CASCADE');
    table.integer('owner_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.enu('status', ['active', 'finished', 'saved', 'abandoned']).defaultTo('active');
    table.jsonb('settings');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('game_moves', (table) => {
    table.increments('id').primary();
    table.integer('session_id').unsigned().notNullable().references('id').inTable('game_sessions').onDelete('CASCADE');
    table.integer('move_no').unsigned().notNullable();
    table.jsonb('payload').notNullable();
    table.integer('score_delta').defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.unique(['session_id', 'move_no']);
  });

  await knex.schema.createTable('achievements', (table) => {
    table.increments('id').primary();
    table.string('code').notNullable().unique();
    table.string('name').notNullable();
    table.text('description');
  });

  await knex.schema.createTable('user_achievements', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('achievement_id').unsigned().notNullable().references('id').inTable('achievements').onDelete('CASCADE');
    table.timestamp('earned_at').defaultTo(knex.fn.now());
    table.unique(['user_id', 'achievement_id']);
  });

  await knex.schema.createTable('ratings', (table) => {
    table.increments('id').primary();
    table.integer('game_id').unsigned().notNullable().references('id').inTable('games').onDelete('CASCADE');
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('stars').notNullable();
    table.text('comment');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.unique(['game_id', 'user_id']);
  });

  await knex.schema.createTable('game_stats', (table) => {
    table.increments('id').primary();
    table.integer('game_id').unsigned().notNullable().references('id').inTable('games').onDelete('CASCADE');
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('total_score').defaultTo(0);
    table.integer('wins').defaultTo(0);
    table.integer('losses').defaultTo(0);
    table.integer('draws').defaultTo(0);
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.unique(['game_id', 'user_id']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('game_stats');
  await knex.schema.dropTableIfExists('ratings');
  await knex.schema.dropTableIfExists('user_achievements');
  await knex.schema.dropTableIfExists('achievements');
  await knex.schema.dropTableIfExists('game_moves');
  await knex.schema.dropTableIfExists('game_sessions');
  await knex.schema.dropTableIfExists('games');
  await knex.schema.dropTableIfExists('messages');
  await knex.schema.dropTableIfExists('friendships');
  await knex.schema.alterTable('users', (table) => {
    table.dropColumns('role', 'display_name', 'avatar_url', 'bio', 'dark_mode');
    table.date('due_date').notNullable();
  });
};
