// models/validacaoPacote2025Model.js
const { Sequelize, DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const ValidacaoPacote2025 = sequelize.define('ValidacaoPacote2025', {
    shipping_id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    },
    venda_id: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status_validacao: {
      type: DataTypes.STRING,
      allowNull: true
    },
    frete_calculado: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    frete_cobrado_api: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    diferenca: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    coluna_tabela_usada: {
      type: DataTypes.STRING,
      allowNull: true
    },
    is_sulsudeste: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    is_special_category: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    is_fulfillment: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    is_novo_79: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    is_novo_100: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    is_novo_120: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    is_novo_150: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    is_novo_200: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    quantidade_itens: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    peso_kg: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true
    },
    peso_volumetrico_kg: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true
    },
    item_ids: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    mensagem_erro: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    data_venda: {
      type: DataTypes.DATE,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    tableName: 'validacao_pacotes_2025',
    timestamps: true
  });

  return ValidacaoPacote2025;
};
