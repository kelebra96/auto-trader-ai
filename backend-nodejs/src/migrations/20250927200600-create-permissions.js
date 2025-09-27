'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Permissions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        comment: 'Nome único da permissão (ex: products_create)'
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Descrição da permissão'
      },
      category: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Categoria da permissão (ex: products, users, dashboard)'
      },
      active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Se a permissão está ativa no sistema'
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

    // Índices para melhor performance
    await queryInterface.addIndex('Permissions', ['category']);
    await queryInterface.addIndex('Permissions', ['active']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Permissions');
  }
};