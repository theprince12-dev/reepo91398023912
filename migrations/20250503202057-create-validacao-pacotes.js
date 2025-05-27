'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('validacao_pacotes', { // Nome EXATO da tabela
      shipping_id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      frete_calculado: {
        type: Sequelize.REAL, // Usar REAL para DECIMAL
        allowNull: true,
      },
      frete_cobrado_api: {
        type: Sequelize.REAL, // Usar REAL para DECIMAL
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
        type: Sequelize.TEXT, // Usar TEXT para JSON/lista longa
        allowNull: true,
      },
      data_validacao: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW, // Sequelize.NOW funciona aqui? Testar. Senão, remover default.
      },
      mensagem_erro: {
        type: Sequelize.TEXT,
        allowNull: true,
      }
      // Adicione createdAt/updatedAt se timestamps: true no modelo
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('validacao_pacotes');
  }
};