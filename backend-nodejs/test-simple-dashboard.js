const axios = require('axios');

async function testSimpleDashboard() {
  try {
    console.log('🔍 Testando se a rota do dashboard está registrada...');
    
    const baseURL = 'http://localhost:3001/api';
    
    // Teste simples sem autenticação para ver se a rota existe
    const response = await axios.get(`${baseURL}/dashboard`, {
      validateStatus: function (status) {
        return status < 500; // Aceita qualquer status < 500
      }
    });
    
    console.log('📋 Status:', response.status);
    console.log('📋 Headers:', response.headers);
    console.log('📋 Data:', response.data);
    
    if (response.status === 401) {
      console.log('✅ Rota encontrada! (401 = não autorizado, mas a rota existe)');
    } else if (response.status === 404) {
      console.log('❌ Rota não encontrada (404)');
    } else {
      console.log('🤔 Status inesperado:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (error.response) {
      console.log('📋 Status:', error.response.status);
      console.log('📋 Data:', error.response.data);
    }
  }
}

testSimpleDashboard();