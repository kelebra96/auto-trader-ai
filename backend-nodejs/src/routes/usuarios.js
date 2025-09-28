const express = require('express');
const router = express.Router();
const { authenticate, requirePermission, requireAdminOrPermission, authorizeOwnerOrAdmin } = require('../middleware/auth');
const { User } = require('../models');
const logger = require('../utils/logger');
const permissionService = require('../services/permissionService');
const userController = require('../controllers/userController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuração de armazenamento para fotos de perfil
const profilePhotosDir = path.join(__dirname, '../../uploads/profile_photos');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      fs.mkdirSync(profilePhotosDir, { recursive: true });
      cb(null, profilePhotosDir);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext) ? ext : '.jpg';
    const filename = `user_${req.params.id}_${Date.now()}${safeExt}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo inválido. Envie uma imagem.'));
    }
  }
});

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

// Upload de foto de perfil do usuário (multipart/form-data)
router.post('/:id/upload-foto', authenticate, authorizeOwnerOrAdmin, upload.single('foto_perfil'), async (req, res) => {
  try {
    // Delegar ao controller para atualizar o usuário e responder
    await userController.uploadUserPhoto(req, res);
  } catch (error) {
    logger.error('Erro ao fazer upload da foto de perfil:', error);
    res.status(400).json({
      error: 'Falha no upload',
      message: error.message || 'Erro ao enviar a foto'
    });
  }
});

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