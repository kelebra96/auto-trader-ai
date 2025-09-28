const express = require('express');
const router = express.Router();
const { authenticate, requirePermission } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const dashboardController = require('../controllers/dashboardController');

// Rota principal do dashboard
router.get('/', authenticate, requirePermission('dashboard_view'), asyncHandler(async (req, res) => {
  const dashboardData = await dashboardController.getDashboardData(req.user.id);
  res.json(dashboardData);
}));

// Rota para estatísticas específicas
router.get('/stats', authenticate, requirePermission('dashboard_view'), asyncHandler(async (req, res) => {
  const stats = await dashboardController.getStats(req.user.id);
  res.json(stats);
}));

// Rota para produtos recentes
router.get('/recent-products', authenticate, requirePermission('dashboard_view'), asyncHandler(async (req, res) => {
  const recentProducts = await dashboardController.getRecentProducts(req.user.id);
  res.json(recentProducts);
}));

// Rota para produtos vencendo
router.get('/expiring-products', authenticate, requirePermission('dashboard_view'), asyncHandler(async (req, res) => {
  const expiringProducts = await dashboardController.getExpiringProducts(req.user.id);
  res.json(expiringProducts);
}));

module.exports = router;