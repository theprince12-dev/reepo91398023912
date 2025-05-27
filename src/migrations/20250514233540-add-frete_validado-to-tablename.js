'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Verifica se a coluna já existe na tabela ValidacaoPacotes
      const tableInfo = await queryInterface.describeTable('validacao_pacotes');
      
      if (!tableInfo.frete_validado) {
        // Adiciona a coluna frete_validado à tabela ValidacaoPacotes
        await queryInterface.addColumn('validacao_pacotes', 'frete_validado', {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: true,
          after: 'frete_calculado'
        });
        console.log('Coluna frete_validado adicionada com sucesso à tabela validacao_pacotes');
      } else {
        console.log('A coluna frete_validado já existe na tabela validacao_pacotes');
      }

      // Verifica se a coluna já existe na tabela validacao_frete
      const freteTableInfo = await queryInterface.describeTable('validacao_frete');
      
      if (!freteTableInfo.frete_validado) {
        // Adiciona a coluna frete_validado à tabela validacao_frete
        await queryInterface.addColumn('validacao_frete', 'frete_validado', {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: true,
          after: 'frete_calculado'
        });
        console.log('Coluna frete_validado adicionada com sucesso à tabela validacao_frete');
      } else {
        console.log('A coluna frete_validado já existe na tabela validacao_frete');
      }
    } catch (error) {
      console.error('Erro ao adicionar coluna frete_validado:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      // Remove a coluna frete_validado da tabela validacao_pacotes
      await queryInterface.removeColumn('validacao_pacotes', 'frete_validado');
      console.log('Coluna frete_validado removida com sucesso da tabela validacao_pacotes');

      // Remove a coluna frete_validado da tabela validacao_frete
      await queryInterface.removeColumn('validacao_frete', 'frete_validado');
      console.log('Coluna frete_validado removida com sucesso da tabela validacao_frete');
    } catch (error) {
      console.error('Erro ao remover coluna frete_validado:', error);
      throw error;
    }
  }
};
