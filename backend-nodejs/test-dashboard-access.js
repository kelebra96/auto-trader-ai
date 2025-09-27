const axios = require('axios');

async function testDashboardAccess() {
  try {
    console.log('🏠 Testando acesso ao dashboard...');
    
    const baseURL = 'http://localhost:3001/api';
    
    // 1. Fazer login
    console.log('\n1. 🔐 Fazendo login...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'testuser@example.com',
      senha: 'password123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login realizado com sucesso');
    console.log('👤 Usuário:', loginResponse.data.data.user.email);
    console.log('🎭 Papel:', loginResponse.data.data.user.papel);
    
    // 2. Obter permissões do usuário
    console.log('\n2. 📋 Obtendo permissões...');
    const permissionsResponse = await axios.get(`${baseURL}/usuarios/permissoes`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const permissions = permissionsResponse.data.permissoes;
    console.log(`✅ ${permissions.length} permissões obtidas:`);
    permissions.forEach(perm => console.log(`   - ${perm}`));
    
    // 3. Verificar se tem permissão para dashboard
    const hasDashboardAccess = permissions.includes('dashboard_view');
    console.log(`\n3. 🏠 Acesso ao dashboard: ${hasDashboardAccess ? '✅ PERMITIDO' : '❌ NEGADO'}`);
    
    // 4. Verificar outras permissões importantes
    console.log('\n4. 🔍 Verificando outras permissões importantes:');
    const importantPermissions = [
      'products_view',
      'companies_view',
      'users_view',
      'reports_view',
      'settings_view'
    ];
    
    importantPermissions.forEach(perm => {
      const hasPermission = permissions.includes(perm);
      console.log(`   - ${perm}: ${hasPermission ? '✅' : '❌'}`);
    });
    
    // 5. Testar endpoint de verificação de token
    console.log('\n5. 🔑 Verificando validade do token...');
    const verifyResponse = await axios.get(`${baseURL}/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Token válido');
    console.log('👤 Dados do usuário verificados:', verifyResponse.data.data.user.email);
    
    // 6. Resumo final
    console.log('\n📊 RESUMO FINAL:');
    console.log('================');
    console.log(`✅ Login: FUNCIONANDO`);
    console.log(`✅ Autenticação: FUNCIONANDO`);
    console.log(`✅ Permissões: ${permissions.length} carregadas`);
    console.log(`${hasDashboardAccess ? '✅' : '❌'} Dashboard: ${hasDashboardAccess ? 'ACESSÍVEL' : 'BLOQUEADO'}`);
    console.log(`✅ Sistema de permissões: FUNCIONANDO`);
    
    return {
      loginWorking: true,
      authWorking: true,
      permissionsCount: permissions.length,
      dashboardAccess: hasDashboardAccess,
      permissions: permissions
    };
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.response ? error.response.data : error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
    }
    return {
      loginWorking: false,
      authWorking: false,
      permissionsCount: 0,
      dashboardAccess: false,
      error: error.message
    };
  }
}

testDashboardAccess().then((result) => {
  console.log('\n🎯 Teste concluído!');
  if (result.loginWorking && result.authWorking && result.dashboardAccess) {
    console.log('🎉 SUCESSO: Sistema de permissões funcionando corretamente!');
  } else {
    console.log('⚠️ ATENÇÃO: Alguns problemas foram encontrados.');
  }
  process.exit(0);
});