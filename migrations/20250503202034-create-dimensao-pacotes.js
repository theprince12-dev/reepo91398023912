'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('DimensaoPacotes', { // Nome EXATO da tabela
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      shipment_id: {
        type: Sequelize.STRING, // Use STRING para TEXT no SQLite com Sequelize
        allowNull: false,
        unique: true,
      },
      height: {
        type: Sequelize.REAL, // Use REAL para valores decimais no SQLite
        allowNull: true,
      },
      width: {
        type: Sequelize.REAL,
        allowNull: true,
      },
      length: {
        type: Sequelize.REAL,
        allowNull: true,
      },
      weight: {
        type: Sequelize.REAL, // Assumindo peso pode ter decimais (em gramas ou kg?)
        allowNull: true,
      },
      // Remova createdAt/updatedAt se timestamps: false no modelo
      // createdAt: {
      //   allowNull: false,
      //   type: Sequelize.DATE
      // },
      // updatedAt: {
      //   allowNull: false,
      //   type: Sequelize.DATE
      // }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('DimensaoPacotes');
  }
};