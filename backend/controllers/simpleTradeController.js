const Trade = require('../models/Trade');
const OpenAI = require('openai');
const axios = require('axios');

class SimpleTradeController {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  createTrade = async (req, res) => {
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

      console.log(`[Simple AI] Analisando dados para ${ativo}`);

      // Análise com IA única
      const aiAnalysis = await this.analyzeWithAI(req.body);

      // Executar ordem se não for 'hold'
      let executionResult = { status: 'skipped', reason: 'Decision was hold' };
      if (aiAnalysis.decision !== 'hold') {
        executionResult = await this.executeOrder({
          asset: ativo,
          action: aiAnalysis.decision,
          volume: 0.01,
          stop_loss: aiAnalysis.stopLoss,
          take_profit: aiAnalysis.takeProfit
        });
      }

      // Salvar no banco
      const trade = new Trade({
        ativo,
        tendencia,
        macd,
        rsi,
        bollinger,
        decision: aiAnalysis.decision,
        confidence: aiAnalysis.confidence,
        aiAnalysis: aiAnalysis.reasoning,
        status: executionResult.status === 'success' ? 'executed' : 'pending',
        executionDetails: executionResult
      });

      await trade.save();

      res.status(201).json({
        message: 'Trade processado com sucesso',
        decision: aiAnalysis.decision,
        confidence: aiAnalysis.confidence,
        reasoning: aiAnalysis.reasoning,
        tradeId: trade._id,
        executionStatus: executionResult.status,
        executionMessage: executionResult.message || executionResult.reason
      });

    } catch (error) {
      console.error('[Simple AI] Erro ao processar trade:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        details: error.message
      });
    }
  }

  analyzeWithAI = async (tradeData) => {
    try {
      const { ativo, tendencia, macd, rsi, bollinger } = tradeData;

      const prompt = `
ANÁLISE TÉCNICA PARA TRADING - ${ativo}

DADOS ATUAIS:
- Ativo: ${ativo}
- Tendência: ${tendencia}
- MACD: ${macd}
- RSI: ${rsi}
- Bandas de Bollinger: ${bollinger}
- Timestamp: ${new Date().toISOString()}

INSTRUÇÕES:
Você é uma IA especializada em trading que deve analisar os dados técnicos fornecidos e tomar uma decisão de investimento.

Considere:
1. RSI < 30: possível sobrevenda (considerar compra)
2. RSI > 70: possível sobrecompra (considerar venda)
3. MACD positivo com tendência alta: sinal de compra
4. MACD negativo com tendência baixa: sinal de venda
5. Posição do preço em relação às Bandas de Bollinger

Responda APENAS com um JSON válido no formato:
{
  "decision": "buy|sell|hold",
  "confidence": 0.85,
  "reasoning": "Explicação detalhada da decisão",
  "riskLevel": "low|medium|high",
  "expectedReturn": 0.02,
  "stopLoss": 1.1750,
  "takeProfit": 1.1850
}`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content: "Você é uma IA especializada em análise técnica e trading de Forex. Forneça análises precisas, objetivas e sempre no formato JSON solicitado."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      });

      const response = completion.choices[0].message.content;
      console.log(`[Simple AI] Resposta da IA: ${response}`);

      // Processar resposta
      try {
        const analysis = JSON.parse(response);
        
        return {
          decision: analysis.decision || 'hold',
          confidence: Math.max(0, Math.min(1, analysis.confidence || 0.5)),
          reasoning: analysis.reasoning || 'Análise baseada em indicadores técnicos',
          riskLevel: analysis.riskLevel || 'medium',
          expectedReturn: analysis.expectedReturn || 0,
          stopLoss: analysis.stopLoss,
          takeProfit: analysis.takeProfit
        };
      } catch (parseError) {
        console.warn('[Simple AI] Erro ao parsear resposta, usando fallback');
        return this.fallbackAnalysis(tradeData);
      }

    } catch (error) {
      console.error('[Simple AI] Erro na análise:', error);
      return this.fallbackAnalysis(tradeData, error.message);
    }
  }

  fallbackAnalysis = (tradeData, errorMessage = '') => {
    const { rsi, macd, tendencia } = tradeData;
    
    let decision = 'hold';
    let reasoning = 'Análise técnica básica (fallback): ';
    
    if (rsi < 30 && macd > 0 && tendencia === 'alta') {
      decision = 'buy';
      reasoning += 'RSI em sobrevenda com MACD positivo e tendência alta';
    } else if (rsi > 70 && macd < 0 && tendencia === 'baixa') {
      decision = 'sell';
      reasoning += 'RSI em sobrecompra com MACD negativo e tendência baixa';
    } else {
      reasoning += 'Sinais mistos, aguardando melhor oportunidade';
    }
    
    if (errorMessage) {
      reasoning += ` (Erro: ${errorMessage})`;
    }
    
    return {
      decision,
      confidence: 0.4,
      reasoning,
      riskLevel: 'high',
      expectedReturn: 0,
      stopLoss: null,
      takeProfit: null
    };
  }

  executeOrder = async (orderPayload) => {
    try {
      console.log(`[Simple AI] Enviando ordem: ${orderPayload.action} ${orderPayload.volume} de ${orderPayload.asset}`);

      if (orderPayload.action === 'hold') {
        return { status: 'skipped', reason: 'Decision was hold' };
      }

      const mt5InterfaceUrl = 'http://localhost:5000/execute_order';
      
      const response = await axios.post(mt5InterfaceUrl, orderPayload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000 // 10 segundos
      });

      console.log('[Simple AI] Resposta da interface MT5:', response.data);
      return response.data;

    } catch (error) {
      console.error('[Simple AI] Erro ao executar ordem:', error.message);
      
      // Se a interface MT5 não estiver disponível, simular execução
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        console.log('[Simple AI] Interface MT5 não disponível, simulando execução...');
        return {
          status: 'simulated',
          message: 'Ordem simulada (interface MT5 não disponível)',
          orderId: Date.now(),
          details: orderPayload
        };
      }
      
      return { 
        status: 'error', 
        message: 'Falha ao comunicar com a interface MT5',
        error: error.message 
      };
    }
  }

  // Métodos herdados do controlador original
  getAllTrades = async (req, res) => {
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

  getDashboardStats = async (req, res) => {
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

      res.json({
        totalTrades,
        decisionStats,
        recentTrades,
        assetStats
      });

    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      res.status(500).json({
        error: 'Erro ao obter estatísticas',
        details: error.message
      });
    }
  }

  getTradeById = async (req, res) => {
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
}

module.exports = new SimpleTradeController();
