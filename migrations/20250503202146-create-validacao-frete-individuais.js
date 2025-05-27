'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ValidacaoFreteIndividuais', { // Nome EXATO da tabela do modelo
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      venda_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true // Mantém unique se definido no modelo
      },
      item_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      frete_esperado: {
        type: Sequelize.REAL, // REAL para DECIMAL
        allowNull: true
      },
      frete_pago: {
        type: Sequelize.REAL, // REAL para DECIMAL
        allowNull: true
      },
      status: {
        type: Sequelize.STRING, // Ou TEXT
        allowNull: true
      },
      shipping_options: {
        type: Sequelize.TEXT, // Usar TEXT para JSON
        allowNull: true
      }
      // Timestamps omitidos (conforme modelo)
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ValidacaoFreteIndividuais');
  }
};