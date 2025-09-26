import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Calendar, Clock, Bell, Package, AlertTriangle, TrendingDown, Settings } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { alertConfigService } from '../../services/api';

const ScheduleAlertForm = ({ onClose, onSuccess }) => {
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tipo: '',
    titulo: '',
    descricao: '',
    data_agendamento: '',
    hora_agendamento: '',
    recorrencia: 'unica',
    categoria_produto: '',
    dias_antecedencia: '7',
    ativo: true,
    notificar_email: true,
    notificar_sistema: true
  });

  const tiposAlerta = [
    {
      id: 'validade',
      nome: 'Alerta de Validade',
      descricao: 'Notificação quando produtos estão próximos do vencimento',
      icon: AlertTriangle,
      color: 'orange'
    },
    {
      id: 'estoque_baixo',
      nome: 'Estoque Baixo',
      descricao: 'Alerta quando produtos atingem estoque mínimo',
      icon: Package,
      color: 'red'
    },
    {
      id: 'inventario',
      nome: 'Inventário Programado',
      descricao: 'Lembrete para realizar contagem de estoque',
      icon: Calendar,
      color: 'blue'
    },
    {
      id: 'personalizado',
      nome: 'Alerta Personalizado',
      descricao: 'Alerta customizado com data e hora específicas',
      icon: Bell,
      color: 'purple'
    }
  ];

  const categorias = [
    'Todas as Categorias',
    'Laticínios',
    'Padaria',
    'Frios',
    'Bebidas',
    'Carnes',
    'Frutas e Verduras',
    'Congelados',
    'Higiene',
    'Limpeza'
  ];

  const recorrenciaOpcoes = [
    { value: 'unica', label: 'Única vez' },
    { value: 'diaria', label: 'Diariamente' },
    { value: 'semanal', label: 'Semanalmente' },
    { value: 'mensal', label: 'Mensalmente' }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTipoChange = (tipoId) => {
    const tipo = tiposAlerta.find(t => t.id === tipoId);
    setFormData(prev => ({
      ...prev,
      tipo: tipoId,
      titulo: tipo?.nome || '',
      descricao: tipo?.descricao || ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.tipo) {
      addNotification('Selecione um tipo de alerta', 'error');
      return;
    }

    setLoading(true);

    try {
      // Preparar dados para envio
      const alertConfig = {
        tipo_alerta: formData.tipo,
        ativo: formData.ativo,
        dias_antecedencia: parseInt(formData.dias_antecedencia),
        estoque_minimo: 5, // valor padrão
        categorias: formData.categoria_produto ? [formData.categoria_produto] : null,
        notificar_email: formData.notificar_email,
        notificar_sistema: formData.notificar_sistema,
        recorrencia: formData.recorrencia,
        horario_notificacao: formData.hora_agendamento || null
      };
      
      // Criar configuração de alerta via API
      await alertConfigService.createAlertConfig(alertConfig);
      
      addNotification('Alerta agendado com sucesso!', 'success');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Erro ao agendar alerta:', error);
      addNotification('Erro ao agendar alerta. Tente novamente.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const formatTime = () => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Seleção do Tipo de Alerta */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Tipo de Alerta *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tiposAlerta.map((tipo) => {
            const Icon = tipo.icon;
            return (
              <div
                key={tipo.id}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  formData.tipo === tipo.id
                    ? `border-${tipo.color}-500 bg-${tipo.color}-50`
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleTipoChange(tipo.id)}
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg bg-${tipo.color}-100`}>
                    <Icon className={`h-5 w-5 text-${tipo.color}-600`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{tipo.nome}</h4>
                    <p className="text-sm text-gray-600 mt-1">{tipo.descricao}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {formData.tipo && (
        <>
          {/* Título e Descrição */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 mb-1">
                Título do Alerta *
              </label>
              <input
                type="text"
                id="titulo"
                name="titulo"
                value={formData.titulo}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Verificar produtos vencendo"
                required
              />
            </div>

            <div>
              <label htmlFor="recorrencia" className="block text-sm font-medium text-gray-700 mb-1">
                Recorrência
              </label>
              <select
                id="recorrencia"
                name="recorrencia"
                value={formData.recorrencia}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {recorrenciaOpcoes.map(opcao => (
                  <option key={opcao.value} value={opcao.value}>
                    {opcao.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              id="descricao"
              name="descricao"
              value={formData.descricao}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descrição detalhada do alerta..."
            />
          </div>

          {/* Configurações específicas por tipo */}
          {(formData.tipo === 'validade' || formData.tipo === 'estoque_baixo') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="categoria_produto" className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria de Produto
                </label>
                <select
                  id="categoria_produto"
                  name="categoria_produto"
                  value={formData.categoria_produto}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categorias.map(categoria => (
                    <option key={categoria} value={categoria}>
                      {categoria}
                    </option>
                  ))}
                </select>
              </div>

              {formData.tipo === 'validade' && (
                <div>
                  <label htmlFor="dias_antecedencia" className="block text-sm font-medium text-gray-700 mb-1">
                    Dias de Antecedência
                  </label>
                  <select
                    id="dias_antecedencia"
                    name="dias_antecedencia"
                    value={formData.dias_antecedencia}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1">1 dia</option>
                    <option value="3">3 dias</option>
                    <option value="7">7 dias</option>
                    <option value="15">15 dias</option>
                    <option value="30">30 dias</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Data e Hora para alertas personalizados */}
          {formData.tipo === 'personalizado' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="data_agendamento" className="block text-sm font-medium text-gray-700 mb-1">
                  Data do Alerta *
                </label>
                <input
                  type="date"
                  id="data_agendamento"
                  name="data_agendamento"
                  value={formData.data_agendamento}
                  onChange={handleChange}
                  min={formatDate()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="hora_agendamento" className="block text-sm font-medium text-gray-700 mb-1">
                  Hora do Alerta *
                </label>
                <input
                  type="time"
                  id="hora_agendamento"
                  name="hora_agendamento"
                  value={formData.hora_agendamento}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          )}

          {/* Opções de Notificação */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Métodos de Notificação
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="notificar_sistema"
                  checked={formData.notificar_sistema}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Notificação no sistema</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="notificar_email"
                  checked={formData.notificar_email}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Notificação por email</span>
              </label>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="ativo"
                checked={formData.ativo}
                onChange={handleChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Alerta ativo</span>
            </label>
          </div>
        </>
      )}

      {/* Botões */}
      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={Boolean(loading || !formData.tipo)}
        >
          {loading ? 'Agendando...' : 'Agendar Alerta'}
        </Button>
      </div>
    </form>
  );
};

export default ScheduleAlertForm;