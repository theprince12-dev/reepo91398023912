// models/especiaisOutrasModel.js
const { Sequelize, DataTypes } = require('sequelize');
// const sequelize = require('../config/database'); // <<< REMOVER ESTA LINHA

// Alterar para exportar uma função que recebe sequelize e DataTypes
module.exports = (sequelize, DataTypes) => {
    const EspeciaisOutras = sequelize.define('especiais_outras', { // Nome do modelo em CamelCase ou como preferir
        faixa_peso: {
            type: DataTypes.STRING, // Ou TEXT se for o tipo na tabela
            primaryKey: true,
            allowNull: false,
            field: 'faixa_peso'
        },
        full_lider: {
            type: DataTypes.DECIMAL(10, 2), // Ou REAL/FLOAT/INTEGER conforme a tabela
            allowNull: true,
            field: 'full_lider'
        },
        full_verde: {
            type: DataTypes.DECIMAL(10, 2), // Ou REAL/FLOAT/INTEGER
            allowNull: true,
            field: 'full_verde'
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
        outros_lider: {
            type: DataTypes.DECIMAL(10, 2), // Ou REAL/FLOAT/INTEGER
            allowNull: true,
            field: 'outros_lider'
        },
        outros_verde: {
            type: DataTypes.DECIMAL(10, 2), // Ou REAL/FLOAT/INTEGER
            allowNull: true,
            field: 'outros_verde'
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
      tableName: 'especiais_outras', // <<< VERIFIQUE O NOME CORRETO DA TABELA
      timestamps: false,
    });

    // Note: A exportação original era { EspeciaisOutras }.
    // O padrão do index.js geralmente espera que o modelo seja exportado diretamente.
    // Se o index.js falhar ao carregar este modelo, pode ser necessário ajustar
    // como ele é adicionado ao objeto 'db' no index.js ou exportar como antes.
    // Por enquanto, exportamos diretamente.
    return EspeciaisOutras;
};