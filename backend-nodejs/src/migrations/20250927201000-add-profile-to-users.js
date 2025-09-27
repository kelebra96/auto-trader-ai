'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'profile_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'UserProfiles',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Perfil do usuário com permissões pré-definidas'
    });

    // Índice para performance
    await queryInterface.addIndex('Users', ['profile_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Users', 'profile_id');
  }
};