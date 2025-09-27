const aiService = require('../services/aiService');

describe('AI Service', () => {
  describe('Service Status', () => {
    it('should check if AI service is enabled', () => {
      const isEnabled = aiService.isEnabled();
      expect(typeof isEnabled).toBe('boolean');
    });
  });

  describe('Demand Prediction', () => {
    const mockSalesData = [
      { date: new Date('2024-01-01'), quantity: 10, revenue: 100 },
      { date: new Date('2024-01-02'), quantity: 15, revenue: 150 },
      { date: new Date('2024-01-03'), quantity: 8, revenue: 80 }
    ];

    const mockProduct = {
      nome: 'Produto Teste',
      categoria: 'Categoria Teste'
    };

    it('should handle demand prediction when AI is disabled', async () => {
      if (!aiService.isEnabled()) {
        const result = await aiService.predictDemand(mockSalesData, mockProduct);
        
        expect(result).toHaveProperty('success', false);
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('prediction', null);
      }
    });

    it('should process demand prediction when AI is enabled', async () => {
      if (aiService.isEnabled()) {
        const result = await aiService.predictDemand(mockSalesData, mockProduct);
        
        expect(result).toHaveProperty('success');
        expect(typeof result.success).toBe('boolean');
        
        if (result.success) {
          expect(result).toHaveProperty('prediction');
        } else {
          expect(result).toHaveProperty('message');
        }
      }
    });
  });

  describe('Expiring Products Analysis', () => {
    const mockExpiringProducts = [
      {
        nome: 'Produto A',
        categoria: 'Categoria A',
        quantidade: 5,
        dataVencimento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
        preco: 10.50
      },
      {
        nome: 'Produto B',
        categoria: 'Categoria B',
        quantidade: 3,
        dataVencimento: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 dias
        preco: 25.00
      }
    ];

    it('should handle expiring products analysis when AI is disabled', async () => {
      if (!aiService.isEnabled()) {
        const result = await aiService.analyzeExpiringProducts(mockExpiringProducts);
        
        expect(result).toHaveProperty('success', false);
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('suggestions', []);
      }
    });

    it('should process expiring products analysis when AI is enabled', async () => {
      if (aiService.isEnabled()) {
        const result = await aiService.analyzeExpiringProducts(mockExpiringProducts);
        
        expect(result).toHaveProperty('success');
        expect(typeof result.success).toBe('boolean');
        
        if (result.success) {
          expect(result).toHaveProperty('suggestions');
          expect(Array.isArray(result.suggestions)).toBe(true);
        } else {
          expect(result).toHaveProperty('message');
        }
      }
    });
  });

  describe('Inventory Optimization', () => {
    const mockProducts = [
      {
        nome: 'Produto X',
        categoria: 'Categoria X',
        quantidade: 50,
        estoqueMinimo: 10,
        vendasMedias: 5
      },
      {
        nome: 'Produto Y',
        categoria: 'Categoria Y',
        quantidade: 20,
        estoqueMinimo: 5,
        vendasMedias: 2
      }
    ];

    it('should handle inventory optimization when AI is disabled', async () => {
      if (!aiService.isEnabled()) {
        const result = await aiService.optimizeInventory(mockProducts);
        
        expect(result).toHaveProperty('success', false);
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('recommendations', []);
      }
    });

    it('should process inventory optimization when AI is enabled', async () => {
      if (aiService.isEnabled()) {
        const result = await aiService.optimizeInventory(mockProducts);
        
        expect(result).toHaveProperty('success');
        expect(typeof result.success).toBe('boolean');
        
        if (result.success) {
          expect(result).toHaveProperty('recommendations');
          expect(Array.isArray(result.recommendations)).toBe(true);
        } else {
          expect(result).toHaveProperty('message');
        }
      }
    });
  });

  describe('Market Insights', () => {
    const mockMarketData = {
      totalSales: 100,
      categories: ['Categoria A', 'Categoria B'],
      salesByCategory: {
        'Categoria A': 60,
        'Categoria B': 40
      },
      revenueByMonth: {
        '2024-01': 1000,
        '2024-02': 1200,
        '2024-03': 1100
      }
    };

    it('should handle market insights when AI is disabled', async () => {
      if (!aiService.isEnabled()) {
        const result = await aiService.generateMarketInsights(mockMarketData);
        
        expect(result).toHaveProperty('success', false);
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('insights', []);
      }
    });

    it('should process market insights when AI is enabled', async () => {
      if (aiService.isEnabled()) {
        const result = await aiService.generateMarketInsights(mockMarketData);
        
        expect(result).toHaveProperty('success');
        expect(typeof result.success).toBe('boolean');
        
        if (result.success) {
          expect(result).toHaveProperty('insights');
          expect(Array.isArray(result.insights)).toBe(true);
        } else {
          expect(result).toHaveProperty('message');
        }
      }
    });
  });
});
