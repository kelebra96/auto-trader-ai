const { User, UserProfile, Permission, UserPermission } = require('../models');
const permissionService = require('../services/permissionService');
const logger = require('../utils/logger');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

// Listar usuários
const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, profile_id, active } = req.query;
  const offset = (page - 1) * limit;

  const whereClause = {};
  
  if (search) {
    whereClause[Op.or] = [
      { email: { [Op.like]: `%${search}%` } },
      { nome_estabelecimento: { [Op.like]: `%${search}%` } }
    ];
  }

  if (profile_id) {
    whereClause.profile_id = profile_id;
  }

  if (active !== undefined) {
    whereClause.ativo = active === 'true';
  }

  const { count, rows: users } = await User.findAndCountAll({
    where: whereClause,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: UserProfile,
        as: 'profile',
        attributes: ['id', 'name', 'description']
      }
    ],
    attributes: { exclude: ['senha'] }
  });

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    }
  });
});

// Obter usuário específico
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id, {
    include: [
      {
        model: UserProfile,
        as: 'profile',
        attributes: ['id', 'name', 'description']
      },
      {
        model: Permission,
        as: 'permissions',
        through: { 
          attributes: ['granted'],
          as: 'userPermission'
        }
      }
    ],
    attributes: { exclude: ['senha'] }
  });

  if (!user) {
    throw new AppError('Usuário não encontrado', 404);
  }

  // Obter todas as permissões do usuário (perfil + específicas)
  const userPermissions = await permissionService.getUserPermissions(user.id);

  res.json({
    success: true,
    data: {
      ...user.toJSON(),
      allPermissions: userPermissions
    }
  });
});

// Criar usuário
const createUser = asyncHandler(async (req, res) => {
  const { 
    email, 
    senha, 
    nome_estabelecimento, 
    papel, 
    profile_id,
    permissions = []
  } = req.body;

  if (!email || !senha || !nome_estabelecimento) {
    throw new AppError('Email, senha e nome do estabelecimento são obrigatórios', 400);
  }

  // Verificar se email já existe
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new AppError('Email já está em uso', 400);
  }

  // Verificar se o perfil existe
  if (profile_id) {
    const profile = await UserProfile.findByPk(profile_id);
    if (!profile) {
      throw new AppError('Perfil não encontrado', 404);
    }
  }

  // Hash da senha
  const hashedPassword = await bcrypt.hash(senha, 12);

  // Criar usuário
  const user = await User.create({
    email,
    senha: hashedPassword,
    nome_estabelecimento,
    papel: papel || 'usuario',
    profile_id: profile_id || null,
    ativo: true
  });

  // Adicionar permissões específicas se fornecidas
  if (permissions.length > 0) {
    const userPermissions = permissions.map(perm => ({
      user_id: user.id,
      permission_id: perm.permission_id,
      granted: perm.granted
    }));

    await UserPermission.bulkCreate(userPermissions);
  }

  logger.info('Usuário criado', {
    userId: user.id,
    email: user.email,
    createdBy: req.user.id
  });

  // Retornar usuário sem senha
  const newUser = await User.findByPk(user.id, {
    include: [
      {
        model: UserProfile,
        as: 'profile',
        attributes: ['id', 'name', 'description']
      }
    ],
    attributes: { exclude: ['senha'] }
  });

  res.status(201).json({
    success: true,
    data: newUser
  });
});

