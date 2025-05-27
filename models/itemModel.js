// models/itemModel.js
const { Sequelize, DataTypes } = require('sequelize');
// const sequelize = require('../config/database'); // <<< REMOVER ESTA LINHA

// Alterar para exportar uma função que recebe sequelize e DataTypes
module.exports = (sequelize, DataTypes) => {
    const Item = sequelize.define('Item', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            field: 'id'
        },
        venda_id: {
            type: DataTypes.STRING,
            allowNull: true,
            field: 'venda_id',
            references: {
                model: 'Vendas',
                key: 'order_id'
            }
        },
        free_shipping: {
            type: DataTypes.BOOLEAN,
            field: 'free_shipping'
        },
        logistic_type: {
            type: DataTypes.STRING,
            field: 'logistic_type'
        },
        category_id: {
            type: DataTypes.STRING,
            field: 'category_id'
        },
        original_price: {
            type: DataTypes.DECIMAL(10, 2), // Ou REAL/FLOAT
            field: 'original_price'
        },
        price: {
            type: DataTypes.DECIMAL(10, 2), // Ou REAL/FLOAT
            field: 'price'
        },
        base_price: {
            type: DataTypes.DECIMAL(10, 2), // Ou REAL/FLOAT
            field: 'base_price'
        },
        listing_type_id: {
            type: DataTypes.STRING,
            field: 'listing_type_id'
        },
        condition: {
            type: DataTypes.STRING,
            field: 'condition'
        },
        title: {
            type: DataTypes.STRING, // Ou TEXT
            field: 'title'
        },
        catalog_listing: {
            type: DataTypes.BOOLEAN,
            field: 'catalog_listing'
        },
        status: {
            type: DataTypes.STRING,
            field: 'status'
        },
        fixed_fee: {
            type: DataTypes.DECIMAL(10, 2), // Ou REAL/FLOAT
            allowNull: true,
            field: 'fixed_fee'
         },
        gross_amount: {
            type: DataTypes.DECIMAL(10, 2), // Ou REAL/FLOAT
           allowNull: true,
           field: 'gross_amount'
        },
        percentage_fee: {
            type: DataTypes.DECIMAL(10, 2), // Ou REAL/FLOAT
           allowNull: true,
           field: 'percentage_fee'
       },
       shipping_options: {
           // O original estava DECIMAL, mas options de frete geralmente são JSON ou TEXT
           // Verifique o tipo real na sua tabela Item
           type: DataTypes.TEXT, // Sugestão: usar TEXT para armazenar JSON
           allowNull: true,
           field: 'shipping_options'
           // Se for realmente um número único, use DECIMAL ou REAL/FLOAT
       },
       list_cost: {
        type: DataTypes.DECIMAL(10, 2), // Ou REAL/FLOAT
         allowNull: true,
         field: 'list_cost'
       }
      }, {
        // freezeTableName: true // Descomente se precisar
        tableName: 'Items', // <<< VERIFIQUE O NOME CORRETO DA TABELA
        timestamps: false // Assumindo que não usa timestamps
        });

    // Adicionar associações
    Item.associate = function(models) {
        Item.belongsTo(models.Venda, {
            foreignKey: 'venda_id',
            as: 'venda'
        });
    };

    return Item; // Retorna o modelo definido
};
