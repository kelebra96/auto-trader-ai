import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Search, 
  Filter, 
  UserPlus, 
  Edit, 
  Trash2, 
  Eye, 
  Shield, 
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  // Mock data - substituir pela API real
  const mockUsers = [
    {
      id: 1,
      nome: 'João Silva',
      email: 'joao@empresa.com',
      telefone: '(11) 99999-9999',
      funcao: 'Gerente',
      perfil: 'admin',
      status: 'ativo',
      ultimo_login: '2024-01-15 14:30:00',
      sessoes_ativas: 2,
      empresa: 'Supermercado Silva',
      created_at: '2024-01-01 10:00:00'
    },
    {
      id: 2,
      nome: 'Maria Santos',
      email: 'maria@loja.com',
      telefone: '(11) 88888-8888',
      funcao: 'Operadora',
      perfil: 'user',
      status: 'ativo',
      ultimo_login: '2024-01-15 16:45:00',
      sessoes_ativas: 1,
      empresa: 'Loja da Maria',
      created_at: '2024-01-05 09:15:00'
    },
    {
      id: 3,
      nome: 'Pedro Costa',
      email: 'pedro@mercado.com',
      telefone: '(11) 77777-7777',
      funcao: 'Supervisor',
      perfil: 'manager',
      status: 'inativo',
      ultimo_login: '2024-01-10 11:20:00',
      sessoes_ativas: 0,
      empresa: 'Mercado do Pedro',
      created_at: '2023-12-20 15:30:00'
    },
    {
      id: 4,
      nome: 'Ana Oliveira',
      email: 'ana@varejo.com',
      telefone: '(11) 66666-6666',
      funcao: 'Estoquista',
      perfil: 'user',
      status: 'bloqueado',
      ultimo_login: '2024-01-12 08:15:00',
      sessoes_ativas: 0,
      empresa: 'Varejo da Ana',
      created_at: '2024-01-03 14:20:00'
    }
  ];

  useEffect(() => {
    // Simular carregamento da API
    setTimeout(() => {
      setUsers(mockUsers);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusBadge = (status) => {
    const statusConfig = {
      ativo: { variant: 'success', icon: CheckCircle, label: 'Ativo' },
      inativo: { variant: 'secondary', icon: Clock, label: 'Inativo' },
      bloqueado: { variant: 'destructive', icon: XCircle, label: 'Bloqueado' },
      suspenso: { variant: 'warning', icon: AlertTriangle, label: 'Suspenso' }
    };

    const config = statusConfig[status] || statusConfig.inativo;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getRoleBadge = (perfil) => {
    const roleConfig = {
      admin: { variant: 'destructive', label: 'Administrador' },
      manager: { variant: 'default', label: 'Gerente' },
      user: { variant: 'secondary', label: 'Usuário' }
    };

    const config = roleConfig[perfil] || roleConfig.user;

    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.empresa.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesRole = roleFilter === 'all' || user.perfil === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  const handleUserAction = (action, userId) => {
    toast.success(`Ação "${action}" executada para o usuário ${userId}`);
  };

  const handleRevokeSession = (userId, sessionId) => {
    toast.success(`Sessão revogada para o usuário ${userId}`);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Usuários</h1>
          <p className="text-gray-600">Gerencie usuários, sessões e permissões</p>
        </div>
        <Button className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome, email ou empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="bloqueado">Bloqueado</SelectItem>
                  <SelectItem value="suspenso">Suspenso</SelectItem>
                </SelectContent>
              </Select>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Perfis</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="manager">Gerente</SelectItem>
                  <SelectItem value="user">Usuário</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Usuários</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Usuários Ativos</p>
                <p className="text-2xl font-bold text-green-600">
                  {users.filter(u => u.status === 'ativo').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sessões Ativas</p>
                <p className="text-2xl font-bold text-orange-600">
                  {users.reduce((acc, u) => acc + u.sessoes_ativas, 0)}
                </p>
              </div>
              <Shield className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Usuários Bloqueados</p>
                <p className="text-2xl font-bold text-red-600">
                  {users.filter(u => u.status === 'bloqueado').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Lista de Usuários ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Usuário</th>
                  <th className="text-left p-3">Empresa</th>
                  <th className="text-left p-3">Perfil</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Sessões</th>
                  <th className="text-left p-3">Último Login</th>
                  <th className="text-left p-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div>
                        <p className="font-medium">{user.nome}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-sm text-gray-500">{user.telefone}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      <div>
                        <p className="font-medium">{user.empresa}</p>
                        <p className="text-sm text-gray-600">{user.funcao}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      {getRoleBadge(user.perfil)}
                    </td>
                    <td className="p-3">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {user.sessoes_ativas} ativa{user.sessoes_ativas !== 1 ? 's' : ''}
                        </Badge>
                        {user.sessoes_ativas > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRevokeSession(user.id)}
                            className="text-xs"
                          >
                            Revogar
                          </Button>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <p className="text-sm">
                        {new Date(user.ultimo_login).toLocaleString('pt-BR')}
                      </p>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUserAction('visualizar', user.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUserAction('editar', user.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUserAction('excluir', user.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum usuário encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

