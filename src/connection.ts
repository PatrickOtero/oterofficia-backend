const knex = require('knex')({
    client: 'pg',
    connection: {
      user: process.env.DB_SERVER_USER || process.env.DB_USER,
      port: 5432,
      host: process.env.DB_SERVER_HOST || process.env.DB_HOST,
      database: process.env.DB_SERVER_DATABASE || process.env.DB_DATABASE,
      password: process.env.DB_SERVER_PASS || process.env.DB_PASS,
      // ssl: { rejectUnauthorized: false },
    },
  })
  
export = knex
