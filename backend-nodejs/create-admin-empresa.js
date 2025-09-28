const { User, Empresa } = require('./src/models');

async function createAdminEmpresa() {
  try {
    console.log('🏢 Criando empresa para usuário admin...');
    
    // Buscar o usuário admin
    const user = await User.findOne({
      where: { email: 'admin@teste.com' }
    });
    
    if (!user) {
      console.log('❌ Usuário admin não encontrado');
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
      nome: 'Empresa Admin Ltda',
      cnpj: '98.765.432/0001-11',
      endereco: 'Rua Admin, 456, Centro',
      telefone: '(11) 5555-6666',
      email: 'admin@empresaadmin.com',
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

createAdminEmpresa()
  .then(() => {
    console.log('\n🎉 Processo concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro:', error);
    process.exit(1);
  });