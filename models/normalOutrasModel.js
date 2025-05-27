// models/normalOutrasModel.js
const { Sequelize, DataTypes } = require('sequelize');
// const sequelize = require('../config/database'); // <<< REMOVER ESTA LINHA

// Alterar para exportar uma função que recebe sequelize e DataTypes
module.exports = (sequelize, DataTypes) => {
    const NormalOutras = sequelize.define('normal_outras', { // Nome do modelo
        faixa_peso: {
            type: DataTypes.STRING, // Ou TEXT
            primaryKey: true,
            allowNull: false,
            field: 'faixa_peso'
        },
        full_7899: {
            type: DataTypes.DECIMAL(10, 2), // Ou REAL/FLOAT/INTEGER conforme tabela
            allowNull: true,
            field: 'full_7899'
        },
        outros_7899: {
            type: DataTypes.DECIMAL(10, 2), // Ou REAL/FLOAT/INTEGER
            allowNull: true,
            field: 'outros_7899'
        },
        full_79: {
            type: DataTypes.DECIMAL(10, 2), // Ou REAL/FLOAT/INTEGER
            allowNull: true,
            field: 'full_79'
        },
        outros_79: {
          type: DataTypes.DECIMAL(10, 2), // Ou REAL/FLOAT/INTEGER
          allowNull: true,
          field: 'outros_79'
        },
        full_especiais: {
          type: DataTypes.DECIMAL(10, 2), // Ou REAL/FLOAT/INTEGER
          allowNull: true,
          field: 'full_especiais'
        },
        outros_especiais: {
            type: DataTypes.DECIMAL(10, 2), // Ou REAL/FLOAT/INTEGER
            allowNull: true,
            field: 'outros_especiais'
        },
    }, {
      tableName: 'normal_outras', // <<< VERIFIQUE O NOME CORRETO DA TABELA
      timestamps: false,
    });

     // Novamente, exportando diretamente. Ajustar no index.js se necessário.
    return NormalOutras;
};