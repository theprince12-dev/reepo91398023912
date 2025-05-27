'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('normal_sul_sudeste', { // Nome EXATO da tabela do modelo
        faixa_peso: { type: Sequelize.STRING, primaryKey: true, allowNull: false },
        full_7899: { type: Sequelize.REAL, allowNull: true }, // REAL para DECIMAL
        outros_7899: { type: Sequelize.REAL, allowNull: true },
        full_79: { type: Sequelize.REAL, allowNull: true },
        outro_79: { type: Sequelize.REAL, allowNull: true }, // Nome da coluna conforme modelo
        full_especiais: { type: Sequelize.REAL, allowNull: true },
        outros_especiais: { type: Sequelize.REAL, allowNull: true }
      // Timestamps omitidos (conforme modelo)
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('normal_sul_sudeste');
  }
};