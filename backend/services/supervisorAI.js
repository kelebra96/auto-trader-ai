const OpenAI = require('openai');
const AIKnowledge = require('../models/AIKnowledge');
const AISession = require('../models/AISession');
const Trade = require('../models/Trade');

class SupervisorAI {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.agentName = 'supervisor';
    this.version = '1.0.0';
  }

  async validateTradingDecision(sessionId, tradingAnalysis, marketData) {
    try {
      console.log(`[Supervisor AI] Validando decisão para ${marketData.ativo}`);
      
      const session = await AISession.findOne({ sessionId, status: 'active' });
      if (!session) {
        throw new Error('Sessão não encontrada');
      }

      // 1. Buscar histórico de erros similares
      const errorHistory = await this.getErrorHistory(marketData.ativo);
      
      // 2. Buscar padrões de sucesso/falha
      const performancePatterns = await this.getPerformancePatterns(marketData.ativo);
      
      // 3. Analisar a decisão
      const validation = await this.analyzeDecision(
        tradingAnalysis,
        marketData,
        errorHistory,
        performancePatterns
      );

      // 4. Registrar validação na sessão
      await session.addMessage(
        this.agentName,
        'trading',
        'answer',
        validation.recommendation,
        {
          validation: validation,
          originalAnalysis: tradingAnalysis,
          corrections: validation.corrections
        },
        validation.confidence
      );

      // 5. Se houver correções, salvar como conhecimento
      if (validation.corrections.length > 0) {
        await this.saveCorrections(marketData.ativo, validation.corrections, {
          originalDecision: tradingAnalysis.decision,
          marketData,
          validationReason: validation.reasoning
        });
      }

      // 6. Solicitar pesquisa de mercado se necessário
      if (validation.needsResearch) {
        await this.requestMarketResearch(session, marketData.ativo, validation.researchTopics);
      }

      return validation;

    } catch (error) {
      console.error('[Supervisor AI] Erro na validação:', error);
      return this.fallbackValidation(tradingAnalysis, error.message);
    }
  }

  async analyzeDecision(tradingAnalysis, marketData, errorHistory, performancePatterns) {
    const prompt = this.buildValidationPrompt(
      tradingAnalysis,
      marketData,
      errorHistory,
      performancePatterns
    );

    const response = await this.callOpenAI(prompt);
    return this.processValidationResponse(response, tradingAnalysis);
  }

  buildValidationPrompt(analysis, marketData, errorHistory, patterns) {
    const { ativo, tendencia, macd, rsi, bollinger } = marketData;
    
    let errorContext = '';
    if (errorHistory.length > 0) {
      errorContext = '\n\nHISTÓRICO DE ERROS IDENTIFICADOS:\n';
      errorHistory.forEach((error, index) => {
        errorContext += `${index + 1}. ${error.content}\n`;
      });
    }

    let patternContext = '';
    if (patterns.length > 0) {
      patternContext = '\n\nPADRÕES DE PERFORMANCE:\n';
      patterns.forEach((pattern, index) => {
        patternContext += `${index + 1}. ${pattern.content} (Precisão: ${(pattern.accuracy * 100).toFixed(1)}%)\n`;
      });
    }

    return `
VALIDAÇÃO DE DECISÃO DE TRADING - ${ativo}

DECISÃO ORIGINAL DA IA DE TRADING:
- Decisão: ${analysis.decision}
- Confiança: ${(analysis.confidence * 100).toFixed(1)}%
- Raciocínio: ${analysis.reasoning}
- Nível de Risco: ${analysis.riskLevel}

DADOS DE MERCADO:
- Ativo: ${ativo}
- Tendência: ${tendencia}
- MACD: ${macd}
- RSI: ${rsi}
- Bandas de Bollinger: ${bollinger}

${errorContext}${patternContext}

INSTRUÇÕES:
Você é uma IA supervisora especializada em validar e corrigir decisões de trading.

Sua função é:
1. Analisar se a decisão da IA de Trading está correta
2. Identificar possíveis erros baseados no histórico
3. Sugerir correções se necessário
4. Avaliar se mais pesquisa de mercado é necessária

Considere:
- O histórico de erros para evitar repetir os mesmos enganos
- Os padrões de performance que funcionaram no passado
- A coerência entre os indicadores técnicos
- O nível de risco da operação

Responda APENAS com um JSON válido:
{
  "isValid": true,
  "confidence": 0.85,
  "recommendation": "APROVAR|CORRIGIR|REJEITAR",
  "reasoning": "Explicação detalhada da validação",
  "corrections": [
    {
      "type": "decision|confidence|risk|parameters",
      "original": "valor original",
      "corrected": "valor corrigido",
      "reason": "motivo da correção"
    }
  ],
  "riskAssessment": {
    "level": "low|medium|high|critical",
    "factors": ["fator1", "fator2"],
    "mitigation": "sugestões para mitigar riscos"
  },
  "needsResearch": false,
  "researchTopics": ["tópico1", "tópico2"],
  "learningPoints": ["ponto de aprendizado 1", "ponto 2"]
}`;
  }

  async callOpenAI(prompt) {
    const completion = await this.openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: "Você é uma IA supervisora especializada em validar decisões de trading, identificar erros e treinar outras IAs. Seja rigoroso na análise e sempre forneça feedback construtivo."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 1000
    });

    return completion.choices[0].message.content;
  }

  processValidationResponse(response, originalAnalysis) {
    try {
      const validation = JSON.parse(response);
      
      return {
        isValid: validation.isValid !== false,
        confidence: Math.max(0, Math.min(1, validation.confidence || 0.5)),
        recommendation: validation.recommendation || 'APROVAR',
        reasoning: validation.reasoning || 'Validação automática',
        corrections: validation.corrections || [],
        riskAssessment: validation.riskAssessment || {
          level: 'medium',
          factors: [],
          mitigation: 'Monitorar posição'
        },
        needsResearch: validation.needsResearch || false,
        researchTopics: validation.researchTopics || [],
        learningPoints: validation.learningPoints || [],
        fullValidation: response
      };
    } catch (parseError) {
      console.warn('[Supervisor AI] Erro ao parsear validação:', parseError);
      return this.fallbackValidation(originalAnalysis, 'Erro de parsing');
    }
  }

  async getErrorHistory(asset, limit = 10) {
    return await AIKnowledge.find({
      aiAgent: this.agentName,
      asset,
      knowledgeType: 'error_analysis',
      status: 'active'
    })
    .sort({ accuracy: -1, createdAt: -1 })
    .limit(limit);
  }

  async getPerformancePatterns(asset, limit = 10) {
    return await AIKnowledge.find({
      aiAgent: 'trading',
      asset,
      knowledgeType: 'pattern',
      status: 'active',
      accuracy: { $gte: 0.6 }
    })
    .sort({ accuracy: -1, usageCount: -1 })
    .limit(limit);
  }

  async saveCorrections(asset, corrections, context) {
    for (const correction of corrections) {
      const knowledge = new AIKnowledge({
        aiAgent: this.agentName,
        knowledgeType: 'correction',
        asset,
        content: `Correção identificada: ${correction.type} - ${correction.reason}`,
        data: {
          correctionType: correction.type,
          originalValue: correction.original,
          correctedValue: correction.corrected,
          reason: correction.reason
        },
        context,
        confidence: 0.7,
        createdBy: this.agentName,
        tags: ['correction', 'validation', 'auto-generated']
      });

      await knowledge.save();
    }
  }

  async requestMarketResearch(session, asset, topics) {
    console.log(`[Supervisor AI] Solicitando pesquisa de mercado para ${asset}`);
    
    await session.addMessage(
      this.agentName,
      'researcher',
      'question',
      `Preciso de pesquisa de mercado para ${asset} sobre os seguintes tópicos: ${topics.join(', ')}`,
      {
        asset,
        topics,
        requestType: 'market_research',
        priority: 'high'
      }
    );

    // Adicionar pesquisador à sessão
    await session.addParticipant('researcher', 'advisor');
  }

  async analyzeTradePerformance(tradeId, actualOutcome) {
    try {
      console.log(`[Supervisor AI] Analisando performance do trade ${tradeId}`);
      
      const trade = await Trade.findById(tradeId);
      if (!trade) {
        throw new Error('Trade não encontrado');
      }

      // Determinar se houve erro
      const wasError = this.identifyError(trade, actualOutcome);
      
      if (wasError) {
        // Criar análise de erro
        const errorAnalysis = await this.createErrorAnalysis(trade, actualOutcome);
        
        // Salvar como conhecimento
        await this.saveErrorKnowledge(trade.ativo, errorAnalysis, {
          tradeId: trade._id,
          originalDecision: trade.decision,
          actualOutcome
        });

        // Criar sessão de treinamento
        await this.createTrainingSession(trade, errorAnalysis);
      } else {
        // Reforçar padrão de sucesso
        await this.reinforceSuccessPattern(trade, actualOutcome);
      }

    } catch (error) {
      console.error('[Supervisor AI] Erro na análise de performance:', error);
    }
  }

  identifyError(trade, outcome) {
    // Lógica para identificar se houve erro
    if (trade.decision === 'buy' && outcome === 'loss') return true;
    if (trade.decision === 'sell' && outcome === 'loss') return true;
    if (trade.decision === 'hold' && outcome === 'missed_opportunity') return true;
    return false;
  }

  async createErrorAnalysis(trade, outcome) {
    const prompt = `
ANÁLISE DE ERRO DE TRADING

TRADE ORIGINAL:
- Ativo: ${trade.ativo}
- Decisão: ${trade.decision}
- RSI: ${trade.rsi}
- MACD: ${trade.macd}
- Tendência: ${trade.tendencia}
- Bollinger: ${trade.bollinger}
- Confiança original: ${trade.confidence || 'N/A'}

RESULTADO REAL:
- Outcome: ${outcome}

Analise o que deu errado nesta decisão e forneça insights para evitar erros similares no futuro.

Responda em JSON:
{
  "errorType": "technical_analysis|risk_management|market_timing|other",
  "rootCause": "causa raiz do erro",
  "learningPoint": "o que aprender com este erro",
  "preventionStrategy": "como evitar no futuro",
  "confidence": 0.8
}`;

    const response = await this.callOpenAI(prompt);
    
    try {
      return JSON.parse(response);
    } catch {
      return {
        errorType: 'analysis_error',
        rootCause: 'Erro na análise automática',
        learningPoint: 'Revisar processo de análise',
        preventionStrategy: 'Melhorar validação de dados',
        confidence: 0.3
      };
    }
  }

  async saveErrorKnowledge(asset, errorAnalysis, context) {
    const knowledge = new AIKnowledge({
      aiAgent: this.agentName,
      knowledgeType: 'error_analysis',
      asset,
      content: `Erro identificado: ${errorAnalysis.rootCause}. Estratégia de prevenção: ${errorAnalysis.preventionStrategy}`,
      data: errorAnalysis,
      context,
      confidence: errorAnalysis.confidence || 0.7,
      createdBy: this.agentName,
      tags: ['error_analysis', 'learning', 'auto-generated']
    });

    await knowledge.save();
  }

  async createTrainingSession(trade, errorAnalysis) {
    const session = await AISession.createSession(
      'error_analysis',
      this.agentName,
      {
        asset: trade.ativo,
        tradeId: trade._id,
        trigger: 'performance_analysis',
        priority: 'high'
      }
    );

    await session.addMessage(
      this.agentName,
      'trading',
      'correction',
      `Erro identificado no trade ${trade._id}: ${errorAnalysis.rootCause}`,
      {
        errorAnalysis,
        originalTrade: trade,
        trainingPoint: errorAnalysis.learningPoint
      }
    );

    await session.addParticipant('trading', 'observer');
  }

  async reinforceSuccessPattern(trade, outcome) {
    // Aumentar confiança em padrões similares bem-sucedidos
    const similarPatterns = await AIKnowledge.find({
      aiAgent: 'trading',
      asset: trade.ativo,
      knowledgeType: 'pattern',
      'data.marketConditions.rsi': { $gte: trade.rsi - 5, $lte: trade.rsi + 5 },
      'data.originalDecision': trade.decision
    });

    for (const pattern of similarPatterns) {
      await pattern.updateAccuracy(true);
    }
  }

  fallbackValidation(analysis, errorMessage) {
    return {
      isValid: true,
      confidence: 0.5,
      recommendation: 'APROVAR',
      reasoning: `Validação de fallback: ${errorMessage}`,
      corrections: [],
      riskAssessment: {
        level: 'medium',
        factors: ['validation_error'],
        mitigation: 'Monitorar manualmente'
      },
      needsResearch: false,
      researchTopics: [],
      learningPoints: ['Melhorar sistema de validação'],
      error: true
    };
  }
}

module.exports = new SupervisorAI();
