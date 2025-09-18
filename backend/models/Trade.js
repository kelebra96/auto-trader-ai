const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
  ativo: {
    type: String,
    required: true,
    trim: true
  },
  tendencia: {
    type: String,
    required: true,
    enum: ['alta', 'baixa', 'lateral']
  },
  macd: {
    type: Number,
    required: true
  },
  rsi: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  bollinger: {
    type: String,
    required: true
  },
  decision: {
    type: String,
    required: true,
    enum: ["buy", "sell", "hold", "timeout"]
  },
  aiAnalysis: {
    type: String,
    required: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  profit: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'executed', 'cancelled'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Índices para melhor performance
tradeSchema.index({ ativo: 1, timestamp: -1 });
tradeSchema.index({ decision: 1 });
tradeSchema.index({ timestamp: -1 });

module.exports = mongoose.model('Trade', tradeSchema);



tradeSchema.add({
  confidence: {
    type: Number,
    min: 0,
    max: 1
  },
  sessionId: {
    type: String,
    index: true
  },
  executionDetails: {
    type: mongoose.Schema.Types.Mixed
  }
});
