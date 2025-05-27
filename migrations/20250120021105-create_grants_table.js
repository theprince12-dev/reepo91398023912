module.exports = {
  up: async (queryInterface, Sequelize) => {
      await queryInterface.createTable('grants', {
          user_id: {
            type: Sequelize.BIGINT,
             primaryKey: true,
              allowNull: false
          },
          application_id: {
            type: Sequelize.BIGINT,
             allowNull: false
         },
           date_created: {
              type: Sequelize.DATE,
              allowNull: true
           },
          authorized: {
            type: Sequelize.BOOLEAN,
             allowNull: true
         }
      });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('grants');
  }
};