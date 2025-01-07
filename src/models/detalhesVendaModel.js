// src/models/detalhesVendaModel.js
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DetalhesVenda = sequelize.define('DetalhesVenda', {
  venda_id: {
      type: DataTypes.STRING,
      allowNull: false,
       unique: 'unique_order_item',
   },
   order_item_id: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: 'unique_order_item'
 },
  date_created: {
       type: DataTypes.DATE,
      allowNull: true,
 },
    total_amount: {
       type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
   },
    currency_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
   buyer_id: {
     type: DataTypes.STRING,
      allowNull: true,
  },
    buyer_nickname: {
      type: DataTypes.STRING,
     allowNull: true,
 },
  status: {
      type: DataTypes.STRING,
    allowNull: true,
},
 shipping_cost: {
     type: DataTypes.DECIMAL(10, 2),
       allowNull: true,
  },
  shipping_id: {
    type: DataTypes.STRING,
    allowNull: true
 },
 height: {
    type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
},
 width: {
    type: DataTypes.DECIMAL(10, 2),
     allowNull: true,
},
length: {
type: DataTypes.DECIMAL(10, 2),
allowNull: true,
},
weight: {
type: DataTypes.DECIMAL(10, 2),
allowNull: true
},
volume: {
type: DataTypes.DECIMAL(10, 2),
allowNull: true
},
senders_cost: {
type: DataTypes.DECIMAL(10, 2),
allowNull: true
}
}, {
indexes: [{
unique: true,
fields: ['venda_id', 'order_item_id'],
name: 'unique_order_item'
}]
});

module.exports = DetalhesVenda;