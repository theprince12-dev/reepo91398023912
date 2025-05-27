'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TabelaFretes', { // Nome EXATO da tabela do modelo
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
        peso_min: { type: Sequelize.REAL, allowNull: false }, // REAL para DECIMAL
        peso_max: { type: Sequelize.REAL, allowNull: false },
        reputacao: { type: Sequelize.STRING, allowNull: false },
        tipo_anuncio: { type: Sequelize.STRING, allowNull: false },
        regiao: { type: Sequelize.STRING, allowNull: false },
        valor_frete: { type: Sequelize.REAL, allowNull: false },
        full: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false }
       // Timestamps omitidos (conforme modelo)
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('TabelaFretes');
  }
};