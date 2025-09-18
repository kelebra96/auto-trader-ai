const AISession = require('../models/AISession');
const AIKnowledge = require('../models/AIKnowledge');
const tradingAI = require('./tradingAI');
const supervisorAI = require('./supervisorAI');
const researcherAI = require('./researcherAI');
const axios = require('axios');

class AIOrchestrator {
  constructor() {
    this.agents = {
      trading: tradingAI,
      supervisor: supervisorAI,
      researcher: researcherAI
    };
    this.activeSessions = new Map();
    this.messageQueue = [];
    this.processingInterval = null;
    this.startMessageProcessor();
  }

  async processTradeRequest(tradeData) {
    try {
      console.log(`[AI Orchestrator] Processando solicitação de trade para ${tradeData.ativo}`);
      const session = await AISession.createSession('trading_decision', 'trading', {
        asset: tradeData.ativo,
        marketData: tradeData,
        trigger: 'new_trade_request',
        priority: 'high'
      });
      this.activeSessions.set(session.sessionId, { session, participants: ['trading'], status: 'active', startTime: Date.now() });
      const tradingResult = await tradingAI.analyzeTradeData(tradeData, session.sessionId);
      await this.processSessionMessages(session.sessionId);
      const finalResult = await this.waitForSessionCompletion(session.sessionId, 60000);
      return finalResult;
    } catch (error) {
      console.error('[AI Orchestrator] Erro no processamento:', error);
      throw error;
    }
  }

  async processSessionMessages(sessionId) {
    const sessionData = this.activeSessions.get(sessionId);
    if (!sessionData) return;
    const session = await AISession.findOne({ sessionId, status: 'active' });
    if (!session) return;
    const unprocessedMessages = session.messages.filter(m => !m.processed);
    for (const message of unprocessedMessages) {
      await this.routeMessage(session, message);
      message.processed = true;
    }
    await session.save();
  }

  async routeMessage(session, message) {
    const { to } = message;
    console.log(`[AI Orchestrator] Roteando mensagem: ${message.from} -> ${to} (${message.messageType})`);
    try {
      switch (to) {
        case 'supervisor': await this.handleSupervisorMessage(session, message); break;
        case 'researcher': await this.handleResearcherMessage(session, message); break;
        case 'trading': await this.handleTradingMessage(session, message); break;
        case 'all': await this.broadcastMessage(session, message); break;
      }
    } catch (error) {
      console.error(`[AI Orchestrator] Erro ao rotear mensagem:`, error);
    }
  }

  async handleSupervisorMessage(session, message) {
    if (message.messageType === 'question' && message.data.requestType === 'validation') {
      const validation = await supervisorAI.validateTradingDecision(session.sessionId, message.data.originalAnalysis, message.data.marketData);
      if (validation.corrections.length > 0) {
        await this.applyCorrections(session, validation.corrections);
      }
    }
  }

  async handleResearcherMessage(session, message) {
    if (message.messageType === 'question' && message.data.requestType === 'market_research') {
      const research = await researcherAI.conductMarketResearch(session.sessionId, message.data.asset, message.data.topics, message.data.priority);
      await this.shareResearchInsights(session, research.insights);
    }
  }

  async handleTradingMessage(session, message) {
    if (message.messageType === 'correction') {
      await this.applyTradingCorrection(session, message.data);
    } else if (message.messageType === 'suggestion') {
      await this.applyResearchSuggestion(session, message.data);
    }
  }

  async broadcastMessage(session, message) {
    const participants = session.participants.map(p => p.aiAgent);
    for (const agent of participants) {
      if (agent !== message.from) {
        await this.routeMessage(session, { ...message, to: agent });
      }
    }
  }

  async applyCorrections(session, corrections) {
    console.log(`[AI Orchestrator] Aplicando ${corrections.length} correções`);
    await session.addMessage('orchestrator', 'all', 'data', 'Correções aplicadas pela IA Supervisora', { corrections, appliedAt: new Date() });
  }

  async shareResearchInsights(session, insights) {
    console.log(`[AI Orchestrator] Compartilhando insights de pesquisa`);
    const tradingInsights = insights.recommendations.filter(r => r.for === 'trading');
    for (const insight of tradingInsights) {
      await session.addMessage('researcher', 'trading', 'suggestion', insight.recommendation, { category: 'research_insight', priority: insight.priority, confidence: insights.confidence });
    }
  }

