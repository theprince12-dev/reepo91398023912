'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    console.log("Adicionando coluna 'frete_ideal_reputacao_verde' à tabela 'validacao_pacotes'");
    await queryInterface.addColumn(
      'validacao_pacotes',      // Nome da tabela
      'frete_ideal_reputacao_verde', // Nome da nova coluna
      {
        type: Sequelize.REAL,   // Mesmo tipo que frete_calculado e frete_cobrado_api
        allowNull: true,        // Pode ser nulo se o cálculo falhar
        after: 'frete_cobrado_api' // Opcional: Posição da coluna
      }
    );
    console.log("Coluna 'frete_ideal_reputacao_verde' adicionada com sucesso.");
  },

  async down (queryInterface, Sequelize) {
    console.log("Removendo coluna 'frete_ideal_reputacao_verde' da tabela 'validacao_pacotes'");
    await queryInterface.removeColumn('validacao_pacotes', 'frete_ideal_reputacao_verde');
    console.log("Coluna 'frete_ideal_reputacao_verde' removida com sucesso.");
  }
};