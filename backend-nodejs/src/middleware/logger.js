const winston = require('winston');
const path = require('path');

// Configurar o logger Winston
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'auto-trader-ai-backend' },
  transports: [
    // Arquivo de log para erros
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Arquivo de log combinado
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Se não estiver em produção, também logar no console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Middleware para logging de requisições
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Capturar informações da requisição
  const requestInfo = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  };

  // Log da requisição
  logger.info('Incoming request', requestInfo);

  // Interceptar o final da resposta
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    
    // Log da resposta
    logger.info('Request completed', {
      ...requestInfo,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      responseSize: data ? data.length : 0
    });

    // Chamar o método original
    originalSend.call(this, data);
  };

  next();
};

// Função para logar erros
const logError = (error, req = null) => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  };

  if (req) {
    errorInfo.request = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    };
  }

  logger.error('Application error', errorInfo);
};

// Função para logar informações gerais
const logInfo = (message, meta = {}) => {
  logger.info(message, {
    ...meta,
    timestamp: new Date().toISOString()
  });
};

// Função para logar warnings
const logWarning = (message, meta = {}) => {
  logger.warn(message, {
    ...meta,
    timestamp: new Date().toISOString()
  });
};

// Função para logar debug (apenas em desenvolvimento)
const logDebug = (message, meta = {}) => {
  if (process.env.NODE_ENV === 'development') {
    logger.debug(message, {
      ...meta,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  logger,
  requestLogger,
  logError,
  logInfo,
  logWarning,
  logDebug
};