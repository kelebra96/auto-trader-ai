const { User, UserProfile, Permission, ProfilePermission, UserPermission } = require('./src/models');

async function checkUserPermissions() {
  try {
    console.log('🔍 Verificando usuário e suas permissões...');
    
    // Buscar usuário com perfil
    const user = await User.findOne({
      where: { id: 2 },
      include: [
        {
          model: UserProfile,
          as: 'profile',
          include: [
            {
              model: Permission,
              as: 'permissions',
              through: { attributes: [] }
            }
          ]
        }
      ]
    });

    if (!user) {
      console.log('❌ Usuário não encontrado');
      return;
    }

    console.log(`👤 Usuário: ${user.email}`);
    console.log(`📋 Perfil: ${user.profile ? user.profile.name : 'Nenhum perfil associado'}`);
    
    if (user.profile && user.profile.permissions) {
      console.log(`🔐 Permissões do perfil (${user.profile.permissions.length}):`);
      user.profile.permissions.forEach(permission => {
        console.log(`  - ${permission.name}: ${permission.description}`);
      });
    }

    // Verificar se existem perfis disponíveis
    console.log('\n📋 Perfis disponíveis:');
    const profiles = await UserProfile.findAll({
      include: [
        {
          model: Permission,
          as: 'permissions',
          through: { attributes: [] }
        }
      ]
    });

    profiles.forEach(profile => {
      console.log(`  - ${profile.name} (${profile.permissions.length} permissões)`);
    });

    // Se o usuário não tem perfil, associar ao primeiro perfil disponível
    if (!user.profile && profiles.length > 0) {
      console.log('\n🔧 Associando usuário ao primeiro perfil disponível...');
      await user.update({ profile_id: profiles[0].id });
      console.log(`✅ Usuário associado ao perfil: ${profiles[0].name}`);
    }

    // Verificar permissões disponíveis
    console.log('\n🔐 Permissões disponíveis no sistema:');
    const allPermissions = await Permission.findAll();
    allPermissions.forEach(permission => {
      console.log(`  - ${permission.name}: ${permission.description}`);
    });

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

checkUserPermissions().then(() => {
  console.log('✅ Verificação concluída');
  process.exit(0);
});