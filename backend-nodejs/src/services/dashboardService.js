// Serviço de Dashboard - implementação mínima para permitir inicialização do servidor
// Posteriormente pode ser expandido para consultar o banco via Sequelize

// Estruturas de retorno foram pensadas para serem compatíveis com o frontend

async function getDashboardSummary(userId) {
  return {
    totalProdutos: 0,
    produtosVencendo: 0,
    produtosVencidos: 0,
    valorEstoque: 0,
    usuariosAtivos: 0,
    lastUpdate: new Date().toISOString()
  };
}

async function getDetailedStats(userId) {
  return {
    sales: {
      last7Days: [],
      last30Days: []
    },
    products: {
      total: 0,
      expiringSoon: 0,
      outOfStock: 0
    },
    alerts: {
      total: 0,
      bySeverity: {
        low: 0,
        medium: 0,
        high: 0
      }
    },
    updatedAt: new Date().toISOString()
  };
}

async function getRecentProducts(userId) {
  return [];
}

async function getExpiringProducts(userId) {
  return [];
}

module.exports = {
  getDashboardSummary,
  getDetailedStats,
  getRecentProducts,
  getExpiringProducts
};