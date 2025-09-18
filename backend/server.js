require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const PORT = process.env.PORT || 4000;

// Conectar ao MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Conectado ao MongoDB');
})
.catch((error) => {
  console.error('❌ Erro ao conectar ao MongoDB:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM recebido, fechando servidor...');
  mongoose.connection.close(() => {
    console.log('Conexão MongoDB fechada.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT recebido, fechando servidor...');
  mongoose.connection.close(() => {
    console.log('Conexão MongoDB fechada.');
    process.exit(0);
  });
});

// Iniciar servidor
const server = app.listen(PORT, () => {
  server.setTimeout(300000); // 5 minutos de timeout
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
  console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
});

module.exports = app;
