const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');

// Importar middlewares
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/logger');

// Importar rotas
const authRoutes = require('./routes/auth');
const usuarioRoutes = require('./routes/usuarios');
const empresaRoutes = require('./routes/empresas');
const fornecedorRoutes = require('./routes/fornecedores');
const produtoRoutes = require('./routes/produtos');
const entradaRoutes = require('./routes/entradas');
const vendaRoutes = require('./routes/vendas');
const alertaRoutes = require('./routes/alertas');
const configuracaoRoutes = require('./routes/configuracoes');
const aiRoutes = require('./routes/ai');
const profileRoutes = require('./routes/profiles');
const permissionRoutes = require('./routes/permissions');
const dashboardRoutes = require('./routes/dashboard');

// Importar modelos para sincronização
const db = require('./models');

const app = express();

// Configuração de CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Durante o desenvolvimento, permitir todas as origens
    if (process.env.NODE_ENV === 'development' || !origin) {
      return callback(null, true);
    }
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:5173'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS: Origem não permitida:', origin);
      callback(new Error('Não permitido pelo CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requisições por IP por janela
  message: {
    error: 'Muitas requisições deste IP, tente novamente em 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Middlewares globais
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors(corsOptions));
app.use(compression());
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}
app.use(requestLogger);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
// Rota de compatibilidade para frontend que usa /api/users
app.use('/api/users', usuarioRoutes);
app.use('/api/empresas', empresaRoutes);
app.use('/api/fornecedores', fornecedorRoutes);
app.use('/api/produtos', produtoRoutes);
app.use('/api/entradas', entradaRoutes);
app.use('/api/vendas', vendaRoutes);
app.use('/api/alertas', alertaRoutes);
app.use('/api/configuracoes', configuracaoRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Rota para servir arquivos estáticos (se necessário)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rota 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    message: `A rota ${req.method} ${req.originalUrl} não existe`
  });
});

// Middleware de tratamento de erros (deve ser o último)
app.use(errorHandler);

// Função para inicializar o banco de dados
async function initializeDatabase() {
  try {
    // Testar conexão
    await db.sequelize.authenticate();
    console.log('✅ Conexão com o banco de dados estabelecida com sucesso.');

    // Sincronizar modelos (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      // await db.sequelize.sync({ alter: true }); // Temporariamente desabilitado para preservar coluna granted
      console.log('✅ Modelos sincronizados com o banco de dados.');
    }

    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar com o banco de dados:', error);
    return false;
  }
}

// Função para iniciar o servidor
async function startServer(port = process.env.PORT || 3001) {
  try {
    // Inicializar banco de dados
    const dbInitialized = await initializeDatabase();
    
    if (!dbInitialized) {
      console.error('❌ Falha ao inicializar o banco de dados. Servidor não iniciado.');
      process.exit(1);
    }

    // Iniciar servidor
    const server = app.listen(port, () => {
      console.log(`🚀 Servidor rodando na porta ${port}`);
      console.log(`📱 API disponível em: http://localhost:${port}`);
      console.log(`🏥 Health check: http://localhost:${port}/health`);
      console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 SIGTERM recebido. Encerrando servidor graciosamente...');
      server.close(() => {
        console.log('✅ Servidor encerrado.');
        db.sequelize.close();
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('🛑 SIGINT recebido. Encerrando servidor graciosamente...');
      server.close(() => {
        console.log('✅ Servidor encerrado.');
        db.sequelize.close();
        process.exit(0);
      });
    });

    return server;
  } catch (error) {
    console.error('❌ Erro ao iniciar o servidor:', error);
    process.exit(1);
  }
}

module.exports = { app, startServer, initializeDatabase };