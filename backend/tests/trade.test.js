const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Trade = require('../models/Trade');

// Configuração de teste
const MONGODB_URI = 'mongodb://localhost:27017/autotrader_test';

describe('Auto-Trader API Tests', () => {
  beforeAll(async () => {
    // Conectar ao banco de teste
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  beforeEach(async () => {
    // Limpar dados de teste antes de cada teste
    await Trade.deleteMany({});
  });

  afterAll(async () => {
    // Limpar e fechar conexão após todos os testes
    await Trade.deleteMany({});
    await mongoose.connection.close();
  });

  describe('GET /api/health', () => {
    it('deve retornar status OK', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.status).toBe('OK');
      expect(response.body.uptime).toBeGreaterThan(0);
    });
  });

  describe('POST /api/trades', () => {
    it('deve criar um trade válido', async () => {
      const tradeData = {
        ativo: 'EURUSD',
        tendencia: 'alta',
        macd: 0.0015,
        rsi: 65.5,
        bollinger: '1.17500 - 1.18500'
      };

      const response = await request(app)
        .post('/api/trades')
        .send(tradeData)
        .expect(201);

      expect(response.body.message).toBe('Ordem criada com sucesso');
      expect(response.body.decision).toMatch(/^(buy|sell|hold)$/);
      expect(response.body.tradeId).toBeDefined();
    });

    it('deve rejeitar dados incompletos', async () => {
      const invalidData = {
        ativo: 'EURUSD',
        tendencia: 'alta'
        // Faltando campos obrigatórios
      };

      const response = await request(app)
        .post('/api/trades')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toContain('Dados incompletos');
    });

    it('deve rejeitar RSI inválido', async () => {
      const invalidData = {
        ativo: 'EURUSD',
        tendencia: 'alta',
        macd: 0.0015,
        rsi: 150, // RSI > 100
        bollinger: '1.17500 - 1.18500'
      };

      const response = await request(app)
        .post('/api/trades')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toContain('RSI deve estar entre 0 e 100');
    });
  });

  describe('GET /api/trades', () => {
    beforeEach(async () => {
      // Criar alguns trades de teste
      const testTrades = [
        {
          ativo: 'EURUSD',
          tendencia: 'alta',
          macd: 0.0015,
          rsi: 65.5,
          bollinger: '1.17500 - 1.18500',
          decision: 'buy'
        },
        {
          ativo: 'GBPUSD',
          tendencia: 'baixa',
          macd: -0.0012,
          rsi: 35.2,
          bollinger: '1.25000 - 1.26000',
          decision: 'sell'
        }
      ];

      await Trade.insertMany(testTrades);
    });

    it('deve listar todos os trades', async () => {
      const response = await request(app)
        .get('/api/trades')
        .expect(200);

      expect(response.body.trades).toHaveLength(2);
      expect(response.body.total).toBe(2);
      expect(response.body.currentPage).toBe(1);
    });

    it('deve filtrar trades por ativo', async () => {
      const response = await request(app)
        .get('/api/trades?ativo=EURUSD')
        .expect(200);

      expect(response.body.trades).toHaveLength(1);
      expect(response.body.trades[0].ativo).toBe('EURUSD');
    });

    it('deve filtrar trades por decisão', async () => {
      const response = await request(app)
        .get('/api/trades?decision=buy')
        .expect(200);

      expect(response.body.trades).toHaveLength(1);
      expect(response.body.trades[0].decision).toBe('buy');
    });
  });

  describe('GET /api/trades/:id', () => {
    let tradeId;

    beforeEach(async () => {
      const trade = new Trade({
        ativo: 'EURUSD',
        tendencia: 'alta',
        macd: 0.0015,
        rsi: 65.5,
        bollinger: '1.17500 - 1.18500',
        decision: 'buy'
      });
      
      const savedTrade = await trade.save();
      tradeId = savedTrade._id.toString();
    });

    it('deve retornar trade específico', async () => {
      const response = await request(app)
        .get(`/api/trades/${tradeId}`)
        .expect(200);

      expect(response.body._id).toBe(tradeId);
      expect(response.body.ativo).toBe('EURUSD');
    });

    it('deve retornar 404 para trade inexistente', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/trades/${fakeId}`)
        .expect(404);

      expect(response.body.error).toBe('Trade não encontrado');
    });
  });

  describe('GET /api/dashboard/stats', () => {
    beforeEach(async () => {
      const testTrades = [
        {
          ativo: 'EURUSD',
          tendencia: 'alta',
          macd: 0.0015,
          rsi: 65.5,
          bollinger: '1.17500 - 1.18500',
          decision: 'buy'
        },
        {
          ativo: 'GBPUSD',
          tendencia: 'baixa',
          macd: -0.0012,
          rsi: 35.2,
          bollinger: '1.25000 - 1.26000',
          decision: 'sell'
        },
        {
          ativo: 'USDJPY',
          tendencia: 'lateral',
          macd: 0.0001,
          rsi: 50.0,
          bollinger: '110.00 - 111.00',
          decision: 'hold'
        }
      ];

      await Trade.insertMany(testTrades);
    });

    it('deve retornar estatísticas do dashboard', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats')
        .expect(200);

      expect(response.body.totalTrades).toBe(3);
      expect(response.body.decisionStats).toHaveLength(3);
      expect(response.body.assetStats).toHaveLength(3);
      expect(response.body.recentTrades).toHaveLength(3);
    });
  });

  describe('POST /api/ai/message', () => {
    it('deve processar mensagem para IA', async () => {
      const messageData = {
        message: 'Qual é a melhor estratégia para EURUSD?',
        context: 'Teste unitário'
      };

      const response = await request(app)
        .post('/api/ai/message')
        .send(messageData)
        .expect(200);

      expect(response.body.response).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
      expect(typeof response.body.response).toBe('string');
    }, 30000); // Timeout maior para chamada da IA

    it('deve rejeitar mensagem vazia', async () => {
      const response = await request(app)
        .post('/api/ai/message')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Mensagem é obrigatória');
    });
  });

  describe('PUT /api/trades/:id/status', () => {
    let tradeId;

    beforeEach(async () => {
      const trade = new Trade({
        ativo: 'EURUSD',
        tendencia: 'alta',
        macd: 0.0015,
        rsi: 65.5,
        bollinger: '1.17500 - 1.18500',
        decision: 'buy'
      });
      
      const savedTrade = await trade.save();
      tradeId = savedTrade._id.toString();
    });

    it('deve atualizar status do trade', async () => {
      const updateData = {
        status: 'executed',
        profit: 150.50
      };

      const response = await request(app)
        .put(`/api/trades/${tradeId}/status`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('Trade atualizado com sucesso');
      expect(response.body.trade.status).toBe('executed');
      expect(response.body.trade.profit).toBe(150.50);
    });

    it('deve retornar 404 para trade inexistente', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .put(`/api/trades/${fakeId}/status`)
        .send({ status: 'executed' })
        .expect(404);

      expect(response.body.error).toBe('Trade não encontrado');
    });
  });
});
