const express = require('express');
const router = express.Router();
const { authenticate, requirePermission } = require('../middleware/auth');
const { Permission } = require('../models');
const permissionService = require('../services/permissionService');
const logger = require('../utils/logger');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

// GET /api/permissions - Listar todas as permissões
router.get('/', authenticate, requirePermission('profiles_view'), asyncHandler(async (req, res) => {
  const permissions = await permissionService.getAllPermissions();
  
  res.json({
    success: true,
    data: permissions
  });
}));

// GET /api/permissions/by-category - Listar permissões agrupadas por categoria
router.get('/by-category', authenticate, requirePermission('profiles_view'), asyncHandler(async (req, res) => {
  const permissionsByCategory = await permissionService.getPermissionsByCategory();
  
  res.json({
    success: true,
    data: permissionsByCategory
  });
}));

// GET /api/permissions/:id - Obter permissão específica
router.get('/:id', authenticate, requirePermission('profiles_view'), asyncHandler(async (req, res) => {
  const permission = await Permission.findByPk(req.params.id);

  if (!permission) {
    throw new AppError('Permissão não encontrada', 404);
  }

  res.json({
    success: true,
    data: permission
  });
}));

// POST /api/permissions - Criar nova permissão
router.post('/', authenticate, requirePermission('profiles_create'), asyncHandler(async (req, res) => {
  const { name, description, category } = req.body;

  if (!name || !description || !category) {
    throw new AppError('Nome, descrição e categoria são obrigatórios', 400);
  }

  // Verificar se já existe uma permissão com esse nome
  const existingPermission = await Permission.findOne({ where: { name } });
  if (existingPermission) {
    throw new AppError('Já existe uma permissão com esse nome', 400);
  }

  const permission = await Permission.create({
    name,
    description,
    category,
    active: true
  });

  logger.info('Permissão criada', {
    permissionId: permission.id,
    permissionName: permission.name,
    createdBy: req.user.id
  });

  res.status(201).json({
    success: true,
    data: permission
  });
}));

// PUT /api/permissions/:id - Atualizar permissão
router.put('/:id', authenticate, requirePermission('profiles_edit'), asyncHandler(async (req, res) => {
  const { name, description, category, active } = req.body;

  const permission = await Permission.findByPk(req.params.id);
  if (!permission) {
    throw new AppError('Permissão não encontrada', 404);
  }

  // Verificar se o nome já existe em outra permissão
  if (name && name !== permission.name) {
    const existingPermission = await Permission.findOne({ 
      where: { name, id: { [require('sequelize').Op.ne]: permission.id } }
    });
    if (existingPermission) {
      throw new AppError('Já existe uma permissão com esse nome', 400);
    }
  }

  await permission.update({
    name: name || permission.name,
    description: description || permission.description,
    category: category || permission.category,
    active: active !== undefined ? active : permission.active
  });

  logger.info('Permissão atualizada', {
    permissionId: permission.id,
    permissionName: permission.name,
    updatedBy: req.user.id
  });

  res.json({
    success: true,
    data: permission
  });
}));

// DELETE /api/permissions/:id - Excluir permissão
router.delete('/:id', authenticate, requirePermission('profiles_delete'), asyncHandler(async (req, res) => {
  const permission = await Permission.findByPk(req.params.id);
  if (!permission) {
    throw new AppError('Permissão não encontrada', 404);
  }

  // Verificar se a permissão está sendo usada
  const { ProfilePermission, UserPermission } = require('../models');
  
  const profileUsage = await ProfilePermission.count({ where: { permission_id: permission.id } });
  const userUsage = await UserPermission.count({ where: { permission_id: permission.id } });
  
  if (profileUsage > 0 || userUsage > 0) {
    throw new AppError('Não é possível excluir a permissão. Ela está sendo usada por perfis ou usuários.', 400);
  }

  await permission.destroy();

  logger.info('Permissão excluída', {
    permissionId: permission.id,
    permissionName: permission.name,
    deletedBy: req.user.id
  });

  res.json({
    success: true,
    message: 'Permissão excluída com sucesso'
  });
}));

// GET /api/permissions/categories - Listar categorias de permissões
router.get('/categories/list', authenticate, requirePermission('profiles_view'), asyncHandler(async (req, res) => {
  const categories = await Permission.findAll({
    attributes: ['category'],
    group: ['category'],
    where: { active: true },
    order: [['category', 'ASC']]
  });

  const categoryList = categories.map(item => item.category);

  res.json({
    success: true,
    data: categoryList
  });
}));

module.exports = router;