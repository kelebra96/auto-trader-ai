import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import api from "@/services/api";

const categories = [
  { value: "tecnico", label: "Técnico" },
  { value: "financeiro", label: "Financeiro" },
  { value: "funcionalidade", label: "Funcionalidade" },
  { value: "bug", label: "Bug" },
  { value: "duvida", label: "Dúvida" },
  { value: "sugestao", label: "Sugestão" },
  { value: "outros", label: "Outros" },
];

const priorities = [
  { value: "baixa", label: "Baixa" },
  { value: "normal", label: "Normal" },
  { value: "alta", label: "Alta" },
  { value: "urgente", label: "Urgente" },
  { value: "critica", label: "Crítica" },
];

export default function NewTicketForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    categoria: 'duvida',
    prioridade: 'normal',
    anexos: [],
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, anexos: Array.from(e.target.files) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    data.append('titulo', formData.titulo);
    data.append('descricao', formData.descricao);
    data.append('categoria', formData.categoria);
    data.append('prioridade', formData.prioridade);
    formData.anexos.forEach((file) => {
      data.append('anexos', file);
    });

    try {
      await api.post('/suporte/chamados', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Sucesso', { description: 'Chamado aberto com sucesso!' });
      navigate('/support/tickets');
    } catch (err) {
      console.error('Erro ao abrir chamado:', err);
      toast.error('Erro', { description: err.response?.data?.error || 'Não foi possível abrir o chamado.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Abrir Novo Chamado</CardTitle>
          <CardDescription>Preencha os detalhes do seu problema ou solicitação.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="titulo">Título</Label>
              <Input
                id="titulo"
                name="titulo"
                value={formData.titulo}
                onChange={handleChange}
                placeholder="Assunto do chamado"
                required
              />
            </div>
            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                placeholder="Descreva seu problema em detalhes..."
                rows={5}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="categoria">Categoria</Label>
                <Select
                  name="categoria"
                  value={formData.categoria}
                  onValueChange={(value) => handleSelectChange('categoria', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="prioridade">Prioridade</Label>
                <Select
                  name="prioridade"
                  value={formData.prioridade}
                  onValueChange={(value) => handleSelectChange('prioridade', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((prio) => (
                      <SelectItem key={prio.value} value={prio.value}>
                        {prio.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="anexos">Anexos (opcional)</Label>
              <Input
                id="anexos"
                name="anexos"
                type="file"
                multiple
                onChange={handleFileChange}
              />
              <p className="text-sm text-gray-500 mt-1">Arquivos permitidos: .txt, .pdf, .png, .jpg, .jpeg, .gif, .doc, .docx, .xls, .xlsx, .zip, .rar (Máx. 10MB por arquivo)</p>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Abrindo Chamado...' : 'Abrir Chamado'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


