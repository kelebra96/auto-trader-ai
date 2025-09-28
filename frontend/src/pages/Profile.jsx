import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Mail, 
  Building, 
  Save, 
  Camera, 
  Shield, 
  Phone, 
  FileText, 
  Upload, 
  Eye, 
  EyeOff,
  Lock,
  Key,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import api, { userService, authService } from '../services/api';
import { useNotifications } from '../contexts/NotificationContext';

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const fileInputRef = useRef(null);
  const { showSuccess, showError } = useNotifications();

  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    nome_completo: '',
    email: '',
    empresa: '',
    telefone: '',
    bio: '',
    foto_perfil: ''
  });

  const [passwordData, setPasswordData] = useState({
    senha_atual: '',
    nova_senha: '',
    confirmar_senha: ''
  });

  useEffect(() => {
    carregarPerfil();
  }, []);

  const carregarPerfil = async () => {
    try {
      setLoading(true);
      const data = await userService.getPerfil();
      setUserData(data);
      setFormData({
        nome_completo: data.nome_completo || '',
        email: data.email || '',
        empresa: data.empresa || '',
        telefone: data.telefone || '',
        bio: data.bio || '',
        foto_perfil: data.foto_perfil || ''
      });
    } catch (error) {
      showError('Erro ao carregar perfil: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await userService.updatePerfil(formData);
      showSuccess('Perfil atualizado com sucesso!');
      carregarPerfil(); // Recarregar dados atualizados
    } catch (error) {
      showError('Erro ao salvar perfil: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async () => {
    if (passwordData.nova_senha !== passwordData.confirmar_senha) {
      showError('As senhas não coincidem');
      return;
    }

    if (passwordData.nova_senha.length < 6) {
      showError('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    try {
      setChangingPassword(true);
      // Obter o ID do usuário atual
      const currentUser = authService.getCurrentUser();
      await userService.alterarSenha(currentUser.id, {
        senha_atual: passwordData.senha_atual,
        nova_senha: passwordData.nova_senha
      });
      showSuccess('Senha alterada com sucesso!');
      setPasswordData({
        senha_atual: '',
        nova_senha: '',
        confirmar_senha: ''
      });
    } catch (error) {
      showError('Erro ao alterar senha: ' + error.message);
    } finally {
      setChangingPassword(false);
    }
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      showError('Por favor, selecione apenas arquivos de imagem');
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('A imagem deve ter no máximo 5MB');
      return;
    }

    try {
      setSaving(true);
      const formDataUpload = new FormData();
      formDataUpload.append('foto_perfil', file);
      
      // Obter o ID do usuário atual
      const currentUser = authService.getCurrentUser();
      
      // Fazer upload direto para o endpoint
      const response = await api.post(`/usuarios/${currentUser.id}/upload-foto`, formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      showSuccess('Foto de perfil atualizada com sucesso!');
      carregarPerfil(); // Recarregar para mostrar nova foto
    } catch (error) {
      showError('Erro ao fazer upload da foto: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const cargos = {
    admin: { label: 'Administrador', color: 'bg-red-100 text-red-800' },
    gerente: { label: 'Gerente', color: 'bg-blue-100 text-blue-800' },
    usuario: { label: 'Usuário', color: 'bg-green-100 text-green-800' },
    visualizador: { label: 'Visualizador', color: 'bg-gray-100 text-gray-800' }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <User className="h-8 w-8 text-blue-600" />
                Meu Perfil
              </h1>
              <p className="text-gray-600 mt-1">
                Gerencie suas informações pessoais e configurações de conta
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Foto do perfil e informações básicas */}
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="text-center">
                  <div className="relative inline-block">
                    {formData.foto_perfil ? (
                      <img 
                        src={formData.foto_perfil.startsWith('http') ? formData.foto_perfil : `${API_ORIGIN}/${formData.foto_perfil}`} 
                        alt="Foto do perfil"
                        className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-gray-200"
                      />
                    ) : (
                      <div className="w-32 h-32 bg-gray-300 rounded-full flex items-center justify-center mx-auto border-4 border-gray-200">
                        <User className="h-16 w-16 text-gray-600" />
                      </div>
                    )}
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={saving}
                      className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Alterar foto do perfil"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">
                    {userData?.nome_completo || 'Nome não informado'}
                  </h3>
                  <p className="text-sm text-gray-500 flex items-center justify-center gap-1">
                    <Mail className="h-4 w-4" />
                    {userData?.email}
                  </p>
                  {userData?.empresa && (
                    <p className="text-sm text-gray-500 flex items-center justify-center gap-1 mt-1">
                      <Building className="h-4 w-4" />
                      {userData.empresa}
                    </p>
                  )}
                  {userData?.telefone && (
                    <p className="text-sm text-gray-500 flex items-center justify-center gap-1 mt-1">
                      {userData.telefone}
                    </p>
                  )}
                  
                  {/* Cargo */}
                  {userData?.cargo && (
                    <div className="mt-3">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        cargos[userData.cargo]?.color || 'bg-gray-100 text-gray-800'
                      }`}>
                        <Shield className="h-3 w-3 mr-1" />
                        {cargos[userData.cargo]?.label || userData.cargo}
                      </span>
                    </div>
                  )}

                  {/* Informações adicionais */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-xs text-gray-500 space-y-1">
                      {userData?.created_at && (
                        <p>Membro desde: {new Date(userData.created_at).toLocaleDateString('pt-BR')}</p>
                      )}
                      {userData?.ultimo_login && (
                        <p>Último acesso: {new Date(userData.ultimo_login).toLocaleDateString('pt-BR')}</p>
                      )}
                      <p className={`font-medium ${userData?.ativo ? 'text-green-600' : 'text-red-600'}`}>
                        Status: {userData?.ativo ? 'Ativo' : 'Inativo'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

        {/* Informações do perfil */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center gap-2 mb-6">
                  <User className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-medium text-gray-900">Informações Pessoais</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      name="nome_completo"
                      value={formData.nome_completo}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Digite seu nome completo"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="seu@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Empresa
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="text"
                        name="empresa"
                        value={formData.empresa}
                        onChange={handleChange}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Nome da empresa"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="tel"
                        name="telefone"
                        value={formData.telefone}
                        onChange={handleChange}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 text-gray-400 h-4 w-4" />
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      rows={4}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Conte um pouco sobre você, sua experiência e interesses..."
                      maxLength={500}
                    />
                  </div>
                  <div className="text-right text-xs text-gray-500 mt-1">
                    {formData.bio.length}/500 caracteres
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Salvar Alterações
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Alterar senha */}
               <div className="bg-white p-6 rounded-lg shadow-sm border">
                 <div className="flex items-center gap-2 mb-6">
                   <Lock className="h-5 w-5 text-red-600" />
                   <h2 className="text-lg font-medium text-gray-900">Alterar Senha</h2>
                 </div>
                 
                 <div className="space-y-6">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       Senha Atual *
                     </label>
                     <div className="relative">
                       <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                       <input
                         type={showCurrentPassword ? "text" : "password"}
                         name="senha_atual"
                         value={passwordData.senha_atual}
                         onChange={handlePasswordChange}
                         required
                         className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                         placeholder="Digite sua senha atual"
                       />
                       <button
                         type="button"
                         onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                         className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                       >
                         {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                       </button>
                     </div>
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       Nova Senha *
                     </label>
                     <div className="relative">
                       <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                       <input
                         type={showNewPassword ? "text" : "password"}
                         name="nova_senha"
                         value={passwordData.nova_senha}
                         onChange={handlePasswordChange}
                         required
                         minLength={6}
                         className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                         placeholder="Digite a nova senha (mín. 6 caracteres)"
                       />
                       <button
                         type="button"
                         onClick={() => setShowNewPassword(!showNewPassword)}
                         className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                       >
                         {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                       </button>
                     </div>
                     {passwordData.nova_senha && passwordData.nova_senha.length < 6 && (
                       <p className="text-red-500 text-xs mt-1">A senha deve ter pelo menos 6 caracteres</p>
                     )}
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       Confirmar Nova Senha *
                     </label>
                     <div className="relative">
                       <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                       <input
                         type={showConfirmPassword ? "text" : "password"}
                         name="confirmar_senha"
                         value={passwordData.confirmar_senha}
                         onChange={handlePasswordChange}
                         required
                         className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                         placeholder="Confirme a nova senha"
                       />
                       <button
                         type="button"
                         onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                         className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                       >
                         {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                       </button>
                     </div>
                     {passwordData.confirmar_senha && passwordData.nova_senha !== passwordData.confirmar_senha && (
                       <p className="text-red-500 text-xs mt-1">As senhas não coincidem</p>
                     )}
                   </div>

                   <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                     <div className="flex items-start gap-2">
                       <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                       <div>
                         <h4 className="text-sm font-medium text-yellow-800">Dicas de segurança:</h4>
                         <ul className="text-xs text-yellow-700 mt-1 space-y-1">
                           <li>• Use pelo menos 6 caracteres</li>
                           <li>• Combine letras maiúsculas e minúsculas</li>
                           <li>• Inclua números e símbolos</li>
                           <li>• Evite informações pessoais óbvias</li>
                         </ul>
                       </div>
                     </div>
                   </div>

                   <div className="flex justify-end">
                     <button
                       onClick={handlePasswordSave}
                       disabled={changingPassword || !passwordData.senha_atual || !passwordData.nova_senha || !passwordData.confirmar_senha || passwordData.nova_senha !== passwordData.confirmar_senha || passwordData.nova_senha.length < 6}
                       className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                     >
                       {changingPassword ? (
                         <>
                           <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                           Alterando...
                         </>
                       ) : (
                         <>
                           <Key className="h-4 w-4" />
                           Alterar Senha
                         </>
                       )}
                     </button>
                   </div>
                 </div>
               </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;