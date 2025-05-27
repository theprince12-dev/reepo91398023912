// models/grantModel.js
const { Sequelize, DataTypes } = require('sequelize');
// const sequelize = require('../config/database'); // <<< REMOVER ESTA LINHA

// Alterar para exportar uma função que recebe sequelize e DataTypes
module.exports = (sequelize, DataTypes) => {
    const Grant = sequelize.define('Grant', {
        user_id: {
            type: DataTypes.BIGINT, // Mantém BIGINT se for esse o tipo na tabela
            primaryKey: true,
            allowNull: false,
            field: 'user_id'
        },
        application_id: {
            type: DataTypes.BIGINT, // Mantém BIGINT
            allowNull: false,
            field: 'application_id'
        },
        date_created: {
            type: DataTypes.DATE,
            allowNull: true, // Permitir nulo se puder ser nulo na tabela
            field: 'date_created'
        },
        authorized: {
            type: DataTypes.STRING, // Mantém STRING
            allowNull: true,
            field: 'authorized'
        },

    }, {
        tableName: 'grants', // <<< VERIFIQUE O NOME CORRETO DA TABELA
        timestamps: false
    });

     // Adicionar associações aqui se houver
    // Grant.associate = function(models) { ... };

    return Grant; // Retorna o modelo definido
};