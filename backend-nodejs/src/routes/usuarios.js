const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { User } = require('../models');
const logger = require('../utils/logger');

// Sistema de Permissões baseado em papéis
const PERMISSIONS = {
  admin: [
    'view_all_users', 'create_user', 'edit_user', 'delete_user', 'change_user_password',
    'view_all_products', 'view_products', 'create_product', 'edit_product', 'delete_product',
    'view_all_sales', 'view_sales', 'create_sale', 'edit_sale', 'delete_sale',
    'view_all_alerts', 'view_alerts', 'create_alert', 'edit_alert', 'delete_alert',
    'view_all_reports', 'view_reports', 'export_data', 'manage_settings',
    'view_dashboard', 'manage_permissions', 'view_suppliers', 'view_companies'
  ],
  gerente: [
    'view_users', 'edit_user', 'change_user_password',
    'view_all_products', 'create_product', 'edit_product', 'delete_product',
    'view_all_sales', 'create_sale', 'edit_sale',
    'view_all_alerts', 'create_alert', 'edit_alert',
    'view_all_reports', 'export_data',
    'view_dashboard', 'view_suppliers', 'view_companies'
  ],
  usuario: [
    'view_own_profile', 'edit_own_profile',
    'view_products', 'create_product', 'edit_product',
    'view_sales', 'create_sale',
    'view_alerts', 'create_alert',
    'view_reports',
    'view_dashboard'
  ],
  visualizador: [
    'view_own_profile',
    'view_products',
    'view_sales',
    'view_alerts',
    'view_reports',
    'view_dashboard'
  ]
};

// Função para verificar se um usuário tem uma permissão específica
const hasPermission = (userRole, permission, customPermissions = null) => {
  // Se o usuário tem permissões customizadas, usar elas
  if (customPermissions && Array.isArray(customPermissions)) {
    // Se tem permissão 'all', pode fazer tudo
    if (customPermissions.includes('all')) {
      return true;
    }
    return customPermissions.includes(permission);
  }
  
  // Caso contrário, usar permissões baseadas no papel
  const rolePermissions = PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
};

// GET /api/usuarios/permissoes - Obter permissões do usuário atual
router.get('/permissoes', authenticate, async (req, res) => {
  try {
    const user = req.user;
    
    logger.info('Obtendo permissões do usuário', {
      userId: user.id,
      email: user.email,
      papel: user.papel
    });

    // Verificar se o usuário tem permissões customizadas
    let permissions;
    
    if (user.permissoes && Array.isArray(user.permissoes)) {
      // Se tem permissão 'all', retorna ['all'] para que o frontend reconheça
      if (user.permissoes.includes('all')) {
        permissions = ['all'];
      } else {
        // Usar permissões customizadas
        permissions = user.permissoes;
      }
    } else {
      // Usar permissões baseadas no papel
      permissions = PERMISSIONS[user.papel] || [];
    }

    // Para admin, sempre garantir que tem permissão 'all'
    if (user.papel === 'admin' && !permissions.includes('all')) {
      permissions = ['all'];
    }

    const response = {
      success: true,
      data: {
        permissoes: permissions,
        cargo: user.papel,
        usuario: {
          id: user.id,
          email: user.email,
          nome_estabelecimento: user.nome_estabelecimento,
          papel: user.papel,
          ativo: user.ativo
        }
      }
    };

    logger.info('Permissões retornadas com sucesso', {
      userId: user.id,
      permissions: permissions,
      papel: user.papel
    });

    res.json(response);
  } catch (error) {
    logger.error('Erro ao obter permissões do usuário', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/usuarios - Listar usuários (apenas admin)
router.get('/', authenticate, async (req, res) => {
  try {
    const user = req.user;
    
    // Verificar se tem permissão para ver todos os usuários
    if (!hasPermission(user.papel, 'view_all_users', user.permissoes)) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Permissão insuficiente.'
      });
    }

    const users = await User.findAll({
      attributes: { exclude: ['senha'] },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    logger.error('Erro ao listar usuários', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;