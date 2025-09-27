const { User, UserProfile, Permission } = require('./src/models');

async function checkUserData() {
  try {
    console.log('🔍 Verificando dados do usuário no banco...');

    // 1. Verificar se o usuário existe
    const user = await User.findOne({
      where: { email: 'testuser@example.com' }
    });

    if (!user) {
      console.log('❌ Usuário não encontrado');
      return;
    }

    console.log('✅ Usuário encontrado:');
    console.log('ID:', user.id);
    console.log('Email:', user.email);
    console.log('Papel:', user.papel);
    console.log('Profile ID:', user.profile_id);
    console.log('Ativo:', user.ativo);

    // 2. Verificar se tem perfil
    if (user.profile_id) {
      const profile = await UserProfile.findByPk(user.profile_id);
      console.log('\n👤 Perfil:');
      console.log('Nome:', profile?.name || 'Não encontrado');
      console.log('Ativo:', profile?.active);
    } else {
      console.log('\n❌ Usuário não tem perfil associado');
    }

    // 3. Verificar permissões diretas
    const userWithPermissions = await User.findByPk(user.id, {
      include: [
        {
          model: Permission,
          as: 'permissions',
          through: { attributes: ['granted'] }
        }
      ]
    });

    console.log('\n🔑 Permissões diretas:', userWithPermissions.permissions?.length || 0);

    // 4. Tentar a consulta que está falhando
    console.log('\n🧪 Testando consulta completa...');
    try {
      const userComplete = await User.findByPk(user.id, {
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
              as: 'userPermission'
            }
          }
        ]
      });

      console.log('✅ Consulta completa funcionou');
      console.log('Perfil:', userComplete.profile?.name || 'Nenhum');
      console.log('Permissões do perfil:', userComplete.profile?.permissions?.length || 0);
      console.log('Permissões diretas:', userComplete.permissions?.length || 0);

    } catch (error) {
      console.log('❌ Erro na consulta completa:', error.message);
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkUserData();