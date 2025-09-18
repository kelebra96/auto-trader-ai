const Trade = require('../models/Trade');
const aiOrchestrator = require('../services/aiOrchestrator');

class TradeController {
  // Criar nova ordem de trade
  async createTrade(req, res) {
    try {
      const { ativo, tendencia, macd, rsi, bollinger } = req.body;

      // Validação básica
      if (!ativo || !tendencia || macd === undefined || rsi === undefined || !bollinger) {
        return res.status(400).json({
          error: 'Dados incompletos. Campos obrigatórios: ativo, tendencia, macd, rsi, bollinger'
        });
      }

      // Validação de valores
      if (rsi < 0 || rsi > 100) {
        return res.status(400).json({
          error: 'RSI deve estar entre 0 e 100'
        });
      }

      // Análise com o Orquestrador Multi-IA
      const aiResult = await aiOrchestrator.processTradeRequest(req.body);

      // Executar a ordem de trade se a decisão não for 'hold'
      let executionResult = { status: 'skipped', reason: 'Decision was hold' };
      if (aiResult.decision !== 'hold') {
        executionResult = await aiOrchestrator.executeTradeOrder({
          ...aiResult,
          asset: ativo // Garantir que o ativo está no payload
        });
      }

      // Criar trade no banco
      const trade = new Trade({
        ativo,
        tendencia,
        macd,
        rsi,
        bollinger,
        decision: aiResult.decision,
        confidence: aiResult.confidence,
        aiAnalysis: JSON.stringify(aiResult.reasoning),
        sessionId: aiResult.sessionId,
        status: executionResult.status === 'success' ? 'executed' : 'pending',
        executionDetails: executionResult
      });

      await trade.save();

      res.status(201).json({
        message: 'Análise de trade concluída',
        decision: aiResult.decision,
        confidence: aiResult.confidence,
        reasoning: aiResult.reasoning,
        tradeId: trade._id,
        executionStatus: executionResult.status,
        executionMessage: executionResult.message
      });

    } catch (error) {
      console.error('Erro ao criar trade:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        details: error.message
      });
    }
  }

  // Listar todas as ordens
  async getAllTrades(req, res) {
    try {
      const { page = 1, limit = 50, ativo, decision } = req.query;
      
      const filter = {};
      if (ativo) filter.ativo = ativo;
      if (decision) filter.decision = decision;

      const trades = await Trade.find(filter)
        .sort({ timestamp: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

      const total = await Trade.countDocuments(filter);

      res.json({
        trades,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });

    } catch (error) {
      console.error('Erro ao buscar trades:', error);
      res.status(500).json({
        error: 'Erro ao buscar trades',
        details: error.message
      });
    }
  }

  // Obter estatísticas do dashboard
  async getDashboardStats(req, res) {
    try {
      const totalTrades = await Trade.countDocuments();
      
      const decisionStats = await Trade.aggregate([
        {
          $group: {
            _id: '$decision',
            count: { $sum: 1 }
          }
        }
      ]);

      const recentTrades = await Trade.find()
        .sort({ timestamp: -1 })
        .limit(10)
        .exec();

      // Estatísticas por ativo
      const assetStats = await Trade.aggregate([
        {
          $group: {
            _id: '$ativo',
            count: { $sum: 1 },
            avgRsi: { $avg: '$rsi' },
            avgMacd: { $avg: '$macd' }
          }
        },
        { $sort: { count: -1 } }
      ]);

      // Performance por período (últimos 7 dias)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const weeklyPerformance = await Trade.aggregate([
        {
          $match: {
            timestamp: { $gte: sevenDaysAgo }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$timestamp'
              }
            },
            trades: { $sum: 1 },
            buyOrders: {
              $sum: { $cond: [{ $eq: ['$decision', 'buy'] }, 1, 0] }
            },
            sellOrders: {
              $sum: { $cond: [{ $eq: ['$decision', 'sell'] }, 1, 0] }
            },
            holdOrders: {
              $sum: { $cond: [{ $eq: ['$decision', 'hold'] }, 1, 0] }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      res.json({
        totalTrades,
        decisionStats,
        recentTrades,
        assetStats,
        weeklyPerformance
      });

    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      res.status(500).json({
        error: 'Erro ao obter estatísticas',
        details: error.message
      });
    }
  }

  // Obter trade específico
  async getTradeById(req, res) {
    try {
      const trade = await Trade.findById(req.params.id);
      
      if (!trade) {
        return res.status(404).json({
          error: 'Trade não encontrado'
        });
      }

      res.json(trade);

    } catch (error) {
      console.error('Erro ao buscar trade:', error);
      res.status(500).json({
        error: 'Erro ao buscar trade',
        details: error.message
      });
    }
  }

  // Enviar mensagem para IA
  async sendMessageToAI(req, res) {
    try {
      const { message, context } = req.body;

      if (!message) {
        return res.status(400).json({
          error: 'Mensagem é obrigatória'
        });
      }

      const response = await openaiService.sendMessageToAI(message, context);

      res.json(response);

    } catch (error) {
      console.error('Erro ao enviar mensagem para IA:', error);
      res.status(500).json({
        error: 'Erro ao comunicar com IA',
        details: error.message
      });
    }
  }

  // Atualizar status de trade
  async updateTradeStatus(req, res) {
    try {
      const { status, profit } = req.body;
      
      const trade = await Trade.findByIdAndUpdate(
        req.params.id,
        { status, profit },
        { new: true }
      );

      if (!trade) {
        return res.status(404).json({
          error: 'Trade não encontrado'
        });
      }

      res.json({
        message: 'Trade atualizado com sucesso',
        trade
      });

    } catch (error) {
      console.error('Erro ao atualizar trade:', error);
      res.status(500).json({
        error: 'Erro ao atualizar trade',
        details: error.message
      });
    }
  }
}

module.exports = new TradeController();
