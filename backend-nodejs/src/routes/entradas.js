const express = require("express");
const router = express.Router();
const { EntradaProduto, Produto, Empresa, Fornecedor } = require("../models");
const { authenticate } = require("../middleware/auth");
const { validate, schemas } = require("../middleware/validation");
const { asyncHandler } = require("../middleware/errorHandler");
const logger = require("../utils/logger");
const { Op } = require("sequelize");

// Listar entradas de produtos
router.get(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      empresa_id,
      produto_id,
      fornecedor_id,
      data_inicio,
      data_fim,
    } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};

    if (empresa_id) {
      whereClause.empresa_id = empresa_id;
    }

    if (produto_id) {
      whereClause.produto_id = produto_id;
    }

    if (fornecedor_id) {
      whereClause.fornecedor_id = fornecedor_id;
    }

    if (data_inicio && data_fim) {
      whereClause.data_entrada = {
        [Op.between]: [new Date(data_inicio), new Date(data_fim)],
      };
    }

    const { count, rows: entradas } = await EntradaProduto.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["data_entrada", "DESC"]],
      include: [
        {
          model: Produto,
          as: "produto",
          attributes: ["id", "nome", "codigo_barras", "categoria"],
        },
        {
          model: Fornecedor,
          as: "fornecedor",
          attributes: ["id", "nome", "cnpj"],
        },
        {
          model: Empresa,
          as: "empresa",
          where: { usuario_id: req.user.id },
          attributes: ["id", "nome"],
        },
      ],
    });

    res.json({
      entradas,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    });
  })
);

// Obter entrada por ID
router.get(
  "/:id",
  authenticate,
  validate(schemas.idParam, "params"),
  asyncHandler(async (req, res) => {
    const entrada = await EntradaProduto.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: Produto,
          as: "produto",
          attributes: ["id", "nome", "codigo_barras", "categoria", "preco"],
        },
        {
          model: Fornecedor,
          as: "fornecedor",
          attributes: ["id", "nome", "cnpj", "telefone", "email"],
        },
        {
          model: Empresa,
          as: "empresa",
          where: { usuario_id: req.user.id },
          attributes: ["id", "nome"],
        },
      ],
    });

    if (!entrada) {
      return res.status(404).json({ error: "Entrada não encontrada" });
    }

    res.json(entrada);
  })
);

// Registrar nova entrada de produto
router.post(
  "/",
  authenticate,
  validate(schemas.createEntrada),
  asyncHandler(async (req, res) => {
    // Verificar se a empresa pertence ao usuário
    const empresa = await Empresa.findOne({
      where: {
        id: req.body.empresa_id,
        usuario_id: req.user.id,
      },
    });

    if (!empresa) {
      return res.status(404).json({ error: "Empresa não encontrada" });
    }

    // Verificar se o produto pertence à empresa
    const produto = await Produto.findOne({
      where: {
        id: req.body.produto_id,
        empresa_id: req.body.empresa_id,
      },
    });

    if (!produto) {
      return res
        .status(404)
        .json({ error: "Produto não encontrado para esta empresa" });
    }

    // Verificar se o fornecedor pertence à empresa
    const fornecedor = await Fornecedor.findOne({
      where: {
        id: req.body.fornecedor_id,
        empresa_id: req.body.empresa_id,
      },
    });

    if (!fornecedor) {
      return res
        .status(404)
        .json({ error: "Fornecedor não encontrado para esta empresa" });
    }

    const entrada = await EntradaProduto.create(req.body);

    const entradaCompleta = await EntradaProduto.findByPk(entrada.id, {
      include: [
        {
          model: Produto,
          as: "produto",
          attributes: ["id", "nome", "codigo_barras", "categoria"],
        },
        {
          model: Fornecedor,
          as: "fornecedor",
          attributes: ["id", "nome", "cnpj"],
        },
        {
          model: Empresa,
          as: "empresa",
          attributes: ["id", "nome"],
        },
      ],
    });

    logger.business("Entrada de produto registrada", {
      entradaId: entrada.id,
      produtoId: req.body.produto_id,
      empresaId: req.body.empresa_id,
      usuarioId: req.user.id,
      quantidade: entrada.quantidade,
    });

    res.status(201).json(entradaCompleta);
  })
);

