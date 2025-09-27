import React, { useState, useEffect } from 'react';
import { 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3,
  Scan,
  Bell,
  RefreshCw,
  Filter,
  Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dashboardService, productService } from '../../services/api';

const MobileDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Buscar dados reais da API
      const [dashboardData, produtosVencendo] = await Promise.all([
        dashboardService.getDashboardData(),
        productService.getProdutosVencendo(7).catch(() => ({ produtos: [], total: 0 }))
      ]);
      
      // Calcular produtos por status baseado na data de validade
      const hoje = new Date();
      const produtos = produtosVencendo.produtos || [];
      
      let vencidos = 0;
      let criticos = 0; // vencendo em 3 dias
      let atencao = 0; // vencendo em 7 dias
      
      produtos.forEach(produto => {
        const dataValidade = new Date(produto.data_validade);
        const diasParaVencer = Math.ceil((dataValidade - hoje) / (1000 * 60 * 60 * 24));
        
        if (diasParaVencer < 0) {
          vencidos++;
        } else if (diasParaVencer <= 3) {
          criticos++;
        } else if (diasParaVencer <= 7) {
          atencao++;
        }
      });
      
      const totalProdutos = dashboardData.stats.totalProdutos || 0;
      const ok = Math.max(0, totalProdutos - vencidos - criticos - atencao);
      
      // Adaptar dados para o formato esperado pelo dashboard mobile
      const adaptedData = {
        produtos: {
          total: totalProdutos,
          vencidos,
          criticos,
          atencao,
          ok
        },
        alertas: [
          ...(vencidos > 0 ? [{
            id: 1,
            tipo: 'critico',
            prioridade: 'alta',
            titulo: `${vencidos} produto${vencidos > 1 ? 's' : ''} vencido${vencidos > 1 ? 's' : ''}`,
            descricao: 'Produtos que já passaram da data de validade',
            tempo: 'agora',
            timestamp: new Date().toISOString()
          }] : []),
          ...(criticos > 0 ? [{
            id: 2,
            tipo: 'atencao',
            prioridade: 'alta',
            titulo: `${criticos} produto${criticos > 1 ? 's' : ''} crítico${criticos > 1 ? 's' : ''}`,
            descricao: 'Produtos vencendo em até 3 dias',
            tempo: 'agora',
            timestamp: new Date().toISOString()
          }] : []),
          ...(atencao > 0 ? [{
            id: 3,
            tipo: 'info',
            prioridade: 'media',
            titulo: `${atencao} produto${atencao > 1 ? 's' : ''} próximo${atencao > 1 ? 's' : ''} ao vencimento`,
            descricao: 'Produtos vencendo em até 7 dias',
            tempo: 'agora',
            timestamp: new Date().toISOString()
          }] : [])
        ],
        atividades: dashboardData.recentProducts ? dashboardData.recentProducts.slice(0, 3).map((produto, index) => ({
          id: produto.id,
          acao: 'Produto cadastrado',
          produto: produto.nome,
          usuario: 'Sistema',
          tempo: `${index + 1} ${index === 0 ? 'min' : index === 1 ? 'horas' : 'dias'} atrás`
        })) : []
      };

      setDashboardData(adaptedData);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      setError(error.message);
      
      // Fallback para dados básicos em caso de erro
      setDashboardData({
        produtos: {
          total: 0,
          vencidos: 0,
          criticos: 0,
          atencao: 0,
          ok: 0
        },
        alertas: [{
          id: 1,
          tipo: 'erro',
          titulo: 'Erro ao carregar dados',
          descricao: 'Não foi possível conectar com o servidor',
          tempo: 'agora'
        }],
        atividades: []
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadge = (prioridade) => {
    const variants = {
      baixa: 'bg-green-100 text-green-800',
      media: 'bg-yellow-100 text-yellow-800',
      alta: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[prioridade] || variants.media}`}>
        {prioridade ? prioridade.charAt(0).toUpperCase() + prioridade.slice(1) : 'Média'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header Mobile */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Mobile</h1>
          <p className="text-gray-600">Visão geral do sistema</p>
        </div>
        <button
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          onClick={loadDashboardData}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-blue-600">{dashboardData.produtos.total}</p>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Vencidos</p>
              <p className="text-2xl font-bold text-red-600">{dashboardData.produtos.vencidos}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Críticos</p>
              <p className="text-2xl font-bold text-red-500">{dashboardData.produtos.criticos}</p>
            </div>
            <Clock className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">OK</p>
              <p className="text-2xl font-bold text-green-600">{dashboardData.produtos.ok}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Gráfico de Status */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Status dos Produtos
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                <span className="text-sm">OK</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2 w-32">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${(dashboardData.produtos.ok / dashboardData.produtos.total) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{dashboardData.produtos.ok}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm">Atenção</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2 w-32">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full" 
                    style={{ width: `${(dashboardData.produtos.atencao / dashboardData.produtos.total) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{dashboardData.produtos.atencao}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm">Crítico</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2 w-32">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${(dashboardData.produtos.criticos / dashboardData.produtos.total) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{dashboardData.produtos.criticos}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                <span className="text-sm">Vencido</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2 w-32">
                  <div 
                    className="bg-red-600 h-2 rounded-full" 
                    style={{ width: `${(dashboardData.produtos.vencidos / dashboardData.produtos.total) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{dashboardData.produtos.vencidos}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alertas Importantes */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alertas Importantes
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {dashboardData.alertas.map((alerta) => (
              <div key={alerta.id} className="border rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className="font-medium">{alerta.titulo}</p>
                    <p className="text-sm text-gray-600">{alerta.descricao}</p>
                  </div>
                  {getPriorityBadge(alerta.prioridade)}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(alerta.timestamp).toLocaleString('pt-BR')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Atividades Recentes */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Atividades Recentes
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {dashboardData.atividades.map((atividade) => (
              <div key={atividade.id} className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{atividade.acao}</p>
                  <p className="text-xs text-gray-600">{atividade.detalhes}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500">{atividade.usuario}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(atividade.timestamp).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button 
          className="h-16 flex flex-col items-center justify-center gap-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          onClick={() => navigate('/mobile/scanner')}
        >
          <Scan className="h-6 w-6" />
          <span className="text-sm">Scanner</span>
        </button>
        <button 
          className="h-16 flex flex-col items-center justify-center gap-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          onClick={() => navigate('/mobile/reports')}
        >
          <BarChart3 className="h-6 w-6" />
          <span className="text-sm">Relatórios</span>
        </button>
      </div>

      {/* Botão Flutuante para Scanner */}
      <div className="fixed bottom-4 right-4">
        <button
          className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          onClick={() => navigate('/mobile/scanner')}
        >
          <Scan className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
};

export default MobileDashboard;