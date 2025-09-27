const axios = require('axios');

async function testPermissionsAPI() {
  try {
    console.log('🌐 Testando endpoint HTTP de permissões...');
    
    const baseURL = 'http://localhost:3001';
    const userId = 2;
    
    // Primeiro, vamos fazer login para obter um token
    console.log('🔐 Fazendo login...');
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'testuser@example.com',
      senha: 'password123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login realizado com sucesso');
    
    // Agora testar o endpoint de permissões
    console.log('📋 Testando endpoint de permissões...');
    const permissionsResponse = await axios.get(`${baseURL}/api/usuarios/permissoes`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Endpoint de permissões funcionando!');
    console.log('📋 Resposta:', JSON.stringify(permissionsResponse.data, null, 2));
    
    // Testar endpoint de verificação de permissão específica do usuário
    console.log('\n🔍 Testando endpoint de permissões específicas do usuário...');
    const checkResponse = await axios.get(`${baseURL}/api/usuarios/${userId}/permissions`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Verificação de permissão específica funcionando!');
    console.log('📋 Resposta:', JSON.stringify(checkResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Erro ao testar API:', error.response ? error.response.data : error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

testPermissionsAPI().then(() => {
  console.log('✅ Teste da API concluído');
  process.exit(0);
});