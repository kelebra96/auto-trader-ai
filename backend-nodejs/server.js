require('dotenv').config();
const { startServer } = require('./src/app');

// Configurar variáveis de ambiente padrão se não estiverem definidas
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

if (!process.env.PORT) {
  process.env.PORT = '3001';
}

// Iniciar o servidor
startServer(process.env.PORT)
  .then(() => {
    console.log('🎉 Auto Trader AI Backend iniciado com sucesso!');
  })
  .catch((error) => {
    console.error('💥 Falha ao iniciar o servidor:', error);
    process.exit(1);
  });