  async waitForSessionCompletion(sessionId, timeout = 60000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const checkCompletion = async () => {
        try {
          const session = await AISession.findOne({ sessionId });
          if (!session) return reject(new Error('Sessão não encontrada'));
          if (session.status === 'completed') return resolve(this.compileSessionResult(session));
          if (Date.now() - startTime > timeout) {
            await session.completeSession('timeout', false);
            return resolve(this.compileSessionResult(session));
          }
          setTimeout(checkCompletion, 1000);
        } catch (error) {
          reject(error);
        }
      };
      checkCompletion();
    });
  }

  compileSessionResult(session) {
    const messages = session.messages;
    const decisions = messages.filter(m => m.messageType === 'decision');
    const finalDecision = session.outcomes.finalDecision || (decisions.length > 0 ? decisions[decisions.length - 1].data.decision : 'hold');
    const confidenceScores = messages.filter(m => m.confidence !== undefined).map(m => m.confidence);
    const avgConfidence = confidenceScores.length > 0 ? confidenceScores.reduce((a, b) => a + b) / confidenceScores.length : 0.5;
    return {
      decision: finalDecision,
      confidence: avgConfidence,
      sessionId: session.sessionId,
      participantCount: session.participants.length,
      messageCount: messages.length,
      correctionsApplied: messages.filter(m => m.messageType === 'correction').length,
      suggestionsReceived: messages.filter(m => m.messageType === 'suggestion').length,
      consensusReached: session.outcomes.consensusReached,
      duration: session.metrics.duration,
      reasoning: this.extractReasoning(messages),
      aiCollaboration: {
        tradingAnalysis: messages.some(m => m.from === 'trading'),
        supervisorValidation: messages.some(m => m.from === 'supervisor'),
        researchInsights: messages.some(m => m.from === 'researcher')
      }
    };
  }

  extractReasoning(messages) {
    return messages.filter(m => ['decision', 'answer', 'suggestion'].includes(m.messageType)).map(m => ({ from: m.from, content: m.content, confidence: m.confidence }));
  }

  startMessageProcessor() {
    this.processingInterval = setInterval(async () => {
      if (this.messageQueue.length > 0) {
        const message = this.messageQueue.shift();
        try {
          await this.processQueuedMessage(message);
        } catch (error) {
          console.error('[AI Orchestrator] Erro ao processar mensagem da fila:', error);
        }
      }
    }, 5000);
  }

  async processQueuedMessage(message) {
    console.log(`[AI Orchestrator] Processando mensagem da fila: ${message.type}`);
  }

  async getSystemStatus() {
    const activeSessions = await AISession.countDocuments({ status: 'active' });
    const totalKnowledge = await AIKnowledge.countDocuments({ status: 'active' });
    const knowledgeByAgent = await AIKnowledge.aggregate([{ $match: { status: 'active' } }, { $group: { _id: '$aiAgent', count: { $sum: 1 } } }]);
    const sessionStats = await AISession.getSessionStats(24);
    return {
      activeSessions, totalKnowledge, knowledgeByAgent, sessionStats,
      agents: { trading: { status: 'active', version: tradingAI.version }, supervisor: { status: 'active', version: supervisorAI.version }, researcher: { status: 'active', version: researcherAI.version } },
      orchestrator: { version: '1.0.0', activeSessionsMap: this.activeSessions.size, messageQueueLength: this.messageQueue.length }
    };
  }

  async shutdown() {
    console.log('[AI Orchestrator] Iniciando shutdown...');
    if (this.processingInterval) clearInterval(this.processingInterval);
    for (const [sessionId, sessionData] of this.activeSessions.entries()) {
      try {
        const session = await AISession.findOne({ sessionId });
        if (session && session.status === 'active') {
          await session.completeSession('shutdown', false);
        }
      } catch (error) {
        console.error(`Erro ao finalizar sessão ${sessionId}:`, error);
      }
    }
    this.activeSessions.clear();
    console.log('[AI Orchestrator] Shutdown concluído');
  }

  async executeTradeOrder(tradeDecision) {
    try {
      console.log(`[AI Orchestrator] Enviando ordem para execução: ${tradeDecision.decision}`);
      const orderPayload = {
        asset: tradeDecision.asset,
        action: tradeDecision.decision,
        volume: 0.01,
        stop_loss: tradeDecision.stopLoss,
        take_profit: tradeDecision.takeProfit,
        source: 'Auto-Trader-AI',
        sessionId: tradeDecision.sessionId
      };

      if (orderPayload.action === 'hold') {
        console.log('[AI Orchestrator] Decisão é HOLD, nenhuma ordem será executada.');
        return { status: 'skipped', reason: 'Decision was hold' };
      }

      const mt5InterfaceUrl = 'http://localhost:5000/execute_order';
      const response = await axios.post(mt5InterfaceUrl, orderPayload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });

      console.log('[AI Orchestrator] Resposta da interface MT5:', response.data);
      return response.data;
    } catch (error) {
      console.error('[AI Orchestrator] Erro ao enviar ordem para a interface MT5:', error.message);
      if (error.response) {
        console.error('   - Resposta do servidor:', error.response.data);
      }
      return { status: 'error', message: 'Falha ao comunicar com a interface MT5' };
    }
  }
}

module.exports = new AIOrchestrator();

