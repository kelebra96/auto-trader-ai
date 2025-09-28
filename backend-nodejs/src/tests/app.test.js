jest.mock('../models', () => {
  const createModelMock = () => ({
    findOne: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    associate: jest.fn()
  });

  const models = {
    sequelize: {
      authenticate: jest.fn().mockResolvedValue(),
      close: jest.fn().mockResolvedValue()
    },
    Sequelize: {}
  };

  [
    'User',
    'Empresa',
    'Fornecedor',
    'Produto',
    'EntradaProduto',
    'Alerta',
    'ConfiguracaoAlerta',
    'Venda',
    'ConfiguracaoUsuario',
    'Permission',
    'UserProfile',
    'ProfilePermission',
    'UserPermission'
  ].forEach(modelName => {
    models[modelName] = createModelMock();
  });

  return models;
});

const request = require('supertest');
const { app } = require('../app');

describe('Auto Trader AI Backend', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Health Check', () => {
    it('should return 200 and health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('environment');
    });
  });

  describe('API Routes', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/non-existent')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Rota não encontrada');
    });

    it('should have CORS headers', async () => {
      const response = await request(app)
        .options('/health')
        .expect(204);

      expect(response.headers).toHaveProperty('access-control-allow-methods');
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
    });
  });

  describe('Rate Limiting', () => {
    it('should include rate limit headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('ratelimit-limit');
      expect(response.headers).toHaveProperty('ratelimit-remaining');
    });
  });
});
