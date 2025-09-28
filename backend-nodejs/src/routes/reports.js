const express = require("express");
const router = express.Router();
const { authenticate, requirePermission } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/errorHandler");
const reportService = require("../services/reportService");

// Dashboard resumo
router.get(
  "/dashboard",
  authenticate,
  requirePermission("reports_view"),
  asyncHandler(async (req, res) => {
    const data = await reportService.getDashboard(req.user.id);
    res.json(data);
  })
);

// Relatório de validades
router.get(
  "/validades",
  authenticate,
  requirePermission("reports_view"),
  asyncHandler(async (req, res) => {
    const data = await reportService.getRelatorioValidades(req.user.id);
    res.json(data);
  })
);

// Relatório de perdas
router.get(
  "/perdas",
  authenticate,
  requirePermission("reports_view"),
  asyncHandler(async (req, res) => {
    const data = await reportService.getRelatorioPerdas(req.user.id);
    res.json(data);
  })
);

// Relatório de estoque
router.get(
  "/estoque",
  authenticate,
  requirePermission("reports_view"),
  asyncHandler(async (req, res) => {
    const data = await reportService.getRelatorioEstoque(req.user.id);
    res.json(data);
  })
);

// Relatório de vendas
router.get(
  "/vendas",
  authenticate,
  requirePermission("reports_view"),
  asyncHandler(async (req, res) => {
    const data = await reportService.getRelatorioVendas(req.user.id, req.query);
    res.json(data);
  })
);

// Relatório de fornecedores
router.get(
  "/fornecedores",
  authenticate,
  requirePermission("reports_view"),
  asyncHandler(async (req, res) => {
    const data = await reportService.getRelatorioFornecedores(req.user.id);
    res.json(data);
  })
);

// Relatório financeiro
router.get(
  "/financeiro",
  authenticate,
  requirePermission("reports_view"),
  asyncHandler(async (req, res) => {
    const data = await reportService.getRelatorioFinanceiro(
      req.user.id,
      req.query
    );
    res.json(data);
  })
);

module.exports = router;
