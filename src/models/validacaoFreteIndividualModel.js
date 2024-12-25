// src/models/validacaoFreteIndividualModel.js
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ValidacaoFreteIndividual = sequelize.define('ValidacaoFreteIndividual', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
     },
     venda_id: {
        type: DataTypes.STRING,
        allowNull: false,
         unique: true
     },
     item_id: {
         type: DataTypes.STRING,
          allowNull: true,
     },
    frete_esperado: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
     },
     frete_pago: {
        type: DataTypes.DECIMAL(10, 2),
         allowNull: true
    },
    status: {
        type: DataTypes.STRING,
        allowNull: true
    },
     shipping_options: {
        type: DataTypes.JSON, // campo para salvar as opções de frete como json
          allowNull: true
       }
});

module.exports = ValidacaoFreteIndividual;