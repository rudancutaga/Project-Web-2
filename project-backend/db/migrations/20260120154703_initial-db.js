/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    await knex.schema.createTable("users", (table) => {
        table.increments("id").primary();
        table.string("name").notNullable();
        table.string("email").notNullable().unique();
        table.string("password").notNullable();
        table.date("due_date").notNullable();
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.timestamp("updated_at").defaultTo(knex.fn.now());
    });

    await knex.schema.createTable("media", (table) => {
        table.increments("id").primary();
        table.integer("user_id").unsigned().notNullable()
            .references("id").inTable("users")
            .onDelete("CASCADE");
        table.string("title").notNullable();
        table.text("description").notNullable();
        table.enu("status", ["PENDING", "DONE"]).defaultTo("PENDING");
        table
            .timestamp("created_at")
            .defaultTo(knex.fn.now());
        table
            .timestamp("updated_at")
            .defaultTo(knex.fn.now());

    });
    await knex.schema.createTable('refresh_tokens', (table) => {
    table.increments('id').primary();

    table
      .integer('user_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');

    table.string('token', 512).notNullable().unique();
    table.string('family', 64).notNullable();
    table.timestamp('expires_at').notNullable();
    table.boolean('is_revoked').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('revoked_at').nullable();

    table.index(['user_id', 'is_revoked']);
    table.index(['family']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    await knex.schema.dropTableIfExists("media");
    await knex.schema.dropTableIfExists("users");
    await knex.schema.dropTableIfExists('refresh_tokens');
};