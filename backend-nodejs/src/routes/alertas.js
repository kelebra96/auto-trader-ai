const express = require("express");
const router = express.Router();
const { Alerta, Produto, User, Empresa, EntradaProduto } = require("../models");
const { authenticate, requirePermission } = require("../middleware/auth");
const { validate, schemas } = require("../middleware/validation");
const { asyncHandler } = require("../middleware/errorHandler");
const logger = require("../utils/logger");
const { Op } = require("sequelize");

// Listar alertas do usuário
router.get(
  "/",
  authenticate,
  requirePermission("alerts_view"),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, tipo, lido } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { usuario_id: req.user.id };

    if (tipo) {
      whereClause.tipo = tipo;
    }

    if (lido !== undefined) {
      whereClause.lido = lido === "true";
    }

    const { count, rows: alertas } = await Alerta.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: Produto,
          as: "produto",
          attributes: [
            "id",
            "nome",
            "codigo_barras",
            "estoque_atual",
            "estoque_minimo",
          ],
          required: false,
        },
      ],
    });

    res.json({
      alertas,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    });
  })
);

// Obter alerta por ID
router.get(
  "/:id",
  authenticate,
  validate(schemas.idParam, "params"),
  asyncHandler(async (req, res) => {
    const alerta = await Alerta.findOne({
      where: {
        id: req.params.id,
        usuario_id: req.user.id,
      },
      include: [
        {
          model: Produto,
          as: "produto",
          attributes: [
            "id",
            "nome",
            "codigo_barras",
            "estoque_atual",
            "estoque_minimo",
          ],
          required: false,
        },
      ],
    });

    if (!alerta) {
      return res.status(404).json({ error: "Alerta não encontrado" });
    }

    res.json(alerta);
  })
);

// Criar novo alerta
router.post(
  "/",
  authenticate,
  validate(schemas.createAlerta),
  asyncHandler(async (req, res) => {
    const alertaData = {
      ...req.body,
      usuario_id: req.user.id,
    };

    // Se tem produto_id, verificar se o produto existe e pertence ao usuário
    if (req.body.produto_id) {
      const produto = await Produto.findOne({
        where: { id: req.body.produto_id },
        include: [
          {
            model: Empresa,
            as: "empresa",
            where: { usuario_id: req.user.id },
          },
        ],
      });

      if (!produto) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }
    }

    const alerta = await Alerta.create(alertaData);

    const alertaCompleto = await Alerta.findByPk(alerta.id, {
      include: [
        {
          model: Produto,
          as: "produto",
          attributes: ["id", "nome", "codigo_barras"],
          required: false,
        },
      ],
    });

    logger.business("Alerta criado", {
      alertaId: alerta.id,
      usuarioId: req.user.id,
      tipo: alerta.tipo,
    });

    res.status(201).json(alertaCompleto);
  })
);

// Marcar alerta como lido
router.patch(
  "/:id/marcar-lido",
  authenticate,
  validate(schemas.idParam, "params"),
  asyncHandler(async (req, res) => {
    const alerta = await Alerta.findOne({
      where: {
        id: req.params.id,
        usuario_id: req.user.id,
      },
    });

    if (!alerta) {
      return res.status(404).json({ error: "Alerta não encontrado" });
    }

    await alerta.markAsRead();

    logger.business("Alerta marcado como lido", {
      alertaId: alerta.id,
      usuarioId: req.user.id,
    });

    res.json({ message: "Alerta marcado como lido" });
  })
);

// Marcar todos os alertas como lidos
router.patch(
  "/marcar-todos-lidos",
  authenticate,
  asyncHandler(async (req, res) => {
    const [updatedCount] = await Alerta.update(
      {
        lido: true,
        data_leitura: new Date(),
      },
      {
        where: {
          usuario_id: req.user.id,
          lido: false,
        },
      }
    );

    logger.business("Todos os alertas marcados como lidos", {
      usuarioId: req.user.id,
      quantidade: updatedCount,
    });

    res.json({
      message: "Todos os alertas marcados como lidos",
      quantidade_atualizada: updatedCount,
    });
  })
);

