const express = require('express');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { generateToken, generateRefreshToken, verifyToken, authenticate } = require('../middleware/auth');
const { validate, authSchemas } = require('../middleware/validation');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

// Registrar novo usuário
router.post('/register', 
  validate(authSchemas.register),
  asyncHandler(async (req, res) => {
    const { email, senha, nome_estabelecimento, papel = 'usuario' } = req.body;

    // Verificar se o usuário já existe
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new AppError('Email já está em uso', 400);
    }

    // Hash da senha
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    const hashedPassword = await bcrypt.hash(senha, saltRounds);

    // Criar usuário
    const user = await User.create({
      email,
      senha: hashedPassword,
      nome_estabelecimento,
      papel,
      ativo: true
    });

    // Gerar tokens
    const token = generateToken({ id: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ id: user.id });

    // Remover senha da resposta
    const userResponse = user.toJSON();
    delete userResponse.senha;

    logger.auth('Novo usuário registrado', {
      userId: user.id,
      email: user.email,
      papel: user.papel
    });

    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      data: {
        user: userResponse,
        token,
        refreshToken
      }
    });
  })
);

// Login
router.post('/login',
  validate(authSchemas.login),
  asyncHandler(async (req, res) => {
    const { email, senha } = req.body;

    // Buscar usuário
    const user = await User.findOne({ where: { email } });
    if (!user) {
      logger.auth('Tentativa de login com email inexistente', {
        email,
        ip: req.ip
      });
      throw new AppError('Credenciais inválidas', 401);
    }

    // Verificar se o usuário está ativo
    if (!user.ativo) {
      logger.auth('Tentativa de login com usuário inativo', {
        userId: user.id,
        email,
        ip: req.ip
      });
      throw new AppError('Usuário inativo', 401);
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(senha, user.senha);
    if (!isPasswordValid) {
      logger.auth('Tentativa de login com senha incorreta', {
        userId: user.id,
        email,
        ip: req.ip
      });
      throw new AppError('Credenciais inválidas', 401);
    }

    // Atualizar último login
    await user.update({ ultimo_login: new Date() });

    // Gerar tokens
    const token = generateToken({ id: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ id: user.id });

    // Remover senha da resposta
    const userResponse = user.toJSON();
    delete userResponse.senha;

    logger.auth('Login realizado com sucesso', {
      userId: user.id,
      email: user.email,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        user: userResponse,
        token,
        refreshToken
      }
    });
  })
);

// Refresh token
router.post('/refresh',
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token não fornecido', 400);
    }

    try {
      // Verificar refresh token
      const decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
      
      // Buscar usuário
      const user = await User.findByPk(decoded.id);
      if (!user || !user.ativo) {
        throw new AppError('Usuário não encontrado ou inativo', 401);
      }

      // Gerar novos tokens
      const newToken = generateToken({ id: user.id, email: user.email });
      const newRefreshToken = generateRefreshToken({ id: user.id });

      logger.auth('Token renovado com sucesso', {
        userId: user.id,
        email: user.email
      });

      res.json({
        success: true,
        message: 'Token renovado com sucesso',
        data: {
          token: newToken,
          refreshToken: newRefreshToken
        }
      });
    } catch (error) {
      logger.auth('Erro ao renovar token', {
        error: error.message,
        ip: req.ip
      });
      throw new AppError('Refresh token inválido', 401);
    }
  })
);

// Verificar token
router.get('/verify',
  authenticate,
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      message: 'Token válido',
      data: {
        user: req.user
      }
    });
  })
);

// Logout (invalidar token - em uma implementação real, você manteria uma blacklist)
router.post('/logout',
  authenticate,
  asyncHandler(async (req, res) => {
    logger.auth('Logout realizado', {
      userId: req.user.id,
      email: req.user.email,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  })
);

// Alterar senha
router.put('/change-password',
  authenticate,
  validate(authSchemas.changePassword),
  asyncHandler(async (req, res) => {
    const { senha_atual, nova_senha } = req.body;
    const userId = req.user.id;

    // Buscar usuário com senha
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('Usuário não encontrado', 404);
    }

    // Verificar senha atual
    const isCurrentPasswordValid = await bcrypt.compare(senha_atual, user.senha);
    if (!isCurrentPasswordValid) {
      logger.auth('Tentativa de alteração de senha com senha atual incorreta', {
        userId,
        ip: req.ip
      });
      throw new AppError('Senha atual incorreta', 400);
    }

    // Hash da nova senha
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    const hashedNewPassword = await bcrypt.hash(nova_senha, saltRounds);

    // Atualizar senha
    await user.update({ senha: hashedNewPassword });

    logger.auth('Senha alterada com sucesso', {
      userId,
      email: user.email,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Senha alterada com sucesso'
    });
  })
);

// Esqueci minha senha (placeholder - implementação completa requer email)
router.post('/forgot-password',
  validate(authSchemas.forgotPassword),
  asyncHandler(async (req, res) => {
    const { email } = req.body;

    // Buscar usuário
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Por segurança, não revelar se o email existe
      return res.json({
        success: true,
        message: 'Se o email existir, você receberá instruções para redefinir sua senha'
      });
    }

    // TODO: Implementar envio de email com token de reset
    // Por enquanto, apenas log
    logger.auth('Solicitação de reset de senha', {
      userId: user.id,
      email,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Se o email existir, você receberá instruções para redefinir sua senha'
    });
  })
);

// Obter perfil do usuário logado
router.get('/profile',
  authenticate,
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  })
);

// Atualizar perfil do usuário logado
router.put('/profile',
  authenticate,
  validate(authSchemas.register.fork(['email', 'senha'], (schema) => schema.optional())),
  asyncHandler(async (req, res) => {
    const { nome_estabelecimento } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('Usuário não encontrado', 404);
    }

    // Atualizar apenas campos permitidos
    const updateData = {};
    if (nome_estabelecimento) updateData.nome_estabelecimento = nome_estabelecimento;

    await user.update(updateData);

    // Buscar usuário atualizado sem senha
    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ['senha'] }
    });

    logger.auth('Perfil atualizado', {
      userId,
      email: user.email,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      data: {
        user: updatedUser
      }
    });
  })
);

module.exports = router;