'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    
    // Criar perfis padrão
    const profiles = [
      {
        name: 'Super Admin',
        description: 'Acesso total ao sistema com todas as permissões',
        is_default: false,
        active: true,
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Administrador',
        description: 'Acesso administrativo com a maioria das permissões',
        is_default: true,
        active: true,
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Gerente',
        description: 'Acesso de gerenciamento com permissões limitadas',
        is_default: false,
        active: true,
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Operador',
        description: 'Acesso básico para operações do dia a dia',
        is_default: false,
        active: true,
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Visualizador',
        description: 'Acesso apenas para visualização de dados',
        is_default: false,
        active: true,
        createdAt: now,
        updatedAt: now
      }
    ];

    await queryInterface.bulkInsert('UserProfiles', profiles);

    // Buscar IDs dos perfis e permissões criados
    const insertedProfiles = await queryInterface.sequelize.query(
      'SELECT id, name FROM UserProfiles ORDER BY id',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const permissions = await queryInterface.sequelize.query(
      'SELECT id, name, category FROM Permissions ORDER BY id',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Mapear permissões por categoria
    const permissionsByCategory = permissions.reduce((acc, perm) => {
      if (!acc[perm.category]) acc[perm.category] = [];
      acc[perm.category].push(perm.id);
      return acc;
    }, {});

    const allPermissionIds = permissions.map(p => p.id);

    // Definir permissões para cada perfil
    const profilePermissions = [];

    insertedProfiles.forEach(profile => {
      let permissionIds = [];

      switch (profile.name) {
        case 'Super Admin':
          // Todas as permissões
          permissionIds = allPermissionIds;
          break;

        case 'Administrador':
          // Todas exceto algumas específicas de super admin
          permissionIds = allPermissionIds.filter(id => {
            const perm = permissions.find(p => p.id === id);
            return !['settings_security', 'profiles_delete'].includes(perm.name);
          });
          break;

        case 'Gerente':
          // Permissões de visualização e algumas de edição
          permissionIds = [
            ...permissionsByCategory.dashboard || [],
            ...permissionsByCategory.products || [],
            ...permissionsByCategory.companies || [],
            ...permissionsByCategory.suppliers || [],
            ...permissionsByCategory.alerts || [],
            ...permissionsByCategory.reports || [],
            ...permissionsByCategory.profile || [],
            ...permissionsByCategory.mobile || []
          ].filter(id => {
            const perm = permissions.find(p => p.id === id);
            return !perm.name.includes('delete') && !perm.name.includes('permissions');
          });
          break;

        case 'Operador':
          // Permissões básicas de operação
          permissionIds = [
            ...permissionsByCategory.dashboard || [],
            ...permissionsByCategory.products?.filter(id => {
              const perm = permissions.find(p => p.id === id);
              return ['products_view', 'products_create', 'products_edit'].includes(perm.name);
            }) || [],
            ...permissionsByCategory.alerts?.filter(id => {
              const perm = permissions.find(p => p.id === id);
              return ['alerts_view', 'alerts_mark_read'].includes(perm.name);
            }) || [],
            ...permissionsByCategory.profile || [],
            ...permissionsByCategory.mobile || []
          ];
          break;

        case 'Visualizador':
          // Apenas visualização
          permissionIds = permissions
            .filter(perm => perm.name.includes('view') || perm.name.includes('dashboard'))
            .map(perm => perm.id);
          break;
      }

      // Adicionar permissões do perfil
      permissionIds.forEach(permissionId => {
        profilePermissions.push({
          profile_id: profile.id,
          permission_id: permissionId,
          createdAt: now,
          updatedAt: now
        });
      });
    });

    if (profilePermissions.length > 0) {
      await queryInterface.bulkInsert('ProfilePermissions', profilePermissions);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('ProfilePermissions', null, {});
    await queryInterface.bulkDelete('UserProfiles', null, {});
  }
};