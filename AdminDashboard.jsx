import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Settings, Activity, Mail, DollarSign, MessageSquare, Shield, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();

  const adminActions = [
    {
      title: 'Gestão de Usuários',
      description: 'Gerencie usuários, sessões e permissões',
      icon: Users,
      action: () => navigate('/admin/users'),
      color: 'text-blue-600'
    },
    {
      title: 'Configurações do Sistema',
      description: 'Configure APIs, integrações e segurança',
      icon: Settings,
      action: () => navigate('/admin/settings'),
      color: 'text-green-600'
    },
    {
      title: 'Gestão de Chamados',
      description: 'Atenda e gerencie chamados de suporte',
      icon: MessageSquare,
      action: () => navigate('/admin/support'),
      color: 'text-purple-600'
    },
    {
      title: 'Logs de Auditoria',
      description: 'Visualize logs e atividades do sistema',
      icon: Activity,
      action: () => navigate('/admin/logs'),
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Painel de Administração</h1>
        <p className="text-gray-600">Visão geral e acesso rápido às funcionalidades administrativas</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Logados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15</div>
            <p className="text-xs text-muted-foreground">+20% desde o último mês</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chamados Abertos</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">3 novos hoje</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 12.500,00</div>
            <p className="text-xs text-muted-foreground">+10% desde o último mês</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Logs de Atividade</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.234</div>
            <p className="text-xs text-muted-foreground">Último log há 5 minutos</p>
          </CardContent>
        </Card>
      </div>

      {/* Ações Administrativas */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Ações Administrativas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {adminActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Icon className={`h-6 w-6 ${action.color}`} />
                        <h3 className="font-semibold">{action.title}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">{action.description}</p>
                      <Button onClick={action.action} className="w-full">
                        Acessar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Status do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Status do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Banco de Dados</p>
                <p className="text-sm text-gray-600">PostgreSQL</p>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">API OpenAI</p>
                <p className="text-sm text-gray-600">IA Preditiva</p>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Mercado Pago</p>
                <p className="text-sm text-gray-600">Pagamentos</p>
              </div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

