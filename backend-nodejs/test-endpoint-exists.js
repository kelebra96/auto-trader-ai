const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testEndpoints() {
  try {
    console.log('🔍 Testando endpoints disponíveis...');
    
    // 1. Testar health check
    console.log('\n1. Testando health check...');
    try {
      const healthResponse = await axios.get('http://localhost:3001/health');
      console.log('✅ Health check:', healthResponse.status);
    } catch (error) {
      console.log('❌ Health check falhou:', error.message);
    }
    
    // 2. Testar endpoint de usuários sem autenticação
    console.log('\n2. Testando GET /usuarios/permissoes sem token...');
    try {
      const response = await axios.get(`${API_BASE}/usuarios/permissoes`);
      console.log('✅ Resposta:', response.status);
    } catch (error) {
      console.log('📋 Erro esperado (sem token):', error.response?.status, error.response?.data?.error);
    }
    
    // 3. Fazer login primeiro
    console.log('\n3. Fazendo login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'testuser@example.com',
      senha: 'test123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login realizado, token obtido');
    console.log('🔍 Token:', token ? 'Presente' : 'Ausente');
    console.log('📋 Token value:', token);
    
    // 4. Testar com token válido
    console.log('\n4. Testando GET /usuarios/permissoes com token...');
    try {
      const response = await axios.get(`${API_BASE}/usuarios/permissoes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Sucesso! Status:', response.status);
      console.log('📋 Resposta:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log('❌ Erro:', error.response?.status);
      console.log('📋 Detalhes:', error.response?.data);
      console.log('🔍 Headers enviados:', error.config?.headers);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testEndpoints();