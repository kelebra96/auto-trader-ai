const axios = require('axios');

async function testDashboardRoute() {
  try {
    console.log('🏠 Testando rota do dashboard...');
    
    const baseURL = 'http://localhost:3001/api';
    
    // 1. Fazer login
    console.log('\n1. 🔐 Fazendo login...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'testuser@example.com',
      senha: 'password123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login realizado com sucesso');
    
    // 2. Testar rota do dashboard
    console.log('\n2. 🏠 Testando GET /dashboard...');
    try {
      const dashboardResponse = await axios.get(`${baseURL}/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Dashboard acessado com sucesso!');
      console.log('📊 Status:', dashboardResponse.status);
      console.log('📋 Dados recebidos:');
      console.log('   - Stats:', dashboardResponse.data.stats ? 'Presente' : 'Ausente');
      console.log('   - Recent Products:', dashboardResponse.data.recentProducts ? `${dashboardResponse.data.recentProducts.length} produtos` : 'Ausente');
      console.log('   - Expiring Products:', dashboardResponse.data.expiringProducts ? `${dashboardResponse.data.expiringProducts.length} produtos` : 'Ausente');
      
      if (dashboardResponse.data.stats) {
        console.log('\n📈 Estatísticas:');
        console.log(`   - Total de produtos: ${dashboardResponse.data.stats.totalProdutos}`);
        console.log(`   - Produtos vencendo: ${dashboardResponse.data.stats.produtosVencendo}`);
        console.log(`   - Produtos vencidos: ${dashboardResponse.data.stats.produtosVencidos}`);
        console.log(`   - Valor do estoque: R$ ${dashboardResponse.data.stats.valorEstoque.toFixed(2)}`);
        console.log(`   - Usuários ativos: ${dashboardResponse.data.stats.usuariosAtivos}`);
      }
      
      return {
        success: true,
        data: dashboardResponse.data
      };
      
    } catch (error) {
      console.error('❌ Erro ao acessar dashboard:', error.response ? error.response.data : error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
      }
      return {
        success: false,
        error: error.message
      };
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.response ? error.response.data : error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

testDashboardRoute().then((result) => {
  console.log('\n🎯 Teste concluído!');
  if (result.success) {
    console.log('🎉 SUCESSO: Rota do dashboard funcionando corretamente!');
  } else {
    console.log('⚠️ ERRO: Problema na rota do dashboard.');
  }
  process.exit(0);
});