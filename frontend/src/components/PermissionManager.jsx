import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Tag,
  Key,
  AlertCircle
} from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import api from '../services/api';

const PermissionManager = () => {
  const { showSuccess, showError } = useNotifications();
  const [permissions, setPermissions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPermission, setEditingPermission] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    active: true
  });

  useEffect(() => {
    loadPermissions();
    loadCategories();
  }, []);

  const loadPermissions = async () => {
    try {
      const response = await api.get('/permissions');
      setPermissions(response.data.data);
    } catch (error) {
      console.error('Erro ao carregar permissões:', error);
      showError('Erro ao carregar permissões');
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.get('/permissions/categories');
      setCategories(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      showError('Erro ao carregar categorias');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingPermission) {
        await api.put(`/permissions/${editingPermission.id}`, formData);
        showSuccess('Permissão atualizada com sucesso!');
      } else {
        await api.post('/permissions', formData);
        showSuccess('Permissão criada com sucesso!');
      }
      
      loadPermissions();
      loadCategories();
      closeModal();
    } catch (error) {
      console.error('Erro ao salvar permissão:', error);
      showError(error.response?.data?.message || 'Erro ao salvar permissão');
    }
  };

  const handleEdit = async (permission) => {
    try {
      const response = await api.get(`/permissions/${permission.id}`);
      const permissionData = response.data.data;
      
      setEditingPermission(permission);
      setFormData({
        name: permissionData.name,
        description: permissionData.description || '',
        category: permissionData.category || '',
        active: permissionData.active
      });
      setShowModal(true);
    } catch (error) {
      console.error('Erro ao carregar dados da permissão:', error);
      showError('Erro ao carregar dados da permissão');
    }
  };

  const handleDelete = async (permission) => {
    if (!window.confirm(`Tem certeza que deseja excluir a permissão "${permission.description}"?`)) {
      return;
    }

    try {
      await api.delete(`/permissions/${permission.id}`);
      showSuccess('Permissão excluída com sucesso!');
      loadPermissions();
      loadCategories();
    } catch (error) {
      console.error('Erro ao excluir permissão:', error);
      showError(error.response?.data?.message || 'Erro ao excluir permissão');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPermission(null);
    setFormData({
      name: '',
      description: '',
      category: '',
      active: true
    });
  };

  const filteredPermissions = permissions.filter(permission => {
    const matchesSearch = permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permission.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || permission.category === filterCategory;
    
    const matchesActive = filterActive === 'all' || 
                         (filterActive === 'active' && permission.active) ||
                         (filterActive === 'inactive' && !permission.active);
    
    return matchesSearch && matchesCategory && matchesActive;
  });

  const getCategoryIcon = (category) => {
    const icons = {
      'user': '👤',
      'product': '📦',
      'company': '🏢',
      'report': '📊',
      'system': '⚙️',
      'admin': '🔧'
    };
    return icons[category] || '🔑';
  };

  const getCategoryColor = (category) => {
    const colors = {
      'user': 'bg-blue-100 text-blue-800',
      'product': 'bg-green-100 text-green-800',
      'company': 'bg-purple-100 text-purple-800',
      'report': 'bg-orange-100 text-orange-800',
      'system': 'bg-gray-100 text-gray-800',
      'admin': 'bg-red-100 text-red-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
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
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Permissões</h1>
          <p className="text-gray-600">Configure as permissões do sistema</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Nova Permissão
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Permissões</p>
              <p className="text-2xl font-bold text-gray-900">{permissions.length}</p>
            </div>
            <Key className="text-blue-600" size={24} />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Permissões Ativas</p>
              <p className="text-2xl font-bold text-green-600">
                {permissions.filter(p => p.active).length}
              </p>
            </div>
            <CheckCircle className="text-green-600" size={24} />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Permissões Inativas</p>
              <p className="text-2xl font-bold text-red-600">
                {permissions.filter(p => !p.active).length}
              </p>
            </div>
            <XCircle className="text-red-600" size={24} />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Categorias</p>
              <p className="text-2xl font-bold text-purple-600">{categories.length}</p>
            </div>
            <Tag className="text-purple-600" size={24} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar permissões..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-400" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todas as categorias</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos os status</option>
            <option value="active">Ativas</option>
            <option value="inactive">Inativas</option>
          </select>
        </div>
      </div>

      {/* Permissions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permissão
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPermissions.map((permission) => (
                <tr key={permission.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Shield className="text-blue-600 mr-3" size={20} />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {permission.description}
                        </div>
                        <div className="text-sm text-gray-500">
                          {permission.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(permission.category)}`}>
                      <span className="mr-1">{getCategoryIcon(permission.category)}</span>
                      {permission.category?.charAt(0).toUpperCase() + permission.category?.slice(1).replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      permission.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {permission.active ? (
                        <>
                          <CheckCircle size={12} className="mr-1" />
                          Ativa
                        </>
                      ) : (
                        <>
                          <XCircle size={12} className="mr-1" />
                          Inativa
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(permission)}
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                      >
                        <Edit size={16} />
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(permission)}
                        className="text-red-600 hover:text-red-900 flex items-center gap-1"
                      >
                        <Trash2 size={16} />
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredPermissions.length === 0 && (
        <div className="text-center py-12">
          <Shield className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma permissão encontrada</h3>
          <p className="text-gray-600">
            {searchTerm || filterCategory !== 'all' || filterActive !== 'all'
              ? 'Tente ajustar os filtros de busca'
              : 'Comece criando uma nova permissão'
            }
          </p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                {editingPermission ? 'Editar Permissão' : 'Nova Permissão'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Permissão *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ex: user.create"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use formato: categoria.acao (ex: user.create, product.view)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição *
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ex: Criar usuários"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione uma categoria</option>
                  <option value="user">Usuários</option>
                  <option value="product">Produtos</option>
                  <option value="company">Empresas</option>
                  <option value="report">Relatórios</option>
                  <option value="system">Sistema</option>
                  <option value="admin">Administração</option>
                </select>
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
                  <option value="true">Ativa</option>
                  <option value="false">Inativa</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
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
                  {editingPermission ? 'Atualizar' : 'Criar'} Permissão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionManager;