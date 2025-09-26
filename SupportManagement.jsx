import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageSquare, 
  Search, 
  Filter, 
  Clock, 
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Reply,
  Archive,
  Star,
  Calendar,
  Timer
} from 'lucide-react';
import { toast } from 'sonner';

export default function SupportManagement() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');

  // Mock data - substituir pela API real
  const mockTickets = [
    {
      id: 'SUP-20240115-0001',
      titulo: 'Erro ao gerar relatório de validade',
      descricao: 'O sistema apresenta erro 500 ao tentar gerar o relatório mensal de produtos próximos ao vencimento.',
      categoria: 'bug',
      prioridade: 'alta',
      status: 'aberto',
      cliente: {
        nome: 'João Silva',
        email: 'joao@empresa.com',
        empresa: 'Supermercado Silva'
      },
      created_at: '2024-01-15 09:30:00',
      updated_at: '2024-01-15 09:30:00',
      sla_vencimento: '2024-01-15 10:30:00',
      tempo_resposta: null,
      tempo_resolucao: null,
      avaliacao: null,
      mensagens: [
        {
          id: 1,
          autor: 'João Silva',
          tipo: 'cliente',
          mensagem: 'O sistema apresenta erro 500 ao tentar gerar o relatório mensal.',
          created_at: '2024-01-15 09:30:00',
          anexos: []
        }
      ]
    },
    {
      id: 'SUP-20240115-0002',
      titulo: 'Dúvida sobre configuração de alertas',
      descricao: 'Como configurar alertas personalizados para diferentes categorias de produtos?',
      categoria: 'duvida',
      prioridade: 'normal',
      status: 'em_andamento',
      cliente: {
        nome: 'Maria Santos',
        email: 'maria@loja.com',
        empresa: 'Loja da Maria'
      },
      created_at: '2024-01-15 08:15:00',
      updated_at: '2024-01-15 14:20:00',
      sla_vencimento: '2024-01-15 09:15:00',
      tempo_resposta: 45, // minutos
      tempo_resolucao: null,
      avaliacao: null,
      mensagens: [
        {
          id: 1,
          autor: 'Maria Santos',
          tipo: 'cliente',
          mensagem: 'Como configurar alertas personalizados para diferentes categorias?',
          created_at: '2024-01-15 08:15:00',
          anexos: []
        },
        {
          id: 2,
          autor: 'Suporte Técnico',
          tipo: 'suporte',
          mensagem: 'Olá Maria! Para configurar alertas personalizados, acesse o menu Configurações > Alertas...',
          created_at: '2024-01-15 09:00:00',
          anexos: []
        }
      ]
    },
    {
      id: 'SUP-20240114-0003',
      titulo: 'Solicitação de nova funcionalidade',
      descricao: 'Gostaria de sugerir a implementação de relatórios por fornecedor.',
      categoria: 'sugestao',
      prioridade: 'baixa',
      status: 'resolvido',
      cliente: {
        nome: 'Pedro Costa',
        email: 'pedro@mercado.com',
        empresa: 'Mercado do Pedro'
      },
      created_at: '2024-01-14 16:45:00',
      updated_at: '2024-01-15 11:30:00',
      sla_vencimento: '2024-01-14 17:45:00',
      tempo_resposta: 30,
      tempo_resolucao: 1125, // minutos
      avaliacao: {
        nota: 5,
        comentario: 'Excelente atendimento!'
      },
      mensagens: [
        {
          id: 1,
          autor: 'Pedro Costa',
          tipo: 'cliente',
          mensagem: 'Gostaria de sugerir a implementação de relatórios por fornecedor.',
          created_at: '2024-01-14 16:45:00',
          anexos: []
        },
        {
          id: 2,
          autor: 'Suporte Técnico',
          tipo: 'suporte',
          mensagem: 'Obrigado pela sugestão! Vamos avaliar a implementação desta funcionalidade.',
          created_at: '2024-01-14 17:15:00',
          anexos: []
        }
      ]
    }
  ];

  useEffect(() => {
    // Simular carregamento da API
    setTimeout(() => {
      setTickets(mockTickets);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusBadge = (status) => {
    const statusConfig = {
      aberto: { variant: 'destructive', icon: AlertCircle, label: 'Aberto' },
      em_andamento: { variant: 'default', icon: Clock, label: 'Em Andamento' },
      aguardando_cliente: { variant: 'secondary', icon: User, label: 'Aguardando Cliente' },
      resolvido: { variant: 'success', icon: CheckCircle, label: 'Resolvido' },
      fechado: { variant: 'outline', icon: Archive, label: 'Fechado' }
    };

    const config = statusConfig[status] || statusConfig.aberto;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (prioridade) => {
    const priorityConfig = {
      critica: { variant: 'destructive', label: 'Crítica' },
      urgente: { variant: 'destructive', label: 'Urgente' },
      alta: { variant: 'warning', label: 'Alta' },
      normal: { variant: 'default', label: 'Normal' },
      baixa: { variant: 'secondary', label: 'Baixa' }
    };

    const config = priorityConfig[prioridade] || priorityConfig.normal;

    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const getSLAStatus = (ticket) => {
    const now = new Date();
    const slaTime = new Date(ticket.sla_vencimento);
    const isOverdue = now > slaTime;
    const minutesLeft = Math.floor((slaTime - now) / (1000 * 60));

    if (ticket.status === 'resolvido' || ticket.status === 'fechado') {
      return <Badge variant="success">SLA Cumprido</Badge>;
    }

    if (isOverdue) {
      return <Badge variant="destructive">SLA Vencido</Badge>;
    }

    if (minutesLeft <= 30) {
      return <Badge variant="warning">SLA Crítico ({minutesLeft}min)</Badge>;
    }

    return <Badge variant="outline">SLA OK ({minutesLeft}min)</Badge>;
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.cliente.empresa.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.prioridade === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleTicketAction = (action, ticketId) => {
    toast.success(`Ação "${action}" executada para o chamado ${ticketId}`);
  };

  const handleReply = (ticketId) => {
    if (!replyMessage.trim()) {
      toast.error('Digite uma mensagem para responder');
      return;
    }

    // Simular envio da resposta
    toast.success('Resposta enviada com sucesso!');
    setReplyMessage('');
    setSelectedTicket(null);
  };

  const getTicketStats = () => {
    const stats = {
      total: tickets.length,
      abertos: tickets.filter(t => t.status === 'aberto').length,
      em_andamento: tickets.filter(t => t.status === 'em_andamento').length,
      vencidos: tickets.filter(t => {
        const now = new Date();
        const sla = new Date(t.sla_vencimento);
        return now > sla && t.status !== 'resolvido' && t.status !== 'fechado';
      }).length
    };
    return stats;
  };

  const stats = getTicketStats();

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
          <h1 className="text-3xl font-bold">Gestão de Chamados</h1>
          <p className="text-gray-600">Gerencie e responda aos chamados de suporte</p>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Chamados</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Chamados Abertos</p>
                <p className="text-2xl font-bold text-red-600">{stats.abertos}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Em Andamento</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.em_andamento}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">SLA Vencido</p>
                <p className="text-2xl font-bold text-red-600">{stats.vencidos}</p>
              </div>
              <Timer className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por título, cliente ou empresa..."
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
                  <SelectItem value="aberto">Aberto</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="aguardando_cliente">Aguardando Cliente</SelectItem>
                  <SelectItem value="resolvido">Resolvido</SelectItem>
                  <SelectItem value="fechado">Fechado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Prioridades</SelectItem>
                  <SelectItem value="critica">Crítica</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Chamados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Chamados de Suporte ({filteredTickets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Chamado</th>
                  <th className="text-left p-3">Cliente</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Prioridade</th>
                  <th className="text-left p-3">SLA</th>
                  <th className="text-left p-3">Criado em</th>
                  <th className="text-left p-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div>
                        <p className="font-medium">{ticket.id}</p>
                        <p className="text-sm text-gray-600">{ticket.titulo}</p>
                        <Badge variant="outline" className="mt-1">
                          {ticket.categoria}
                        </Badge>
                      </div>
                    </td>
                    <td className="p-3">
                      <div>
                        <p className="font-medium">{ticket.cliente.nome}</p>
                        <p className="text-sm text-gray-600">{ticket.cliente.email}</p>
                        <p className="text-sm text-gray-500">{ticket.cliente.empresa}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      {getStatusBadge(ticket.status)}
                    </td>
                    <td className="p-3">
                      {getPriorityBadge(ticket.prioridade)}
                    </td>
                    <td className="p-3">
                      {getSLAStatus(ticket)}
                    </td>
                    <td className="p-3">
                      <p className="text-sm">
                        {new Date(ticket.created_at).toLocaleString('pt-BR')}
                      </p>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTicketAction('responder', ticket.id)}
                        >
                          <Reply className="h-4 w-4" />
                        </Button>
                        {ticket.avaliacao && (
                          <div className="flex items-center gap-1 ml-2">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="text-sm">{ticket.avaliacao.nota}</span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredTickets.length === 0 && (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum chamado encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes do Chamado */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold">{selectedTicket.id}</h2>
                  <p className="text-gray-600">{selectedTicket.titulo}</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setSelectedTicket(null)}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Cliente</p>
                    <p className="font-medium">{selectedTicket.cliente.nome}</p>
                    <p className="text-sm text-gray-500">{selectedTicket.cliente.empresa}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    {getStatusBadge(selectedTicket.status)}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Mensagens</p>
                  <div className="space-y-3 max-h-60 overflow-y-auto border rounded p-3">
                    {selectedTicket.mensagens.map((mensagem) => (
                      <div key={mensagem.id} className={`p-3 rounded ${
                        mensagem.tipo === 'cliente' ? 'bg-gray-100' : 'bg-blue-50'
                      }`}>
                        <div className="flex justify-between items-center mb-2">
                          <p className="font-medium text-sm">{mensagem.autor}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(mensagem.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <p className="text-sm">{mensagem.mensagem}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="reply">Responder</Label>
                  <Textarea
                    id="reply"
                    placeholder="Digite sua resposta..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedTicket(null)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => handleReply(selectedTicket.id)}
                  >
                    Enviar Resposta
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

