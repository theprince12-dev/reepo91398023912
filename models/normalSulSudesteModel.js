// models/normalSulSudesteModel.js
const { Sequelize, DataTypes } = require('sequelize');
// const sequelize = require('../config/database'); // <<< REMOVER ESTA LINHA

// Alterar para exportar uma função que recebe sequelize e DataTypes
module.exports = (sequelize, DataTypes) => {
    const NormalSulSudeste = sequelize.define('normal_sul_sudeste', { // Nome do modelo
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
      outro_79: { // Note o nome "outro_79" aqui, diferente de "outros_79" em normalOutrasModel
        type: DataTypes.DECIMAL(10, 2), // Ou REAL/FLOAT/INTEGER
        allowNull: true,
        field: 'outro_79' // Mapear para o nome correto da coluna na tabela
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
      }
    }, {
      tableName: 'normal_sul_sudeste', // <<< VERIFIQUE O NOME CORRETO DA TABELA
      timestamps: false,
    });

    // Novamente, exportando diretamente.
    return NormalSulSudeste;
};