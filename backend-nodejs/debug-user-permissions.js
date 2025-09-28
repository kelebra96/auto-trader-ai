const { User, Permission, UserPermission } = require('./src/models');
// Allow passing email or user id via CLI
const targetEmail = process.argv[2] || process.env.DEBUG_EMAIL || null;
const targetId = process.argv[3] ? parseInt(process.argv[3], 10) : (process.env.DEBUG_USER_ID ? parseInt(process.env.DEBUG_USER_ID, 10) : null);

async function resolveUser() {
  if (targetId) {
    const user = await User.findByPk(targetId);
    return user;
  }
  if (targetEmail) {
    const user = await User.findOne({ where: { email: targetEmail } });
    return user;
  }
  // fallback: first user
  const user = await User.findOne();
  return user;
}

async function debugUserPermissions() {
  try {
    console.log('🔍 Debugando permissões específicas do usuário...\n');

    const user = await resolveUser();
    if (!user) {
      console.log('❌ Usuário não encontrado com os parâmetros fornecidos');
      return;
    }
    console.log(`📧 Usuário alvo: ${user.email} (ID: ${user.id})`);

    // 1. Verificar permissões específicas na tabela UserPermissions
    console.log('1. Verificando tabela UserPermissions:');
    const userPermissions = await UserPermission.findAll({
      where: { user_id: user.id },
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
    const userWithPermissions = await User.findByPk(user.id, {
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
        const permJson = permission.toJSON();
        const grantedAttr = permJson.UserPermissions?.granted ?? permJson.userPermission?.granted;
        console.log(`  - ${permission.name}: granted=${grantedAttr}`);
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