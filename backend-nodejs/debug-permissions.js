const { User, UserProfile, Permission } = require('./src/models');

async function debugPermissions() {
  try {
    console.log('🔍 Debug detalhado das permissões...');
    
    const user = await User.findByPk(2, {
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
        },
        {
          model: Permission,
          as: 'permissions',
          through: { 
            attributes: ['granted'],
            as: 'UserPermission'
          }
        }
      ]
    });

    console.log('📋 Resultado completo:');
    console.log(JSON.stringify(user, null, 2));

    if (user) {
      console.log('\n👤 Usuário:', user.email);
      console.log('📋 Perfil:', user.profile ? user.profile.name : 'Nenhum');
      
      if (user.profile && user.profile.permissions) {
        console.log(`🔐 Permissões do perfil (${user.profile.permissions.length}):`);
        user.profile.permissions.slice(0, 5).forEach(permission => {
          console.log(`  - ${permission.name}`);
        });
        if (user.profile.permissions.length > 5) {
          console.log(`  ... e mais ${user.profile.permissions.length - 5} permissões`);
        }
      }

      if (user.permissions) {
        console.log(`🔐 Permissões específicas do usuário (${user.permissions.length}):`);
        user.permissions.forEach(permission => {
          console.log(`  - ${permission.name}: granted=${permission.UserPermission ? permission.UserPermission.granted : 'N/A'}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

debugPermissions().then(() => {
  console.log('✅ Debug concluído');
  process.exit(0);
});