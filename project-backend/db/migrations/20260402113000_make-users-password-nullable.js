exports.up = async function (knex) {
  await knex.raw('ALTER TABLE users ALTER COLUMN password DROP NOT NULL');
};

exports.down = async function (knex) {
  await knex.raw(
    "UPDATE users SET password = CONCAT('supabase-migrated-', id::text) WHERE password IS NULL"
  );
  await knex.raw('ALTER TABLE users ALTER COLUMN password SET NOT NULL');
};
