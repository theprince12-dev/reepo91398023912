'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ValidacaoFretes', { // Nome EXATO da tabela do modelo
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      venda_id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      item_id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      frete_esperado: {
        type: Sequelize.REAL, // REAL para DECIMAL
        allowNull: true
      },
      frete_pago: {
        type: Sequelize.REAL, // REAL para DECIMAL
        allowNull: true
      }
      // Timestamps omitidos (conforme modelo)
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ValidacaoFretes');
  }
};