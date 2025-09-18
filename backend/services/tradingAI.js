const OpenAI = require('openai');
const AIKnowledge = require('../models/AIKnowledge');
const AISession = require('../models/AISession');

class TradingAI {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.agentName = 'trading';
    this.version = '1.0.0';
  }

  async analyzeTradeData(tradeData, sessionId = null) {
    try {
      console.log(`[Trading AI] Analisando dados para ${tradeData.ativo}`);
      
      // 1. Buscar conhecimento relevante na base
      const relevantKnowledge = await this.getRelevantKnowledge(tradeData.ativo, 'pattern');
      
      // 2. Criar ou usar sessão existente
      let session = null;
      if (sessionId) {
        session = await AISession.findOne({ sessionId, status: 'active' });
      }
      
      if (!session) {
        session = await AISession.createSession(
          'trading_decision',
          this.agentName,
          {
            asset: tradeData.ativo,
            marketData: tradeData,
            trigger: 'new_market_data'
          }
        );
      }

      // 3. Construir prompt com conhecimento histórico
      const prompt = await this.buildAnalysisPrompt(tradeData, relevantKnowledge);
      
      // 4. Obter análise da OpenAI
      const aiResponse = await this.callOpenAI(prompt);
      
      // 5. Processar resposta
      const analysis = this.processAIResponse(aiResponse);
      
      // 6. Registrar decisão na sessão
      await session.addMessage(
        this.agentName,
        'all',
        'decision',
        `Decisão: ${analysis.decision} (Confiança: ${analysis.confidence})`,
        {
          decision: analysis.decision,
          confidence: analysis.confidence,
          reasoning: analysis.reasoning,
          technicalAnalysis: analysis.technicalAnalysis
        },
        analysis.confidence
      );

      // 7. Solicitar validação da IA Supervisora se confiança baixa
      if (analysis.confidence < 0.7) {
        await this.requestSupervisorValidation(session, analysis, tradeData);
      }

      // 8. Atualizar uso do conhecimento
      await this.updateKnowledgeUsage(relevantKnowledge);

      return {
        ...analysis,
        sessionId: session.sessionId,
        knowledgeUsed: relevantKnowledge.length
      };

    } catch (error) {
      console.error('[Trading AI] Erro na análise:', error);
      return this.fallbackAnalysis(tradeData, error.message);
    }
  }

  async buildAnalysisPrompt(tradeData, knowledge) {
    const { ativo, tendencia, macd, rsi, bollinger } = tradeData;
    
    let knowledgeContext = '';
    if (knowledge.length > 0) {
      knowledgeContext = '\n\nCONHECIMENTO HISTÓRICO RELEVANTE:\n';
      knowledge.forEach((k, index) => {
        knowledgeContext += `${index + 1}. ${k.content} (Precisão: ${(k.accuracy * 100).toFixed(1)}%)\n`;
      });
    }

    return `
ANÁLISE TÉCNICA PARA TRADING - ${ativo}

DADOS ATUAIS:
- Ativo: ${ativo}
- Tendência: ${tendencia}
- MACD: ${macd}
- RSI: ${rsi}
- Bandas de Bollinger: ${bollinger}
- Timestamp: ${new Date().toISOString()}

${knowledgeContext}

INSTRUÇÕES:
Você é uma IA especializada em trading que deve analisar os dados técnicos fornecidos e tomar uma decisão de investimento.

Considere:
1. RSI < 30: possível sobrevenda (considerar compra)
2. RSI > 70: possível sobrecompra (considerar venda)
3. MACD positivo com tendência alta: sinal de compra
4. MACD negativo com tendência baixa: sinal de venda
5. Posição do preço em relação às Bandas de Bollinger
6. O conhecimento histórico fornecido acima

IMPORTANTE: Use o conhecimento histórico para melhorar sua análise, mas não se limite apenas a ele.

Responda APENAS com um JSON válido no formato:
{
  "decision": "buy|sell|hold",
  "confidence": 0.85,
  "reasoning": "Explicação detalhada da decisão",
  "technicalAnalysis": {
    "rsiSignal": "oversold|overbought|neutral",
    "macdSignal": "bullish|bearish|neutral",
    "bollingerSignal": "upper|lower|middle",
    "trendAlignment": "aligned|conflicting"
  },
  "riskLevel": "low|medium|high",
  "expectedReturn": 0.02,
  "stopLoss": 1.1750,
  "takeProfit": 1.1850
}`;
  }

  async callOpenAI(prompt) {
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
      max_tokens: 800
    });

    return completion.choices[0].message.content;
  }

  processAIResponse(response) {
    try {
      const analysis = JSON.parse(response);
      
      // Validar campos obrigatórios
      if (!analysis.decision || !['buy', 'sell', 'hold'].includes(analysis.decision)) {
        throw new Error('Decisão inválida');
      }

      return {
        decision: analysis.decision,
        confidence: Math.max(0, Math.min(1, analysis.confidence || 0.5)),
        reasoning: analysis.reasoning || 'Análise baseada em indicadores técnicos',
        technicalAnalysis: analysis.technicalAnalysis || {},
        riskLevel: analysis.riskLevel || 'medium',
        expectedReturn: analysis.expectedReturn || 0,
        stopLoss: analysis.stopLoss,
        takeProfit: analysis.takeProfit,
        fullAnalysis: response
      };
    } catch (parseError) {
      console.warn('[Trading AI] Erro ao parsear resposta:', parseError);
      return this.extractDecisionFromText(response);
    }
  }

  extractDecisionFromText(text) {
    // Fallback para extrair decisão de texto não estruturado
    const lowerText = text.toLowerCase();
    
    let decision = 'hold';
    let confidence = 0.5;
    
    if (lowerText.includes('buy') || lowerText.includes('compra')) {
      decision = 'buy';
      confidence = 0.6;
    } else if (lowerText.includes('sell') || lowerText.includes('venda')) {
      decision = 'sell';
      confidence = 0.6;
    }

    return {
      decision,
      confidence,
      reasoning: 'Análise extraída de resposta não estruturada',
      technicalAnalysis: {},
      riskLevel: 'medium',
      expectedReturn: 0,
      fullAnalysis: text
    };
  }

  async getRelevantKnowledge(asset, knowledgeType = 'pattern', limit = 5) {
    return await AIKnowledge.findRelevantKnowledge(
      this.agentName,
      asset,
      knowledgeType,
      limit
    );
  }

  async saveKnowledge(asset, content, data, context, confidence = 0.5) {
    const knowledge = new AIKnowledge({
      aiAgent: this.agentName,
      knowledgeType: 'pattern',
      asset,
      content,
      data,
      context,
      confidence,
      createdBy: this.agentName,
      tags: ['auto-generated', 'trading-decision']
    });

    return await knowledge.save();
  }

  async requestSupervisorValidation(session, analysis, tradeData) {
    console.log(`[Trading AI] Solicitando validação da IA Supervisora para ${tradeData.ativo}`);
    
    await session.addMessage(
      this.agentName,
      'supervisor',
      'question',
      `Preciso de validação para esta decisão de baixa confiança: ${analysis.decision} (${(analysis.confidence * 100).toFixed(1)}%)`,
      {
        originalAnalysis: analysis,
        marketData: tradeData,
        requestType: 'validation'
      }
    );

    // Adicionar supervisor à sessão se não estiver presente
    await session.addParticipant('supervisor', 'validator');
  }

  async updateKnowledgeUsage(knowledgeList) {
    for (const knowledge of knowledgeList) {
      knowledge.usageCount += 1;
      await knowledge.save();
    }
  }

  async learnFromOutcome(tradeId, actualOutcome, marketData) {
    try {
      console.log(`[Trading AI] Aprendendo com resultado do trade ${tradeId}`);
      
      // Buscar trade original
      const Trade = require('../models/Trade');
      const originalTrade = await Trade.findById(tradeId);
      
      if (!originalTrade) {
        console.warn(`[Trading AI] Trade ${tradeId} não encontrado`);
        return;
      }

      // Determinar se foi um sucesso ou falha
      const wasSuccessful = this.evaluateTradeSuccess(originalTrade, actualOutcome);
      
      // Criar conhecimento baseado no resultado
      const knowledgeContent = this.generateKnowledgeFromOutcome(
        originalTrade,
        actualOutcome,
        wasSuccessful
      );

      // Salvar novo conhecimento
      await this.saveKnowledge(
        originalTrade.ativo,
        knowledgeContent,
        {
          originalDecision: originalTrade.decision,
          marketConditions: {
            rsi: originalTrade.rsi,
            macd: originalTrade.macd,
            tendencia: originalTrade.tendencia,
            bollinger: originalTrade.bollinger
          },
          actualOutcome,
          wasSuccessful
        },
        {
          tradeId: originalTrade._id,
          originalDecision: originalTrade.decision,
          actualOutcome
        },
        wasSuccessful ? 0.8 : 0.3
      );

      console.log(`[Trading AI] Conhecimento ${wasSuccessful ? 'positivo' : 'negativo'} salvo para ${originalTrade.ativo}`);

    } catch (error) {
      console.error('[Trading AI] Erro ao aprender com resultado:', error);
    }
  }

  evaluateTradeSuccess(trade, outcome) {
    // Lógica simples para avaliar sucesso
    // Em um sistema real, isso seria baseado em lucro/prejuízo real
    if (trade.decision === 'buy' && outcome === 'profit') return true;
    if (trade.decision === 'sell' && outcome === 'profit') return true;
    if (trade.decision === 'hold' && outcome === 'neutral') return true;
    return false;
  }

  generateKnowledgeFromOutcome(trade, outcome, wasSuccessful) {
    const action = wasSuccessful ? 'funcionou bem' : 'não foi eficaz';
    
    return `Para ${trade.ativo} com RSI ${trade.rsi}, MACD ${trade.macd} e tendência ${trade.tendencia}, a decisão ${trade.decision} ${action}. Resultado: ${outcome}.`;
  }

  fallbackAnalysis(tradeData, errorMessage) {
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
    
    return {
      decision,
      confidence: 0.4,
      reasoning,
      technicalAnalysis: {},
      riskLevel: 'high',
      expectedReturn: 0,
      fullAnalysis: `Fallback analysis: ${errorMessage}`,
      error: true
    };
  }
}

module.exports = new TradingAI();
