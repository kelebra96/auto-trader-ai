const express = require('express');
const router = express.Router();
const { authenticate, requirePermission, requireAdminOrPermission } = require('../middleware/auth');
const { User } = require('../models');
const logger = require('../utils/logger');
const permissionService = require('../services/permissionService');
const userController = require('../controllers/userController');

// Rota para obter permissões do usuário atual
router.get('/permissoes', authenticate, async (req, res) => {
  try {
    const permissionsData = await permissionService.getUserPermissions(req.user.id);
    
    res.json({
      success: true,
      permissoes: permissionsData.permissions || [],
      cargo: permissionsData.role || req.user.papel || '',
      usuario: {
        id: req.user.id,
        nome_completo: req.user.nome_completo,
        email: req.user.email,
        papel: req.user.papel,
        profile: permissionsData.profile
      }
    });
  } catch (error) {
    logger.error('Erro ao obter permissões do usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível obter as permissões do usuário'
    });
  }
});

// Rotas para perfil do usuário atual
router.get('/perfil', authenticate, userController.getCurrentUserProfile);
router.put('/perfil', authenticate, userController.updateCurrentUserProfile);

// Rotas CRUD para usuários
router.get('/', authenticate, requirePermission('users_view'), userController.getUsers);
router.get('/:id', authenticate, requirePermission('users_view'), userController.getUser);
router.post('/', authenticate, requirePermission('users_create'), userController.createUser);
router.put('/:id', authenticate, requirePermission('users_edit'), userController.updateUser);
router.delete('/:id', authenticate, requirePermission('users_delete'), userController.deleteUser);

// Rotas específicas para gerenciamento de usuários
router.put('/:id/password', authenticate, requireAdminOrPermission('users_edit'), userController.changePassword);
router.get('/:id/permissions', authenticate, requirePermission('users_view'), userController.getUserPermissions);
router.put('/:id/profile', authenticate, requirePermission('users_edit'), userController.assignProfile);
router.put('/:id/permission', authenticate, requirePermission('users_edit'), userController.manageUserPermission);

module.exports = router;