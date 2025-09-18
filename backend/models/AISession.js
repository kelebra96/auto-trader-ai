const mongoose = require('mongoose');

// Schema para sessões de comunicação e aprendizado entre IAs
const aiSessionSchema = new mongoose.Schema({
  // Identificação da sessão
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Tipo de sessão
  sessionType: {
    type: String,
    required: true,
    enum: ['trading_decision', 'error_analysis', 'market_research', 'knowledge_sharing', 'strategy_update'],
    index: true
  },
  
  // IAs participantes
  participants: [{
    aiAgent: {
      type: String,
      required: true,
      enum: ['trading', 'supervisor', 'researcher']
    },
    role: {
      type: String,
      enum: ['initiator', 'advisor', 'validator', 'observer']
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Contexto da sessão
  context: {
    asset: String,
    tradeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trade'
    },
    marketData: mongoose.Schema.Types.Mixed,
    trigger: String, // O que iniciou esta sessão
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    }
  },
  
  // Mensagens da conversa
  messages: [{
    from: {
      type: String,
      required: true,
      enum: ['trading', 'supervisor', 'researcher']
    },
    to: {
      type: String,
      enum: ['trading', 'supervisor', 'researcher', 'all']
    },
    messageType: {
      type: String,
      enum: ['question', 'answer', 'suggestion', 'correction', 'data', 'decision'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    data: mongoose.Schema.Types.Mixed,
    timestamp: {
      type: Date,
      default: Date.now
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    processed: {
      type: Boolean,
      default: false
    }
  }],
  
  // Resultados da sessão
  outcomes: {
    finalDecision: String,
    consensusReached: {
      type: Boolean,
      default: false
    },
    knowledgeGenerated: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AIKnowledge'
    }],
    actionsToTake: [String],
    improvementsIdentified: [String]
  },
  
  // Métricas da sessão
  metrics: {
    duration: Number, // em segundos
    messageCount: {
      type: Number,
      default: 0
    },
    consensusScore: {
      type: Number,
      min: 0,
      max: 1
    },
    effectivenessScore: {
      type: Number,
      min: 0,
      max: 1
    }
  },
  
  // Status da sessão
  status: {
    type: String,
    enum: ['active', 'completed', 'timeout', 'error'],
    default: 'active',
    index: true
  },
  
  startedAt: {
    type: Date,
    default: Date.now
  },
  
  completedAt: Date,
  
  // TTL para limpeza automática de sessões antigas
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias
  }
}, {
  timestamps: true
});

// Índices
aiSessionSchema.index({ status: 1, startedAt: -1 });
aiSessionSchema.index({ 'context.asset': 1, sessionType: 1 });
aiSessionSchema.index({ 'participants.aiAgent': 1 });
aiSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Métodos do schema
aiSessionSchema.methods.addMessage = function(from, to, messageType, content, data = null, confidence = null) {
  const message = {
    from,
    to: to || 'all',
    messageType,
    content,
    data,
    confidence,
    timestamp: new Date()
  };
  
  this.messages.push(message);
  this.metrics.messageCount = this.messages.length;
  
  return this.save();
};

aiSessionSchema.methods.completeSession = function(finalDecision, consensusReached = false) {
  this.status = 'completed';
  this.completedAt = new Date();
  this.outcomes.finalDecision = finalDecision;
  this.outcomes.consensusReached = consensusReached;
  
  // Calcular duração
  this.metrics.duration = Math.floor((this.completedAt - this.startedAt) / 1000);
  
  return this.save();
};

aiSessionSchema.methods.addParticipant = function(aiAgent, role = 'observer') {
  const existingParticipant = this.participants.find(p => p.aiAgent === aiAgent);
  
  if (!existingParticipant) {
    this.participants.push({
      aiAgent,
      role,
      joinedAt: new Date()
    });
  }
  
  return this.save();
};

// Métodos estáticos
aiSessionSchema.statics.createSession = function(sessionType, initiatorAgent, context = {}) {
  const sessionId = `${sessionType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return this.create({
    sessionId,
    sessionType,
    participants: [{
      aiAgent: initiatorAgent,
      role: 'initiator',
      joinedAt: new Date()
    }],
    context,
    status: 'active'
  });
};

aiSessionSchema.statics.getActiveSessionsForAgent = function(aiAgent) {
  return this.find({
    'participants.aiAgent': aiAgent,
    status: 'active'
  }).sort({ startedAt: -1 });
};

aiSessionSchema.statics.getSessionStats = function(timeframe = 24) {
  const since = new Date(Date.now() - timeframe * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        startedAt: { $gte: since }
      }
    },
    {
      $group: {
        _id: {
          sessionType: '$sessionType',
          status: '$status'
        },
        count: { $sum: 1 },
        avgDuration: { $avg: '$metrics.duration' },
        avgMessages: { $avg: '$metrics.messageCount' }
      }
    }
  ]);
};

module.exports = mongoose.model('AISession', aiSessionSchema);
