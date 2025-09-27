const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const Joi = require('joi');
const db = require('../models');

// Middleware de autenticação para todas as rotas
router.use(authenticate);

// Schemas de validação
const demandPredictionSchema = Joi.object({
  productId: Joi.number().integer().positive().required(),
  period: Joi.string().valid('30days', '60days', '90days').default('30days')
});

const expiringProductsSchema = Joi.object({
  days: Joi.number().integer().min(1).max(365).default(30)
});

const inventoryOptimizationSchema = Joi.object({
  categoryId: Joi.number().integer().positive().optional(),
  includeAll: Joi.boolean().default(false)
});

/**
 * GET /api/ai/status
 * Verifica o status do serviço de IA
 */
router.get('/status', (req, res) => {
  try {
    const isEnabled = aiService.isEnabled();
    
    res.json({
      success: true,
      enabled: isEnabled,
      message: isEnabled ? 'Serviço de IA disponível' : 'Serviço de IA não configurado',
      features: {
        demandPrediction: isEnabled,
        expiringAnalysis: isEnabled,
        inventoryOptimization: isEnabled,
        marketInsights: isEnabled
      }
    });
  } catch (error) {
    console.error('Erro ao verificar status da IA:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/ai/predict-demand
 * Prevê demanda para um produto específico
 */
router.post('/predict-demand', validate(demandPredictionSchema), async (req, res) => {
  try {
    const { productId, period } = req.body;
    const userId = req.user.id;

    // Buscar produto
    const product = await db.Produto.findOne({
      where: { 
        id: productId,
        empresaId: req.user.empresaId 
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produto não encontrado'
      });
    }

    // Buscar dados de vendas
    const salesData = await db.Venda.findAll({
      where: {
        produtoId: productId,
        empresaId: req.user.empresaId,
        createdAt: {
          [db.Sequelize.Op.gte]: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // últimos 90 dias
        }
      },
      attributes: ['quantidade', 'preco', 'createdAt'],
      order: [['createdAt', 'ASC']]
    });

    // Processar dados para análise
    const processedSalesData = salesData.map(sale => ({
      date: sale.createdAt,
      quantity: sale.quantidade,
      revenue: sale.preco * sale.quantidade
    }));

    // Chamar serviço de IA
    const prediction = await aiService.predictDemand(processedSalesData, {
      nome: product.nome,
      categoria: product.categoria
    });

    res.json({
      success: true,
      product: {
        id: product.id,
        nome: product.nome,
        categoria: product.categoria
      },
      period,
      salesDataPoints: processedSalesData.length,
      prediction: prediction.prediction,
      aiEnabled: prediction.success
    });

  } catch (error) {
    console.error('Erro na previsão de demanda:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar previsão de demanda'
    });
  }
});

/**
 * POST /api/ai/analyze-expiring
 * Analisa produtos próximos ao vencimento
 */
router.post('/analyze-expiring', validate(expiringProductsSchema), async (req, res) => {
  try {
    const { days } = req.body;
    const userId = req.user.id;

    // Buscar produtos próximos ao vencimento
    const expiringDate = new Date();
    expiringDate.setDate(expiringDate.getDate() + days);

    const expiringProducts = await db.EntradaProduto.findAll({
      where: {
        empresaId: req.user.empresaId,
        dataVencimento: {
          [db.Sequelize.Op.lte]: expiringDate,
          [db.Sequelize.Op.gte]: new Date()
        },
        quantidade: {
          [db.Sequelize.Op.gt]: 0
        }
      },
      include: [{
        model: db.Produto,
        attributes: ['nome', 'categoria', 'preco']
      }],
      order: [['dataVencimento', 'ASC']]
    });

    if (expiringProducts.length === 0) {
      return res.json({
        success: true,
        message: 'Nenhum produto próximo ao vencimento encontrado',
        products: [],
        suggestions: []
      });
    }

    // Processar dados para análise
    const processedProducts = expiringProducts.map(entry => ({
      nome: entry.Produto.nome,
      categoria: entry.Produto.categoria,
      quantidade: entry.quantidade,
      dataVencimento: entry.dataVencimento,
      preco: entry.Produto.preco,
      diasParaVencer: Math.ceil((entry.dataVencimento - new Date()) / (1000 * 60 * 60 * 24))
    }));

    // Chamar serviço de IA
    const analysis = await aiService.analyzeExpiringProducts(processedProducts);

    res.json({
      success: true,
      daysAnalyzed: days,
      productsFound: expiringProducts.length,
      products: processedProducts,
      suggestions: analysis.suggestions || [],
      aiEnabled: analysis.success
    });

  } catch (error) {
    console.error('Erro na análise de produtos vencendo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao analisar produtos próximos ao vencimento'
    });
  }
});

/**
 * POST /api/ai/optimize-inventory
 * Otimiza níveis de estoque
 */
router.post('/optimize-inventory', validate(inventoryOptimizationSchema), async (req, res) => {
  try {
    const { categoryId, includeAll } = req.body;
    const userId = req.user.id;

    // Construir filtros
    const whereClause = {
      empresaId: req.user.empresaId
    };

    if (categoryId && !includeAll) {
      whereClause.categoria = categoryId;
    }

    // Buscar produtos com dados de estoque
    const products = await db.Produto.findAll({
      where: whereClause,
      include: [
        {
          model: db.EntradaProduto,
          attributes: ['quantidade', 'dataVencimento'],
          where: {
            quantidade: {
              [db.Sequelize.Op.gt]: 0
            }
          },
          required: false
        },
        {
          model: db.Venda,
          attributes: ['quantidade', 'createdAt'],
          where: {
            createdAt: {
              [db.Sequelize.Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // últimos 30 dias
            }
          },
          required: false
        }
      ]
    });

    if (products.length === 0) {
      return res.json({
        success: true,
        message: 'Nenhum produto encontrado para análise',
        recommendations: []
      });
    }

    // Processar dados para análise
    const processedProducts = products.map(product => {
      const totalStock = product.EntradaProdutos.reduce((sum, entry) => sum + entry.quantidade, 0);
      const totalSales = product.Vendas.reduce((sum, sale) => sum + sale.quantidade, 0);
      const avgSales = totalSales / 30; // média diária

      return {
        nome: product.nome,
        categoria: product.categoria,
        quantidade: totalStock,
        estoqueMinimo: product.estoqueMinimo || 10,
        vendasMedias: avgSales
      };
    });

    // Chamar serviço de IA
    const optimization = await aiService.optimizeInventory(processedProducts);

    res.json({
      success: true,
      productsAnalyzed: products.length,
      categoryFilter: categoryId || 'Todas',
      recommendations: optimization.recommendations || [],
      aiEnabled: optimization.success
    });

  } catch (error) {
    console.error('Erro na otimização de estoque:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao otimizar níveis de estoque'
    });
  }
});

/**
 * GET /api/ai/market-insights
 * Gera insights de mercado baseados nos dados da empresa
 */
router.get('/market-insights', async (req, res) => {
  try {
    const userId = req.user.id;
    const empresaId = req.user.empresaId;

    // Buscar dados de vendas dos últimos 3 meses
    const salesData = await db.Venda.findAll({
      where: {
        empresaId: empresaId,
        createdAt: {
          [db.Sequelize.Op.gte]: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        }
      },
      include: [{
        model: db.Produto,
        attributes: ['nome', 'categoria']
      }],
      attributes: ['quantidade', 'preco', 'createdAt']
    });

    // Buscar dados de produtos
    const productsData = await db.Produto.findAll({
      where: { empresaId: empresaId },
      attributes: ['categoria', 'preco'],
      group: ['categoria']
    });

    // Processar dados para análise
    const marketData = {
      totalSales: salesData.length,
      categories: [...new Set(salesData.map(sale => sale.Produto.categoria))],
      salesByCategory: {},
      revenueByMonth: {},
      topProducts: {}
    };

    // Agrupar vendas por categoria
    salesData.forEach(sale => {
      const category = sale.Produto.categoria;
      if (!marketData.salesByCategory[category]) {
        marketData.salesByCategory[category] = 0;
      }
      marketData.salesByCategory[category] += sale.quantidade;
    });

    // Agrupar receita por mês
    salesData.forEach(sale => {
      const month = sale.createdAt.toISOString().substring(0, 7);
      if (!marketData.revenueByMonth[month]) {
        marketData.revenueByMonth[month] = 0;
      }
      marketData.revenueByMonth[month] += sale.preco * sale.quantidade;
    });

    // Chamar serviço de IA
    const insights = await aiService.generateMarketInsights(marketData);

    res.json({
      success: true,
      period: '90 dias',
      dataPoints: salesData.length,
      marketData: {
        totalSales: marketData.totalSales,
        categoriesCount: marketData.categories.length,
        salesByCategory: marketData.salesByCategory,
        revenueByMonth: marketData.revenueByMonth
      },
      insights: insights.insights || [],
      aiEnabled: insights.success
    });

  } catch (error) {
    console.error('Erro na geração de insights:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar insights de mercado'
    });
  }
});

module.exports = router;
