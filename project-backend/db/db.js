const knex = require('knex');
const knexConfig = require('../knexfile.js');

const enviroment = process.env.NODE_ENV || 'development';
const db = knex(knexConfig[enviroment]);

module.exports = db;
