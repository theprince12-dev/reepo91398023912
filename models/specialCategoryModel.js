// models/specialCategoryModel.js
const { Sequelize, DataTypes } = require('sequelize');
// const sequelize = require('../config/database'); // <<< REMOVER ESTA LINHA

// Alterar para exportar uma função que recebe sequelize e DataTypes
module.exports = (sequelize, DataTypes) => {
    const SpecialCategory = sequelize.define('SpecialCategory', {
        category_id: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false,
             field: 'category_id'
        },
         // Adicione outras colunas, se necessário, com seus tipos e 'field'
    },
        {
            tableName: 'special_categories', // <<< VERIFIQUE O NOME CORRETO DA TABELA
             timestamps: false,
        }
    );

     // Novamente, a exportação original era { SpecialCategory }. Exportando diretamente.
    return SpecialCategory;
};