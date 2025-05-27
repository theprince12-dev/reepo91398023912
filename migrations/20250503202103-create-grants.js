'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('grants', { // Nome EXATO da tabela do modelo
      user_id: {
        type: Sequelize.BIGINT, // Mantém BIGINT
        primaryKey: true,
        allowNull: false
      },
      application_id: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      date_created: {
        type: Sequelize.DATE,
        allowNull: true
      },
      authorized: {
        type: Sequelize.STRING,
        allowNull: true
      }
      // Timestamps omitidos (conforme modelo)
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('grants');
  }
};