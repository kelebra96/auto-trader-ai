const dashboardService = require("./dashboardService");
const {
  Venda,
  Produto,
  EntradaProduto,
  Fornecedor,
  Empresa,
} = require("../models");
const { Op, fn, col, literal, Sequelize } = require("sequelize");

// Serviço mínimo de relatórios. Retorna estruturas compatíveis com o frontend.
async function getDashboard(userId) {
  // Reaproveita resumo do dashboard
  const summary = await dashboardService.getDashboardSummary(userId);
  return summary;
}

async function getRelatorioValidades(userId) {
  // Retorna lista vazia por enquanto (implementar lógica real conforme necessidade)
  return {
    produtos_vencidos: [],
    produtos_vencendo: [],
    resumo: {
      total_vencidos: 0,
      total_vencendo: 0,
    },
  };
}

async function getRelatorioPerdas(userId) {
  return {
    perdas_por_categoria: [],
    resumo: {},
  };
}

async function getRelatorioEstoque(userId) {
  // Exemplo simples: contar produtos por empresa do usuário
  const estoque_por_categoria = [];
  return { estoque_por_categoria };
}

async function getRelatorioVendas(userId, opts = {}) {
  const { data_inicio, data_fim, empresa_id } = opts;

  // Implementação simplificada: buscar últimas vendas do usuário
  const where = {};
  if (empresa_id) where.empresa_id = empresa_id;
  if (data_inicio && data_fim) {
    where.data_venda = {
      [Op.between]: [new Date(data_inicio), new Date(data_fim)],
    };
  }

  const vendas = await Venda.findAll({
    where,
    limit: 100,
    order: [["data_venda", "DESC"]],
    include: [
      {
        model: Produto,
        as: "produto",
        attributes: ["id", "nome", "categoria"],
      },
      { model: Empresa, as: "empresa", attributes: ["id", "nome"] },
    ],
  });

  return {
    periodo: { data_inicio, data_fim },
    resumo: { total_vendas: vendas.length },
    vendas,
    vendas_por_categoria: {},
  };
}

async function getRelatorioFornecedores(userId) {
  // Retorna fornecedores com contagem de produtos - implementação mínima
  const fornecedores = await Fornecedor.findAll({
    attributes: ["id", "nome"],
    limit: 100,
  });

  return { fornecedores };
}

async function getRelatorioFinanceiro(userId, opts = {}) {
  // Retorna estrutura básica
  return {
    resumo: {
      receitas: 0,
      custos: 0,
      lucro: 0,
    },
    detalhes: [],
  };
}

module.exports = {
  getDashboard,
  getRelatorioValidades,
  getRelatorioPerdas,
  getRelatorioEstoque,
  getRelatorioVendas,
  getRelatorioFornecedores,
  getRelatorioFinanceiro,
};
