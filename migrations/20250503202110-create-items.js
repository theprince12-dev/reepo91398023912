'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Items', { // Nome EXATO da tabela do modelo
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false // PK não pode ser nula
      },
      free_shipping: { type: Sequelize.BOOLEAN, allowNull: true },
      logistic_type: { type: Sequelize.STRING, allowNull: true },
      category_id: { type: Sequelize.STRING, allowNull: true },
      original_price: { type: Sequelize.REAL, allowNull: true }, // REAL para DECIMAL
      price: { type: Sequelize.REAL, allowNull: true },
      base_price: { type: Sequelize.REAL, allowNull: true },
      listing_type_id: { type: Sequelize.STRING, allowNull: true },
      condition: { type: Sequelize.STRING, allowNull: true },
      title: { type: Sequelize.TEXT, allowNull: true }, // TEXT para títulos longos
      catalog_listing: { type: Sequelize.BOOLEAN, allowNull: true },
      status: { type: Sequelize.STRING, allowNull: true },
      fixed_fee: { type: Sequelize.REAL, allowNull: true },
      gross_amount: { type: Sequelize.REAL, allowNull: true },
      percentage_fee: { type: Sequelize.REAL, allowNull: true },
      shipping_options: { type: Sequelize.TEXT, allowNull: true }, // TEXT para JSON
      list_cost: { type: Sequelize.REAL, allowNull: true }
      // Timestamps omitidos (conforme modelo)
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Items');
  }
};