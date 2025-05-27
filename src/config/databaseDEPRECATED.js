// src/config/database.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './mercado-livre.db', // Nome do banco de dados SQLite
  logging: false, // Desabilita logs do sequelize
});

// Remova a opção alter: true
sequelize.sync()
  .then(() => {
    console.log('Banco de dados sincronizado com sucesso!');
  })
  .catch((error) => {
    console.error('Erro ao sincronizar o banco de dados:', error);
  });

module.exports = sequelize;