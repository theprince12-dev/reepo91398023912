'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('DetalhesVendas', { // Nome EXATO da tabela do modelo
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER
        },
        venda_id: { type: Sequelize.STRING, allowNull: false },
        order_item_id: { type: Sequelize.STRING, allowNull: false },
        date_created: { type: Sequelize.DATE },
        total_amount: { type: Sequelize.REAL }, // REAL para DECIMAL
        currency_id: { type: Sequelize.STRING },
        buyer_id: { type: Sequelize.STRING, allowNull: true }, // Permitir nulo
        buyer_nickname: { type: Sequelize.STRING, allowNull: true },
        status: { type: Sequelize.STRING, allowNull: true },
        shipping_cost: { type: Sequelize.REAL, allowNull: true },
        shipping_id: { type: Sequelize.STRING, allowNull: true },
        height: { type: Sequelize.REAL, allowNull: true },
        width: { type: Sequelize.REAL, allowNull: true },
        length: { type: Sequelize.REAL, allowNull: true },
        weight: { type: Sequelize.REAL, allowNull: true }, // Peso Real (KG)
        volume: { type: Sequelize.REAL, allowNull: true }, // Peso Cobrável (KG)
        senders_cost: { type: Sequelize.REAL, allowNull: true },
        category_id: { type: Sequelize.STRING, allowNull: true },
        is_special_category: { type: Sequelize.INTEGER, allowNull: true },
        logistic_type: { type: Sequelize.STRING, allowNull: true },
        is_fulfillment: { type: Sequelize.INTEGER, allowNull: true },
        pack_id: { type: Sequelize.STRING, allowNull: true },
        is_pack: { type: Sequelize.INTEGER, allowNull: true },
        receiver_state: { type: Sequelize.STRING, allowNull: true },
        is_sulsudeste: { type: Sequelize.INTEGER, allowNull: true },
        frete_validado: { type: Sequelize.REAL, allowNull: true },
        colfrete_validado: { type: Sequelize.STRING, allowNull: true }
        // Timestamps omitidos (conforme modelo)
    });
    // Adicionar índice composto após criar a tabela
     await queryInterface.addIndex('DetalhesVendas', ['venda_id', 'order_item_id'], {
        unique: true,
        name: 'detalhesvendas_venda_item_unique_idx' // Nome do índice
    });
  },
  async down(queryInterface, Sequelize) {
    // Remover índice antes de dropar a tabela
    await queryInterface.removeIndex('DetalhesVendas', 'detalhesvendas_venda_item_unique_idx');
    await queryInterface.dropTable('DetalhesVendas');
  }
};