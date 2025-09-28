const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testUsersAPI() {
  try {
    console.log('🧪 Testando API de usuários...\n');

    // 1. Login
    console.log('1. Fazendo login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'testuser@example.com',
      senha: 'password123'
    });

    console.log('✅ Login realizado com sucesso');
    console.log('   Resposta completa:', JSON.stringify(loginResponse.data, null, 2));
    
    const token = loginResponse.data.token || loginResponse.data.data?.token;
    console.log('   Token extraído:', token ? 'Sim' : 'Não');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 2. Testar GET /api/users
    console.log('\n2. Testando GET /api/users...');
    try {
      const usersResponse = await axios.get(`${BASE_URL}/api/users`, { headers });
      console.log('✅ GET /api/users - Sucesso');
      console.log(`   Usuários encontrados: ${usersResponse.data.length}`);
    } catch (error) {
      console.log('❌ GET /api/users - Erro:', error.response?.status, error.response?.data?.message || error.response?.data);
      console.log('   Headers enviados:', JSON.stringify(headers, null, 2));
    }

    // 3. Testar POST /api/users
    console.log('\n3. Testando POST /api/users...');
    try {
      const newUser = {
        email: 'newuser@example.com',
        senha: 'password123',
        nome_estabelecimento: 'Novo Estabelecimento',
        papel: 'usuario'
      };

      const createResponse = await axios.post(`${BASE_URL}/api/users`, newUser, { headers });
      console.log('✅ POST /api/users - Sucesso');
      console.log(`   Usuário criado com ID: ${createResponse.data.id}`);
      
      // Limpar - deletar o usuário criado
      try {
        await axios.delete(`${BASE_URL}/api/users/${createResponse.data.id}`, { headers });
        console.log('   ✅ Usuário de teste removido');
      } catch (deleteError) {
        console.log('   ⚠️ Erro ao remover usuário de teste:', deleteError.response?.data?.message);
      }
    } catch (error) {
      console.log('❌ POST /api/users - Erro:', error.response?.status, error.response?.data?.message);
    }

    // 4. Testar PUT /api/users/:id
    console.log('\n4. Testando PUT /api/users/:id...');
    try {
      const updateData = {
        nome_estabelecimento: 'Estabelecimento Atualizado'
      };

      const updateResponse = await axios.put(`${BASE_URL}/api/users/2`, updateData, { headers });
      console.log('✅ PUT /api/users/2 - Sucesso');
    } catch (error) {
      console.log('❌ PUT /api/users/2 - Erro:', error.response?.status, error.response?.data?.message);
    }

    console.log('\n✅ Teste da API concluído');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

testUsersAPI().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});