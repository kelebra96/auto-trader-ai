import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { toast } from "sonner";
import api from "@/services/api";

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

export default function SupportTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: "",
    categoria: "",
    prioridade: "",
    search: "",
  });

  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        page: page,
        per_page: 10,
        ...(filters.status && { status: filters.status }),
        ...(filters.categoria && { categoria: filters.categoria }),
        ...(filters.prioridade && { prioridade: filters.prioridade }),
        // TODO: Adicionar filtro de busca no backend
      }).toString();

      const response = await api.get(`/suporte/chamados?${queryParams}`);
      setTickets(response.data.chamados);
      setTotalPages(response.data.pages);
    } catch (err) {
      console.error("Erro ao buscar chamados:", err);
      setError("Não foi possível carregar os chamados.");
      toast.error("Erro", { description: "Não foi possível carregar os chamados." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [page, filters]);

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1); // Resetar para a primeira página ao aplicar filtro
  };

  if (loading) return <div className="text-center py-8">Carregando chamados...</div>;
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Meus Chamados de Suporte</CardTitle>
          <CardDescription>Acompanhe o status e o histórico dos seus chamados.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <Input
              placeholder="Buscar por título ou descrição..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="max-w-sm"
            />
            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange("status", value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os Status</SelectItem>
                {Object.entries(statusMap).map(([key, { text }]) => (
                  <SelectItem key={key} value={key}>
                    {text}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.prioridade}
              onValueChange={(value) => handleFilterChange("prioridade", value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as Prioridades</SelectItem>
                {Object.entries(priorityMap).map(([key, { text }]) => (
                  <SelectItem key={key} value={key}>
                    {text}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.categoria}
              onValueChange={(value) => handleFilterChange("categoria", value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as Categorias</SelectItem>
                {Object.entries(categoryMap).map(([key, text]) => (
                  <SelectItem key={key} value={key}>
                    {text}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => handleFilterChange("search", "")} variant="outline">Limpar Busca</Button>
          </div>

          {tickets.length === 0 ? (
            <p className="text-center text-gray-500">Nenhum chamado encontrado com os filtros aplicados.</p>
          ) : (
            <div className="grid gap-4">
              {tickets.map((ticket) => (
                <Card key={ticket.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4">
                  <div className="flex-1 mb-2 md:mb-0">
                    <Link to={`/support/tickets/${ticket.id}`} className="text-lg font-semibold hover:underline">
                      #{ticket.numero} - {ticket.titulo}
                    </Link>
                    <p className="text-sm text-gray-600 line-clamp-1">{ticket.descricao}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant={statusMap[ticket.status]?.variant || "default"}>
                        {statusMap[ticket.status]?.text || ticket.status}
                      </Badge>
                      <Badge variant={priorityMap[ticket.prioridade]?.variant || "default"}>
                        {priorityMap[ticket.prioridade]?.text || ticket.prioridade}
                      </Badge>
                      <Badge variant="outline">{categoryMap[ticket.categoria] || ticket.categoria}</Badge>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="text-sm text-gray-500">Criado em: {new Date(ticket.created_at).toLocaleDateString()}</span>
                    {ticket.data_limite_resposta && (
                      <span className="text-sm text-red-500">SLA Resposta: {new Date(ticket.data_limite_resposta).toLocaleDateString()}</span>
                    )}
                    <Link to={`/support/tickets/${ticket.id}`}>
                      <Button size="sm" className="mt-2">Ver Detalhes</Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page === 1} />
              </PaginationItem>
              {[...Array(totalPages)].map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink onClick={() => setPage(i + 1)} isActive={page === i + 1}>
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} disabled={page === totalPages} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </CardFooter>
      </Card>
      <div className="text-center mt-6">
        <Link to="/support/tickets/new">
          <Button size="lg">Abrir Novo Chamado</Button>
        </Link>
      </div>
    </div>
  );
}


