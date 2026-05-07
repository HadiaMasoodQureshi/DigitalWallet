const { DataSource } = require('typeorm')
const User = require('../models/User')
const Transaction = require('../models/Transaction')
require('dotenv').config()

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: true,
  logging: true,
  entities: [User, Transaction]
})

module.exports = AppDataSource