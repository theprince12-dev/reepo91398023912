// src/models/validacaoFreteModel.js
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ValidacaoFrete = sequelize.define('ValidacaoFrete', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
     },
     venda_id: {
        type: DataTypes.STRING,
        allowNull: false
    },
    item_id: {
        type: DataTypes.STRING,
        allowNull: false
     },
    frete_esperado: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
     frete_pago: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
   },
});

module.exports = ValidacaoFrete;