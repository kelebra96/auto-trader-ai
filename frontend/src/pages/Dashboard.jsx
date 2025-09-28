import React, { useState, useEffect } from 'react';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Calendar,
  DollarSign,
  Users,
  BarChart3,
  Clock
} from 'lucide-react';
import { Button } from '../components/ui/button';
import Dialog from '../components/ui/Dialog';
import AddProductForm from '../components/forms/AddProductForm';
import ReportsViewer from '../components/reports/ReportsViewer';
import ScheduleAlertForm from '../components/forms/ScheduleAlertForm';

import { formatCurrency, formatDate, getExpiryStatus, getExpiryStatusColor, getExpiryStatusText } from '../lib/utils';
import { dashboardService } from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProdutos: 0,
    produtosVencendo: 0,
    produtosVencidos: 0,
    valorEstoque: 0,
    usuariosAtivos: 0
  });
  
  const [changes, setChanges] = useState({
    totalProdutos: 0,
    produtosVencendo: 0,
    produtosVencidos: 0,
    valorEstoque: 0,
    usuariosAtivos: 0
  });
  
  const [recentProducts, setRecentProducts] = useState([]);
  const [expiringProducts, setExpiringProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para modais das ações rápidas
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [showScheduleAlertModal, setShowScheduleAlertModal] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Buscar dados reais da API
      const data = await dashboardService.getDashboardData();
      
      setStats(data.stats || {
        totalProdutos: 0,
        produtosVencendo: 0,
        produtosVencidos: 0,
        valorEstoque: 0,
        usuariosAtivos: 0
      });
      setChanges(data.changes || {
        totalProdutos: 0,
        produtosVencendo: 0,
        produtosVencidos: 0,
        valorEstoque: 0,
        usuariosAtivos: 0
      });
      
      // Mapear produtos recentes para o formato esperado pelo componente
      const recentProductsFormatted = (data.recentProducts || []).map(product => ({
        id: product.id,
        nome: product.nome,
        categoria: product.categoria,
        data_validade: product.data_validade,
        preco: product.preco_venda || 0,
        estoque: product.quantidade || 0
      }));
      
      // Mapear produtos vencendo para o formato esperado pelo componente
      const expiringProductsFormatted = (data.expiringProducts || []).map(product => ({
        id: product.id,
        nome: product.nome,
        categoria: product.categoria,
        data_validade: product.data_validade,
        preco: product.preco_venda || 0,
        estoque: product.quantidade || 0
      }));
      
      setRecentProducts(recentProductsFormatted);
      setExpiringProducts(expiringProductsFormatted);
      
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      setLoading(false);
    }
  };

  // Funções para lidar com sucesso das ações
  const handleProductAdded = (newProduct) => {
    // Atualizar lista de produtos recentes
    setRecentProducts(prev => [newProduct, ...prev.slice(0, 2)]);
    
    // Atualizar estatísticas
    setStats(prev => ({
      ...prev,
      totalProdutos: prev.totalProdutos + 1,
      valorEstoque: prev.valorEstoque + newProduct.preco
    }));
    
    // Recarregar dados do dashboard
    fetchDashboardData();
  };

  const handleAlertScheduled = (newAlert) => {
    console.log('Novo alerta agendado:', newAlert);
    // Em produção, atualizar lista de alertas ou estatísticas relacionadas
  };

  const StatCard = ({ title, value, icon: Icon, color = 'blue', change }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change > 0 ? '+' : ''}{change}% vs mês anterior
            </p>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Visão geral do seu negócio</p>
        </div>
        <Button onClick={fetchDashboardData}>
          Atualizar Dados
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <StatCard
          title="Total de Produtos"
          value={(stats?.totalProdutos ?? 0).toLocaleString()}
          icon={Package}
          color="blue"
          change={changes.totalProdutos}
        />
        <StatCard
          title="Produtos Vencendo"
          value={stats?.produtosVencendo ?? 0}
          icon={AlertTriangle}
          color="orange"
          change={changes.produtosVencendo}
        />
        <StatCard
          title="Produtos Vencidos"
          value={stats?.produtosVencidos ?? 0}
          icon={Clock}
          color="red"
          change={changes.produtosVencidos}
        />
        <StatCard
          title="Valor do Estoque"
          value={formatCurrency(stats?.valorEstoque ?? 0)}
          icon={DollarSign}
          color="green"
          change={changes.valorEstoque}
        />
        <StatCard
          title="Usuários Ativos"
          value={stats?.usuariosAtivos ?? 0}
          icon={Users}
          color="indigo"
          change={changes.usuariosAtivos}
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Products */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Produtos Recentes</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentProducts && recentProducts.length > 0 ? recentProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{product.nome}</h3>
                    <p className="text-sm text-gray-600">{product.categoria}</p>
                    <p className="text-sm text-gray-500">
                      Validade: {formatDate(product.data_validade)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatCurrency(product.preco)}</p>
                    <p className="text-sm text-gray-600">Estoque: {product.estoque}</p>
                  </div>
                </div>
              )) : (
                <p className="text-center text-gray-500 py-8">
                  Nenhum produto recente encontrado
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Expiring Products */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Produtos Vencendo</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {expiringProducts && expiringProducts.length > 0 ? expiringProducts.map((product) => {
                const status = getExpiryStatus(product.data_validade);
                const statusColor = getExpiryStatusColor(status);
                const statusText = getExpiryStatusText(status);
                
                return (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{product.nome}</h3>
                      <p className="text-sm text-gray-600">{product.categoria}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                          {statusText}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(product.data_validade)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(product.preco)}</p>
                      <p className="text-sm text-gray-600">Estoque: {product.estoque}</p>
                    </div>
                  </div>
                );
              }) : (
                <p className="text-center text-gray-500 py-8">
                  Nenhum produto vencendo nos próximos dias
                </p>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Button 
            className="flex items-center justify-center space-x-2"
            onClick={() => setShowAddProductModal(true)}
          >
            <Package className="h-4 w-4" />
            <span>Adicionar Produto</span>
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center justify-center space-x-2"
            onClick={() => setShowReportsModal(true)}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Ver Relatórios</span>
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center justify-center space-x-2"
            onClick={() => setShowScheduleAlertModal(true)}
          >
            <Calendar className="h-4 w-4" />
            <span>Agendar Alerta</span>
          </Button>
        </div>
      </div>

      {/* Modais das Ações Rápidas */}
      <Dialog
        isOpen={showAddProductModal}
        onClose={() => setShowAddProductModal(false)}
        title="Adicionar Novo Produto"
        size="lg"
      >
        <AddProductForm
          onClose={() => setShowAddProductModal(false)}
          onSuccess={handleProductAdded}
        />
      </Dialog>

      <Dialog
        isOpen={showReportsModal}
        onClose={() => setShowReportsModal(false)}
        title="Relatórios do Sistema"
        size="xl"
      >
        <ReportsViewer
          onClose={() => setShowReportsModal(false)}
        />
      </Dialog>

      <Dialog
        isOpen={showScheduleAlertModal}
        onClose={() => setShowScheduleAlertModal(false)}
        title="Agendar Novo Alerta"
        size="lg"
      >
        <ScheduleAlertForm
          onClose={() => setShowScheduleAlertModal(false)}
          onSuccess={handleAlertScheduled}
        />
      </Dialog>
    </div>
  );
};

export default Dashboard;