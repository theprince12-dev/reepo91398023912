'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('special_categories', { // Nome EXATO da tabela
      category_id: {
        type: Sequelize.STRING, // Use STRING para TEXT
        primaryKey: true,
        allowNull: false,
      },
      // Adicione outras colunas se houver
      // Adicione createdAt/updatedAt se timestamps: true no modelo
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('special_categories');
  }
};