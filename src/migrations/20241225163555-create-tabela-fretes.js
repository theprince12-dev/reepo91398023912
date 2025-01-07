// src/migrations/XXXXXXXXXXXXXX-create-tabela-fretes.js
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
async up(queryInterface, Sequelize) {
await queryInterface.createTable('TabelaFretes', {
id: {
allowNull: false,
autoIncrement: true,
primaryKey: true,
type: Sequelize.INTEGER
},
peso_min: {
type: Sequelize.REAL, // Alterado para REAL
allowNull: false
},
peso_max: {
type: Sequelize.REAL, // Alterado para REAL
allowNull: false
},
reputacao: {
type: Sequelize.STRING,
allowNull: false
},
tipo_anuncio: {
type: Sequelize.STRING,
allowNull: false
},
regiao: {
type: Sequelize.STRING,
allowNull: false
},
valor_frete: {
type: Sequelize.REAL, // Alterado para REAL
allowNull: false
},
full: {
type: Sequelize.BOOLEAN,
defaultValue: false
},
createdAt: {
allowNull: false,
type: Sequelize.DATE
},
updatedAt: {
allowNull: false,
type: Sequelize.DATE
}
});
},
async down(queryInterface, Sequelize) {
await queryInterface.dropTable('TabelaFretes');
}
};