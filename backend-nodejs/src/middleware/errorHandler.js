const logger = require('../utils/logger');

// Classe para erros customizados
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Middleware de tratamento de erros
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log do erro
  logger.error(`Erro na rota ${req.method} ${req.originalUrl}:`, {
    error: err.message,
    stack: err.stack,
    body: req.body,
    params: req.params,
    query: req.query,
    user: req.user?.id || 'Não autenticado'
  });

  // Erro de validação do Sequelize
  if (err.name === 'SequelizeValidationError') {
    const message = err.errors.map(error => error.message).join(', ');
    error = new AppError(message, 400);
  }

  // Erro de constraint única do Sequelize
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0]?.path || 'campo';
    const message = `${field} já existe no sistema`;
    error = new AppError(message, 400);
  }

  // Erro de foreign key do Sequelize
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    const message = 'Referência inválida. Verifique os dados relacionados.';
    error = new AppError(message, 400);
  }

  // Erro de conexão com banco de dados
  if (err.name === 'SequelizeConnectionError') {
    const message = 'Erro de conexão com o banco de dados';
    error = new AppError(message, 500);
  }

  // Erro de JWT
  if (err.name === 'JsonWebTokenError') {
    const message = 'Token inválido';
    error = new AppError(message, 401);
  }

  // Erro de JWT expirado
  if (err.name === 'TokenExpiredError') {
    const message = 'Token expirado';
    error = new AppError(message, 401);
  }

  // Erro de validação do Joi
  if (err.isJoi) {
    const message = err.details.map(detail => detail.message).join(', ');
    error = new AppError(message, 400);
  }

  // Erro de cast (tipo inválido)
  if (err.name === 'CastError') {
    const message = 'ID inválido';
    error = new AppError(message, 400);
  }

  // Erro de arquivo muito grande
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'Arquivo muito grande. Tamanho máximo: 16MB';
    error = new AppError(message, 400);
  }

  // Erro de tipo de arquivo não suportado
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Tipo de arquivo não suportado';
    error = new AppError(message, 400);
  }

  // Resposta padrão
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Erro interno do servidor';

  // Em desenvolvimento, incluir stack trace
  const response = {
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };

  res.status(statusCode).json(response);
};

// Middleware para capturar erros assíncronos
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  asyncHandler,
  AppError
};