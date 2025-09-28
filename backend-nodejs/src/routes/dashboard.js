const express = require('express');
const router = express.Router();
const { authenticate, requirePermission } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const dashboardService = require('../services/dashboardService');

// Mantém 'dashboard_view' como permissão principal; aliases tratados no serviço
router.get('/', authenticate, requirePermission('dashboard_view'), asyncHandler(async (req, res) => {
  const stats = await dashboardService.getDashboardSummary(req.user.id);
  res.json({ success: true, data: stats });
}));

router.get('/stats', authenticate, requirePermission('dashboard_view'), asyncHandler(async (req, res) => {
  const stats = await dashboardService.getDetailedStats(req.user.id);
  res.json({ success: true, data: stats });
}));

router.get('/recent-products', authenticate, requirePermission('dashboard_view'), asyncHandler(async (req, res) => {
  const products = await dashboardService.getRecentProducts(req.user.id);
  res.json({ success: true, data: products });
}));

router.get('/expiring-products', authenticate, requirePermission('dashboard_view'), asyncHandler(async (req, res) => {
  const expiringProducts = await dashboardService.getExpiringProducts(req.user.id);
  res.json({ success: true, data: expiringProducts });
}));

module.exports = router;