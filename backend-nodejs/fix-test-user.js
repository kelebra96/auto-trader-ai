const bcrypt = require('bcryptjs');
const { User } = require('./src/models');

async function fixTestUser() {
  try {
    console.log('🔧 Verificando e corrigindo usuário de teste...');
    
    const user = await User.findOne({
      where: { email: 'testuser@example.com' }
    });
    
    if (!user) {
      console.log('❌ Usuário não encontrado');
      return;
    }
    
    console.log('👤 Usuário encontrado:', user.email);
    console.log('🔐 Hash atual da senha:', user.senha);
    
    // Gerar nova senha hash
    const newPassword = 'password123';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    console.log('🔐 Nova senha hash:', hashedPassword);
    
    // Atualizar senha
    await user.update({ senha: hashedPassword });
    
    console.log('✅ Senha atualizada com sucesso');
    
    // Testar a senha
    const isValid = await bcrypt.compare(newPassword, hashedPassword);
    console.log('🧪 Teste da senha:', isValid ? 'VÁLIDA' : 'INVÁLIDA');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

fixTestUser().then(() => {
  console.log('✅ Correção concluída');
  process.exit(0);
});