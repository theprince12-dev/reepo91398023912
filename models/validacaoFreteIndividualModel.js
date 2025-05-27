// models/validacaoFreteIndividualModel.js
const { Sequelize, DataTypes } = require('sequelize');
// const sequelize = require('../config/database'); // <<< REMOVER ESTA LINHA

// Alterar para exportar uma função que recebe sequelize e DataTypes
module.exports = (sequelize, DataTypes) => {
    const ValidacaoFreteIndividual = sequelize.define('ValidacaoFreteIndividual', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
            // field: 'id' // Opcional
         },
         venda_id: {
            type: DataTypes.STRING,
            allowNull: false,
             unique: true, // Mantém unique se for a regra de negócio
             field: 'venda_id'
         },
         item_id: {
             type: DataTypes.STRING,
              allowNull: true, // Permitir nulo se a validação puder falhar antes de ter o item_id
              field: 'item_id'
         },
        frete_esperado: {
            type: DataTypes.DECIMAL(10, 2), // Ou REAL/FLOAT
            allowNull: true,
             field: 'frete_esperado'
         },
         frete_pago: {
            type: DataTypes.DECIMAL(10, 2), // Ou REAL/FLOAT
             allowNull: true,
             field: 'frete_pago'
        },
        status: {
            type: DataTypes.STRING, // Ou TEXT
            allowNull: true,
             field: 'status'
        },
         shipping_options: {
            type: DataTypes.JSON, // Mantém JSON se for o tipo na tabela
            // Se o tipo na tabela for TEXT, use DataTypes.TEXT
            // Se for BLOB, use DataTypes.BLOB
              allowNull: true,
              field: 'shipping_options'
           }
    }, {
         tableName: 'ValidacaoFreteIndividuais', // <<< VERIFIQUE O NOME CORRETO DA TABELA
         timestamps: false // Assumindo que não usa timestamps
    });

     // Adicionar associações aqui se houver
    // ValidacaoFreteIndividual.associate = function(models) { ... };

    return ValidacaoFreteIndividual; // Retorna o modelo definido
};