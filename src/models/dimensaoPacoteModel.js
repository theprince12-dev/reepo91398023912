// src/models/dimensaoPacoteModel.js
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DimensaoPacote = sequelize.define('DimensaoPacote', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    shipment_id: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
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
      allowNull: true,
    }
});

module.exports = DimensaoPacote;