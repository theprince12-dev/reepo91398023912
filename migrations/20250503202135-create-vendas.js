'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Vendas', { // Nome EXATO da tabela do modelo
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      order_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      date_created: {
        type: Sequelize.DATE,
        allowNull: false
      },
      buyer_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      buyer_nickname: {
        type: Sequelize.STRING,
        allowNull: true
      },
      status: {
        type: Sequelize.STRING,
        allowNull: true
      },
      total_amount: {
        type: Sequelize.REAL, // REAL para DECIMAL
        allowNull: true
      }
      // Timestamps omitidos (conforme modelo)
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Vendas');
  }
};