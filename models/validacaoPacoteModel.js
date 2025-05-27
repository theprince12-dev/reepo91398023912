// models/validacaoPacoteModel.js
const { Sequelize, DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const ValidacaoPacote = sequelize.define('ValidacaoPacote', {
        shipping_id: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false,
            field: 'shipping_id'
        },
        venda_id: {
            type: DataTypes.STRING,
            allowNull: true,
            field: 'venda_id',
        },
        frete_calculado: { // Com reputação REAL
            type: DataTypes.REAL,
            allowNull: true,
            field: 'frete_calculado'
        },
        frete_cobrado_api: {
            type: DataTypes.REAL,
            allowNull: true,
            field: 'frete_cobrado_api'
        },
        // *** COLUNA NOVA ADICIONADA ***
        frete_ideal_reputacao_verde: {
            type: DataTypes.REAL, // Tipo correspondente na migração
            allowNull: true,
            field: 'frete_ideal_reputacao_verde' // Nome da coluna no DB
        },
        // --- Campos restantes ---
        coluna_tabela_usada: { // Coluna usada para frete_calculado (real)
            type: DataTypes.STRING,
            allowNull: true,
            field: 'coluna_tabela_usada'
        },
        status_validacao: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'PENDENTE',
            field: 'status_validacao'
        },
        item_ids: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'item_ids',
            get() {
                const rawValue = this.getDataValue('item_ids');
                try { return rawValue ? JSON.parse(rawValue) : []; }
                catch (e) { return rawValue ? rawValue.split(',') : []; }
            },
            set(value) {
                if (Array.isArray(value)) { this.setDataValue('item_ids', JSON.stringify(value)); }
                else { this.setDataValue('item_ids', value); }
            }
        },
        data_validacao: {
            type: DataTypes.DATE,
            defaultValue: Sequelize.NOW,
            field: 'data_validacao'
        },
        mensagem_erro: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'mensagem_erro'
        }
    }, {
        tableName: 'validacao_pacotes',
        timestamps: false,
         indexes: [
             { name: 'validacao_pacotes_venda_id_idx', fields: ['venda_id'] }
         ]
    });
    // Adicionar associações
    ValidacaoPacote.associate = function(models) {
        ValidacaoPacote.belongsTo(models.Venda, {
            foreignKey: 'venda_id',
            as: 'venda'
        });
    };
    
    return ValidacaoPacote;
};
