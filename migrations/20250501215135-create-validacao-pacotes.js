// Em migrations/xxxxxxxxxxxxxx-create-validacao-pacotes.js
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('validacao_pacotes', {
      shipping_id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      frete_calculado: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      frete_cobrado_api: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      coluna_tabela_usada: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      status_validacao: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'PENDENTE',
      },
      item_ids: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      data_validacao: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      mensagem_erro: {
        type: Sequelize.TEXT,
        allowNull: true,
      }
      // Remova createdAt e updatedAt se timestamps: false no Model
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
    await queryInterface.dropTable('validacao_pacotes');
  }
};