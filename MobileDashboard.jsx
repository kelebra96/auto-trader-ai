import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

export default function MobileDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    produtos: {
      total: 0,
      vencidos: 0,
      criticos: 0,
      atencao: 0,
      ok: 0
    },
    alertas: [],
    atividades: []
  });

  // Mock data
  const mockData = {
    produtos: {
      total: 1247,
      vencidos: 23,
      criticos: 45,
      atencao: 78,
      ok: 1101
    },
    alertas: [
      {
        id: 1,
        tipo: 'vencimento',
        titulo: '23 produtos vencidos',
        descricao: 'Retirar produtos vencidos das prateleiras',
        prioridade: 'alta',
        timestamp: '2024-01-15 08:30:00'
      },
      {
        id: 2,
        tipo: 'estoque',
        titulo: 'Estoque baixo - Leite Integral',
        descricao: 'Apenas 5 unidades restantes',
        prioridade: 'media',
        timestamp: '2024-01-15 09:15:00'
      },
      {
        id: 3,
        tipo: 'ia',
        titulo: 'Sugestão de IA',
        descricao: 'Reduzir preço dos iogurtes próximos ao vencimento',
        prioridade: 'baixa',
        timestamp: '2024-01-15 10:00:00'
      }
    ],
    atividades: [
      {
        id: 1,
        acao: 'Produto escaneado',
        detalhes: 'Leite Integral 1L adicionado',
        usuario: 'João Silva',
        timestamp: '2024-01-15 11:30:00'
      },
      {
        id: 2,
        acao: 'Alerta resolvido',
        detalhes: 'Produtos vencidos removidos do setor A',
        usuario: 'Maria Santos',
        timestamp: '2024-01-15 11:15:00'
      },
      {
        id: 3,
        acao: 'Relatório gerado',
        detalhes: 'Relatório de validade semanal',
        usuario: 'Sistema',
        timestamp: '2024-01-15 10:45:00'
      }
    ]
  };

  useEffect(() => {
    // Simular carregamento
    setTimeout(() => {
      setDashboardData(mockData);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status) => {
    const colors = {
      vencidos: 'text-red-600',
      criticos: 'text-red-500',
      atencao: 'text-yellow-600',
      ok: 'text-green-600'
    };
    return colors[status] || 'text-gray-600';
  };

  const getPriorityBadge = (prioridade) => {
    const configs = {
      alta: { variant: 'destructive', label: 'Alta' },
      media: { variant: 'warning', label: 'Média' },
      baixa: { variant: 'secondary', label: 'Baixa' }
    };
    const config = configs[prioridade] || configs.baixa;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header Mobile */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-gray-600">Visão geral dos produtos</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={() => navigate('/mobile/scanner')}>
              <Scan className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{dashboardData.produtos.total}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Vencidos</p>
                <p className="text-2xl font-bold text-red-600">{dashboardData.produtos.vencidos}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Críticos</p>
                <p className="text-2xl font-bold text-red-500">{dashboardData.produtos.criticos}</p>
              </div>
              <Clock className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">OK</p>
                <p className="text-2xl font-bold text-green-600">{dashboardData.produtos.ok}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Status dos Produtos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">OK</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2 w-32">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
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
        </CardContent>
      </Card>

      {/* Alertas Importantes */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alertas Importantes
          </CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Atividades Recentes */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Atividades Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Ações Rápidas */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Button 
          onClick={() => navigate('/mobile/scanner')}
          className="h-16 flex flex-col items-center justify-center gap-2"
        >
          <Scan className="h-6 w-6" />
          <span className="text-sm">Scanner</span>
        </Button>
        <Button 
          variant="outline"
          onClick={() => navigate('/mobile/reports')}
          className="h-16 flex flex-col items-center justify-center gap-2"
        >
          <BarChart3 className="h-6 w-6" />
          <span className="text-sm">Relatórios</span>
        </Button>
      </div>

      {/* Botão Flutuante para Scanner */}
      <div className="fixed bottom-4 right-4">
        <Button
          size="lg"
          onClick={() => navigate('/mobile/scanner')}
          className="rounded-full w-14 h-14 shadow-lg"
        >
          <Scan className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}

