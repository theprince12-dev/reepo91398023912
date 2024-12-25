    // src/models/vendaModel.js
    const { DataTypes } = require('sequelize');
    const sequelize = require('../config/database');
    
    const Venda = sequelize.define('Venda', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        order_id: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        date_created: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        buyer_id: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        buyer_nickname: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        status: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        total_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
        },
    });
    
    module.exports = Venda;