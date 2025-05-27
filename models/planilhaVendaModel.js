// models/planilhaVendaModel.js
const { DataTypes } = require('sequelize');
// const sequelize = require('../config/database'); // <<< REMOVER ESTA LINHA

// Alterar para exportar uma função que recebe sequelize e DataTypes
module.exports = (sequelize, DataTypes) => {
    const PlanilhaVenda = sequelize.define('PlanilhaVenda', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        // field: 'id' // Opcional
      },
       venda_id: {
         type: DataTypes.STRING,
           allowNull: false, // Assumindo que não pode ser nulo
           field: 'venda_id'
       },
      tarifa_envio: {
          type: DataTypes.DECIMAL(10, 2), // Ou REAL/FLOAT
          allowNull: true, // Permitir nulo
          field: 'tarifa_envio'
      },
      receita_envio: {
        type: DataTypes.DECIMAL(10, 2), // Ou REAL/FLOAT
        allowNull: true,
        field: 'receita_envio'
      },
    frete_validado: { // Este campo parece redundante agora que temos ValidacaoPacote
        type: DataTypes.DECIMAL(10, 2), // Ou REAL/FLOAT
          allowNull: true,
          field: 'frete_validado'
    },
    }, {
        tableName: 'PlanilhaVendas', // <<< VERIFIQUE O NOME CORRETO DA TABELA
        timestamps: false
    });

    // Adicionar associações aqui se houver
    // PlanilhaVenda.associate = function(models) { ... };

    return PlanilhaVenda; // Retorna o modelo definido
};