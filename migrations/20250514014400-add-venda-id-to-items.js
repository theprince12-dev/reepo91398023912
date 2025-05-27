'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Adicionar coluna venda_id à tabela Items
    await queryInterface.addColumn('Items', 'venda_id', {
      type: Sequelize.STRING,
      allowNull: true,
      references: {
        model: 'Vendas',
        key: 'order_id' // Referencia o campo order_id da tabela Vendas
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Criar índice para melhorar o desempenho das consultas
    await queryInterface.addIndex('Items', ['venda_id'], {
      name: 'items_venda_id_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remover índice
    await queryInterface.removeIndex('Items', 'items_venda_id_idx');
    
    // Remover coluna
    await queryInterface.removeColumn('Items', 'venda_id');
  }
};
