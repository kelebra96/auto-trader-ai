jest.mock('../utils/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  http: jest.fn(),
  db: jest.fn(),
  auth: jest.fn(),
  business: jest.fn()
}));

const logger = require('../utils/logger');
const { errorHandler, asyncHandler, AppError } = require('../middleware/errorHandler');

const createMockReq = (overrides = {}) => ({
  method: 'GET',
  originalUrl: '/test',
  body: { example: 'payload' },
  params: { id: '123' },
  query: { search: 'term' },
  ...overrides
});

const createMockRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn()
});

describe('errorHandler middleware', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  let req;
  let res;

  beforeEach(() => {
    req = createMockReq();
    res = createMockRes();
    process.env.NODE_ENV = 'test';
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('should log the error and respond with a 500 status by default', () => {
    const error = new Error('Unexpected failure');

    errorHandler(error, req, res, jest.fn());

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Erro na rota GET /test'),
      expect.objectContaining({
        error: 'Unexpected failure',
        user: 'Não autenticado'
      })
    );
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Unexpected failure'
    });
  });

  it('should respect the status code of an AppError instance', () => {
    const appError = new AppError('Resource missing', 404);

    errorHandler(appError, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Resource missing'
    });
  });

  it('should convert Sequelize validation errors into a 400 response', () => {
    const sequelizeError = {
      name: 'SequelizeValidationError',
      message: 'Validation failed',
      errors: [
        { message: 'Campo nome é obrigatório' },
        { message: 'Campo email inválido' }
      ]
    };

    errorHandler(sequelizeError, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Campo nome é obrigatório, Campo email inválido'
    });
  });

  it('should convert Sequelize unique constraint errors into a 400 response', () => {
    const uniqueError = {
      name: 'SequelizeUniqueConstraintError',
      errors: [
        { path: 'email' }
      ]
    };

    errorHandler(uniqueError, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'email já existe no sistema'
    });
  });

  it('should convert Sequelize foreign key errors into a 400 response', () => {
    const foreignKeyError = {
      name: 'SequelizeForeignKeyConstraintError'
    };

    errorHandler(foreignKeyError, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Referência inválida. Verifique os dados relacionados.'
    });
  });

  it('should convert Sequelize connection errors into a 500 response', () => {
    const connectionError = {
      name: 'SequelizeConnectionError'
    };

    errorHandler(connectionError, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Erro de conexão com o banco de dados'
    });
  });

  it('should convert Joi validation errors into a 400 response', () => {
    const joiError = {
      isJoi: true,
      message: 'Validation failed',
      details: [
        { message: 'email é obrigatório' },
        { message: 'senha deve ter no mínimo 8 caracteres' }
      ]
    };

    errorHandler(joiError, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'email é obrigatório, senha deve ter no mínimo 8 caracteres'
    });
  });

  it('should convert JWT errors into a 401 response', () => {
    const jwtError = {
      name: 'JsonWebTokenError'
    };

    errorHandler(jwtError, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Token inválido'
    });
  });

  it('should convert expired JWT errors into a 401 response', () => {
    const jwtExpiredError = {
      name: 'TokenExpiredError'
    };

    errorHandler(jwtExpiredError, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Token expirado'
    });
  });

  it('should convert cast errors into a 400 response', () => {
    const castError = {
      name: 'CastError'
    };

    errorHandler(castError, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'ID inválido'
    });
  });

  it('should convert file size limit errors into a 400 response', () => {
    const fileSizeError = {
      code: 'LIMIT_FILE_SIZE'
    };

    errorHandler(fileSizeError, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Arquivo muito grande. Tamanho máximo: 16MB'
    });
  });

  it('should convert unexpected file errors into a 400 response', () => {
    const unexpectedFileError = {
      code: 'LIMIT_UNEXPECTED_FILE'
    };

    errorHandler(unexpectedFileError, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Tipo de arquivo não suportado'
    });
  });

  it('should include the stack trace when running in development mode', () => {
    process.env.NODE_ENV = 'development';
    const error = new Error('Development failure');

    errorHandler(error, req, res, jest.fn());

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Development failure',
      stack: expect.any(String)
    });
  });
});

describe('AppError class', () => {
  it('should extend Error and set additional properties', () => {
    const appError = new AppError('Resource not found', 404, false);

    expect(appError).toBeInstanceOf(Error);
    expect(appError.name).toBe('AppError');
    expect(appError.message).toBe('Resource not found');
    expect(appError.statusCode).toBe(404);
    expect(appError.isOperational).toBe(false);
  });

  it('should default status code to 500 and mark as operational', () => {
    const appError = new AppError('Unexpected');

    expect(appError.statusCode).toBe(500);
    expect(appError.isOperational).toBe(true);
  });
});

describe('asyncHandler utility', () => {
  it('should forward rejected promises to the next handler', async () => {
    const next = jest.fn();
    const middleware = asyncHandler(async () => {
      throw new Error('Async failure');
    });

    await middleware({}, {}, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].message).toBe('Async failure');
  });

  it('should call the wrapped handler when it resolves successfully', async () => {
    const next = jest.fn();
    const handler = jest.fn().mockResolvedValue(undefined);
    const middleware = asyncHandler(handler);

    await middleware({ value: 1 }, { value: 2 }, next);

    expect(handler).toHaveBeenCalledWith({ value: 1 }, { value: 2 }, next);
    expect(next).not.toHaveBeenCalled();
  });

  it('should forward synchronous errors to the next handler', async () => {
    const next = jest.fn();
    const handler = () => {
      throw new Error('Sync failure');
    };

    const middleware = asyncHandler(handler);
    await middleware({}, {}, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].message).toBe('Sync failure');
  });
});
