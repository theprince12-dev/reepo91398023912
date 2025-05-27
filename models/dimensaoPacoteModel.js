// src/models/dimensaoPacoteModel.js
const { Sequelize, DataTypes } = require('sequelize');
// const sequelize = require('../config/database'); // <<< REMOVER ESTA LINHA

// Alterar para exportar uma função que recebe sequelize e DataTypes
module.exports = (sequelize, DataTypes) => {
    const DimensaoPacote = sequelize.define('DimensaoPacote', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
            // field: 'id' // Opcional para 'id'
        },
        shipment_id: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            field: 'shipment_id' // Mapeamento explícito
        },
        height: {
            type: DataTypes.DECIMAL(10, 2), // Ou DataTypes.REAL se for REAL na tabela
             allowNull: true,
             field: 'height' // Mapeamento explícito
        },
        width: {
            type: DataTypes.DECIMAL(10, 2), // Ou DataTypes.REAL se for REAL na tabela
             allowNull: true,
             field: 'width' // Mapeamento explícito
        },
        length: {
            type: DataTypes.DECIMAL(10, 2), // Ou DataTypes.REAL se for REAL na tabela
            allowNull: true,
            field: 'length' // Mapeamento explícito
        },
        weight: {
          type: DataTypes.DECIMAL(10, 2), // Ou DataTypes.REAL/INTEGER (peso em g ou kg?)
          // Se for REAL na tabela, use DataTypes.REAL
          // Se for INTEGER na tabela, use DataTypes.INTEGER
          allowNull: true,
          field: 'weight' // Mapeamento explícito
        }
    }, {
        // Adicionar tableName e outras opções se necessário
        tableName: 'DimensaoPacotes', // <<< VERIFIQUE O NOME CORRETO DA TABELA
        timestamps: false // Assumindo que não usa timestamps
    });

    // Adicionar associações aqui se houver
    // DimensaoPacote.associate = function(models) { ... };

    return DimensaoPacote; // Retorna o modelo definido
};