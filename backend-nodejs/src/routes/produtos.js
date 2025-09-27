const express = require('express');
const router = express.Router();
const { Produto, Empresa, Fornecedor } = require('../models');
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

// Listar produtos
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, empresa_id, categoria, estoque_baixo } = req.query;
  const offset = (page - 1) * limit;

  const whereClause = {};
  
  if (search) {
    whereClause[Op.or] = [
      { nome: { [Op.like]: `%${search}%` } },
      { codigo_barras: { [Op.like]: `%${search}%` } },
      { categoria: { [Op.like]: `%${search}%` } }
    ];
  }

  if (empresa_id) {
    whereClause.empresa_id = empresa_id;
  }

  if (categoria) {
    whereClause.categoria = categoria;
  }

  if (estoque_baixo === 'true') {
    whereClause[Op.and] = [
      { estoque_atual: { [Op.lte]: { [Op.col]: 'estoque_minimo' } } }
    ];
  }

  const { count, rows: produtos } = await Produto.findAndCountAll({
    where: whereClause,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['nome', 'ASC']],
    include: [
      {
        model: Empresa,
        as: 'empresa',
        where: { usuario_id: req.user.id },
        attributes: ['id', 'nome']
      },
      {
        model: Fornecedor,
        as: 'fornecedor',
        attributes: ['id', 'nome', 'cnpj']
      }
    ]
  });

  res.json({
    produtos,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      pages: Math.ceil(count / limit)
    }
  });
}));

// Obter produto por ID
router.get('/:id', authenticate, validate(schemas.idParam), asyncHandler(async (req, res) => {
  const produto = await Produto.findOne({
    where: { id: req.params.id },
    include: [
      {
        model: Empresa,
        as: 'empresa',
        where: { usuario_id: req.user.id },
        attributes: ['id', 'nome']
      },
      {
        model: Fornecedor,
        as: 'fornecedor',
        attributes: ['id', 'nome', 'cnpj', 'telefone', 'email']
      }
    ]
  });

  if (!produto) {
    return res.status(404).json({ error: 'Produto não encontrado' });
  }

  res.json(produto);
}));

// Criar novo produto
router.post('/', authenticate, validate(schemas.createProduto), asyncHandler(async (req, res) => {
  // Verificar se a empresa pertence ao usuário
  const empresa = await Empresa.findOne({
    where: { 
      id: req.body.empresa_id,
      usuario_id: req.user.id
    }
  });

  if (!empresa) {
    return res.status(404).json({ error: 'Empresa não encontrada' });
  }

  // Verificar se o fornecedor pertence à empresa
  if (req.body.fornecedor_id) {
    const fornecedor = await Fornecedor.findOne({
      where: { 
        id: req.body.fornecedor_id,
        empresa_id: req.body.empresa_id
      }
    });

    if (!fornecedor) {
      return res.status(404).json({ error: 'Fornecedor não encontrado para esta empresa' });
    }
  }

  const produto = await Produto.create(req.body);
  
  const produtoCompleto = await Produto.findByPk(produto.id, {
    include: [
      {
        model: Empresa,
        as: 'empresa',
        attributes: ['id', 'nome']
      },
      {
        model: Fornecedor,
        as: 'fornecedor',
        attributes: ['id', 'nome', 'cnpj']
      }
    ]
  });

  logger.business('Produto criado', { 
    produtoId: produto.id, 
    empresaId: req.body.empresa_id,
    usuarioId: req.user.id,
    nome: produto.nome 
  });

  res.status(201).json(produtoCompleto);
}));

// Atualizar produto
router.put('/:id', authenticate, validate(schemas.idParam), validate(schemas.updateProduto), asyncHandler(async (req, res) => {
  const produto = await Produto.findOne({
    where: { id: req.params.id },
    include: [{
      model: Empresa,
      as: 'empresa',
      where: { usuario_id: req.user.id }
    }]
  });

  if (!produto) {
    return res.status(404).json({ error: 'Produto não encontrado' });
  }

  // Se está mudando o fornecedor, verificar se pertence à empresa
  if (req.body.fornecedor_id && req.body.fornecedor_id !== produto.fornecedor_id) {
    const fornecedor = await Fornecedor.findOne({
      where: { 
        id: req.body.fornecedor_id,
        empresa_id: produto.empresa_id
      }
    });

    if (!fornecedor) {
      return res.status(404).json({ error: 'Fornecedor não encontrado para esta empresa' });
    }
  }

  await produto.update(req.body);
  
  const produtoAtualizado = await Produto.findByPk(produto.id, {
    include: [
      {
        model: Empresa,
        as: 'empresa',
        attributes: ['id', 'nome']
      },
      {
        model: Fornecedor,
        as: 'fornecedor',
        attributes: ['id', 'nome', 'cnpj']
      }
    ]
  });

  logger.business('Produto atualizado', { 
    produtoId: produto.id, 
    usuarioId: req.user.id 
  });

  res.json(produtoAtualizado);
}));

