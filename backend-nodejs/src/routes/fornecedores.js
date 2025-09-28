const express = require("express");
const router = express.Router();
const { Fornecedor, Empresa } = require("../models");
const { authenticate, requirePermission } = require("../middleware/auth");
const { validate, schemas } = require("../middleware/validation");
const { asyncHandler } = require("../middleware/errorHandler");
const logger = require("../utils/logger");
const { Op } = require("sequelize");

// Listar fornecedores
router.get(
  "/",
  authenticate,
  requirePermission("suppliers_view"),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search, empresa_id } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};

    if (search) {
      whereClause[Op.or] = [
        { nome: { [Op.like]: `%${search}%` } },
        { cnpj: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    if (empresa_id) {
      whereClause.empresa_id = empresa_id;
    }

    const { count, rows: fornecedores } = await Fornecedor.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["nome", "ASC"]],
      include: [
        {
          model: Empresa,
          as: "empresa",
          where: { usuario_id: req.user.id },
          attributes: ["id", "nome", "cnpj"],
        },
      ],
    });

    res.json({
      fornecedores,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    });
  })
);

// Obter fornecedor por ID
router.get(
  "/:id",
  authenticate,
  validate(schemas.idParam, "params"),
  asyncHandler(async (req, res) => {
    const fornecedor = await Fornecedor.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: Empresa,
          as: "empresa",
          where: { usuario_id: req.user.id },
          attributes: ["id", "nome", "cnpj"],
        },
      ],
    });

    if (!fornecedor) {
      return res.status(404).json({ error: "Fornecedor não encontrado" });
    }

    res.json(fornecedor);
  })
);

// Criar novo fornecedor
router.post(
  "/",
  authenticate,
  validate(schemas.createFornecedor),
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

    const fornecedor = await Fornecedor.create(req.body);

    const fornecedorCompleto = await Fornecedor.findByPk(fornecedor.id, {
      include: [
        {
          model: Empresa,
          as: "empresa",
          attributes: ["id", "nome", "cnpj"],
        },
      ],
    });

    logger.business("Fornecedor criado", {
      fornecedorId: fornecedor.id,
      empresaId: req.body.empresa_id,
      usuarioId: req.user.id,
      nome: fornecedor.nome,
    });

    res.status(201).json(fornecedorCompleto);
  })
);

// Atualizar fornecedor
router.put(
  "/:id",
  authenticate,
  validate(schemas.idParam, "params"),
  validate(schemas.updateFornecedor),
  asyncHandler(async (req, res) => {
    const fornecedor = await Fornecedor.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: Empresa,
          as: "empresa",
          where: { usuario_id: req.user.id },
        },
      ],
    });

    if (!fornecedor) {
      return res.status(404).json({ error: "Fornecedor não encontrado" });
    }

    // Se está mudando a empresa, verificar se a nova empresa pertence ao usuário
    if (req.body.empresa_id && req.body.empresa_id !== fornecedor.empresa_id) {
      const novaEmpresa = await Empresa.findOne({
        where: {
          id: req.body.empresa_id,
          usuario_id: req.user.id,
        },
      });

      if (!novaEmpresa) {
        return res.status(404).json({ error: "Nova empresa não encontrada" });
      }
    }

    await fornecedor.update(req.body);

    const fornecedorAtualizado = await Fornecedor.findByPk(fornecedor.id, {
      include: [
        {
          model: Empresa,
          as: "empresa",
          attributes: ["id", "nome", "cnpj"],
        },
      ],
    });

    logger.business("Fornecedor atualizado", {
      fornecedorId: fornecedor.id,
      usuarioId: req.user.id,
    });

    res.json(fornecedorAtualizado);
  })
);

// Deletar fornecedor
router.delete(
  "/:id",
  authenticate,
  validate(schemas.idParam, "params"),
  asyncHandler(async (req, res) => {
    const fornecedor = await Fornecedor.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: Empresa,
          as: "empresa",
          where: { usuario_id: req.user.id },
        },
      ],
    });

    if (!fornecedor) {
      return res.status(404).json({ error: "Fornecedor não encontrado" });
    }

    await fornecedor.destroy();

    logger.business("Fornecedor deletado", {
      fornecedorId: fornecedor.id,
      usuarioId: req.user.id,
    });

    res.status(204).send();
  })
);

// Ativar/Desativar fornecedor
router.patch(
  "/:id/toggle-status",
  authenticate,
  validate(schemas.idParam, "params"),
  asyncHandler(async (req, res) => {
    const fornecedor = await Fornecedor.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: Empresa,
          as: "empresa",
          where: { usuario_id: req.user.id },
        },
      ],
    });

    if (!fornecedor) {
      return res.status(404).json({ error: "Fornecedor não encontrado" });
    }

    await fornecedor.update({ ativo: !fornecedor.ativo });

    logger.business("Status do fornecedor alterado", {
      fornecedorId: fornecedor.id,
      usuarioId: req.user.id,
      novoStatus: fornecedor.ativo,
    });

    res.json({
      message: `Fornecedor ${
        fornecedor.ativo ? "ativado" : "desativado"
      } com sucesso`,
    });
  })
);

module.exports = router;
