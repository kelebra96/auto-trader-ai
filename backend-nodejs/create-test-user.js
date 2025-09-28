const bcrypt = require('bcryptjs');
const { User, UserProfile } = require('./src/models');

async function createTestUser() {
  try {
    console.log('🔧 Criando usuário de teste...\n');

    // Verificar se já existe
    const existingUser = await User.findOne({ where: { email: 'testuser@example.com' } });
    
    if (existingUser) {
      console.log('Usuário já existe. Atualizando senha...');
      const hashedPassword = await bcrypt.hash('password123', 10);
      await existingUser.update({ senha: hashedPassword });
      console.log('✅ Senha atualizada para: password123');
    } else {
      // Buscar perfil Administrador
      const adminProfile = await UserProfile.findOne({ where: { name: 'Administrador' } });
      
      if (!adminProfile) {
        throw new Error('Perfil Administrador não encontrado');
      }

      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const user = await User.create({
        email: 'testuser@example.com',
        senha: hashedPassword,
        nome_estabelecimento: 'Estabelecimento Teste',
        papel: 'usuario',
        ativo: true,
        profile_id: adminProfile.id
      });

      console.log('✅ Usuário criado com sucesso');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Perfil: ${adminProfile.name}`);
    }

    console.log('\n✅ Usuário de teste pronto para uso');
    console.log('   Email: testuser@example.com');
    console.log('   Senha: password123');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Stack:', error.stack);
  }
}

createTestUser();