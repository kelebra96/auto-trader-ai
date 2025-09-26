import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Key, 
  Mail, 
  Database, 
  Shield, 
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

export default function SystemSettings() {
  const [loading, setLoading] = useState(false);
  const [showKeys, setShowKeys] = useState({});
  const [settings, setSettings] = useState({
    // Configurações de API
    openai_api_key: 'sk-proj-***************************',
    openai_api_base: 'https://api.openai.com/v1',
    mercadopago_access_token: 'APP_USR-***************************',
    mercadopago_public_key: 'APP_USR-***************************',
    
    // Configurações de Email
    smtp_host: 'smtp.gmail.com',
    smtp_port: '587',
    smtp_user: 'sistema@validadeinteligente.com',
    smtp_password: '***************************',
    email_from: 'sistema@validadeinteligente.com',
    email_from_name: 'Validade Inteligente',
    
    // Configurações do Sistema
    app_name: 'Validade Inteligente',
    app_url: 'https://validadeinteligente.com',
    app_timezone: 'America/Sao_Paulo',
    app_locale: 'pt_BR',
    
    // Configurações de Segurança
    jwt_secret: '***************************',
    session_timeout: '1440', // minutos
    max_login_attempts: '5',
    lockout_duration: '30', // minutos
    
    // Configurações de Backup
    backup_enabled: true,
    backup_frequency: 'daily',
    backup_retention_days: '30',
    
    // Configurações de Notificações
    notifications_enabled: true,
    sla_alert_threshold: '60', // minutos
    email_notifications: true,
    push_notifications: false
  });

  const [apiStatus, setApiStatus] = useState({
    openai: 'checking',
    mercadopago: 'checking',
    smtp: 'checking',
    database: 'checking'
  });

  useEffect(() => {
    // Simular verificação de status das APIs
    setTimeout(() => {
      setApiStatus({
        openai: 'connected',
        mercadopago: 'connected',
        smtp: 'error',
        database: 'connected'
      });
    }, 2000);
  }, []);

  const handleInputChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleShowKey = (keyName) => {
    setShowKeys(prev => ({
      ...prev,
      [keyName]: !prev[keyName]
    }));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      connected: { variant: 'success', icon: CheckCircle, label: 'Conectado' },
      error: { variant: 'destructive', icon: XCircle, label: 'Erro' },
      checking: { variant: 'secondary', icon: RefreshCw, label: 'Verificando...' },
      warning: { variant: 'warning', icon: AlertTriangle, label: 'Atenção' }
    };

    const config = statusConfig[status] || statusConfig.error;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${status === 'checking' ? 'animate-spin' : ''}`} />
        {config.label}
      </Badge>
    );
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async (service) => {
    setApiStatus(prev => ({ ...prev, [service]: 'checking' }));
    
    // Simular teste de conexão
    setTimeout(() => {
      const success = Math.random() > 0.3; // 70% de chance de sucesso
      setApiStatus(prev => ({ 
        ...prev, 
        [service]: success ? 'connected' : 'error' 
      }));
      
      toast[success ? 'success' : 'error'](
        `Teste de conexão ${service}: ${success ? 'Sucesso' : 'Falhou'}`
      );
    }, 2000);
  };

  const renderPasswordField = (key, label, value) => (
    <div className="space-y-2">
      <Label htmlFor={key}>{label}</Label>
      <div className="relative">
        <Input
          id={key}
          type={showKeys[key] ? 'text' : 'password'}
          value={value}
          onChange={(e) => handleInputChange(key, e.target.value)}
          className="pr-10"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3"
          onClick={() => toggleShowKey(key)}
        >
          {showKeys[key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
          <p className="text-gray-600">Gerencie as configurações e integrações do sistema</p>
        </div>
        <Button 
          onClick={handleSaveSettings}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {loading ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>

      {/* Status das Integrações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Status das Integrações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">OpenAI</p>
                <p className="text-sm text-gray-600">IA Preditiva</p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(apiStatus.openai)}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTestConnection('openai')}
                >
                  Testar
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Mercado Pago</p>
                <p className="text-sm text-gray-600">Pagamentos</p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(apiStatus.mercadopago)}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTestConnection('mercadopago')}
                >
                  Testar
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">SMTP</p>
                <p className="text-sm text-gray-600">E-mails</p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(apiStatus.smtp)}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTestConnection('smtp')}
                >
                  Testar
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">PostgreSQL</p>
                <p className="text-sm text-gray-600">Banco de Dados</p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(apiStatus.database)}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTestConnection('database')}
                >
                  Testar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configurações de API */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Chaves de API
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderPasswordField('openai_api_key', 'OpenAI API Key', settings.openai_api_key)}
            
            <div className="space-y-2">
              <Label htmlFor="openai_api_base">OpenAI API Base URL</Label>
              <Input
                id="openai_api_base"
                value={settings.openai_api_base}
                onChange={(e) => handleInputChange('openai_api_base', e.target.value)}
              />
            </div>

            {renderPasswordField('mercadopago_access_token', 'Mercado Pago Access Token', settings.mercadopago_access_token)}
            {renderPasswordField('mercadopago_public_key', 'Mercado Pago Public Key', settings.mercadopago_public_key)}
          </CardContent>
        </Card>

        {/* Configurações de Email */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Configurações de E-mail
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtp_host">Servidor SMTP</Label>
                <Input
                  id="smtp_host"
                  value={settings.smtp_host}
                  onChange={(e) => handleInputChange('smtp_host', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp_port">Porta</Label>
                <Input
                  id="smtp_port"
                  value={settings.smtp_port}
                  onChange={(e) => handleInputChange('smtp_port', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtp_user">Usuário SMTP</Label>
              <Input
                id="smtp_user"
                value={settings.smtp_user}
                onChange={(e) => handleInputChange('smtp_user', e.target.value)}
              />
            </div>

            {renderPasswordField('smtp_password', 'Senha SMTP', settings.smtp_password)}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email_from">E-mail Remetente</Label>
                <Input
                  id="email_from"
                  value={settings.email_from}
                  onChange={(e) => handleInputChange('email_from', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email_from_name">Nome Remetente</Label>
                <Input
                  id="email_from_name"
                  value={settings.email_from_name}
                  onChange={(e) => handleInputChange('email_from_name', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configurações do Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações Gerais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="app_name">Nome da Aplicação</Label>
              <Input
                id="app_name"
                value={settings.app_name}
                onChange={(e) => handleInputChange('app_name', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="app_url">URL da Aplicação</Label>
              <Input
                id="app_url"
                value={settings.app_url}
                onChange={(e) => handleInputChange('app_url', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="app_timezone">Fuso Horário</Label>
                <Input
                  id="app_timezone"
                  value={settings.app_timezone}
                  onChange={(e) => handleInputChange('app_timezone', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="app_locale">Idioma</Label>
                <Input
                  id="app_locale"
                  value={settings.app_locale}
                  onChange={(e) => handleInputChange('app_locale', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Segurança */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Configurações de Segurança
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderPasswordField('jwt_secret', 'JWT Secret', settings.jwt_secret)}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="session_timeout">Timeout da Sessão (min)</Label>
                <Input
                  id="session_timeout"
                  type="number"
                  value={settings.session_timeout}
                  onChange={(e) => handleInputChange('session_timeout', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_login_attempts">Máx. Tentativas de Login</Label>
                <Input
                  id="max_login_attempts"
                  type="number"
                  value={settings.max_login_attempts}
                  onChange={(e) => handleInputChange('max_login_attempts', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lockout_duration">Duração do Bloqueio (min)</Label>
              <Input
                id="lockout_duration"
                type="number"
                value={settings.lockout_duration}
                onChange={(e) => handleInputChange('lockout_duration', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

