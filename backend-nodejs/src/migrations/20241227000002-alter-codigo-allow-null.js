'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Alterar a coluna codigo para permitir NULL temporariamente
    await queryInterface.changeColumn('fornecedores', 'codigo', {
      type: Sequelize.STRING(20),
      allowNull: true,
      unique: true
    });
  },

  async down(queryInterface, Sequelize) {
    // Reverter para NOT NULL
    await queryInterface.changeColumn('fornecedores', 'codigo', {
      type: Sequelize.STRING(20),
      allowNull: false,
      unique: true
    });
  }
};