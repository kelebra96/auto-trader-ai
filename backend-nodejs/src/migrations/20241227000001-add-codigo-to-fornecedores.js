'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('fornecedores', 'codigo', {
      type: Sequelize.STRING(20),
      allowNull: true,
      unique: true,
      comment: 'Código único do fornecedor gerado automaticamente baseado no ID'
    });

    // Gerar códigos para fornecedores existentes
    const [fornecedores] = await queryInterface.sequelize.query(
      'SELECT id FROM fornecedores ORDER BY id ASC'
    );

    for (const fornecedor of fornecedores) {
      const codigo = `FOR${String(fornecedor.id).padStart(6, '0')}`;
      await queryInterface.sequelize.query(
        'UPDATE fornecedores SET codigo = ? WHERE id = ?',
        {
          replacements: [codigo, fornecedor.id]
        }
      );
    }

    // Tornar o campo obrigatório após popular os dados existentes
    await queryInterface.changeColumn('fornecedores', 'codigo', {
      type: Sequelize.STRING(20),
      allowNull: false,
      unique: true,
      comment: 'Código único do fornecedor gerado automaticamente baseado no ID'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('fornecedores', 'codigo');
  }
};