// Deletar alerta
router.delete(
  "/:id",
  authenticate,
  validate(schemas.idParam, "params"),
  asyncHandler(async (req, res) => {
    const alerta = await Alerta.findOne({
      where: {
        id: req.params.id,
        usuario_id: req.user.id,
      },
    });

    if (!alerta) {
      return res.status(404).json({ error: "Alerta não encontrado" });
    }

    await alerta.destroy();

    logger.business("Alerta deletado", {
      alertaId: alerta.id,
      usuarioId: req.user.id,
    });

    res.status(204).send();
  })
);

// Contar alertas não lidos
router.get(
  "/nao-lidos/count",
  authenticate,
  asyncHandler(async (req, res) => {
    const count = await Alerta.count({
      where: {
        usuario_id: req.user.id,
        lido: false,
      },
    });

    res.json({ count });
  })
);

// Gerar alertas automáticos (estoque baixo)
router.post(
  "/gerar/estoque-baixo",
  authenticate,
  asyncHandler(async (req, res) => {
    const { empresa_id } = req.body;

    // Buscar produtos com estoque baixo
    const whereClause = {
      [Op.and]: [
        { estoque_atual: { [Op.lte]: { [Op.col]: "estoque_minimo" } } },
        { ativo: true },
      ],
    };

    if (empresa_id) {
      whereClause.empresa_id = empresa_id;
    }

    const produtosEstoqueBaixo = await Produto.findAll({
      where: whereClause,
      include: [
        {
          model: Empresa,
          as: "empresa",
          where: { usuario_id: req.user.id },
          attributes: ["id", "nome"],
        },
      ],
    });

    const alertasCriados = [];

    for (const produto of produtosEstoqueBaixo) {
      // Verificar se já existe um alerta de estoque baixo para este produto
      const alertaExistente = await Alerta.findOne({
        where: {
          tipo: "estoque_baixo",
          produto_id: produto.id,
          usuario_id: req.user.id,
          lido: false,
        },
      });

      if (!alertaExistente) {
        const alerta = await Alerta.create({
          tipo: "estoque_baixo",
          titulo: `Estoque baixo: ${produto.nome}`,
          mensagem: `O produto "${produto.nome}" está com estoque baixo. Estoque atual: ${produto.estoque_atual}, Estoque mínimo: ${produto.estoque_minimo}`,
          produto_id: produto.id,
          usuario_id: req.user.id,
        });

        alertasCriados.push(alerta);
      }
    }

    logger.business("Alertas de estoque baixo gerados", {
      usuarioId: req.user.id,
      quantidade: alertasCriados.length,
    });

    res.json({
      message: `${alertasCriados.length} alertas de estoque baixo criados`,
      alertas: alertasCriados,
    });
  })
);

// Gerar alertas automáticos (produtos vencendo)
router.post(
  "/gerar/produtos-vencendo",
  authenticate,
  asyncHandler(async (req, res) => {
    const { dias = 30, empresa_id } = req.body;

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

    const entradasVencendo = await EntradaProduto.findAll({
      where: whereClause,
      include: [
        {
          model: Produto,
          as: "produto",
          attributes: ["id", "nome"],
        },
        {
          model: Empresa,
          as: "empresa",
          where: { usuario_id: req.user.id },
          attributes: ["id", "nome"],
        },
      ],
    });

    const alertasCriados = [];

    for (const entrada of entradasVencendo) {
      // Verificar se já existe um alerta para este produto vencendo
      const alertaExistente = await Alerta.findOne({
        where: {
          tipo: "produto_vencendo",
          produto_id: entrada.produto_id,
          usuario_id: req.user.id,
          lido: false,
        },
      });

      if (!alertaExistente) {
        const diasRestantes = Math.ceil(
          (entrada.data_validade - new Date()) / (1000 * 60 * 60 * 24)
        );

        const alerta = await Alerta.create({
          tipo: "produto_vencendo",
          titulo: `Produto vencendo: ${entrada.produto.nome}`,
          mensagem: `O produto "${entrada.produto.nome}" (Lote: ${
            entrada.lote
          }) vence em ${diasRestantes} dias (${entrada.data_validade.toLocaleDateString()})`,
          produto_id: entrada.produto_id,
          usuario_id: req.user.id,
        });

        alertasCriados.push(alerta);
      }
    }

    logger.business("Alertas de produtos vencendo gerados", {
      usuarioId: req.user.id,
      quantidade: alertasCriados.length,
      dias,
    });

    res.json({
      message: `${alertasCriados.length} alertas de produtos vencendo criados`,
      alertas: alertasCriados,
    });
  })
);

module.exports = router;
