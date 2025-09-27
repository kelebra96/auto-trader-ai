import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Shield, 
  Star,
  Search,
  Filter,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import api from '../services/api';

const UserProfiles = () => {
  const { showSuccess, showError } = useNotifications();
  const [profiles, setProfiles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [permissionsByCategory, setPermissionsByCategory] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [],
    active: true
  });

  useEffect(() => {
    loadProfiles();
    loadPermissions();
  }, []);

  const loadProfiles = async () => {
    try {
      const response = await api.get('/profiles');
      setProfiles(response.data.data);
    } catch (error) {
      console.error('Erro ao carregar perfis:', error);
      showError('Erro ao carregar perfis');
    }
  };

  const loadPermissions = async () => {
    try {
      const [allPermissions, categorizedPermissions] = await Promise.all([
        api.get('/permissions'),
        api.get('/permissions/by-category')
      ]);
      
      setPermissions(allPermissions.data.data);
      setPermissionsByCategory(categorizedPermissions.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar permissões:', error);
      showError('Erro ao carregar permissões');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingProfile) {
        await api.put(`/profiles/${editingProfile.id}`, formData);
        showSuccess('Perfil atualizado com sucesso!');
      } else {
        await api.post('/profiles', formData);
        showSuccess('Perfil criado com sucesso!');
      }
      
      loadProfiles();
      closeModal();
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      showError(error.response?.data?.message || 'Erro ao salvar perfil');
    }
  };

  const handleEdit = async (profile) => {
    try {
      const response = await api.get(`/profiles/${profile.id}`);
      const profileData = response.data.data;
      
      setEditingProfile(profile);
      setFormData({
        name: profileData.name,
        description: profileData.description || '',
        permissions: profileData.permissions?.map(p => p.id) || [],
        active: profileData.active
      });
      setShowModal(true);
    } catch (error) {
      console.error('Erro ao carregar dados do perfil:', error);
      showError('Erro ao carregar dados do perfil');
    }
  };

  const handleDelete = async (profile) => {
    if (!window.confirm(`Tem certeza que deseja excluir o perfil "${profile.name}"?`)) {
      return;
    }

    try {
      await api.delete(`/profiles/${profile.id}`);
      showSuccess('Perfil excluído com sucesso!');
      loadProfiles();
    } catch (error) {
      console.error('Erro ao excluir perfil:', error);
      showError(error.response?.data?.message || 'Erro ao excluir perfil');
    }
  };

  const handleSetDefault = async (profile) => {
    try {
      await api.put(`/profiles/${profile.id}/set-default`);
      showSuccess('Perfil definido como padrão!');
      loadProfiles();
    } catch (error) {
      console.error('Erro ao definir perfil padrão:', error);
      showError(error.response?.data?.message || 'Erro ao definir perfil padrão');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProfile(null);
    setFormData({
      name: '',
      description: '',
      permissions: [],
      active: true
    });
  };

  const handlePermissionToggle = (permissionId) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(id => id !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         profile.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterActive === 'all' || 
                         (filterActive === 'active' && profile.active) ||
                         (filterActive === 'inactive' && !profile.active);
    
    return matchesSearch && matchesFilter;
  });

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
          <h1 className="text-2xl font-bold text-gray-900">Perfis de Usuário</h1>
          <p className="text-gray-600">Gerencie perfis e suas permissões</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Novo Perfil
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar perfis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-400" />
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
        </div>
      </div>

      {/* Profiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProfiles.map((profile) => (
          <div key={profile.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shield className="text-blue-600" size={24} />
                <div>
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    {profile.name}
                    {profile.is_default && (
                      <Star className="text-yellow-500 fill-current" size={16} />
                    )}
                  </h3>
                  <p className="text-sm text-gray-600">{profile.description}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                {profile.active ? (
                  <CheckCircle className="text-green-500" size={20} />
                ) : (
                  <XCircle className="text-red-500" size={20} />
                )}
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Usuários:</span>
                <span className="font-medium">{profile.userCount || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Permissões:</span>
                <span className="font-medium">{profile.permissionCount || 0}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(profile)}
                className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 flex items-center justify-center gap-2"
              >
                <Edit size={16} />
                Editar
              </button>
              
              {!profile.is_default && (
                <button
                  onClick={() => handleSetDefault(profile)}
                  className="bg-yellow-50 text-yellow-600 px-3 py-2 rounded-lg hover:bg-yellow-100 flex items-center justify-center gap-2"
                >
                  <Star size={16} />
                  Padrão
                </button>
              )}
              
              <button
                onClick={() => handleDelete(profile)}
                className="bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 flex items-center justify-center gap-2"
                disabled={profile.is_default}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredProfiles.length === 0 && (
        <div className="text-center py-12">
          <Shield className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum perfil encontrado</h3>
          <p className="text-gray-600">
            {searchTerm || filterActive !== 'all' 
              ? 'Tente ajustar os filtros de busca'
              : 'Comece criando um novo perfil de usuário'
            }
          </p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                {editingProfile ? 'Editar Perfil' : 'Novo Perfil'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Perfil *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.active}
                    onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.value === 'true' }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Permissões
                </label>
                
                <div className="space-y-4">
                  {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => (
                    <div key={category} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3 capitalize">
                        {category.replace('_', ' ')}
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {categoryPermissions.map((permission) => (
                          <label key={permission.id} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.permissions.includes(permission.id)}
                              onChange={() => handlePermissionToggle(permission.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{permission.description}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingProfile ? 'Atualizar' : 'Criar'} Perfil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfiles;