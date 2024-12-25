// src/config/database.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
   dialect: 'sqlite',
   storage: './mercado-livre.db', // Nome do banco de dados SQLite
});

module.exports = sequelize;