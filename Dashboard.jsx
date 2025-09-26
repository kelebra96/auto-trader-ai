import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Package, AlertTriangle, TrendingUp, DollarSign, Calendar, Users } from 'lucide-react';
import apiService from '../services/api';

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [produtosVencendo, setProdutosVencendo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboard, produtos] = await Promise.all([
        apiService.getDashboard(),
        apiService.getProdutosVencendo(7)
      ]);
      
      setDashboardData(dashboard);
      setProdutosVencendo(produtos.produtos || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar dashboard: {error}
        </AlertDescription>
      </Alert>
    );
  }

  const resumo = dashboardData?.resumo || {};
  const graficos = dashboardData?.graficos || {};

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Visão geral do seu negócio</p>
        </div>
        <Button onClick={loadDashboardData} variant="outline">
          Atualizar
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumo.total_produtos || 0}</div>
            <p className="text-xs text-muted-foreground">
              +2% desde o mês passado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos Vencendo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {resumo.produtos_vencendo || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Próximos 7 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor em Risco</CardTitle>
            <DollarSign className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {(resumo.valor_risco || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Produtos próximos ao vencimento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Economia do Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {(resumo.economia_mes || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {((resumo.reducao_desperdicio || 0) * 100).toFixed(1)}% redução de desperdício
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas de Produtos Vencendo */}
      {produtosVencendo.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Produtos Vencendo (Próximos 7 dias)
            </CardTitle>
            <CardDescription>
              Produtos que precisam de atenção imediata
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {produtosVencendo.slice(0, 5).map((produto) => (
                <div key={produto.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{produto.nome}</h4>
                    <p className="text-sm text-gray-600">
                      {produto.quantidade} unidades • Vence em {produto.dias_para_vencer} dias
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={produto.dias_para_vencer <= 3 ? 'destructive' : 'secondary'}>
                      {produto.dias_para_vencer <= 3 ? 'Urgente' : 'Atenção'}
                    </Badge>
                    <span className="font-medium text-sm">
                      R$ {(produto.preco_venda * produto.quantidade).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendas por Dia */}
        <Card>
          <CardHeader>
            <CardTitle>Vendas por Dia</CardTitle>
            <CardDescription>Últimos 7 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={graficos.vendas_por_dia || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" />
                <YAxis />
                <Tooltip formatter={(value) => [`R$ ${value}`, 'Vendas']} />
                <Bar dataKey="vendas" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Produtos por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos por Categoria</CardTitle>
            <CardDescription>Distribuição do estoque</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={graficos.produtos_por_categoria || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ categoria, percent }) => `${categoria} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="quantidade"
                >
                  {(graficos.produtos_por_categoria || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Alertas por Urgência */}
      <Card>
        <CardHeader>
          <CardTitle>Status dos Alertas</CardTitle>
          <CardDescription>Distribuição por nível de urgência</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {graficos.alertas_por_urgencia?.alta || 0}
              </div>
              <div className="text-sm text-red-600">Alta Urgência</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {graficos.alertas_por_urgencia?.media || 0}
              </div>
              <div className="text-sm text-yellow-600">Média Urgência</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {graficos.alertas_por_urgencia?.baixa || 0}
              </div>
              <div className="text-sm text-green-600">Baixa Urgência</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

