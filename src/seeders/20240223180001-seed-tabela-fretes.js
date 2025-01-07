// src/seeders/20240223180001-seed-tabela-fretes.js
'use strict';
const tabelaFreteSeed = require('./tabelaFreteSeed.js');
/** @type {import('sequelize-cli').Migration} */
module.exports = {
async up (queryInterface, Sequelize) {
await queryInterface.bulkInsert('TabelaFretes', tabelaFreteSeed, {});
},
async down (queryInterface, Sequelize) {
     await queryInterface.bulkDelete('TabelaFretes', null, {});
}
};