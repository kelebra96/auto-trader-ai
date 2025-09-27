const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testPermissions() {
  try {
    console.log('🔐 Testando endpoint de permissões...');
    
    // 1. Fazer login
    console.log('\n1. Fazendo login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'testuser@example.com',
      senha: 'test123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login realizado com sucesso');
    console.log('🔑 Token recebido:', token ? 'Presente' : 'Ausente');
    console.log('📋 Resposta completa do login:', JSON.stringify(loginResponse.data, null, 2));
    
    // 2. Testar endpoint de permissões
    console.log('\n2. Testando endpoint /usuarios/permissoes...');
    const permissionsResponse = await axios.get(`${API_BASE}/usuarios/permissoes`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Resposta recebida:');
    console.log('📊 Status:', permissionsResponse.status);
    console.log('📋 Estrutura da resposta:');
    
    const data = permissionsResponse.data;
    
    // Verificar estrutura esperada
    console.log('   - permissoes:', data.permissoes ? '✅ Presente' : '❌ Ausente');
    console.log('   - cargo:', data.cargo ? '✅ Presente' : '❌ Ausente');
    console.log('   - usuario:', data.usuario ? '✅ Presente' : '❌ Ausente');
    
    if (data.permissoes) {
      console.log(`   - Total de permissões: ${data.permissoes.length}`);
    }
    
    if (data.cargo) {
      console.log(`   - Cargo: ${data.cargo.nome || data.cargo}`);
    }
    
    if (data.usuario) {
      console.log(`   - Usuário: ${data.usuario.nome_completo || data.usuario.email}`);
    }
    
    console.log('\n🎉 Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
  }
}

testPermissions();