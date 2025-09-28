console.log('🔍 Debug das rotas...');

try {
  console.log('1. Testando importação do dashboard routes...');
  const dashboardRoutes = require('./src/routes/dashboard');
  console.log('✅ Dashboard routes importado:', typeof dashboardRoutes);
  
  console.log('2. Testando importação do express...');
  const express = require('express');
  const app = express();
  
  console.log('3. Registrando rota do dashboard...');
  app.use('/api/dashboard', dashboardRoutes);
  
  console.log('4. Verificando rotas registradas...');
  app._router.stack.forEach((middleware, index) => {
    if (middleware.route) {
      console.log(`   Rota ${index}: ${middleware.route.path}`);
    } else if (middleware.name === 'router') {
      console.log(`   Router ${index}: ${middleware.regexp}`);
    }
  });
  
  console.log('✅ Debug concluído!');
  
} catch (error) {
  console.error('❌ Erro no debug:', error.message);
  console.error('📋 Stack:', error.stack);
}