const express = require('express');
const router = express.Router();
const { authenticate, requirePermission, requireAdminOrPermission } = require('../middleware/auth');
const { UserProfile, Permission, ProfilePermission, User } = require('../models');
const permissionService = require('../services/permissionService');
const logger = require('../utils/logger');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

// GET /api/profiles - Listar todos os perfis
router.get('/', authenticate, requirePermission('profiles_view'), asyncHandler(async (req, res) => {
  const profiles = await permissionService.getAllProfiles();
  
  res.json({
    success: true,
    data: profiles
  });
}));

// GET /api/profiles/:id - Obter perfil específico
router.get('/:id', authenticate, requirePermission('profiles_view'), asyncHandler(async (req, res) => {
  const profile = await UserProfile.findByPk(req.params.id, {
    include: [
      {
        model: Permission,
        as: 'permissions',
        through: { attributes: [] }
      }
    ]
  });

  if (!profile) {
    throw new AppError('Perfil não encontrado', 404);
  }

  res.json({
    success: true,
    data: profile
  });
}));

// POST /api/profiles - Criar novo perfil
router.post('/', authenticate, requirePermission('profiles_create'), asyncHandler(async (req, res) => {
  const { name, description, permissions = [] } = req.body;

  if (!name) {
    throw new AppError('Nome do perfil é obrigatório', 400);
  }

  // Verificar se já existe um perfil com esse nome
  const existingProfile = await UserProfile.findOne({ where: { name } });
  if (existingProfile) {
    throw new AppError('Já existe um perfil com esse nome', 400);
  }

  // Criar o perfil
  const profile = await UserProfile.create({
    name,
    description,
    active: true
  });

  // Associar permissões se fornecidas
  if (permissions.length > 0) {
    const validPermissions = await Permission.findAll({
      where: { id: permissions, active: true }
    });

    if (validPermissions.length !== permissions.length) {
      throw new AppError('Algumas permissões fornecidas são inválidas', 400);
    }

    await profile.setPermissions(validPermissions);
  }

  // Buscar o perfil criado com as permissões
  const createdProfile = await UserProfile.findByPk(profile.id, {
    include: [
      {
        model: Permission,
        as: 'permissions',
        through: { attributes: [] }
      }
    ]
  });

  logger.info('Perfil criado', {
    profileId: profile.id,
    profileName: profile.name,
    createdBy: req.user.id
  });

  res.status(201).json({
    success: true,
    data: createdProfile
  });
}));

// PUT /api/profiles/:id - Atualizar perfil
router.put('/:id', authenticate, requirePermission('profiles_edit'), asyncHandler(async (req, res) => {
  const { name, description, permissions = [], active } = req.body;

  const profile = await UserProfile.findByPk(req.params.id);
  if (!profile) {
    throw new AppError('Perfil não encontrado', 404);
  }

  // Verificar se o nome já existe em outro perfil
  if (name && name !== profile.name) {
    const existingProfile = await UserProfile.findOne({ 
      where: { name, id: { [require('sequelize').Op.ne]: profile.id } }
    });
    if (existingProfile) {
      throw new AppError('Já existe um perfil com esse nome', 400);
    }
  }

  // Atualizar dados básicos
  await profile.update({
    name: name || profile.name,
    description: description !== undefined ? description : profile.description,
    active: active !== undefined ? active : profile.active
  });

  // Atualizar permissões se fornecidas
  if (permissions.length >= 0) {
    const validPermissions = await Permission.findAll({
      where: { id: permissions, active: true }
    });

    if (permissions.length > 0 && validPermissions.length !== permissions.length) {
      throw new AppError('Algumas permissões fornecidas são inválidas', 400);
    }

    await profile.setPermissions(validPermissions);
  }

  // Buscar o perfil atualizado com as permissões
  const updatedProfile = await UserProfile.findByPk(profile.id, {
    include: [
      {
        model: Permission,
        as: 'permissions',
        through: { attributes: [] }
      }
    ]
  });

  logger.info('Perfil atualizado', {
    profileId: profile.id,
    profileName: profile.name,
    updatedBy: req.user.id
  });

  res.json({
    success: true,
    data: updatedProfile
  });
}));

// DELETE /api/profiles/:id - Excluir perfil
router.delete('/:id', authenticate, requirePermission('profiles_delete'), asyncHandler(async (req, res) => {
  const profile = await UserProfile.findByPk(req.params.id);
  if (!profile) {
    throw new AppError('Perfil não encontrado', 404);
  }

  // Verificar se há usuários usando este perfil
  const usersCount = await User.count({ where: { profile_id: profile.id } });
  if (usersCount > 0) {
    throw new AppError(`Não é possível excluir o perfil. ${usersCount} usuário(s) estão usando este perfil.`, 400);
  }

  // Verificar se é o perfil padrão
  if (profile.is_default) {
    throw new AppError('Não é possível excluir o perfil padrão', 400);
  }

  await profile.destroy();

  logger.info('Perfil excluído', {
    profileId: profile.id,
    profileName: profile.name,
    deletedBy: req.user.id
  });

  res.json({
    success: true,
    message: 'Perfil excluído com sucesso'
  });
}));

// GET /api/profiles/:id/users - Listar usuários do perfil
router.get('/:id/users', authenticate, requirePermission('profiles_view'), asyncHandler(async (req, res) => {
  const profile = await UserProfile.findByPk(req.params.id);
  if (!profile) {
    throw new AppError('Perfil não encontrado', 404);
  }

  const users = await User.findAll({
    where: { profile_id: profile.id },
    attributes: ['id', 'email', 'nome_estabelecimento', 'papel', 'ativo', 'createdAt']
  });

  res.json({
    success: true,
    data: {
      profile: profile,
      users: users
    }
  });
}));

// POST /api/profiles/:id/set-default - Definir como perfil padrão
router.post('/:id/set-default', authenticate, requirePermission('profiles_edit'), asyncHandler(async (req, res) => {
  const profile = await UserProfile.findByPk(req.params.id);
  if (!profile) {
    throw new AppError('Perfil não encontrado', 404);
  }

  if (!profile.active) {
    throw new AppError('Não é possível definir um perfil inativo como padrão', 400);
  }

  // Remover flag de padrão de todos os outros perfis
  await UserProfile.update(
    { is_default: false },
    { where: { is_default: true } }
  );

  // Definir este perfil como padrão
  await profile.update({ is_default: true });

  logger.info('Perfil definido como padrão', {
    profileId: profile.id,
    profileName: profile.name,
    setBy: req.user.id
  });

  res.json({
    success: true,
    message: 'Perfil definido como padrão com sucesso'
  });
}));

module.exports = router;