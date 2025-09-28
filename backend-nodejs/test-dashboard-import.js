console.log('🔍 Testando importação das rotas do dashboard...');

try {
  const dashboardRoutes = require('./src/routes/dashboard');
  console.log('✅ Rotas do dashboard importadas com sucesso');
  console.log('📋 Tipo:', typeof dashboardRoutes);
  console.log('📋 Stack de rotas:', dashboardRoutes.stack ? dashboardRoutes.stack.length : 'N/A');
} catch (error) {
  console.error('❌ Erro ao importar rotas do dashboard:', error.message);
  console.error('📋 Stack:', error.stack);
}

try {
  const dashboardController = require('./src/controllers/dashboardController');
  console.log('✅ Controller do dashboard importado com sucesso');
  console.log('📋 Funções disponíveis:', Object.keys(dashboardController));
} catch (error) {
  console.error('❌ Erro ao importar controller do dashboard:', error.message);
  console.error('📋 Stack:', error.stack);
}

console.log('🎯 Teste de importação concluído!');