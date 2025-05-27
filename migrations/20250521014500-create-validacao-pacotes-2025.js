'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('validacao_pacotes_2025', {
      shipping_id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      venda_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      status_validacao: {
        type: Sequelize.STRING,
        allowNull: true
      },
      frete_calculado: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      frete_cobrado_api: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      diferenca: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      coluna_tabela_usada: {
        type: Sequelize.STRING,
        allowNull: true
      },
      is_sulsudeste: {
        type: Sequelize.BOOLEAN,
        allowNull: true
      },
      is_special_category: {
        type: Sequelize.BOOLEAN,
        allowNull: true
      },
      is_fulfillment: {
        type: Sequelize.BOOLEAN,
        allowNull: true
      },
      is_novo_79: {
        type: Sequelize.BOOLEAN,
        allowNull: true
      },
      is_novo_100: {
        type: Sequelize.BOOLEAN,
        allowNull: true
      },
      is_novo_120: {
        type: Sequelize.BOOLEAN,
        allowNull: true
      },
      is_novo_150: {
        type: Sequelize.BOOLEAN,
        allowNull: true
      },
      is_novo_200: {
        type: Sequelize.BOOLEAN,
        allowNull: true
      },
      quantidade_itens: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      peso_kg: {
        type: Sequelize.DECIMAL(10, 4),
        allowNull: true
      },
      peso_volumetrico_kg: {
        type: Sequelize.DECIMAL(10, 4),
        allowNull: true
      },
      item_ids: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      mensagem_erro: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      data_venda: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('validacao_pacotes_2025');
  }
};
