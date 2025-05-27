// models/userModel.js
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class User extends Model {
        static associate(models) {
            // Definir a associação com o modelo AuthToken
            User.hasMany(models.AuthToken, {
                foreignKey: 'user_id',
                as: 'tokens'
            });
        }
    }
    
    User.init({
          id: {
            type: DataTypes.STRING, // ID do usuário geralmente é string ou BIGINT
            primaryKey: true,
            field: 'id'
         },
        nickname: {
            type: DataTypes.STRING, // Ou TEXT
            field: 'nickname'
        },
        user_type: {
            type: DataTypes.STRING,
            field: 'user_type'
        },
        level_id: {
            type: DataTypes.STRING,
            field: 'level_id'
        },
        power_seller_status: {
            type: DataTypes.STRING,
            allowNull: true, // Pode ser nulo
            field: 'power_seller_status'
        },
        transactions_completed: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'transactions_completed'
        },
        sales_completed:  {
            type: DataTypes.INTEGER,
             allowNull: true,
             field: 'sales_completed'
         },
        claims_value:  {
           type: DataTypes.DECIMAL(10,2), // Ou REAL/FLOAT
           allowNull: true,
           field: 'claims_value'
        },
        delayed_handling_time_value:  {
          type: DataTypes.DECIMAL(10, 2), // Ou REAL/FLOAT
             allowNull: true,
             field: 'delayed_handling_time_value'
        },
        cancellations_value: {
             type: DataTypes.DECIMAL(10, 2), // Ou REAL/FLOAT
            allowNull: true,
            field: 'cancellations_value'
        }
    }, {
        sequelize, // Instância do Sequelize necessário para inicializar
        // freezeTableName: true // Descomente se precisar
        tableName: 'Users', // <<< VERIFIQUE O NOME CORRETO DA TABELA
        timestamps: false // Assumindo que não usa timestamps
    });

     // Adicionar associações aqui se houver
    // User.associate = function(models) { ... };

    return User; // Retorna o modelo definido
};
