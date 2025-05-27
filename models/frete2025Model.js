// models/frete2025Model.js
const { Sequelize, DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    console.log(`[${new Date().toISOString()}] frete2025Model.js: Definindo modelo Frete2025 com instância Sequelize ID: ${sequelize.id || 'N/A'}`);

    const Frete2025 = sequelize.define('Frete2025', {
        faixa_peso: { type: DataTypes.TEXT, primaryKey: true, allowNull: false, field: 'faixa_peso' },
        // CEOR
        ceor_full_lider: { type: DataTypes.REAL, allowNull: true, field: 'CEOR_full_lider' },
        ceor_full_verde: { type: DataTypes.REAL, allowNull: true, field: 'CEOR_full_verde' },
        ceor_outros_lider: { type: DataTypes.INTEGER, allowNull: true, field: 'CEOR_outros_lider' },
        ceor_outros_verde: { type: DataTypes.INTEGER, allowNull: true, field: 'CEOR_outros_verde' },
        ceor_full_amarelo: { type: DataTypes.REAL, allowNull: true, field: 'CEOR_full_amarelo' },
        ceor_full_sem: { type: DataTypes.REAL, allowNull: true, field: 'CEOR_full_sem' },
        ceor_outros_amarelo: { type: DataTypes.INTEGER, allowNull: true, field: 'CEOR_outros_amarelo' },
        ceor_outros_sem: { type: DataTypes.INTEGER, allowNull: true, field: 'CEOR_outros_sem' },
        ceor_full_laranja: { type: DataTypes.REAL, allowNull: true, field: 'CEOR_full_laranja' },
        ceor_full_vermelho: { type: DataTypes.REAL, allowNull: true, field: 'CEOR_full_vermelho' },
        ceor_outros_laranja: { type: DataTypes.INTEGER, allowNull: true, field: 'CEOR_outros_laranja' },
        ceor_outros_vermelho: { type: DataTypes.INTEGER, allowNull: true, field: 'CEOR_outros_vermelho' },
        // CESS
        cess_full_lider: { type: DataTypes.REAL, allowNull: true, field: 'CESS_full_lider' },
        cess_outros_lider: { type: DataTypes.REAL, allowNull: true, field: 'CESS_outros_lider' },
        cess_full_verde: { type: DataTypes.REAL, allowNull: true, field: 'CESS_full_verde' },
        cess_outros_verde: { type: DataTypes.REAL, allowNull: true, field: 'CESS_outros_verde' },
        cess_full_amarelo: { type: DataTypes.REAL, allowNull: true, field: 'CESS_full_amarelo' },
        cess_full_sem: { type: DataTypes.REAL, allowNull: true, field: 'CESS_full_sem' },
        cess_outros_amarelo: { type: DataTypes.REAL, allowNull: true, field: 'CESS_outros_amarelo' },
        cess_outros_sem: { type: DataTypes.REAL, allowNull: true, field: 'CESS_outros_sem' },
        cess_full_laranja: { type: DataTypes.REAL, allowNull: true, field: 'CESS_full_laranja' },
        cess_full_vermelho: { type: DataTypes.REAL, allowNull: true, field: 'CESS_full_vermelho' },
        cess_outros_laranja: { type: DataTypes.REAL, allowNull: true, field: 'CESS_outros_laranja' },
        cess_outros_vermelho: { type: DataTypes.REAL, allowNull: true, field: 'CESS_outros_vermelho' },
        // CNOR - Nomes dos atributos JS em minúsculas para coincidir com o cálculo
        cnor_full_7899: { type: DataTypes.REAL, allowNull: true, field: 'CNOR_full_7899' },
        cnor_outros_7899: { type: DataTypes.INTEGER, allowNull: true, field: 'CNOR_outros_7899' }, 
        cnor_full_79: { type: DataTypes.REAL, allowNull: true, field: 'CNOR_full_79' },
        cnor_outros_79: { type: DataTypes.INTEGER, allowNull: true, field: 'CNOR_outros_79' }, 
        cnor_full_especiais: { type: DataTypes.REAL, allowNull: true, field: 'CNOR_full_especiais' },
        cnor_outros_especiais: { type: DataTypes.INTEGER, allowNull: true, field: 'CNOR_outros_especiais' },
        // CNSS
        cnss_full_7899: { type: DataTypes.REAL, allowNull: true, field: 'CNSS_full_7899' },
        cnss_outros_7899: { type: DataTypes.REAL, allowNull: true, field: 'CNSS_outros_7899' },
        cnss_full_79: { type: DataTypes.REAL, allowNull: true, field: 'CNSS_full_79' },
        cnss_full_especiais: { type: DataTypes.REAL, allowNull: true, field: 'CNSS_full_especiais' },
        cnss_outros_79: { type: DataTypes.INTEGER, allowNull: true, field: 'CNSS_outros_79' },
        cnss_outros_especiais: { type: DataTypes.INTEGER, allowNull: true, field: 'CNSS_outros_especiais' },
        // Novas Faixas de Preço
        cnor_full_100: { type: DataTypes.REAL, allowNull: true, field: 'CNOR_full_100' },
        cnor_outros_100: { type: DataTypes.INTEGER, allowNull: true, field: 'CNOR_outros_100' },
        cnss_full_100: { type: DataTypes.REAL, allowNull: true, field: 'CNSS_full_100' },
        cnss_outros_100: { type: DataTypes.INTEGER, allowNull: true, field: 'CNSS_outros_100' },
        cnor_full_120: { type: DataTypes.REAL, allowNull: true, field: 'CNOR_full_120' },
        cnor_outros_120: { type: DataTypes.INTEGER, allowNull: true, field: 'CNOR_outros_120' },
        cnss_full_120: { type: DataTypes.REAL, allowNull: true, field: 'CNSS_full_120' },
        cnss_outros_120: { type: DataTypes.INTEGER, allowNull: true, field: 'CNSS_outros_120' },
        cnor_full_150: { type: DataTypes.REAL, allowNull: true, field: 'CNOR_full_150' },
        cnor_outros_150: { type: DataTypes.INTEGER, allowNull: true, field: 'CNOR_outros_150' },
        cnss_full_150: { type: DataTypes.REAL, allowNull: true, field: 'CNSS_full_150' },
        cnss_outros_150: { type: DataTypes.INTEGER, allowNull: true, field: 'CNSS_outros_150' },
        cnor_full_200: { type: DataTypes.REAL, allowNull: true, field: 'CNOR_full_200' },
        cnor_outros_200: { type: DataTypes.INTEGER, allowNull: true, field: 'CNOR_outros_200' },
        cnss_full_200: { type: DataTypes.REAL, allowNull: true, field: 'CNSS_full_200' },
        cnss_outros_200: { type: DataTypes.INTEGER, allowNull: true, field: 'CNSS_outros_200' }
    }, {
        tableName: 'bdValidacaoFrete2025',
        timestamps: false,
    });

    console.log(`[${new Date().toISOString()}] frete2025Model.js: Modelo Frete2025 DEFINIDO.`);
    return Frete2025;
};
