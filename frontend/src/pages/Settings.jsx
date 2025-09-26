import React, { useState, useEffect } from 'react';
import { Save, Bell, Shield, Database, Mail, Download, Upload, Server, Palette } from 'lucide-react';
import { configService } from '../services/api';

const Settings = () => {
  const [settings, setSettings] = useState({
    notificacoes_email: true,
    notificacoes_push: true,
    dias_antecedencia_notificacao: 7,
    autenticacao_dois_fatores: false,
    timeout_sessao: 60,
    tema: 'light',
    idioma: 'pt-BR',
    smtp_servidor: '',
    smtp_porta: 587,
    smtp_usuario: '',
    smtp_senha: '',
    smtp_ssl: true,
    backup_automatico: false,
    frequencia_backup: 'semanal',
    local_backup: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const configuracoes = await configService.getConfiguracoes();
      setSettings(configuracoes);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      showMessage('Erro ao carregar configurações', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await configService.salvarConfiguracoes(settings);
      showMessage('Configurações salvas com sucesso!', 'success');
      
      // Aplicar tema imediatamente
      if (settings.tema === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      showMessage('Erro ao salvar configurações', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      const dados = await configService.exportarDados();
      const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-dados-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showMessage('Dados exportados com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      showMessage('Erro ao exportar dados', 'error');
    }
  };

  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 3000);
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
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
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-md ${messageType === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message}
        </div>
      )}

      <div className="grid gap-6">
        {/* Notificações */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-medium text-gray-900">Notificações</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">Email</label>
                <p className="text-sm text-gray-500">Receber alertas por email</p>
              </div>
              <input
                type="checkbox"
                checked={settings.notificacoes_email}
                onChange={(e) => updateSetting('notificacoes_email', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">Push</label>
                <p className="text-sm text-gray-500">Notificações push no navegador</p>
              </div>
              <input
                type="checkbox"
                checked={settings.notificacoes_push}
                onChange={(e) => updateSetting('notificacoes_push', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Dias de antecedência para alertas
              </label>
              <select
                value={settings.dias_antecedencia_notificacao}
                onChange={(e) => updateSetting('dias_antecedencia_notificacao', parseInt(e.target.value))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={3}>3 dias</option>
                <option value={5}>5 dias</option>
                <option value={7}>7 dias</option>
                <option value={10}>10 dias</option>
                <option value={15}>15 dias</option>
              </select>
            </div>
          </div>
        </div>

        {/* Segurança */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-medium text-gray-900">Segurança</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">Autenticação de dois fatores</label>
                <p className="text-sm text-gray-500">Adicionar uma camada extra de segurança</p>
              </div>
              <input
                type="checkbox"
                checked={settings.autenticacao_dois_fatores}
                onChange={(e) => updateSetting('autenticacao_dois_fatores', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Timeout da sessão (minutos)
              </label>
              <select
                value={settings.timeout_sessao}
                onChange={(e) => updateSetting('timeout_sessao', parseInt(e.target.value))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={15}>15 minutos</option>
                <option value={30}>30 minutos</option>
                <option value={60}>1 hora</option>
                <option value={120}>2 horas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sistema */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-medium text-gray-900">Aparência e Sistema</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Tema
              </label>
              <select
                value={settings.tema}
                onChange={(e) => updateSetting('tema', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="light">Claro</option>
                <option value="dark">Escuro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Idioma
              </label>
              <select
                value={settings.idioma}
                onChange={(e) => updateSetting('idioma', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en-US">English (US)</option>
                <option value="es-ES">Español</option>
              </select>
            </div>
          </div>
        </div>

        {/* Configurações de Email/SMTP */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-medium text-gray-900">Configurações de Email</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Servidor SMTP
              </label>
              <input
                type="text"
                value={settings.smtp_servidor || ''}
                onChange={(e) => updateSetting('smtp_servidor', e.target.value)}
                placeholder="smtp.gmail.com"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Porta
              </label>
              <input
                type="number"
                value={settings.smtp_porta || 587}
                onChange={(e) => updateSetting('smtp_porta', parseInt(e.target.value))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Usuário
              </label>
              <input
                type="email"
                value={settings.smtp_usuario || ''}
                onChange={(e) => updateSetting('smtp_usuario', e.target.value)}
                placeholder="seu-email@gmail.com"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Senha
              </label>
              <input
                type="password"
                value={settings.smtp_senha || ''}
                onChange={(e) => updateSetting('smtp_senha', e.target.value)}
                placeholder="••••••••"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={settings.smtp_ssl}
                onChange={(e) => updateSetting('smtp_ssl', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
              />
              <label className="text-sm font-medium text-gray-900">Usar SSL/TLS</label>
            </div>
          </div>
        </div>

        {/* Backup e Exportação */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-4">
            <Database className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-medium text-gray-900">Backup e Dados</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">Backup automático</label>
                <p className="text-sm text-gray-500">Fazer backup automático dos dados</p>
              </div>
              <input
                type="checkbox"
                checked={settings.backup_automatico}
                onChange={(e) => updateSetting('backup_automatico', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            {settings.backup_automatico && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Frequência do backup
                  </label>
                  <select
                    value={settings.frequencia_backup}
                    onChange={(e) => updateSetting('frequencia_backup', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="diario">Diário</option>
                    <option value="semanal">Semanal</option>
                    <option value="mensal">Mensal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Local do backup
                  </label>
                  <input
                    type="text"
                    value={settings.local_backup || ''}
                    onChange={(e) => updateSetting('local_backup', e.target.value)}
                    placeholder="/caminho/para/backup"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </>
            )}

            <div className="pt-4 border-t">
              <button
                onClick={handleExportData}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar Dados
              </button>
              <p className="text-sm text-gray-500 mt-2">
                Baixar todos os seus dados em formato JSON
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;