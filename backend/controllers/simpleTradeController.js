const Trade = require('../models/Trade');
const OpenAI = require('openai');
const axios = require('axios');

class SimpleTradeController {
  constructor() {
    // Validar chave da OpenAI
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.warn('[Simple AI] ⚠️ OPENAI_API_KEY não encontrada no .env');
      this.openai = null;
    } else if (!apiKey.startsWith('sk-')) {
      console.warn('[Simple AI] ⚠️ OPENAI_API_KEY parece inválida (deve começar com sk-)');
      this.openai = null;
    } else {
      console.log('[Simple AI] ✅ Chave OpenAI configurada');
      this.openai = new OpenAI({
        apiKey: apiKey
      });
    }
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
      // Se não há OpenAI configurada, usar análise de fallback
      if (!this.openai) {
        console.warn('[Simple AI] ⚠️ OpenAI não disponível, usando análise de fallback');
        return this.fallbackAnalysis(tradeData, 'OpenAI não configurada');
      }

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
      console.error('[Simple AI] Erro na análise:', error.message);
      
      // Tratar erros específicos da OpenAI
      if (error.code === 'invalid_api_key') {
        console.error('[Simple AI] ❌ Chave da OpenAI inválida! Verifique o arquivo .env');
        console.error('[Simple AI] 💡 Dica: A chave deve começar com "sk-" e ser válida');
        return this.fallbackAnalysis(tradeData, 'Chave OpenAI inválida');
      } else if (error.status === 401) {
        console.error('[Simple AI] ❌ Erro de autenticação OpenAI');
        return this.fallbackAnalysis(tradeData, 'Erro de autenticação OpenAI');
      } else if (error.status === 429) {
        console.error('[Simple AI] ❌ Limite de requisições OpenAI excedido');
        return this.fallbackAnalysis(tradeData, 'Limite de requisições excedido');
      }
      
      return this.fallbackAnalysis(tradeData, error.message);
    }
  }

  fallbackAnalysis = (tradeData, errorMessage = '') => {
    const { rsi, macd, tendencia, ativo } = tradeData;
    
    let decision = 'hold';
    let reasoning = '🔧 Análise técnica automática (sem IA): ';
    let confidence = 0.5;
    let riskLevel = 'medium';
    
    // Análise mais sofisticada baseada em múltiplos indicadores
    const signals = [];
    
    // Análise RSI
    if (rsi < 30) {
      signals.push('RSI sobrevenda (possível compra)');
      if (tendencia === 'alta' || macd > 0) {
        decision = 'buy';
        confidence += 0.2;
      }
    } else if (rsi > 70) {
      signals.push('RSI sobrecompra (possível venda)');
      if (tendencia === 'baixa' || macd < 0) {
        decision = 'sell';
        confidence += 0.2;
      }
    } else {
      signals.push('RSI neutro');
    }
    
    // Análise MACD
    if (macd > 0.001) {
      signals.push('MACD forte positivo');
      if (decision !== 'sell') decision = 'buy';
      confidence += 0.1;
    } else if (macd < -0.001) {
      signals.push('MACD forte negativo');
      if (decision !== 'buy') decision = 'sell';
      confidence += 0.1;
    } else {
      signals.push('MACD fraco');
    }
    
    // Análise de tendência
    if (tendencia === 'alta') {
      signals.push('Tendência de alta');
      if (decision === 'hold') decision = 'buy';
      confidence += 0.1;
    } else if (tendencia === 'baixa') {
      signals.push('Tendência de baixa');
      if (decision === 'hold') decision = 'sell';
      confidence += 0.1;
    }
    
    // Ajustar confiança e risco
    confidence = Math.min(0.8, confidence); // Máximo 80% sem IA
    if (signals.length < 2) {
      riskLevel = 'high';
      confidence *= 0.7;
    }
    
    reasoning += signals.join(', ') + '. ';
    
    if (decision === 'buy') {
      reasoning += '✅ Recomendação: COMPRA';
    } else if (decision === 'sell') {
      reasoning += '🔻 Recomendação: VENDA';
    } else {
      reasoning += '⏸️ Recomendação: AGUARDAR';
    }
    
    if (errorMessage) {
      reasoning += ` | ⚠️ Motivo do fallback: ${errorMessage}`;
    }
    
    console.log(`[Simple AI] 🤖 Análise de fallback para ${ativo}: ${decision.toUpperCase()} (${Math.round(confidence * 100)}%)`);
    
    return {
      decision,
      confidence: Math.round(confidence * 100) / 100,
      reasoning,
      riskLevel,
      expectedReturn: decision === 'hold' ? 0 : (decision === 'buy' ? 0.01 : -0.01),
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
