// models/tabelaFreteModel.js
const { DataTypes } = require('sequelize');
// const sequelize = require('../config/database'); // <<< REMOVER ESTA LINHA

// Alterar para exportar uma função que recebe sequelize e DataTypes
module.exports = (sequelize, DataTypes) => {
    const TabelaFrete = sequelize.define('TabelaFrete', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
            // field: 'id' // Opcional
        },
        peso_min: {
            type: DataTypes.DECIMAL(10, 2), // Ou REAL/FLOAT/INTEGER
            allowNull: false,
            field: 'peso_min'
        },
        peso_max: {
            type: DataTypes.DECIMAL(10, 2), // Ou REAL/FLOAT/INTEGER
            allowNull: false,
            field: 'peso_max'
        },
        reputacao: {
            type: DataTypes.STRING, // Ou TEXT
            allowNull: false,
            field: 'reputacao'
        },
        tipo_anuncio: {
            type: DataTypes.STRING, // Ou TEXT
            allowNull: false,
            field: 'tipo_anuncio'
        },
        regiao: {
            type: DataTypes.STRING, // Ou TEXT
            allowNull: false,
            field: 'regiao'
        },
        valor_frete: {
            type: DataTypes.DECIMAL(10, 2), // Ou REAL/FLOAT
            allowNull: false,
            field: 'valor_frete'
        },
       full: {
            type: DataTypes.BOOLEAN, // Ou INTEGER (0/1)
             defaultValue: false, // Mantém default se existir na tabela
             allowNull: false, // Booleano geralmente não é nulo, mas verifique sua tabela
             field: 'full'
        }
    },
     {
        tableName: 'TabelaFretes', // <<< VERIFIQUE O NOME CORRETO DA TABELA
        timestamps: false // Assumindo que não usa timestamps
     });

     // Adicionar associações aqui se houver
    // TabelaFrete.associate = function(models) { ... };

    return TabelaFrete; // Retorna o modelo definido
};