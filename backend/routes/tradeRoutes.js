const express = require('express');
const router = express.Router();
const tradeController = require('../controllers/simpleTradeController');

// Middleware de validação básica
const validateTradeData = (req, res, next) => {
  const { ativo, tendencia, macd, rsi, bollinger } = req.body;
  
  if (!ativo || !tendencia || macd === undefined || rsi === undefined || !bollinger) {
    return res.status(400).json({
      error: 'Dados incompletos',
      required: ['ativo', 'tendencia', 'macd', 'rsi', 'bollinger']
    });
  }
  
  next();
};

// Rotas principais
router.post('/trades', validateTradeData, tradeController.createTrade);
router.get('/trades', tradeController.getAllTrades);
router.get('/trades/:id', tradeController.getTradeById);
// router.put('/trades/:id/status', tradeController.updateTradeStatus); // Removido no controlador simplificado

// Rotas do dashboard
router.get('/dashboard/stats', tradeController.getDashboardStats);

// Rotas de IA removidas (usando controlador simplificado)

// Rota de health check
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Rota de teste
router.get('/test', (req, res) => {
  res.json({
    message: 'API Auto-Trader funcionando!',
    endpoints: [
      'POST /api/trades - Criar nova ordem',
      'GET /api/trades - Listar ordens',
      'GET /api/trades/:id - Obter ordem específica',
      'PUT /api/trades/:id/status - Atualizar status da ordem',
      'GET /api/dashboard/stats - Estatísticas do dashboard',
      'POST /api/ai/message - Enviar mensagem para IA',
      'GET /api/health - Health check',
      'GET /api/test - Esta rota de teste'
    ]
  });
});

module.exports = router;