// Atualizar usuário
const updateUser = asyncHandler(async (req, res) => {
  const { 
    email, 
    nome_estabelecimento, 
    papel, 
    profile_id,
    ativo,
    permissions = []
  } = req.body;

  const user = await User.findByPk(req.params.id);
  if (!user) {
    throw new AppError('Usuário não encontrado', 404);
  }

  // Verificar se email já existe em outro usuário
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ 
      where: { 
        email, 
        id: { [Op.ne]: user.id } 
      } 
    });
    if (existingUser) {
      throw new AppError('Email já está em uso', 400);
    }
  }

  // Verificar se o perfil existe
  if (profile_id) {
    const profile = await UserProfile.findByPk(profile_id);
    if (!profile) {
      throw new AppError('Perfil não encontrado', 404);
    }
  }

  // Atualizar dados do usuário
  await user.update({
    email: email || user.email,
    nome_estabelecimento: nome_estabelecimento || user.nome_estabelecimento,
    papel: papel || user.papel,
    profile_id: profile_id !== undefined ? profile_id : user.profile_id,
    ativo: ativo !== undefined ? ativo : user.ativo
  });

  // Atualizar permissões específicas
  if (permissions.length > 0) {
    // Remover permissões existentes
    await UserPermission.destroy({ where: { user_id: user.id } });

    // Adicionar novas permissões
    const userPermissions = permissions.map(perm => ({
      user_id: user.id,
      permission_id: perm.permission_id,
      granted: perm.granted
    }));

    await UserPermission.bulkCreate(userPermissions);
  }

  logger.info('Usuário atualizado', {
    userId: user.id,
    email: user.email,
    updatedBy: req.user.id
  });

  // Retornar usuário atualizado
  const updatedUser = await User.findByPk(user.id, {
    include: [
      {
        model: UserProfile,
        as: 'profile',
        attributes: ['id', 'name', 'description']
      }
    ],
    attributes: { exclude: ['senha'] }
  });

  res.json({
    success: true,
    data: updatedUser
  });
});

// Excluir usuário
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) {
    throw new AppError('Usuário não encontrado', 404);
  }

  // Não permitir excluir o próprio usuário
  if (user.id === req.user.id) {
    throw new AppError('Não é possível excluir seu próprio usuário', 400);
  }

  // Remover permissões específicas do usuário
  await UserPermission.destroy({ where: { user_id: user.id } });

  // Excluir usuário
  await user.destroy();

  logger.info('Usuário excluído', {
    userId: user.id,
    email: user.email,
    deletedBy: req.user.id
  });

  res.json({
    success: true,
    message: 'Usuário excluído com sucesso'
  });
});

// Alterar senha do usuário
const changePassword = asyncHandler(async (req, res) => {
  const { senha } = req.body;

  if (!senha) {
    throw new AppError('Nova senha é obrigatória', 400);
  }

  if (senha.length < 6) {
    throw new AppError('A senha deve ter pelo menos 6 caracteres', 400);
  }

  const user = await User.findByPk(req.params.id);
  if (!user) {
    throw new AppError('Usuário não encontrado', 404);
  }

  // Hash da nova senha
  const hashedPassword = await bcrypt.hash(senha, 12);

  await user.update({ senha: hashedPassword });

  logger.info('Senha do usuário alterada', {
    userId: user.id,
    email: user.email,
    changedBy: req.user.id
  });

  res.json({
    success: true,
    message: 'Senha alterada com sucesso'
  });
});

// Obter permissões do usuário
const getUserPermissions = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) {
    throw new AppError('Usuário não encontrado', 404);
  }

  const permissions = await permissionService.getUserPermissions(user.id);

  res.json({
    success: true,
    data: permissions
  });
});

// Atribuir perfil ao usuário
const assignProfile = asyncHandler(async (req, res) => {
  const { profile_id } = req.body;

  const user = await User.findByPk(req.params.id);
  if (!user) {
    throw new AppError('Usuário não encontrado', 404);
  }

  if (profile_id) {
    const profile = await UserProfile.findByPk(profile_id);
    if (!profile) {
      throw new AppError('Perfil não encontrado', 404);
    }
  }

  await user.update({ profile_id });

  logger.info('Perfil atribuído ao usuário', {
    userId: user.id,
    profileId: profile_id,
    assignedBy: req.user.id
  });

  res.json({
    success: true,
    message: 'Perfil atribuído com sucesso'
  });
});

// Conceder/negar permissão específica ao usuário
const manageUserPermission = asyncHandler(async (req, res) => {
  const { permission_id, granted } = req.body;

  const user = await User.findByPk(req.params.id);
  if (!user) {
    throw new AppError('Usuário não encontrado', 404);
  }

  const permission = await Permission.findByPk(permission_id);
  if (!permission) {
    throw new AppError('Permissão não encontrada', 404);
  }

  await permissionService.grantUserPermission(user.id, permission_id, granted);

  logger.info('Permissão específica gerenciada', {
    userId: user.id,
    permissionId: permission_id,
    granted,
    managedBy: req.user.id
  });

  res.json({
    success: true,
    message: `Permissão ${granted ? 'concedida' : 'negada'} com sucesso`
  });
});

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  changePassword,
  getUserPermissions,
  assignProfile,
  manageUserPermission
};