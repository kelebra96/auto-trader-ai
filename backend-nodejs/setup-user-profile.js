const { User, UserProfile, Permission } = require('./src/models');

async function setupUserProfile() {
  try {
    console.log('🔍 Configurando perfil para o usuário de teste...');

    // 1. Verificar se já existe um perfil padrão
    let defaultProfile = await UserProfile.findOne({
      where: { is_default: true, active: true }
    });

    if (!defaultProfile) {
      console.log('📝 Criando perfil padrão...');
      defaultProfile = await UserProfile.create({
        name: 'Usuário Padrão',
        description: 'Perfil padrão para usuários do sistema',
        is_default: true,
        active: true
      });
      console.log('✅ Perfil padrão criado:', defaultProfile.name);
    } else {
      console.log('✅ Perfil padrão já existe:', defaultProfile.name);
    }

    // 2. Verificar se existem permissões básicas
    const basicPermissions = [
      { name: 'dashboard_view', description: 'Visualizar dashboard', category: 'dashboard' },
      { name: 'products_view', description: 'Visualizar produtos', category: 'products' },
      { name: 'companies_view', description: 'Visualizar empresas', category: 'companies' }
    ];

    for (const permData of basicPermissions) {
      let permission = await Permission.findOne({ where: { name: permData.name } });
      
      if (!permission) {
        permission = await Permission.create({
          ...permData,
          active: true
        });
        console.log('✅ Permissão criada:', permission.name);
      }
    }

    // 3. Associar permissões básicas ao perfil padrão
    const permissions = await Permission.findAll({
      where: { 
        name: basicPermissions.map(p => p.name),
        active: true 
      }
    });

    if (permissions.length > 0) {
      await defaultProfile.setPermissions(permissions);
      console.log('✅ Permissões associadas ao perfil padrão');
    }

    // 4. Associar o perfil ao usuário de teste
    const testUser = await User.findOne({
      where: { email: 'testuser@example.com' }
    });

    if (testUser) {
      await testUser.update({ profile_id: defaultProfile.id });
      console.log('✅ Perfil associado ao usuário de teste');
      
      // Verificar a associação
      const userWithProfile = await User.findByPk(testUser.id, {
        include: [
          {
            model: UserProfile,
            as: 'profile'
          }
        ]
      });
      
      console.log('👤 Usuário atualizado:');
      console.log('- Email:', userWithProfile.email);
      console.log('- Perfil:', userWithProfile.profile?.name);
      console.log('- Profile ID:', userWithProfile.profile_id);
    } else {
      console.log('❌ Usuário de teste não encontrado');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

setupUserProfile();