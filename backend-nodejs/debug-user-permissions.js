const { User, Permission, UserPermission } = require('./src/models');

async function debugUserPermissions() {
  try {
    console.log('🔍 Debugando permissões específicas do usuário...\n');

    // 1. Verificar permissões específicas na tabela UserPermissions
    console.log('1. Verificando tabela UserPermissions:');
    const userPermissions = await UserPermission.findAll({
      where: { user_id: 2 },
      include: [
        {
          model: Permission,
          as: 'permission'
        }
      ]
    });

    console.log(`Encontradas ${userPermissions.length} permissões específicas:`);
    userPermissions.forEach(up => {
      console.log(`  - ${up.permission.name}: ${up.granted ? 'GRANTED' : 'DENIED'}`);
    });

    // 2. Testar consulta com include
    console.log('\n2. Testando consulta com include:');
    const userWithPermissions = await User.findByPk(2, {
      include: [
        {
          model: Permission,
          as: 'permissions',
          through: { 
            attributes: ['granted']
          }
        }
      ]
    });

    console.log(`Usuário encontrado: ${userWithPermissions.email}`);
    console.log(`Permissões carregadas: ${userWithPermissions.permissions ? userWithPermissions.permissions.length : 0}`);
    
    if (userWithPermissions.permissions) {
      userWithPermissions.permissions.forEach(permission => {
        console.log(`  - ${permission.name}:`);
        console.log(`    permission object:`, JSON.stringify(permission.toJSON(), null, 2));
        const userPermission = permission.UserPermissions;
        console.log(`    UserPermissions:`, userPermission);
        console.log(`    granted:`, userPermission ? userPermission.granted : 'undefined');
      });
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Stack:', error.stack);
  }
}

debugUserPermissions().then(() => {
  console.log('\n✅ Debug concluído');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});