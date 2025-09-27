'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('UserPermissions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
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
      granted: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'true = permissão concedida, false = permissão negada (override do perfil)'
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
    await queryInterface.addIndex('UserPermissions', ['user_id', 'permission_id'], {
      unique: true,
      name: 'unique_user_permission'
    });

    // Índices para performance
    await queryInterface.addIndex('UserPermissions', ['user_id']);
    await queryInterface.addIndex('UserPermissions', ['permission_id']);
    await queryInterface.addIndex('UserPermissions', ['granted']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('UserPermissions');
  }
};