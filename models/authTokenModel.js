// models/authTokenModel.js
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AuthToken extends Model {
  static associate(models) {
      // Definir a associação com o modelo User
      AuthToken.belongsTo(models.User, { 
        foreignKey: 'user_id',
        targetKey: 'id',
        as: 'user' 
      });
    }

    // Verificar se o token está expirado
    isExpired() {
      if (!this.expires_at) return true;
      return new Date() > new Date(this.expires_at);
    }

    // Verificar se o token é válido (ativo e não expirado)
    isValid() {
      return this.is_active && !this.isExpired();
    }

    // Tempo restante em segundos
    getTimeRemaining() {
      if (this.isExpired()) return 0;
      return Math.floor((new Date(this.expires_at) - new Date()) / 1000);
    }
  }

  AuthToken.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    access_token: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    refresh_token: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    token_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'bearer'
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    scope: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'AuthToken',
    tableName: 'auth_tokens',
    underscored: true, // Usa snake_case para os nomes das colunas no DB
    timestamps: true, // Usa os campos created_at e updated_at
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return AuthToken;
};
