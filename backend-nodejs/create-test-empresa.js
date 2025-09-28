const { User, Empresa } = require('./src/models');

async function createTestEmpresa() {
  try {
    console.log('🏢 Criando empresa de teste...');
    
    // Buscar o usuário de teste
    const user = await User.findOne({
      where: { email: 'testuser@example.com' }
    });
    
    if (!user) {
      console.log('❌ Usuário de teste não encontrado');
      return;
    }
    
    console.log(`✅ Usuário encontrado: ${user.email} (ID: ${user.id})`);
    
    // Verificar se já existe uma empresa para este usuário
    const empresaExistente = await Empresa.findOne({
      where: { usuario_id: user.id }
    });
    
    if (empresaExistente) {
      console.log(`✅ Empresa já existe: ${empresaExistente.nome} (ID: ${empresaExistente.id})`);
      return empresaExistente;
    }
    
    // Criar nova empresa
    const novaEmpresa = await Empresa.create({
      nome: 'Empresa Teste Ltda',
      cnpj: '12.345.678/0001-95',
      endereco: 'Rua Teste, 123, Centro',
      telefone: '(11) 3333-4444',
      email: 'contato@empresateste.com',
      usuario_id: user.id,
      ativa: true
    });
    
    console.log('✅ Empresa criada com sucesso!');
    console.log(`📋 ID: ${novaEmpresa.id}`);
    console.log(`📛 Nome: ${novaEmpresa.nome}`);
    console.log(`🏷️ CNPJ: ${novaEmpresa.cnpj}`);
    console.log(`👤 Usuário: ${user.email}`);
    
    return novaEmpresa;
    
  } catch (error) {
    console.error('❌ Erro ao criar empresa:', error.message);
    throw error;
  }
}

createTestEmpresa().then(() => {
  console.log('\n🎉 Processo concluído!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Erro:', error.message);
  process.exit(1);
});