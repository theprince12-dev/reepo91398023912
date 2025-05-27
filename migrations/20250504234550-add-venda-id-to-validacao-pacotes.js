'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    console.log("Adicionando coluna 'venda_id' à tabela 'validacao_pacotes'");
    await queryInterface.addColumn(
      'validacao_pacotes', // Nome da tabela que recebe a coluna
      'venda_id',          // Nome da nova coluna
      {
        type: Sequelize.STRING, // Mesmo tipo que venda_id em DetalhesVendas
        allowNull: true, // Permitir nulo inicialmente ou se houver erro ao obter
        after: 'shipping_id' // Opcional: Posição da coluna na tabela
      }
    );
    // Opcional: Adicionar um índice para busca rápida por venda_id
    console.log("Adicionando índice na coluna 'venda_id'");
    await queryInterface.addIndex('validacao_pacotes', ['venda_id'], {
        name: 'validacao_pacotes_venda_id_idx'
    });
     console.log("Coluna e índice 'venda_id' adicionados com sucesso.");
  },

  async down (queryInterface, Sequelize) {
    console.log("Removendo índice da coluna 'venda_id'");
    await queryInterface.removeIndex('validacao_pacotes', 'validacao_pacotes_venda_id_idx');

    console.log("Removendo coluna 'venda_id' da tabela 'validacao_pacotes'");
    await queryInterface.removeColumn('validacao_pacotes', 'venda_id');

     console.log("Coluna e índice 'venda_id' removidos com sucesso.");
  }
};