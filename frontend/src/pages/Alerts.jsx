import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Package, Calendar, CheckCircle, Settings, Eye, Clock } from 'lucide-react';
import { alertService, productService, alertConfigService } from '../services/api';
import { useNavigate } from 'react-router-dom';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfig, setShowConfig] = useState(false);
  const [configurations, setConfigurations] = useState([]);
  const navigate = useNavigate();

  // Carregar alertas
  const loadAlerts = async () => {
    try {
      setLoading(true);
      const alertsData = await alertService.getAlertas();
      setAlerts(alertsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Carregar configurações
  const loadConfigurations = async () => {
    try {
      const configs = await alertConfigService.getConfiguracoes();
      setConfigurations(configs);
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
    }
  };

  // Marcar alerta como lido
  const handleMarkAsRead = async (alertId) => {
    try {
      await alertService.marcarAlertaLido(alertId);
      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, lido: true } : alert
      ));
    } catch (err) {
      setError(err.message);
    }
  };

  // Marcar todos como lidos
  const handleMarkAllAsRead = async () => {
    try {
      await alertService.marcarTodosLidos();
      setAlerts(alerts.map(alert => ({ ...alert, lido: true })));
    } catch (err) {
      setError(err.message);
    }
  };

  // Ver produto
  const handleViewProduct = async (productId) => {
    if (productId) {
      navigate(`/produtos?highlight=${productId}`);
    }
  };

  // Gerar alertas automáticos
  const handleGenerateAlerts = async () => {
    try {
      await alertService.gerarAlertas();
      await loadAlerts(); // Recarregar alertas
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadAlerts();
    loadConfigurations();
  }, []);

  const getUrgencyColor = (urgencia) => {
    switch (urgencia) {
      case 'alta': return 'bg-red-100 text-red-800 border-red-200';
      case 'media': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'baixa': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getIcon = (tipo) => {
    switch (tipo) {
      case 'vencimento': return <Calendar className="h-5 w-5" />;
      case 'estoque_baixo': return <Package className="h-5 w-5" />;
      default: return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Alertas</h1>
        <div className="flex gap-2">
          <button 
            onClick={handleGenerateAlerts}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Gerar Alertas
          </button>
          <button 
            onClick={handleMarkAllAsRead}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Marcar todos como lidos
          </button>
          <button 
            onClick={() => setShowConfig(!showConfig)}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Configurar alertas
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Configurações de Alertas */}
      {showConfig && (
        <AlertConfigPanel 
          configurations={configurations}
          onSave={loadConfigurations}
          onClose={() => setShowConfig(false)}
        />
      )}

      {/* Lista de Alertas */}
      <div className="grid gap-4">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-4 border rounded-lg ${getUrgencyColor(alert.urgencia)} ${
              alert.lido ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                {getIcon(alert.tipo)}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{alert.titulo}</h3>
                    <p className="text-sm mt-1">{alert.descricao}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {formatDate(alert.created_at)}
                    </p>
                  </div>
                  {alert.lido && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                </div>
                <div className="mt-3 flex gap-2">
                  {alert.produto_id && (
                    <button 
                      onClick={() => handleViewProduct(alert.produto_id)}
                      className="text-xs px-3 py-1 bg-white bg-opacity-70 rounded hover:bg-opacity-90 flex items-center gap-1"
                    >
                      <Eye className="h-3 w-3" />
                      Ver produto
                    </button>
                  )}
                  {!alert.lido && (
                    <button 
                      onClick={() => handleMarkAsRead(alert.id)}
                      className="text-xs px-3 py-1 bg-white bg-opacity-70 rounded hover:bg-opacity-90 flex items-center gap-1"
                    >
                      <CheckCircle className="h-3 w-3" />
                      Marcar como lido
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {alerts.length === 0 && !loading && (
        <div className="text-center py-12">
          <Bell className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum alerta</h3>
          <p className="mt-1 text-sm text-gray-500">
            Todos os produtos estão dentro dos parâmetros normais.
          </p>
          <button 
            onClick={handleGenerateAlerts}
            className="mt-4 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Gerar Alertas Automáticos
          </button>
        </div>
      )}
    </div>
  );
};

// Componente para configuração de alertas
const AlertConfigPanel = ({ configurations, onSave, onClose }) => {
  const [configs, setConfigs] = useState({
    vencimento: {
      ativo: true,
      dias_antecedencia: 7,
      notificar_email: true,
      notificar_sistema: true
    },
    estoque_baixo: {
      ativo: true,
      estoque_minimo: 5,
      notificar_email: true,
      notificar_sistema: true
    }
  });

  useEffect(() => {
    // Carregar configurações existentes
    configurations.forEach(config => {
      setConfigs(prev => ({
        ...prev,
        [config.tipo_alerta]: {
          ativo: config.ativo,
          dias_antecedencia: config.dias_antecedencia || 7,
          estoque_minimo: config.estoque_minimo || 5,
          notificar_email: config.notificar_email,
          notificar_sistema: config.notificar_sistema
        }
      }));
    });
  }, [configurations]);

  const handleSave = async () => {
    try {
      // Salvar configuração de vencimento
      await alertConfigService.salvarConfiguracao({
        tipo_alerta: 'vencimento',
        ...configs.vencimento
      });

      // Salvar configuração de estoque baixo
      await alertConfigService.salvarConfiguracao({
        tipo_alerta: 'estoque_baixo',
        ...configs.estoque_baixo
      });

      onSave();
      onClose();
    } catch (err) {
      console.error('Erro ao salvar configurações:', err);
    }
  };

  return (
    <div className="bg-white border rounded-lg p-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Configurações de Alertas</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          ✕
        </button>
      </div>

      <div className="space-y-6">
        {/* Configuração de Vencimento */}
        <div className="border-b pb-4">
          <h3 className="font-medium mb-3">Alertas de Vencimento</h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={configs.vencimento.ativo}
                onChange={(e) => setConfigs(prev => ({
                  ...prev,
                  vencimento: { ...prev.vencimento, ativo: e.target.checked }
                }))}
                className="mr-2"
              />
              Ativar alertas de vencimento
            </label>
            <div className="flex items-center gap-2">
              <label className="text-sm">Alertar com</label>
              <input
                type="number"
                value={configs.vencimento.dias_antecedencia}
                onChange={(e) => setConfigs(prev => ({
                  ...prev,
                  vencimento: { ...prev.vencimento, dias_antecedencia: parseInt(e.target.value) }
                }))}
                className="w-16 px-2 py-1 border rounded text-sm"
                min="1"
              />
              <label className="text-sm">dias de antecedência</label>
            </div>
          </div>
        </div>

        {/* Configuração de Estoque */}
        <div className="border-b pb-4">
          <h3 className="font-medium mb-3">Alertas de Estoque Baixo</h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={configs.estoque_baixo.ativo}
                onChange={(e) => setConfigs(prev => ({
                  ...prev,
                  estoque_baixo: { ...prev.estoque_baixo, ativo: e.target.checked }
                }))}
                className="mr-2"
              />
              Ativar alertas de estoque baixo
            </label>
            <div className="flex items-center gap-2">
              <label className="text-sm">Alertar quando estoque ≤</label>
              <input
                type="number"
                value={configs.estoque_baixo.estoque_minimo}
                onChange={(e) => setConfigs(prev => ({
                  ...prev,
                  estoque_baixo: { ...prev.estoque_baixo, estoque_minimo: parseInt(e.target.value) }
                }))}
                className="w-16 px-2 py-1 border rounded text-sm"
                min="1"
              />
              <label className="text-sm">unidades</label>
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  );
};

export default Alerts;