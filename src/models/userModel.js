    // src/models/userModel.js
    const { Sequelize, DataTypes } = require('sequelize');
    const sequelize = require('../config/database');
    
    const User = sequelize.define('User', {
          id: {
            type: DataTypes.STRING,
            primaryKey: true,
         },
        nickname: DataTypes.STRING,
        user_type: DataTypes.STRING,
        level_id: DataTypes.STRING,
       power_seller_status: DataTypes.STRING,
        transactions_completed: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        sales_completed:  {
            type: DataTypes.INTEGER,
             allowNull: true,
         },
        claims_value:  {
           type: DataTypes.DECIMAL(10,2),
           allowNull: true,
        },
        delayed_handling_time_value:  {
          type: DataTypes.DECIMAL(10, 2),
             allowNull: true,
        },
        cancellations_value: {
             type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
        }
    }, {
        freezeTableName: true
    });
    
    module.exports = User;