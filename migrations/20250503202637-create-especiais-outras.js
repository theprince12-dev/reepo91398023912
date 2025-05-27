'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('especiais_outras', { // Nome EXATO da tabela do modelo
        faixa_peso: { type: Sequelize.STRING, primaryKey: true, allowNull: false },
        full_lider: { type: Sequelize.REAL, allowNull: true }, // REAL para DECIMAL
        full_verde: { type: Sequelize.REAL, allowNull: true },
        full_amarelo: { type: Sequelize.REAL, allowNull: true },
        full_sem: { type: Sequelize.REAL, allowNull: true },
        full_laranja: { type: Sequelize.REAL, allowNull: true },
        full_vermelho: { type: Sequelize.REAL, allowNull: true },
        outros_lider: { type: Sequelize.REAL, allowNull: true },
        outros_verde: { type: Sequelize.REAL, allowNull: true },
        outros_amarelo: { type: Sequelize.REAL, allowNull: true },
        outros_sem: { type: Sequelize.REAL, allowNull: true },
        outros_laranja: { type: Sequelize.REAL, allowNull: true },
        outros_vermelho: { type: Sequelize.REAL, allowNull: true }
      // Timestamps omitidos (conforme modelo)
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('especiais_outras');
  }
};