const winston = require('winston');
const path = require('path');

// Definir formato personalizado
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    if (stack) {
      return `${timestamp} [${level.toUpperCase()}]: ${message}\n${stack}`;
    }
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
  })
);

// Configurar transports
const transports = [
  // Console transport
  new winston.transports.Console({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.colorize(),
      customFormat
    )
  })
];

// Adicionar file transports apenas em produção
if (process.env.NODE_ENV === 'production') {
  // Log de erro
  transports.push(
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      format: customFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );
  
  // Log combinado
  transports.push(
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
      format: customFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );
}

// Criar logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  transports,
  exitOnError: false
});

// Adicionar método para log de requisições HTTP
logger.http = (message, meta = {}) => {
  logger.info(message, { type: 'http', ...meta });
};

// Adicionar método para log de banco de dados
logger.db = (message, meta = {}) => {
  logger.info(message, { type: 'database', ...meta });
};

// Adicionar método para log de autenticação
logger.auth = (message, meta = {}) => {
  logger.info(message, { type: 'auth', ...meta });
};

// Adicionar método para log de business logic
logger.business = (message, meta = {}) => {
  logger.info(message, { type: 'business', ...meta });
};

module.exports = logger;