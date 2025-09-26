import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import api from "@/services/api";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const statusMap = {
  aberto: { text: "Aberto", variant: "default" },
  em_andamento: { text: "Em Andamento", variant: "secondary" },
  aguardando_cliente: { text: "Aguardando Cliente", variant: "warning" },
  resolvido: { text: "Resolvido", variant: "success" },
  fechado: { text: "Fechado", variant: "outline" },
  cancelado: { text: "Cancelado", variant: "destructive" },
};

const priorityMap = {
  baixa: { text: "Baixa", variant: "outline" },
  normal: { text: "Normal", variant: "default" },
  alta: { text: "Alta", variant: "secondary" },
  urgente: { text: "Urgente", variant: "warning" },
  critica: { text: "Crítica", variant: "destructive" },
};

const categoryMap = {
  tecnico: "Técnico",
  financeiro: "Financeiro",
  funcionalidade: "Funcionalidade",
  bug: "Bug",
  duvida: "Dúvida",
  sugestao: "Sugestão",
  outros: "Outros",
};

const availableStatuses = Object.keys(statusMap);

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [newFiles, setNewFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const messagesEndRef = useRef(null);

  const fetchTicketDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/suporte/chamados/${id}`);
      setTicket(response.data.chamado);
      setMessages(response.data.mensagens);
      setNewStatus(response.data.chamado.status); // Set initial status for dropdown
    } catch (err) {
      console.error("Erro ao buscar detalhes do chamado:", err);
      setError("Não foi possível carregar os detalhes do chamado.");
      toast.error("Erro", { description: "Não foi possível carregar os detalhes do chamado." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketDetails();
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && newFiles.length === 0) return;

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('conteudo', newMessage);
    newFiles.forEach((file) => {
      formData.append('anexos', file);
    });

    try {
      const response = await api.post(`/suporte/chamados/${id}/mensagens`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setMessages((prev) => [...prev, response.data.mensagem]);
      setNewMessage('');
      setNewFiles([]);
      toast.success('Sucesso', { description: 'Mensagem enviada com sucesso!' });
      fetchTicketDetails(); // Refresh ticket details to update status if changed
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      toast.error('Erro', { description: err.response?.data?.error || 'Não foi possível enviar a mensagem.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    setNewFiles(Array.from(e.target.files));
  };

  const handleStatusChange = async (status) => {
    if (status === ticket.status) return; // No change
    setIsSubmitting(true);
    try {
      await api.put(`/suporte/chamados/${id}/status`, { status });
      toast.success('Sucesso', { description: `Status do chamado atualizado para ${statusMap[status]?.text}.` });
      fetchTicketDetails(); // Refresh ticket details
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      toast.error('Erro', { description: err.response?.data?.error || 'Não foi possível atualizar o status.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-8">Carregando detalhes do chamado...</div>;
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;
  if (!ticket) return <div className="text-center py-8">Chamado não encontrado.</div>;

  const isSupportUser = ['admin', 'suporte'].includes(ticket.usuario.perfil);

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Chamado #{ticket.numero} - {ticket.titulo}</CardTitle>
          <CardDescription>
            Criado por: {ticket.usuario.nome} ({ticket.usuario.email}) em {format(new Date(ticket.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p><strong>Empresa:</strong> {ticket.empresa.nome}</p>
              <p><strong>Categoria:</strong> <Badge variant="outline">{categoryMap[ticket.categoria]}</Badge></p>
              <p><strong>Prioridade:</strong> <Badge variant={priorityMap[ticket.prioridade]?.variant || "default"}>{priorityMap[ticket.prioridade]?.text}</Badge></p>
              <p><strong>Status:</strong> <Badge variant={statusMap[ticket.status]?.variant || "default"}>{statusMap[ticket.status]?.text}</Badge></p>
              {ticket.atendente && <p><strong>Atendente:</strong> {ticket.atendente.nome}</p>}
            </div>
            <div>
              <p><strong>Descrição:</strong> {ticket.descricao}</p>
              {ticket.data_limite_resposta && <p><strong>SLA Resposta:</strong> {format(new Date(ticket.data_limite_resposta), 'dd/MM/yyyy HH:mm', { locale: ptBR })} {ticket.sla_resposta_vencido && <Badge variant="destructive">Vencido</Badge>}</p>}
              {ticket.data_limite_resolucao && <p><strong>SLA Resolução:</strong> {format(new Date(ticket.data_limite_resolucao), 'dd/MM/yyyy HH:mm', { locale: ptBR })} {ticket.sla_resolucao_vencido && <Badge variant="destructive">Vencido</Badge>}</p>}
              {ticket.resolvido_em && <p><strong>Resolvido em:</strong> {format(new Date(ticket.resolvido_em), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>}
              {ticket.fechado_em && <p><strong>Fechado em:</strong> {format(new Date(ticket.fechado_em), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>}
            </div>
          </div>

          {isSupportUser && (ticket.status !== 'fechado' && ticket.status !== 'cancelado') && (
            <div className="mb-4">
              <Label htmlFor="status-select">Atualizar Status</Label>
              <Select value={newStatus} onValueChange={handleStatusChange} disabled={isSubmitting}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Alterar Status" />
                </SelectTrigger>
                <SelectContent>
                  {availableStatuses.map((statusKey) => (
                    <SelectItem key={statusKey} value={statusKey}>
                      {statusMap[statusKey]?.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <h3 className="text-xl font-semibold mb-3">Mensagens</h3>
          <div className="space-y-4 max-h-96 overflow-y-auto p-2 border rounded-md bg-gray-50">
            {messages.length === 0 ? (
              <p className="text-center text-gray-500">Nenhuma mensagem ainda.</p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.usuario.id === ticket.usuario_id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-3 rounded-lg ${msg.usuario.id === ticket.usuario_id ? 'bg-blue-100 text-right' : 'bg-gray-100 text-left'}`}>
                    <p className="font-semibold text-sm">{msg.usuario.nome} ({msg.usuario.perfil})</p>
                    <p className="text-sm">{msg.conteudo}</p>
                    {msg.total_anexos > 0 && (
                      <p className="text-xs text-gray-500 mt-1">Anexos: {msg.total_anexos}</p>
                    )}
                    <span className="text-xs text-gray-400 block mt-1">
                      {format(new Date(msg.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </span>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {(ticket.status !== 'fechado' && ticket.status !== 'cancelado') && (
            <form onSubmit={handleSendMessage} className="mt-4 space-y-3">
              <div>
                <Label htmlFor="newMessage">Sua Mensagem</Label>
                <Textarea
                  id="newMessage"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite sua resposta..."
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="newFiles">Anexar Arquivos (opcional)</Label>
                <Input
                  id="newFiles"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  disabled={isSubmitting}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting || (!newMessage.trim() && newFiles.length === 0)}>
                {isSubmitting ? 'Enviando...' : 'Enviar Mensagem'}
              </Button>
            </form>
          )}

          {ticket.status === 'resolvido' && !ticket.avaliacao_nota && !isSupportUser && (
            <div className="mt-6 p-4 border rounded-md bg-yellow-50">
              <h3 className="text-lg font-semibold mb-2">Avalie este Chamado</h3>
              <p className="text-sm text-gray-700 mb-3">Sua opinião é importante para melhorarmos nosso serviço.</p>
              <Button onClick={() => navigate(`/support/tickets/${id}/rate`)}>
                Avaliar Chamado
              </Button>
            </div>
          )}

        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => navigate('/support/tickets')}>Voltar para Chamados</Button>
        </CardFooter>
      </Card>
    </div>
  );
}


