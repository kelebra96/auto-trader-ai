const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { AppError, asyncHandler } = require('./errorHandler');
const logger = require('../utils/logger');
const permissionService = require('../services/permissionService');

// Gerar token JWT
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Gerar refresh token
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  });
};

// Verificar token JWT
const verifyToken = (token, secret = process.env.JWT_SECRET) => {
  return jwt.verify(token, secret);
};

// Middleware de autenticação
const authenticate = asyncHandler(async (req, res, next) => {
  let token;

  // Verificar se o token está no header Authorization
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Verificar se o token existe
  if (!token) {
    logger.auth('Tentativa de acesso sem token', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.originalUrl
    });
    throw new AppError('Token de acesso não fornecido', 401);
  }

  try {
    // Verificar e decodificar o token
    const decoded = verifyToken(token);
    
    // Buscar o usuário no banco de dados
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['senha'] }
    });

    if (!user) {
      logger.auth('Token válido mas usuário não encontrado', {
        userId: decoded.id,
        ip: req.ip
      });
      throw new AppError('Usuário não encontrado', 401);
    }

    // Verificar se o usuário está ativo
    if (!user.ativo) {
      logger.auth('Tentativa de acesso com usuário inativo', {
        userId: user.id,
        email: user.email,
        ip: req.ip
      });
      throw new AppError('Usuário inativo', 401);
    }

    // Adicionar usuário ao request
    req.user = user;
    
    logger.auth('Usuário autenticado com sucesso', {
      userId: user.id,
      email: user.email,
      path: req.originalUrl
    });

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      logger.auth('Token JWT inválido', {
        error: error.message,
        ip: req.ip
      });
      throw new AppError('Token inválido', 401);
    }
    
    if (error.name === 'TokenExpiredError') {
      logger.auth('Token JWT expirado', {
        ip: req.ip
      });
      throw new AppError('Token expirado', 401);
    }

    throw error;
  }
});

// Middleware de autorização por papel
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError('Usuário não autenticado', 401);
    }

    if (!roles.includes(req.user.papel)) {
      logger.auth('Acesso negado por falta de permissão', {
        userId: req.user.id,
        userRole: req.user.papel,
        requiredRoles: roles,
        path: req.originalUrl
      });
      throw new AppError('Acesso negado. Permissões insuficientes.', 403);
    }

    next();
  };
};

// Middleware opcional de autenticação (não falha se não houver token)
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = verifyToken(token);
      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['senha'] }
      });

      if (user && user.ativo) {
        req.user = user;
      }
    } catch (error) {
      // Ignorar erros de token em autenticação opcional
      logger.auth('Token inválido em autenticação opcional', {
        error: error.message,
        ip: req.ip
      });
    }
  }

  next();
});

// Middleware para verificar se é o próprio usuário ou admin
const authorizeOwnerOrAdmin = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new AppError('Usuário não autenticado', 401);
  }

  const userId = req.params.id || req.params.userId;
  
  // Admin pode acessar qualquer recurso
  if (req.user.papel === 'admin') {
    return next();
  }

  // Usuário pode acessar apenas seus próprios recursos
  if (req.user.id.toString() === userId) {
    return next();
  }

  logger.auth('Tentativa de acesso a recurso não autorizado', {
    userId: req.user.id,
    targetUserId: userId,
    path: req.originalUrl
  });

  throw new AppError('Acesso negado. Você só pode acessar seus próprios recursos.', 403);
});

// Middleware para verificar permissão específica
const requirePermission = (permissionName) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const hasPermission = await permissionService.hasPermission(req.user.id, permissionName);
    
    if (!hasPermission) {
      logger.auth('Acesso negado por falta de permissão específica', {
        userId: req.user.id,
        requiredPermission: permissionName,
        path: req.originalUrl
      });
      throw new AppError(`Acesso negado. Permissão '${permissionName}' necessária.`, 403);
    }

    next();
  });
};

// Middleware para verificar qualquer uma das permissões especificadas
const requireAnyPermission = (...permissionNames) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const hasAnyPermission = await permissionService.hasAnyPermission(req.user.id, permissionNames);
    
    if (!hasAnyPermission) {
      logger.auth('Acesso negado por falta de permissões', {
        userId: req.user.id,
        requiredPermissions: permissionNames,
        path: req.originalUrl
      });
      throw new AppError(`Acesso negado. Uma das seguintes permissões é necessária: ${permissionNames.join(', ')}`, 403);
    }

    next();
  });
};

// Middleware para verificar se é admin ou tem permissão específica
const requireAdminOrPermission = (permissionName) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw new AppError('Usuário não autenticado', 401);
    }

    // Se é admin, permite acesso
    if (req.user.papel === 'admin') {
      return next();
    }

    // Senão, verifica a permissão específica
    const hasPermission = await permissionService.hasPermission(req.user.id, permissionName);
    
    if (!hasPermission) {
      logger.auth('Acesso negado - não é admin nem tem permissão específica', {
        userId: req.user.id,
        requiredPermission: permissionName,
        path: req.originalUrl
      });
      throw new AppError(`Acesso negado. Permissão de administrador ou '${permissionName}' necessária.`, 403);
    }

    next();
  });
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  authenticate,
  authorize,
  optionalAuth,
  authorizeOwnerOrAdmin,
  requirePermission,
  requireAnyPermission,
  requireAdminOrPermission
};