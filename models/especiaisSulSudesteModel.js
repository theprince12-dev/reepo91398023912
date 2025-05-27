// models/especiaisSulSudesteModel.js
const { Sequelize, DataTypes } = require('sequelize');
// const sequelize = require('../config/database'); // <<< REMOVER ESTA LINHA

// Alterar para exportar uma função que recebe sequelize e DataTypes
module.exports = (sequelize, DataTypes) => {
    const EspeciaisSulSudeste = sequelize.define('especiais_sul_sudeste', { // Nome do modelo
        faixa_peso: {
          type: DataTypes.STRING, // Ou TEXT
          primaryKey: true,
          allowNull: false,
          field: 'faixa_peso'
        },
        full_lider: {
            type: DataTypes.DECIMAL(10, 2), // Ou REAL/FLOAT/INTEGER conforme tabela
            allowNull: true,
            field: 'full_lider'
        },
        outros_lider: {
            type: DataTypes.DECIMAL(10, 2), // Ou REAL/FLOAT/INTEGER
            allowNull: true,
            field: 'outros_lider'
        },
        full_verde: {
            type: DataTypes.DECIMAL(10, 2), // Ou REAL/FLOAT/INTEGER
            allowNull: true,
            field: 'full_verde'
        },
        outros_verde: {
            type: DataTypes.DECIMAL(10, 2), // Ou REAL/FLOAT/INTEGER
            allowNull: true,
            field: 'outros_verde'
        },
        full_amarelo: {
            type: DataTypes.DECIMAL(10, 2), // Ou REAL/FLOAT/INTEGER
            allowNull: true,
            field: 'full_amarelo'
        },
        full_sem: {
            type: DataTypes.DECIMAL(10, 2), // Ou REAL/FLOAT/INTEGER
            allowNull: true,
            field: 'full_sem'
        },
        outros_amarelo: {
           type: DataTypes.DECIMAL(10, 2), // Ou REAL/FLOAT/INTEGER
           allowNull: true,
           field: 'outros_amarelo'
        },
        outros_sem: {
            type: DataTypes.DECIMAL(10, 2), // Ou REAL/FLOAT/INTEGER
           allowNull: true,
           field: 'outros_sem'
        },
        full_laranja: {
            type: DataTypes.DECIMAL(10, 2), // Ou REAL/FLOAT/INTEGER
            allowNull: true,
            field: 'full_laranja'
        },
        full_vermelho: {
          type: DataTypes.DECIMAL(10, 2), // Ou REAL/FLOAT/INTEGER
          allowNull: true,
          field: 'full_vermelho'
        },
        outros_laranja: {
            type: DataTypes.DECIMAL(10, 2), // Ou REAL/FLOAT/INTEGER
             allowNull: true,
             field: 'outros_laranja'
        },
        outros_vermelho: {
            type: DataTypes.DECIMAL(10, 2), // Ou REAL/FLOAT/INTEGER
            allowNull: true,
            field: 'outros_vermelho'
        }
    }, {
       tableName: 'especiais_sul_sudeste', // <<< VERIFIQUE O NOME CORRETO DA TABELA
        timestamps: false,
    });

    // Novamente, exportando diretamente. Ajustar no index.js se necessário.
    return EspeciaisSulSudeste;
};