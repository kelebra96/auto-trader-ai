const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testUsersRoute() {
  try {
    console.log('🔍 Testando nova rota /api/users...');
    
    // 1. Fazer login primeiro
    console.log('\n1. Fazendo login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'testuser@example.com',
      senha: 'test123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login realizado com sucesso');
    
    // 2. Testar GET /api/users
    console.log('\n2. Testando GET /api/users...');
    try {
      const response = await axios.get(`${API_BASE}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ GET /api/users funcionando!');
      console.log(`📊 Encontrados ${response.data.data?.length || 0} usuários`);
    } catch (error) {
      console.log('❌ Erro no GET /api/users:', error.response?.status, error.response?.data?.message);
    }
    
    // 3. Testar POST /api/users (criar usuário)
    console.log('\n3. Testando POST /api/users...');
    const novoUsuario = {
      nome_completo: 'Usuário Teste API',
      email: 'teste.api@example.com',
      telefone: '(11) 99999-9999',
      empresa: 'Empresa Teste',
      nome_estabelecimento: 'Estabelecimento Teste',
      password: 'teste123',
      bio: 'Usuário criado para teste da API',
      ativo: true
    };
    
    try {
      const response = await axios.post(`${API_BASE}/users`, novoUsuario, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ POST /api/users funcionando!');
      console.log('📋 Usuário criado:', response.data.data?.nome_completo);
      
      // 4. Testar PUT /api/users/:id (atualizar usuário)
      const userId = response.data.data?.id;
      if (userId) {
        console.log('\n4. Testando PUT /api/users/:id...');
        try {
          const updateResponse = await axios.put(`${API_BASE}/users/${userId}`, {
            nome_completo: 'Usuário Teste API Atualizado',
            bio: 'Bio atualizada via teste'
          }, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          console.log('✅ PUT /api/users/:id funcionando!');
          console.log('📋 Usuário atualizado:', updateResponse.data.data?.nome_completo);
        } catch (error) {
          console.log('❌ Erro no PUT /api/users/:id:', error.response?.status, error.response?.data?.message);
        }
        
        // 5. Testar DELETE /api/users/:id (deletar usuário)
        console.log('\n5. Testando DELETE /api/users/:id...');
        try {
          const deleteResponse = await axios.delete(`${API_BASE}/users/${userId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          console.log('✅ DELETE /api/users/:id funcionando!');
          console.log('📋 Usuário deletado com sucesso');
        } catch (error) {
          console.log('❌ Erro no DELETE /api/users/:id:', error.response?.status, error.response?.data?.message);
        }
      }
      
    } catch (error) {
      console.log('❌ Erro no POST /api/users:', error.response?.status, error.response?.data?.message);
      console.log('📋 Detalhes do erro:', error.response?.data);
    }
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error.message);
    if (error.response) {
      console.error('📋 Status:', error.response.status);
      console.error('📋 Dados:', error.response.data);
    }
  }
}

testUsersRoute().then(() => {
  console.log('\n✅ Teste da rota /api/users concluído');
  process.exit(0);
});