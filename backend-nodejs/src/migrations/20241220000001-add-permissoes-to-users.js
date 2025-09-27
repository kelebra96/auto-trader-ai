'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'permissoes', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: null,
      comment: 'Permissões customizadas do usuário em formato JSON'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'permissoes');
  }
};