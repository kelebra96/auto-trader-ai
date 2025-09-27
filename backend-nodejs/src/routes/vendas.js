const express = require('express');
const router = express.Router();
const { Venda, Produto, Empresa } = require('../models');
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

// Listar vendas
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, empresa_id, produto_id, data_inicio, data_fim } = req.query;
  const offset = (page - 1) * limit;

  const whereClause = {};
  
  if (empresa_id) {
    whereClause.empresa_id = empresa_id;
  }

  if (produto_id) {
    whereClause.produto_id = produto_id;
  }

  if (data_inicio && data_fim) {
    whereClause.data_venda = {
      [Op.between]: [new Date(data_inicio), new Date(data_fim)]
    };
  }

  const { count, rows: vendas } = await Venda.findAndCountAll({
    where: whereClause,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['data_venda', 'DESC']],
    include: [
      {
        model: Produto,
        as: 'produto',
        attributes: ['id', 'nome', 'codigo_barras', 'categoria', 'preco']
      },
      {
        model: Empresa,
        as: 'empresa',
        where: { usuario_id: req.user.id },
        attributes: ['id', 'nome']
      }
    ]
  });

  res.json({
    vendas,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      pages: Math.ceil(count / limit)
    }
  });
}));

// Obter venda por ID
router.get('/:id', authenticate, validate(schemas.idParam), asyncHandler(async (req, res) => {
  const venda = await Venda.findOne({
    where: { id: req.params.id },
    include: [
      {
        model: Produto,
        as: 'produto',
        attributes: ['id', 'nome', 'codigo_barras', 'categoria', 'preco']
      },
      {
        model: Empresa,
        as: 'empresa',
        where: { usuario_id: req.user.id },
        attributes: ['id', 'nome']
      }
    ]
  });

  if (!venda) {
    return res.status(404).json({ error: 'Venda não encontrada' });
  }

  res.json(venda);
}));

// Registrar nova venda
router.post('/', authenticate, validate(schemas.createVenda), asyncHandler(async (req, res) => {
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

  // Verificar se o produto pertence à empresa e tem estoque suficiente
  const produto = await Produto.findOne({
    where: { 
      id: req.body.produto_id,
      empresa_id: req.body.empresa_id
    }
  });

  if (!produto) {
    return res.status(404).json({ error: 'Produto não encontrado para esta empresa' });
  }

  if (produto.estoque_atual < req.body.quantidade) {
    return res.status(400).json({ 
      error: 'Estoque insuficiente',
      estoque_disponivel: produto.estoque_atual,
      quantidade_solicitada: req.body.quantidade
    });
  }

  // Criar a venda
  const venda = await Venda.create(req.body);
  
  // Atualizar o estoque do produto
  await produto.update({
    estoque_atual: produto.estoque_atual - req.body.quantidade
  });

  const vendaCompleta = await Venda.findByPk(venda.id, {
    include: [
      {
        model: Produto,
        as: 'produto',
        attributes: ['id', 'nome', 'codigo_barras', 'categoria', 'preco']
      },
      {
        model: Empresa,
        as: 'empresa',
        attributes: ['id', 'nome']
      }
    ]
  });

  logger.business('Venda registrada', { 
    vendaId: venda.id, 
    produtoId: req.body.produto_id,
    empresaId: req.body.empresa_id,
    usuarioId: req.user.id,
    quantidade: venda.quantidade,
    valor: venda.preco_total
  });

  res.status(201).json(vendaCompleta);
}));

// Atualizar venda
router.put('/:id', authenticate, validate(schemas.idParam), validate(schemas.updateVenda), asyncHandler(async (req, res) => {
  const venda = await Venda.findOne({
    where: { id: req.params.id },
    include: [
      {
        model: Produto,
        as: 'produto'
      },
      {
        model: Empresa,
        as: 'empresa',
        where: { usuario_id: req.user.id }
      }
    ]
  });

  if (!venda) {
    return res.status(404).json({ error: 'Venda não encontrada' });
  }

  // Se está mudando a quantidade, ajustar o estoque
  if (req.body.quantidade && req.body.quantidade !== venda.quantidade) {
    const diferenca = req.body.quantidade - venda.quantidade;
    
    if (diferenca > 0) {
      // Aumentou a quantidade vendida, verificar se há estoque
      if (venda.produto.estoque_atual < diferenca) {
        return res.status(400).json({ 
          error: 'Estoque insuficiente para o aumento da quantidade',
          estoque_disponivel: venda.produto.estoque_atual,
          diferenca_solicitada: diferenca
        });
      }
      
      // Diminuir estoque
      await venda.produto.update({
        estoque_atual: venda.produto.estoque_atual - diferenca
      });
    } else {
      // Diminuiu a quantidade vendida, devolver ao estoque
      await venda.produto.update({
        estoque_atual: venda.produto.estoque_atual - diferenca // diferenca é negativa
      });
    }
  }

  await venda.update(req.body);
  
  const vendaAtualizada = await Venda.findByPk(venda.id, {
    include: [
      {
        model: Produto,
        as: 'produto',
        attributes: ['id', 'nome', 'codigo_barras', 'categoria', 'preco']
      },
      {
        model: Empresa,
        as: 'empresa',
        attributes: ['id', 'nome']
      }
    ]
  });

  logger.business('Venda atualizada', { 
    vendaId: venda.id, 
    usuarioId: req.user.id 
  });

  res.json(vendaAtualizada);
}));

