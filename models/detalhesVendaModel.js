// models/detalhesVendaModel.js
const { Sequelize, DataTypes } = require('sequelize');
// const sequelize = require('../config/database'); // <<< REMOVER ESTA LINHA

// Alterar para exportar uma função que recebe sequelize e DataTypes
module.exports = (sequelize, DataTypes) => {
    const DetalhesVenda = sequelize.define('DetalhesVenda', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        venda_id: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'venda_id'
        },
        order_item_id: {
             type: DataTypes.STRING,
            allowNull: false,
            field: 'order_item_id'
        },
        date_created: {
            type: DataTypes.DATE,
            field: 'date_created'
        },
        total_amount: {
            type: DataTypes.DECIMAL(10, 2), // Ou REAL/FLOAT se for o tipo na tabela
            field: 'total_amount'
        },
        currency_id: {
            type: DataTypes.STRING,
            field: 'currency_id'
        },
        buyer_id: {
            type: DataTypes.STRING,
            field: 'buyer_id'
        },
         buyer_nickname: {
             type: DataTypes.STRING,
             field: 'buyer_nickname'
        },
        status: {
            type: DataTypes.STRING,
            field: 'status'
        },
        shipping_cost: {
            type: DataTypes.DECIMAL(10, 2), // Ou REAL/FLOAT
             field: 'shipping_cost'
        },
        shipping_id: {
            type: DataTypes.STRING,
             field: 'shipping_id'
        },
        height: {
           type: DataTypes.DECIMAL(10, 2), // Ou REAL/FLOAT
            field: 'height'
        },
         width: {
             type: DataTypes.DECIMAL(10, 2), // Ou REAL/FLOAT
             field: 'width'
         },
        length: {
            type: DataTypes.DECIMAL(10, 2), // Ou REAL/FLOAT
            field: 'length'
        },
        weight: { // Peso Real (KG)
            type: DataTypes.DECIMAL(10, 4), // Ou REAL/FLOAT
            allowNull: true,
            field: 'weight'
        },
        volume: { // Peso Cobrável (KG)
              type: DataTypes.DECIMAL(10, 4), // Ou REAL/FLOAT
              allowNull: true,
              field: 'volume'
          },
        senders_cost: {
          type: DataTypes.DECIMAL(10, 2), // Ou REAL/FLOAT
          allowNull: true,
          field: 'senders_cost'
        },
        category_id: {
            type: DataTypes.STRING,
            field: 'category_id'
        },
        is_special_category: {
             type: DataTypes.INTEGER,
             field: 'is_special_category'
        },
        logistic_type: {
            type: DataTypes.STRING,
            field: 'logistic_type'
        },
       is_fulfillment: {
            type: DataTypes.INTEGER,
            field: 'is_fulfillment'
       },
        pack_id: {
            type: DataTypes.STRING,
            field: 'pack_id'
        },
        is_pack: {
            type: DataTypes.INTEGER,
            field: 'is_pack'
        },
         receiver_state: {
             type: DataTypes.STRING,
             field: 'receiver_state'
        },
       is_sulsudeste: {
          type: DataTypes.INTEGER,
          field: 'is_sulsudeste'
        },
    }, {
        tableName: 'DetalhesVendas', // <<< VERIFIQUE O NOME CORRETO DA TABELA
         indexes: [
          {
            unique: true,
            fields: ['venda_id', 'order_item_id']
          }
        ],
        timestamps: false
    });

     // Adicionar associações aqui se houver
    // DetalhesVenda.associate = function(models) { ... };

    return DetalhesVenda; // Retorna o modelo definido
};