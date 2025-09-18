const mongoose = require('mongoose');

// Schema para armazenar conhecimento e aprendizado das IAs
const aiKnowledgeSchema = new mongoose.Schema({
  // Identificação do conhecimento
  aiAgent: {
    type: String,
    required: true,
    enum: ['trading', 'supervisor', 'researcher'],
    index: true
  },
  
  // Tipo de conhecimento
  knowledgeType: {
    type: String,
    required: true,
    enum: ['pattern', 'error_analysis', 'market_research', 'strategy', 'correction'],
    index: true
  },
  
  // Ativo relacionado
  asset: {
    type: String,
    required: true,
    index: true
  },
  
  // Conteúdo do conhecimento
  content: {
    type: String,
    required: true
  },
  
  // Dados estruturados (JSON)
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Contexto original que gerou esse conhecimento
  context: {
    tradeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trade'
    },
    marketConditions: {
      type: mongoose.Schema.Types.Mixed
    },
    originalDecision: String,
    actualOutcome: String
  },
  
  // Métricas de qualidade
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.5
  },
  
  accuracy: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.5
  },
  
  // Contadores de uso
  usageCount: {
    type: Number,
    default: 0
  },
  
  successCount: {
    type: Number,
    default: 0
  },
  
  // Tags para categorização
  tags: [{
    type: String,
    index: true
  }],
  
  // Status do conhecimento
  status: {
    type: String,
    enum: ['active', 'deprecated', 'under_review'],
    default: 'active'
  },
  
  // Metadados
  createdBy: {
    type: String,
    required: true
  },
  
  validatedBy: String,
  
  expiresAt: Date,
  
  // Relacionamentos
  parentKnowledge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AIKnowledge'
  },
  
  relatedKnowledge: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AIKnowledge'
  }]
}, {
  timestamps: true
});

// Índices compostos para consultas eficientes
aiKnowledgeSchema.index({ aiAgent: 1, asset: 1, knowledgeType: 1 });
aiKnowledgeSchema.index({ asset: 1, createdAt: -1 });
aiKnowledgeSchema.index({ confidence: -1, accuracy: -1 });
aiKnowledgeSchema.index({ tags: 1, status: 1 });

// Métodos do schema
aiKnowledgeSchema.methods.updateAccuracy = function(wasSuccessful) {
  this.usageCount += 1;
  if (wasSuccessful) {
    this.successCount += 1;
  }
  this.accuracy = this.successCount / this.usageCount;
  return this.save();
};

aiKnowledgeSchema.methods.isRelevant = function(asset, context = {}) {
  if (this.asset !== asset) return false;
  if (this.status !== 'active') return false;
  if (this.expiresAt && this.expiresAt < new Date()) return false;
  
  return true;
};

// Métodos estáticos
aiKnowledgeSchema.statics.findRelevantKnowledge = function(aiAgent, asset, knowledgeType, limit = 10) {
  return this.find({
    aiAgent,
    asset,
    knowledgeType,
    status: 'active',
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  })
  .sort({ accuracy: -1, confidence: -1, createdAt: -1 })
  .limit(limit);
};

aiKnowledgeSchema.statics.getKnowledgeStats = function(aiAgent, asset) {
  return this.aggregate([
    {
      $match: {
        aiAgent,
        asset,
        status: 'active'
      }
    },
    {
      $group: {
        _id: '$knowledgeType',
        count: { $sum: 1 },
        avgAccuracy: { $avg: '$accuracy' },
        avgConfidence: { $avg: '$confidence' },
        totalUsage: { $sum: '$usageCount' }
      }
    }
  ]);
};

module.exports = mongoose.model('AIKnowledge', aiKnowledgeSchema);
