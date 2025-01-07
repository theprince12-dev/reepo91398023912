// src/models/itemModel.js
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Item = sequelize.define('Item', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    free_shipping: DataTypes.BOOLEAN,
    logistic_type: DataTypes.STRING,
    category_id: DataTypes.STRING,
    original_price: DataTypes.DECIMAL(10, 2),
    price: DataTypes.DECIMAL(10, 2),
    base_price: DataTypes.DECIMAL(10, 2),
    listing_type_id: DataTypes.STRING,
    condition: DataTypes.STRING,
    title: DataTypes.STRING,
    catalog_listing: DataTypes.BOOLEAN,
    status: DataTypes.STRING,
    fixed_fee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
     },
    gross_amount: {
        type: DataTypes.DECIMAL(10, 2),
       allowNull: true
    },
    percentage_fee: {
        type: DataTypes.DECIMAL(10, 2),
       allowNull: true
   },
    shipping_options: {
       type: DataTypes.DECIMAL(10, 2),
       allowNull: true
   },
   list_cost: {
    type: DataTypes.DECIMAL(10, 2),
     allowNull: true
   }
  }, {
    freezeTableName: true
    });
    module.exports = Item;