// Deletar venda
router.delete('/:id', authenticate, validate(schemas.idParam), asyncHandler(async (req, res) => {
  const venda = await Venda.findOne({
    where: { id: req.params.id },
    include: [
      {
        model: Produto,
        as: 'produto'
      },
      {
        model: Empresa,
        as: 'empresa',
        where: { usuario_id: req.user.id }
      }
    ]
  });

  if (!venda) {
    return res.status(404).json({ error: 'Venda não encontrada' });
  }

  // Devolver a quantidade ao estoque
  await venda.produto.update({
    estoque_atual: venda.produto.estoque_atual + venda.quantidade
  });

  await venda.destroy();

  logger.business('Venda deletada', { 
    vendaId: venda.id, 
    usuarioId: req.user.id,
    quantidadeDevolvida: venda.quantidade
  });

  res.status(204).send();
}));

// Relatório de vendas por período
router.get('/relatorio/periodo', authenticate, asyncHandler(async (req, res) => {
  const { data_inicio, data_fim, empresa_id } = req.query;

  if (!data_inicio || !data_fim) {
    return res.status(400).json({ error: 'Data de início e fim são obrigatórias' });
  }

  const whereClause = {
    data_venda: {
      [Op.between]: [new Date(data_inicio), new Date(data_fim)]
    }
  };

  if (empresa_id) {
    whereClause.empresa_id = empresa_id;
  }

  const vendas = await Venda.findAll({
    where: whereClause,
    include: [
      {
        model: Produto,
        as: 'produto',
        attributes: ['id', 'nome', 'categoria']
      },
      {
        model: Empresa,
        as: 'empresa',
        where: { usuario_id: req.user.id },
        attributes: ['id', 'nome']
      }
    ],
    order: [['data_venda', 'DESC']]
  });

  // Calcular totais
  const totalVendas = vendas.length;
  const valorTotal = vendas.reduce((sum, venda) => sum + parseFloat(venda.preco_total), 0);
  const quantidadeTotal = vendas.reduce((sum, venda) => sum + venda.quantidade, 0);

  // Agrupar por categoria
  const vendasPorCategoria = vendas.reduce((acc, venda) => {
    const categoria = venda.produto.categoria || 'Sem categoria';
    if (!acc[categoria]) {
      acc[categoria] = {
        quantidade: 0,
        valor: 0,
        vendas: 0
      };
    }
    acc[categoria].quantidade += venda.quantidade;
    acc[categoria].valor += parseFloat(venda.preco_total);
    acc[categoria].vendas += 1;
    return acc;
  }, {});

  res.json({
    periodo: {
      data_inicio,
      data_fim
    },
    resumo: {
      total_vendas: totalVendas,
      valor_total: valorTotal,
      quantidade_total: quantidadeTotal,
      ticket_medio: totalVendas > 0 ? valorTotal / totalVendas : 0
    },
    vendas_por_categoria: vendasPorCategoria,
    vendas
  });
}));

// Top produtos mais vendidos
router.get('/relatorio/top-produtos', authenticate, asyncHandler(async (req, res) => {
  const { limite = 10, data_inicio, data_fim, empresa_id } = req.query;

  const whereClause = {};

  if (data_inicio && data_fim) {
    whereClause.data_venda = {
      [Op.between]: [new Date(data_inicio), new Date(data_fim)]
    };
  }

  if (empresa_id) {
    whereClause.empresa_id = empresa_id;
  }

  const topProdutos = await Venda.findAll({
    where: whereClause,
    attributes: [
      'produto_id',
      [sequelize.fn('SUM', sequelize.col('quantidade')), 'total_quantidade'],
      [sequelize.fn('SUM', sequelize.col('preco_total')), 'total_valor'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'total_vendas']
    ],
    include: [
      {
        model: Produto,
        as: 'produto',
        attributes: ['id', 'nome', 'categoria', 'preco']
      },
      {
        model: Empresa,
        as: 'empresa',
        where: { usuario_id: req.user.id },
        attributes: []
      }
    ],
    group: ['produto_id', 'produto.id'],
    order: [[sequelize.fn('SUM', sequelize.col('quantidade')), 'DESC']],
    limit: parseInt(limite)
  });

  res.json(topProdutos);
}));

module.exports = router;