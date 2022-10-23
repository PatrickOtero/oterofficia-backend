"use strict";
const knex = require('knex')({
    client: 'pg',
    connection: {
        user: process.env.DB_USER || process.env.DB_SERVER_USER,
        port: 5432,
        host: process.env.DB_HOST || process.env.DB_SERVER_HOST,
        database: process.env.DB_DATABASE || process.env.DB_SERVER_DATABASE,
        password: process.env.DB_PASS || process.env.DB_SERVER_PASS,
        //   ssl: { rejectUnauthorized: false },
    },
});
module.exports = knex;
