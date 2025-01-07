// src/models/tabelaFreteModel.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TabelaFrete = sequelize.define('TabelaFrete', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    peso_min: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    peso_max: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    reputacao: {
        type: DataTypes.STRING,
        allowNull: false
    },
    tipo_anuncio: {
        type: DataTypes.STRING,
        allowNull: false
    },
    regiao: {
        type: DataTypes.STRING,
        allowNull: false
    },
    valor_frete: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
   full: {
        type: DataTypes.BOOLEAN,
         defaultValue: false
    }
},
 {
    tableName: 'TabelaFretes',
 });

module.exports = TabelaFrete;