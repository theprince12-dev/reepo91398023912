'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('PlanilhaVendas', { // Nome EXATO da tabela do modelo
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      venda_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      tarifa_envio: {
        type: Sequelize.REAL, // REAL para DECIMAL
        allowNull: true,
      },
      receita_envio: {
        type: Sequelize.REAL, // REAL para DECIMAL
        allowNull: true,
      },
      frete_validado: {
        type: Sequelize.REAL, // REAL para DECIMAL
        allowNull: true
      },
      // Timestamps omitidos (conforme modelo)
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('PlanilhaVendas');
  }
};