import React, { useState, useEffect } from 'react';
import { userService } from '../services/api';
import { useNotifications } from '../contexts/NotificationContext';
import { 
  Users as UsersIcon, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Shield, 
  Mail, 
  Phone, 
  Building, 
  Calendar,
  Filter,
  MoreVertical,
  UserCheck,
  UserX,
  Key
} from 'lucide-react';

const Users = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCargo, setFilterCargo] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [modalMode, setModalMode] = useState('view'); // view, edit, create
  const { showSuccess, showError } = useNotifications();

  // Estados para formulários
  const [userForm, setUserForm] = useState({
    nome_completo: '',
    email: '',
    telefone: '',
    empresa: '',
    bio: '',
    cargo: 'usuario',
    ativo: true
  });

  const [passwordForm, setPasswordForm] = useState({
    senha_atual: '',
    nova_senha: '',
    confirmar_senha: ''
  });

  const cargos = [
    { value: 'admin', label: 'Administrador', color: 'bg-red-100 text-red-800' },
    { value: 'gerente', label: 'Gerente', color: 'bg-blue-100 text-blue-800' },
    { value: 'usuario', label: 'Usuário', color: 'bg-green-100 text-green-800' },
    { value: 'visualizador', label: 'Visualizador', color: 'bg-gray-100 text-gray-800' }
  ];

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const carregarUsuarios = async () => {
    try {
      setLoading(true);
      const data = await userService.getUsuarios();
      setUsuarios(data.usuarios || []);
    } catch (error) {
      showError('Erro ao carregar usuários: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = (usuario) => {
    setSelectedUser(usuario);
    setUserForm(usuario);
    setModalMode('view');
    setShowUserModal(true);
  };

  const handleEditUser = (usuario) => {
    setSelectedUser(usuario);
    setUserForm(usuario);
    setModalMode('edit');
    setShowUserModal(true);
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setUserForm({
      nome_completo: '',
      email: '',
      telefone: '',
      empresa: '',
      nome_estabelecimento: '',
      password: '',
      bio: '',
      cargo: 'usuario',
      ativo: true
    });
    setModalMode('create');
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    try {
      // Validações básicas
      if (!userForm.email || !userForm.nome_completo) {
        showError('Email e nome completo são obrigatórios');
        return;
      }

      if (modalMode === 'edit') {
        await userService.updateUsuario(selectedUser.id, userForm);
        showSuccess('Usuário atualizado com sucesso!');
      } else if (modalMode === 'create') {
        // Validações adicionais para criação
        if (!userForm.password) {
          showError('Senha é obrigatória para criar usuário');
          return;
        }
        if (!userForm.nome_estabelecimento) {
          showError('Nome do estabelecimento é obrigatório');
          return;
        }

        await userService.createUsuario(userForm);
        showSuccess('Usuário criado com sucesso!');
      }
      
      setShowUserModal(false);
      carregarUsuarios();
    } catch (error) {
      showError('Erro ao salvar usuário: ' + error.message);
    }
  };

  const handleDeleteUser = async (usuarioId) => {
    if (window.confirm('Tem certeza que deseja desativar este usuário?')) {
      try {
        await userService.deleteUsuario(usuarioId);
        showSuccess('Usuário desativado com sucesso!');
        carregarUsuarios();
      } catch (error) {
        showError('Erro ao desativar usuário: ' + error.message);
      }
    }
  };

  const handleChangePassword = (usuario) => {
    setSelectedUser(usuario);
    setPasswordForm({
      senha_atual: '',
      nova_senha: '',
      confirmar_senha: ''
    });
    setShowPasswordModal(true);
  };

  const handleSavePassword = async () => {
    if (passwordForm.nova_senha !== passwordForm.confirmar_senha) {
      showError('As senhas não coincidem');
      return;
    }

    try {
      await userService.alterarSenha(selectedUser.id, {
        senha_atual: passwordForm.senha_atual,
        nova_senha: passwordForm.nova_senha
      });
      showSuccess('Senha alterada com sucesso!');
      setShowPasswordModal(false);
    } catch (error) {
      showError('Erro ao alterar senha: ' + error.message);
    }
  };

  const filteredUsers = usuarios.filter(usuario => {
    const matchesSearch = usuario.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         usuario.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         usuario.empresa?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCargo = !filterCargo || usuario.cargo === filterCargo;
    const matchesStatus = !filterStatus || 
                         (filterStatus === 'ativo' && usuario.ativo) ||
                         (filterStatus === 'inativo' && !usuario.ativo);
    
    return matchesSearch && matchesCargo && matchesStatus;
  });

  const getCargoInfo = (cargo) => {
    return cargos.find(c => c.value === cargo) || cargos[2];
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UsersIcon className="h-8 w-8 text-blue-600" />
            Gerenciamento de Usuários
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie usuários, permissões e configurações de acesso
          </p>
        </div>
        <button
          onClick={handleCreateUser}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo Usuário
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterCargo}
            onChange={(e) => setFilterCargo(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos os cargos</option>
            {cargos.map(cargo => (
              <option key={cargo.value} value={cargo.value}>{cargo.label}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos os status</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>

          <div className="flex items-center text-sm text-gray-600">
            <Filter className="h-4 w-4 mr-1" />
            {filteredUsers.length} usuário(s) encontrado(s)
          </div>
        </div>
      </div>

      {/* Lista de Usuários */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cargo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Último Login
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((usuario) => {
                const cargoInfo = getCargoInfo(usuario.cargo);
                return (
                  <tr key={usuario.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {usuario.foto_perfil ? (
                            <img 
                              className="h-10 w-10 rounded-full object-cover" 
                              src={usuario.foto_perfil} 
                              alt={usuario.nome_completo}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <UsersIcon className="h-6 w-6 text-gray-600" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {usuario.nome_completo || 'Nome não informado'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {usuario.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {usuario.telefone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4 text-gray-400" />
                            {usuario.telefone}
                          </div>
                        )}
                        {usuario.empresa && (
                          <div className="flex items-center gap-1 mt-1">
                            <Building className="h-4 w-4 text-gray-400" />
                            {usuario.empresa}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${cargoInfo.color}`}>
                        {cargoInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        usuario.ativo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {usuario.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {usuario.ultimo_login ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(usuario.ultimo_login).toLocaleDateString('pt-BR')}
                        </div>
                      ) : (
                        'Nunca'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewUser(usuario)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditUser(usuario)}
                          className="text-green-600 hover:text-green-900"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleChangePassword(usuario)}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Alterar Senha"
                        >
                          <Key className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(usuario.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Desativar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum usuário encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">
              Tente ajustar os filtros ou criar um novo usuário.
            </p>
          </div>
        )}
      </div>

      {/* Modal de Usuário */}
      {showUserModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {modalMode === 'view' && 'Visualizar Usuário'}
                {modalMode === 'edit' && 'Editar Usuário'}
                {modalMode === 'create' && 'Novo Usuário'}
              </h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={userForm.nome_completo || ''}
                    onChange={(e) => setUserForm({...userForm, nome_completo: e.target.value})}
                    disabled={modalMode === 'view'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={userForm.email || ''}
                    onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                    disabled={modalMode === 'view'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={userForm.telefone || ''}
                    onChange={(e) => setUserForm({...userForm, telefone: e.target.value})}
                    disabled={modalMode === 'view'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Empresa
                  </label>
                  <input
                    type="text"
                    value={userForm.empresa || ''}
                    onChange={(e) => setUserForm({...userForm, empresa: e.target.value})}
                    disabled={modalMode === 'view'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Estabelecimento {modalMode === 'create' && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    value={userForm.nome_estabelecimento || ''}
                    onChange={(e) => setUserForm({...userForm, nome_estabelecimento: e.target.value})}
                    disabled={modalMode === 'view'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    placeholder="Nome do estabelecimento do usuário"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cargo
                  </label>
                  <select
                    value={userForm.cargo || 'usuario'}
                    onChange={(e) => setUserForm({...userForm, cargo: e.target.value})}
                    disabled={modalMode === 'view'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    {cargos.map(cargo => (
                      <option key={cargo.value} value={cargo.value}>{cargo.label}</option>
                    ))}
                  </select>
                </div>

                {modalMode === 'create' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Senha <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={userForm.password || ''}
                      onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Senha para o novo usuário"
                      minLength="6"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={userForm.ativo ? 'true' : 'false'}
                    onChange={(e) => setUserForm({...userForm, ativo: e.target.value === 'true'})}
                    disabled={modalMode === 'view'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  value={userForm.bio || ''}
                  onChange={(e) => setUserForm({...userForm, bio: e.target.value})}
                  disabled={modalMode === 'view'}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
            </div>

            {modalMode !== 'view' && (
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveUser}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Salvar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Alteração de Senha */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Alterar Senha - {selectedUser?.nome_completo}
              </h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha Atual
                </label>
                <input
                  type="password"
                  value={passwordForm.senha_atual}
                  onChange={(e) => setPasswordForm({...passwordForm, senha_atual: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nova Senha
                </label>
                <input
                  type="password"
                  value={passwordForm.nova_senha}
                  onChange={(e) => setPasswordForm({...passwordForm, nova_senha: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Nova Senha
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmar_senha}
                  onChange={(e) => setPasswordForm({...passwordForm, confirmar_senha: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePassword}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Alterar Senha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;