// Atualizar entrada
router.put(
  "/:id",
  authenticate,
  validate(schemas.idParam, "params"),
  validate(schemas.updateEntrada),
  asyncHandler(async (req, res) => {
    const entrada = await EntradaProduto.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: Empresa,
          as: "empresa",
          where: { usuario_id: req.user.id },
        },
      ],
    });

    if (!entrada) {
      return res.status(404).json({ error: "Entrada não encontrada" });
    }

    // Se está mudando produto ou fornecedor, verificar se pertencem à empresa
    if (req.body.produto_id && req.body.produto_id !== entrada.produto_id) {
      const produto = await Produto.findOne({
        where: {
          id: req.body.produto_id,
          empresa_id: entrada.empresa_id,
        },
      });

      if (!produto) {
        return res
          .status(404)
          .json({ error: "Produto não encontrado para esta empresa" });
      }
    }

    if (
      req.body.fornecedor_id &&
      req.body.fornecedor_id !== entrada.fornecedor_id
    ) {
      const fornecedor = await Fornecedor.findOne({
        where: {
          id: req.body.fornecedor_id,
          empresa_id: entrada.empresa_id,
        },
      });

      if (!fornecedor) {
        return res
          .status(404)
          .json({ error: "Fornecedor não encontrado para esta empresa" });
      }
    }

    await entrada.update(req.body);

    const entradaAtualizada = await EntradaProduto.findByPk(entrada.id, {
      include: [
        {
          model: Produto,
          as: "produto",
          attributes: ["id", "nome", "codigo_barras", "categoria"],
        },
        {
          model: Fornecedor,
          as: "fornecedor",
          attributes: ["id", "nome", "cnpj"],
        },
        {
          model: Empresa,
          as: "empresa",
          attributes: ["id", "nome"],
        },
      ],
    });

    logger.business("Entrada atualizada", {
      entradaId: entrada.id,
      usuarioId: req.user.id,
    });

    res.json(entradaAtualizada);
  })
);

// Deletar entrada
router.delete(
  "/:id",
  authenticate,
  validate(schemas.idParam, "params"),
  asyncHandler(async (req, res) => {
    const entrada = await EntradaProduto.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: Empresa,
          as: "empresa",
          where: { usuario_id: req.user.id },
        },
      ],
    });

    if (!entrada) {
      return res.status(404).json({ error: "Entrada não encontrada" });
    }

    await entrada.destroy();

    logger.business("Entrada deletada", {
      entradaId: entrada.id,
      usuarioId: req.user.id,
    });

    res.status(204).send();
  })
);

// Listar produtos próximos ao vencimento
router.get(
  "/vencimento/proximos",
  authenticate,
  asyncHandler(async (req, res) => {
    const { dias = 30, empresa_id } = req.query;
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() + parseInt(dias));

    const whereClause = {
      data_validade: {
        [Op.between]: [new Date(), dataLimite],
      },
    };

    if (empresa_id) {
      whereClause.empresa_id = empresa_id;
    }

    const entradas = await EntradaProduto.findAll({
      where: whereClause,
      include: [
        {
          model: Produto,
          as: "produto",
          attributes: ["id", "nome", "codigo_barras", "categoria"],
        },
        {
          model: Fornecedor,
          as: "fornecedor",
          attributes: ["id", "nome"],
        },
        {
          model: Empresa,
          as: "empresa",
          where: { usuario_id: req.user.id },
          attributes: ["id", "nome"],
        },
      ],
      order: [["data_validade", "ASC"]],
    });

    res.json(entradas);
  })
);

// Listar produtos vencidos
router.get(
  "/vencimento/vencidos",
  authenticate,
  asyncHandler(async (req, res) => {
    const { empresa_id } = req.query;

    const whereClause = {
      data_validade: {
        [Op.lt]: new Date(),
      },
    };

    if (empresa_id) {
      whereClause.empresa_id = empresa_id;
    }

    const entradas = await EntradaProduto.findAll({
      where: whereClause,
      include: [
        {
          model: Produto,
          as: "produto",
          attributes: ["id", "nome", "codigo_barras", "categoria"],
        },
        {
          model: Fornecedor,
          as: "fornecedor",
          attributes: ["id", "nome"],
        },
        {
          model: Empresa,
          as: "empresa",
          where: { usuario_id: req.user.id },
          attributes: ["id", "nome"],
        },
      ],
      order: [["data_validade", "DESC"]],
    });

    res.json(entradas);
  })
);

module.exports = router;
