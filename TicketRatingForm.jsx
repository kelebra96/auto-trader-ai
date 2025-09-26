import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import api from "@/services/api";
import { Star } from 'lucide-react';

export default function TicketRatingForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTicket = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/suporte/chamados/${id}`);
        const fetchedTicket = response.data.chamado;
        if (fetchedTicket.status !== 'resolvido') {
          toast.error('Erro', { description: 'Apenas chamados resolvidos podem ser avaliados.' });
          navigate(`/support/tickets/${id}`);
          return;
        }
        if (fetchedTicket.avaliacao_nota) {
          toast.info('Informação', { description: 'Este chamado já foi avaliado.' });
          navigate(`/support/tickets/${id}`);
          return;
        }
        setTicket(fetchedTicket);
      } catch (err) {
        console.error('Erro ao buscar chamado para avaliação:', err);
        setError('Não foi possível carregar o chamado para avaliação.');
        toast.error('Erro', { description: err.response?.data?.error || 'Não foi possível carregar o chamado.' });
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [id, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Erro', { description: 'Por favor, selecione uma nota.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/suporte/chamados/${id}/avaliar`, { nota: rating, comentario: comment });
      toast.success('Sucesso', { description: 'Chamado avaliado com sucesso!' });
      navigate(`/support/tickets/${id}`);
    } catch (err) {
      console.error('Erro ao enviar avaliação:', err);
      toast.error('Erro', { description: err.response?.data?.error || 'Não foi possível enviar sua avaliação.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-8">Carregando chamado para avaliação...</div>;
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;
  if (!ticket) return <div className="text-center py-8">Chamado não encontrado ou não elegível para avaliação.</div>;

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Avaliar Chamado #{ticket.numero}</CardTitle>
          <CardDescription>Sua opinião é muito importante para melhorarmos nosso serviço.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Sua Nota</Label>
              <div className="flex space-x-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`cursor-pointer ${star <= rating ? 'text-yellow-500' : 'text-gray-300'}`}
                    onClick={() => setRating(star)}
                    size={32}
                    fill={star <= rating ? 'currentColor' : 'none'}
                  />
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="comment">Comentário (opcional)</Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Deixe seu comentário sobre o atendimento..."
                rows={4}
                disabled={isSubmitting}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting || rating === 0}>
              {isSubmitting ? 'Enviando Avaliação...' : 'Enviar Avaliação'}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => navigate(`/support/tickets/${id}`)}>Cancelar</Button>
        </CardFooter>
      </Card>
    </div>
  );
}


