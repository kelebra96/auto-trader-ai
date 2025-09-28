const { Produto, Empresa, User, EntradaProduto, Fornecedor } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

const dashboardController = {
  // Obter todos os dados do dashboard
  getDashboardData: async (userId) => {
    try {
      const [stats, recentProducts, expiringProducts] = await Promise.all([
        dashboardController.getStats(userId),
        dashboardController.getRecentProducts(userId),
        dashboardController.getExpiringProducts(userId)
      ]);

      return {
        stats,
        recentProducts,
        expiringProducts,
        changes: {
          totalProdutos: 0,
          produtosVencendo: 0,
          produtosVencidos: 0,
          valorEstoque: 0,
          usuariosAtivos: 0
        }
      };
    } catch (error) {
      logger.error('Erro ao obter dados do dashboard:', error);
      throw error;
    }
  },

  // Obter estatísticas gerais
  getStats: async (userId) => {
    try {
      // Buscar empresas do usuário
      const empresas = await Empresa.findAll({
        where: { usuario_id: userId },
        attributes: ['id']
      });

      const empresaIds = empresas.map(e => e.id);

      if (empresaIds.length === 0) {
        return {
          totalProdutos: 0,
          produtosVencendo: 0,
          produtosVencidos: 0,
          valorEstoque: 0,
          usuariosAtivos: 1
        };
      }

      // Contar produtos totais
      const totalProdutos = await Produto.count({
        where: { empresa_id: { [Op.in]: empresaIds } }
      });

      // Calcular data limite para produtos vencendo (próximos 7 dias)
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() + 7);

      // Contar produtos vencendo
      const produtosVencendo = await EntradaProduto.count({
        where: {
          empresa_id: { [Op.in]: empresaIds },
          data_validade: {
            [Op.between]: [new Date(), dataLimite]
          }
        }
      });

      // Contar produtos vencidos
      const produtosVencidos = await EntradaProduto.count({
        where: {
          empresa_id: { [Op.in]: empresaIds },
          data_validade: {
            [Op.lt]: new Date()
          }
        }
      });

      // Calcular valor do estoque
      const produtos = await Produto.findAll({
          where: { empresa_id: { [Op.in]: empresaIds } },
          attributes: ['preco', 'estoque_atual']
        });

        const valorEstoque = produtos.reduce((total, produto) => {
          return total + ((produto.preco || 0) * (produto.estoque_atual || 0));
        }, 0);

      // Contar usuários ativos (simplificado - apenas o usuário atual)
      const usuariosAtivos = 1;

      return {
        totalProdutos,
        produtosVencendo,
        produtosVencidos,
        valorEstoque,
        usuariosAtivos
      };
    } catch (error) {
      logger.error('Erro ao obter estatísticas:', error);
      throw error;
    }
  },

  // Obter produtos recentes
  getRecentProducts: async (userId) => {
    try {
      // Buscar empresas do usuário
      const empresas = await Empresa.findAll({
        where: { usuario_id: userId },
        attributes: ['id']
      });

      const empresaIds = empresas.map(e => e.id);

      if (empresaIds.length === 0) {
        return [];
      }

      const recentProducts = await Produto.findAll({
        where: { empresa_id: { [Op.in]: empresaIds } },
        order: [['createdAt', 'DESC']],
        limit: 5,
        attributes: ['id', 'nome', 'categoria', 'preco', 'estoque_atual', 'createdAt'],
        include: [
          {
            model: EntradaProduto,
            as: 'entradas',
            limit: 1,
            order: [['data_validade', 'ASC']],
            attributes: ['data_validade'],
            required: false
          }
        ]
      });

      return recentProducts.map(produto => ({
        id: produto.id,
        nome: produto.nome,
        categoria: produto.categoria,
        preco_venda: produto.preco,
          quantidade: produto.estoque_atual,
        data_validade: produto.entradas && produto.entradas.length > 0 
          ? produto.entradas[0].data_validade 
          : null,
        createdAt: produto.createdAt
      }));
    } catch (error) {
      logger.error('Erro ao obter produtos recentes:', error);
      throw error;
    }
  },

  // Obter produtos vencendo
  getExpiringProducts: async (userId) => {
    try {
      // Buscar empresas do usuário
      const empresas = await Empresa.findAll({
        where: { usuario_id: userId },
        attributes: ['id']
      });

      const empresaIds = empresas.map(e => e.id);

      if (empresaIds.length === 0) {
        return [];
      }

      // Calcular data limite para produtos vencendo (próximos 30 dias)
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() + 30);

      const expiringProducts = await EntradaProduto.findAll({
        where: {
          empresa_id: { [Op.in]: empresaIds },
          data_validade: {
            [Op.between]: [new Date(), dataLimite]
          }
        },
        order: [['data_validade', 'ASC']],
        limit: 10,
        include: [
          {
            model: Produto,
            as: 'produto',
            attributes: ['id', 'nome', 'categoria', 'preco']
          }
        ]
      });

      return expiringProducts.map(entrada => ({
        id: entrada.produto.id,
        nome: entrada.produto.nome,
        categoria: entrada.produto.categoria,
        preco_venda: entrada.produto.preco,
        quantidade: entrada.quantidade,
        data_validade: entrada.data_validade,
        lote: entrada.lote
      }));
    } catch (error) {
      logger.error('Erro ao obter produtos vencendo:', error);
      throw error;
    }
  }
};

module.exports = dashboardController;