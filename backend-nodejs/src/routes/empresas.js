const express = require('express');
const router = express.Router();
const { Empresa, User } = require('../models');
const { authenticate, authorize, requirePermission } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

// Listar empresas do usuário
router.get('/', authenticate, requirePermission('companies_view'), asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search } = req.query;
  const offset = (page - 1) * limit;

  const whereClause = { usuario_id: req.user.id };
  
  if (search) {
    whereClause[Op.or] = [
      { nome: { [Op.like]: `%${search}%` } },
      { cnpj: { [Op.like]: `%${search}%` } }
    ];
  }

  const { count, rows: empresas } = await Empresa.findAndCountAll({
    where: whereClause,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['nome', 'ASC']],
    include: [{
      model: User,
      as: 'usuario',
      attributes: ['id', 'email', 'nome_estabelecimento']
    }]
  });

  res.json({
    empresas,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      pages: Math.ceil(count / limit)
    }
  });
}));

// Obter empresa por ID
router.get('/:id', authenticate, validate(schemas.idParam), asyncHandler(async (req, res) => {
  const empresa = await Empresa.findOne({
    where: { 
      id: req.params.id,
      usuario_id: req.user.id
    },
    include: [{
      model: User,
      as: 'usuario',
      attributes: ['id', 'email', 'nome_estabelecimento']
    }]
  });

  if (!empresa) {
    return res.status(404).json({ error: 'Empresa não encontrada' });
  }

  res.json(empresa);
}));

// Criar nova empresa
router.post('/', authenticate, validate(schemas.createEmpresa), asyncHandler(async (req, res) => {
  const empresaData = {
    ...req.body,
    usuario_id: req.user.id
  };

  const empresa = await Empresa.create(empresaData);
  
  const empresaCompleta = await Empresa.findByPk(empresa.id, {
    include: [{
      model: User,
      as: 'usuario',
      attributes: ['id', 'email', 'nome_estabelecimento']
    }]
  });

  logger.business('Empresa criada', { 
    empresaId: empresa.id, 
    usuarioId: req.user.id,
    nome: empresa.nome 
  });

  res.status(201).json(empresaCompleta);
}));

// Atualizar empresa
router.put('/:id', authenticate, validate(schemas.idParam), validate(schemas.updateEmpresa), asyncHandler(async (req, res) => {
  const empresa = await Empresa.findOne({
    where: { 
      id: req.params.id,
      usuario_id: req.user.id
    }
  });

  if (!empresa) {
    return res.status(404).json({ error: 'Empresa não encontrada' });
  }

  await empresa.update(req.body);
  
  const empresaAtualizada = await Empresa.findByPk(empresa.id, {
    include: [{
      model: User,
      as: 'usuario',
      attributes: ['id', 'email', 'nome_estabelecimento']
    }]
  });

  logger.business('Empresa atualizada', { 
    empresaId: empresa.id, 
    usuarioId: req.user.id 
  });

  res.json(empresaAtualizada);
}));

// Deletar empresa
router.delete('/:id', authenticate, validate(schemas.idParam), asyncHandler(async (req, res) => {
  const empresa = await Empresa.findOne({
    where: { 
      id: req.params.id,
      usuario_id: req.user.id
    }
  });

  if (!empresa) {
    return res.status(404).json({ error: 'Empresa não encontrada' });
  }

  await empresa.destroy();

  logger.business('Empresa deletada', { 
    empresaId: empresa.id, 
    usuarioId: req.user.id 
  });

  res.status(204).send();
}));

// Ativar/Desativar empresa
router.patch('/:id/toggle-status', authenticate, validate(schemas.idParam), asyncHandler(async (req, res) => {
  const empresa = await Empresa.findOne({
    where: { 
      id: req.params.id,
      usuario_id: req.user.id
    }
  });

  if (!empresa) {
    return res.status(404).json({ error: 'Empresa não encontrada' });
  }

  await empresa.update({ ativa: !empresa.ativa });

  logger.business('Status da empresa alterado', { 
    empresaId: empresa.id, 
    usuarioId: req.user.id,
    novoStatus: empresa.ativa
  });

  res.json({ message: `Empresa ${empresa.ativa ? 'ativada' : 'desativada'} com sucesso` });
}));

module.exports = router;