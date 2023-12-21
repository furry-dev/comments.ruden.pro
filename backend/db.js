const mysql = require('mysql2/promise')

require('dotenv').config()

module.exports = module.exports = mysql.createPool({
    host: process.env.RCOMMENTS_DB_HOST,
    user: process.env.RCOMMENTS_DB_USER,
    password: process.env.RCOMMENTS_DB_PASS,
    database: process.env.RCOMMENTS_DB_NAME,
    connectionLimit: process.env.RCOMMENTS_DB_CONLIMIT
})

