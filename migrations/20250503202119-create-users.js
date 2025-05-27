'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', { // Nome EXATO da tabela do modelo
      id: {
        type: Sequelize.STRING, // Ou BIGINT? Verificar tipo real do ID do usuário ML
        primaryKey: true,
        allowNull: false
      },
      nickname: { type: Sequelize.STRING, allowNull: true },
      user_type: { type: Sequelize.STRING, allowNull: true },
      level_id: { type: Sequelize.STRING, allowNull: true },
      power_seller_status: { type: Sequelize.STRING, allowNull: true },
      transactions_completed: { type: Sequelize.INTEGER, allowNull: true },
      sales_completed: { type: Sequelize.INTEGER, allowNull: true },
      claims_value: { type: Sequelize.REAL, allowNull: true }, // REAL para DECIMAL
      delayed_handling_time_value: { type: Sequelize.REAL, allowNull: true },
      cancellations_value: { type: Sequelize.REAL, allowNull: true }
      // Timestamps omitidos (conforme modelo)
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Users');
  }
};