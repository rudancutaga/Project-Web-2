exports.up = async function (knex) {
  await knex.schema.alterTable('users', (table) => {
    table.uuid('auth_user_id').unique();
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('auth_user_id');
  });
};
