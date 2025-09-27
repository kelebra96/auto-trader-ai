'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ProfilePermissions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      profile_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'UserProfiles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      permission_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Permissions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Índice único para evitar duplicatas
    await queryInterface.addIndex('ProfilePermissions', ['profile_id', 'permission_id'], {
      unique: true,
      name: 'unique_profile_permission'
    });

    // Índices para performance
    await queryInterface.addIndex('ProfilePermissions', ['profile_id']);
    await queryInterface.addIndex('ProfilePermissions', ['permission_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ProfilePermissions');
  }
};