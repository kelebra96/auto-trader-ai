async function testUserDebug() {
  try {
    console.log('🔍 Testando dados do usuário...');

    // 0. Verificar se o servidor está rodando
    console.log('\n0. Verificando servidor...');
    try {
      const healthResponse = await fetch('http://localhost:3001/health');
      console.log('✅ Servidor rodando:', healthResponse.status);
    } catch (error) {
      console.log('❌ Servidor não está respondendo:', error.message);
      return;
    }

    // 1. Fazer login
    console.log('\n1. Fazendo login...');
    try {
      const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'testuser@example.com',
          password: 'test123'
        })
      });

      const loginData = await loginResponse.json();
      
      if (!loginResponse.ok) {
        console.log('❌ Erro no login:');
        console.log('Status:', loginResponse.status);
        console.log('Dados:', JSON.stringify(loginData, null, 2));
        return;
      }

      const token = loginData.data.token;
      console.log('✅ Login realizado, token obtido');

      // 2. Testar endpoint de permissões
      console.log('\n2. Testando endpoint de permissões...');
      try {
        const permissionsResponse = await fetch('http://localhost:3001/api/usuarios/permissoes', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const permissionsData = await permissionsResponse.json();
        
        if (permissionsResponse.ok) {
          console.log('✅ Permissões obtidas com sucesso:');
          console.log(JSON.stringify(permissionsData, null, 2));
        } else {
          console.log('❌ Erro ao obter permissões:');
          console.log('Status:', permissionsResponse.status);
          console.log('Dados:', JSON.stringify(permissionsData, null, 2));
        }
        
      } catch (error) {
        console.log('❌ Erro na requisição de permissões:', error.message);
      }

    } catch (loginError) {
      console.log('❌ Erro na requisição de login:', loginError.message);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testUserDebug();