const { User, Permission, UserPermission } = require('./src/models');

async function grantUserPermissions() {
  try {
    console.log('🔐 Concedendo permissões de usuários...');
    
    // Buscar o usuário de teste
    const user = await User.findOne({
      where: { email: 'testuser@example.com' }
    });
    
    if (!user) {
      console.log('❌ Usuário não encontrado');
      return;
    }
    
    console.log(`✅ Usuário encontrado: ${user.email} (ID: ${user.id})`);
    
    // Buscar permissões relacionadas a usuários
    const userPermissions = await Permission.findAll({
      where: {
        name: [
          'users_view',
          'users_create', 
          'users_edit',
          'users_delete'
        ],
        active: true
      }
    });
    
    console.log(`📋 Encontradas ${userPermissions.length} permissões de usuários`);
    
    // Conceder todas as permissões
    for (const permission of userPermissions) {
      try {
        // Tentar criar nova permissão (upsert)
        const [userPermission, created] = await UserPermission.findOrCreate({
          where: {
            user_id: user.id,
            permission_id: permission.id
          },
          defaults: {
            user_id: user.id,
            permission_id: permission.id,
            granted: true
          }
        });
        
        if (!created) {
          // Se já existe, atualizar para granted = true
          await userPermission.update({ granted: true });
          console.log(`✅ Permissão atualizada: ${permission.name}`);
        } else {
          console.log(`✅ Permissão concedida: ${permission.name}`);
        }
      } catch (error) {
        console.log(`⚠️ Erro ao processar ${permission.name}: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Todas as permissões de usuários foram concedidas!');
    
    // Verificar permissões do usuário
    const userWithPermissions = await User.findByPk(user.id, {
      include: [
        {
          model: Permission,
          as: 'permissions',
          through: { 
            attributes: ['granted'],
            as: 'userPermission'
          }
        }
      ]
    });
    
    console.log('\n📋 Permissões específicas do usuário:');
    userWithPermissions.permissions.forEach(perm => {
      const granted = perm.userPermission.granted;
      console.log(`   - ${perm.name}: ${granted ? '✅ CONCEDIDA' : '❌ NEGADA'}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

grantUserPermissions().then(() => {
  console.log('\n✅ Processo concluído');
  process.exit(0);
});