// Setup para testes Jest
require('dotenv').config({ path: '.env.test' });

// Configurar ambiente de teste
process.env.NODE_ENV = 'test';
process.env.DB_DIALECT = 'sqlite';
process.env.JWT_SECRET = 'test-jwt-secret';

// Mock do console para testes mais limpos
global.console = {
  ...console,
  // Desabilitar logs durante os testes
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Timeout global para testes
jest.setTimeout(10000);
