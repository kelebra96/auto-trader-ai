'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const permissions = [
      // Dashboard
      { name: 'dashboard_view', description: 'Visualizar dashboard', category: 'dashboard' },
      { name: 'dashboard_stats', description: 'Ver estatísticas do dashboard', category: 'dashboard' },
      
      // Produtos
      { name: 'products_view', description: 'Visualizar produtos', category: 'products' },
      { name: 'products_create', description: 'Criar produtos', category: 'products' },
      { name: 'products_edit', description: 'Editar produtos', category: 'products' },
      { name: 'products_delete', description: 'Excluir produtos', category: 'products' },
      { name: 'products_import', description: 'Importar produtos', category: 'products' },
      { name: 'products_export', description: 'Exportar produtos', category: 'products' },
      
      // Usuários
      { name: 'users_view', description: 'Visualizar usuários', category: 'users' },
      { name: 'users_create', description: 'Criar usuários', category: 'users' },
      { name: 'users_edit', description: 'Editar usuários', category: 'users' },
      { name: 'users_delete', description: 'Excluir usuários', category: 'users' },
      { name: 'users_permissions', description: 'Gerenciar permissões de usuários', category: 'users' },
      
      // Empresas
      { name: 'companies_view', description: 'Visualizar empresas', category: 'companies' },
      { name: 'companies_create', description: 'Criar empresas', category: 'companies' },
      { name: 'companies_edit', description: 'Editar empresas', category: 'companies' },
      { name: 'companies_delete', description: 'Excluir empresas', category: 'companies' },
      
      // Fornecedores
      { name: 'suppliers_view', description: 'Visualizar fornecedores', category: 'suppliers' },
      { name: 'suppliers_create', description: 'Criar fornecedores', category: 'suppliers' },
      { name: 'suppliers_edit', description: 'Editar fornecedores', category: 'suppliers' },
      { name: 'suppliers_delete', description: 'Excluir fornecedores', category: 'suppliers' },
      
      // Alertas
      { name: 'alerts_view', description: 'Visualizar alertas', category: 'alerts' },
      { name: 'alerts_create', description: 'Criar alertas', category: 'alerts' },
      { name: 'alerts_edit', description: 'Editar alertas', category: 'alerts' },
      { name: 'alerts_delete', description: 'Excluir alertas', category: 'alerts' },
      { name: 'alerts_config', description: 'Configurar alertas', category: 'alerts' },
      { name: 'alerts_mark_read', description: 'Marcar alertas como lidos', category: 'alerts' },
      
      // Relatórios
      { name: 'reports_view', description: 'Visualizar relatórios', category: 'reports' },
      { name: 'reports_generate', description: 'Gerar relatórios', category: 'reports' },
      { name: 'reports_export', description: 'Exportar relatórios', category: 'reports' },
      { name: 'reports_validities', description: 'Relatório de validades', category: 'reports' },
      { name: 'reports_losses', description: 'Relatório de perdas', category: 'reports' },
      { name: 'reports_stock', description: 'Relatório de estoque', category: 'reports' },
      { name: 'reports_sales', description: 'Relatório de vendas', category: 'reports' },
      { name: 'reports_suppliers', description: 'Relatório de fornecedores', category: 'reports' },
      
      // Configurações
      { name: 'settings_view', description: 'Visualizar configurações', category: 'settings' },
      { name: 'settings_edit', description: 'Editar configurações', category: 'settings' },
      { name: 'settings_notifications', description: 'Configurar notificações', category: 'settings' },
      { name: 'settings_security', description: 'Configurações de segurança', category: 'settings' },
      { name: 'settings_smtp', description: 'Configurar SMTP', category: 'settings' },
      { name: 'settings_backup', description: 'Configurar backup', category: 'settings' },
      { name: 'settings_import_export', description: 'Importar/Exportar dados', category: 'settings' },
      
      // Perfil
      { name: 'profile_view', description: 'Visualizar perfil', category: 'profile' },
      { name: 'profile_edit', description: 'Editar perfil', category: 'profile' },
      { name: 'profile_change_password', description: 'Alterar senha', category: 'profile' },
      
      // Mobile
      { name: 'mobile_dashboard', description: 'Dashboard mobile', category: 'mobile' },
      { name: 'mobile_scanner', description: 'Scanner mobile', category: 'mobile' },
      
      // Perfis de usuário
      { name: 'profiles_view', description: 'Visualizar perfis de usuário', category: 'profiles' },
      { name: 'profiles_create', description: 'Criar perfis de usuário', category: 'profiles' },
      { name: 'profiles_edit', description: 'Editar perfis de usuário', category: 'profiles' },
      { name: 'profiles_delete', description: 'Excluir perfis de usuário', category: 'profiles' },
      { name: 'profiles_permissions', description: 'Gerenciar permissões de perfis', category: 'profiles' }
    ];

    const now = new Date();
    const permissionsWithTimestamps = permissions.map(permission => ({
      ...permission,
      active: true,
      createdAt: now,
      updatedAt: now
    }));

    await queryInterface.bulkInsert('Permissions', permissionsWithTimestamps);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Permissions', null, {});
  }
};