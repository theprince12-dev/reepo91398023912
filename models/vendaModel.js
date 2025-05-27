// src/models/vendaModel.js
const { DataTypes } = require('sequelize');
// const sequelize = require('../config/database'); // <<< LINHA REMOVIDA

// Alterado para exportar uma função que recebe sequelize e DataTypes
module.exports = (sequelize, DataTypes) => {
    const Venda = sequelize.define('Venda', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            // Não precisa de field aqui, Sequelize geralmente acerta 'id'
        },
        order_id: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            field: 'order_id' // Mapeamento explícito
        },
        date_created: {
            type: DataTypes.DATE,
            allowNull: false,
            field: 'date_created' // Mapeamento explícito
        },
        buyer_id: {
            type: DataTypes.STRING,
            allowNull: true,
            field: 'buyer_id' // Mapeamento explícito
        },
        buyer_nickname: {
            type: DataTypes.STRING,
            allowNull: true,
            field: 'buyer_nickname' // Mapeamento explícito
        },
        status: {
            type: DataTypes.STRING,
            allowNull: true,
            field: 'status' // Mapeamento explícito
        },
        total_amount: {
            type: DataTypes.DECIMAL(10, 2), // Ou DataTypes.REAL se for REAL na tabela
            allowNull: true,
            field: 'total_amount' // Mapeamento explícito
        },
    }, {
        tableName: 'Vendas', // <<< VERIFIQUE SE O NOME DA SUA TABELA É 'Vendas'
        timestamps: false
    });

    // Adicionar associações
    Venda.associate = function(models) {
        // Relacionamento com ValidacaoPacote
        Venda.hasMany(models.ValidacaoPacote, {
            foreignKey: 'venda_id',
            as: 'validacaoPacotes'
        });
        
        // Relacionamento com Item
        Venda.hasMany(models.Item, {
            foreignKey: 'venda_id',
            as: 'items'
        });
    };

    return Venda; // Retorna o modelo definido
};
