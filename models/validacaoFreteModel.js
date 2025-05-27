// models/validacaoFreteModel.js
const { Sequelize, DataTypes } = require('sequelize');
// const sequelize = require('../config/database'); // <<< REMOVER ESTA LINHA

// Alterar para exportar uma função que recebe sequelize e DataTypes
module.exports = (sequelize, DataTypes) => {
    const ValidacaoFrete = sequelize.define('ValidacaoFrete', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
            // field: 'id' // Opcional
         },
         venda_id: {
            type: DataTypes.STRING,
            allowNull: false, // Assumindo não nulo
             field: 'venda_id'
        },
        item_id: {
            type: DataTypes.STRING,
            allowNull: false, // Assumindo não nulo
             field: 'item_id'
         },
        frete_esperado: {
            type: DataTypes.DECIMAL(10, 2), // Ou REAL/FLOAT
            allowNull: true, // Permitir nulo
             field: 'frete_esperado'
        },
         frete_pago: {
            type: DataTypes.DECIMAL(10, 2), // Ou REAL/FLOAT
            allowNull: true, // Permitir nulo
             field: 'frete_pago'
       },
    }, {
         tableName: 'ValidacaoFretes', // <<< VERIFIQUE O NOME CORRETO DA TABELA
         timestamps: false // Assumindo que não usa timestamps
    });

    // Adicionar associações aqui se houver
    // ValidacaoFrete.associate = function(models) { ... };

    return ValidacaoFrete; // Retorna o modelo definido
};