'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('auth_tokens', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      access_token: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      refresh_token: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      token_type: {
        type: Sequelize.STRING, // Removido o tamanho para SQLite
        allowNull: false,
        defaultValue: 'bearer'
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      scope: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: new Date() // Substituído por new Date() direto
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: new Date() // Substituído por new Date() direto
      }
    });
    
    // Simplificado para funcionar com SQLite
    try {
      await queryInterface.addIndex('auth_tokens', ['is_active']);
      await queryInterface.addIndex('auth_tokens', ['expires_at']);
    } catch (error) {
      console.warn('Aviso: Não foi possível criar índices - SQLite pode ter limitações:', error.message);
      // Continuar mesmo se os índices falharem, já que são opcionais
    }
  },
  
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('auth_tokens');
  }
};