// Deletar produto
router.delete('/:id', authenticate, validate(schemas.idParam), asyncHandler(async (req, res) => {
  const produto = await Produto.findOne({
    where: { id: req.params.id },
    include: [{
      model: Empresa,
      as: 'empresa',
      where: { usuario_id: req.user.id }
    }]
  });

  if (!produto) {
    return res.status(404).json({ error: 'Produto não encontrado' });
  }

  await produto.destroy();

  logger.business('Produto deletado', { 
    produtoId: produto.id, 
    usuarioId: req.user.id 
  });

  res.status(204).send();
}));

// Ativar/Desativar produto
router.patch('/:id/toggle-status', authenticate, validate(schemas.idParam), asyncHandler(async (req, res) => {
  const produto = await Produto.findOne({
    where: { id: req.params.id },
    include: [{
      model: Empresa,
      as: 'empresa',
      where: { usuario_id: req.user.id }
    }]
  });

  if (!produto) {
    return res.status(404).json({ error: 'Produto não encontrado' });
  }

  await produto.update({ ativo: !produto.ativo });

  logger.business('Status do produto alterado', { 
    produtoId: produto.id, 
    usuarioId: req.user.id,
    novoStatus: produto.ativo
  });

  res.json({ message: `Produto ${produto.ativo ? 'ativado' : 'desativado'} com sucesso` });
}));

// Atualizar estoque
router.patch('/:id/estoque', authenticate, validate(schemas.idParam), asyncHandler(async (req, res) => {
  const { quantidade, operacao } = req.body;

  if (!quantidade || !operacao || !['adicionar', 'remover', 'definir'].includes(operacao)) {
    return res.status(400).json({ 
      error: 'Quantidade e operação (adicionar, remover, definir) são obrigatórias' 
    });
  }

  const produto = await Produto.findOne({
    where: { id: req.params.id },
    include: [{
      model: Empresa,
      as: 'empresa',
      where: { usuario_id: req.user.id }
    }]
  });

  if (!produto) {
    return res.status(404).json({ error: 'Produto não encontrado' });
  }

  let novoEstoque;
  switch (operacao) {
    case 'adicionar':
      novoEstoque = produto.estoque_atual + parseInt(quantidade);
      break;
    case 'remover':
      novoEstoque = produto.estoque_atual - parseInt(quantidade);
      break;
    case 'definir':
      novoEstoque = parseInt(quantidade);
      break;
  }

  if (novoEstoque < 0) {
    return res.status(400).json({ error: 'Estoque não pode ser negativo' });
  }

  await produto.update({ estoque_atual: novoEstoque });

  logger.business('Estoque atualizado', { 
    produtoId: produto.id, 
    usuarioId: req.user.id,
    operacao,
    quantidade,
    estoqueAnterior: produto.estoque_atual,
    novoEstoque
  });

  res.json({ 
    message: 'Estoque atualizado com sucesso',
    estoque_anterior: produto.estoque_atual,
    novo_estoque: novoEstoque
  });
}));

// Listar produtos com estoque baixo
router.get('/estoque-baixo', authenticate, asyncHandler(async (req, res) => {
  const { empresa_id } = req.query;

  const whereClause = {
    [Op.and]: [
      { estoque_atual: { [Op.lte]: { [Op.col]: 'estoque_minimo' } } }
    ]
  };

  if (empresa_id) {
    whereClause.empresa_id = empresa_id;
  }

  const produtos = await Produto.findAll({
    where: whereClause,
    include: [
      {
        model: Empresa,
        as: 'empresa',
        where: { usuario_id: req.user.id },
        attributes: ['id', 'nome']
      },
      {
        model: Fornecedor,
        as: 'fornecedor',
        attributes: ['id', 'nome']
      }
    ],
    order: [['estoque_atual', 'ASC']]
  });

  res.json(produtos);
}));

module.exports = router;