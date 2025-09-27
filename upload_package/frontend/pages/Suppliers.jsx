import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, X, Building2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import Dialog from '../components/ui/Dialog';
import { useNotifications } from '../contexts/NotificationContext';
import { supplierService } from '../services/api';

const Suppliers = () => {
  const { addNotification } = useNotifications();
  
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para modais
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [deletingSupplier, setDeletingSupplier] = useState(null);
  const [loading, setLoading] = useState(false);

  // Estados para formulário
  const [formData, setFormData] = useState({
    codigo: '',
    nome: '',
    cnpj: '',
    email: '',
    telefone: '',
    endereco: ''
  });

  // Função para carregar fornecedores da API
  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const data = await supplierService.getSuppliers();
      setSuppliers(data);
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erro',
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  // Filtrar fornecedores baseado na busca
  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.cnpj.includes(searchTerm) ||
    supplier.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Resetar formulário
  const resetForm = () => {
    setFormData({
      codigo: '',
      nome: '',
      cnpj: '',
      email: '',
      telefone: '',
      endereco: ''
    });
  };

  // Abrir modal de adicionar
  const handleAddSupplier = () => {
    resetForm();
    setShowAddModal(true);
  };

  // Abrir modal de editar
  const handleEditSupplier = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      codigo: supplier.codigo || '',
      nome: supplier.nome || '',
      cnpj: supplier.cnpj || '',
      email: supplier.email || '',
      telefone: supplier.telefone || '',
      endereco: supplier.endereco || ''
    });
    setShowEditModal(true);
  };

  // Abrir modal de deletar
  const handleDeleteSupplier = (supplier) => {
    setDeletingSupplier(supplier);
    setShowDeleteModal(true);
  };

  // Submeter formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.codigo || !formData.nome || !formData.cnpj) {
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Código, Nome e CNPJ são obrigatórios'
      });
      return;
    }

    try {
      if (editingSupplier) {
        // Atualizar fornecedor
        await supplierService.updateSupplier(editingSupplier.id, formData);
        addNotification({
          type: 'success',
          title: 'Sucesso',
          message: 'Fornecedor atualizado com sucesso!'
        });
        setShowEditModal(false);
      } else {
        // Criar novo fornecedor
        await supplierService.createSupplier(formData);
        addNotification({
          type: 'success',
          title: 'Sucesso',
          message: 'Fornecedor criado com sucesso!'
        });
        setShowAddModal(false);
      }
      
      loadSuppliers();
      resetForm();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erro',
        message: error.message
      });
    }
  };

  // Confirmar exclusão
  const confirmDelete = async () => {
    try {
      await supplierService.deleteSupplier(deletingSupplier.id);
      addNotification({
        type: 'success',
        title: 'Sucesso',
        message: 'Fornecedor excluído com sucesso!'
      });
      setShowDeleteModal(false);
      loadSuppliers();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erro',
        message: error.message
      });
    }
  };

  // Fechar modais
  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setEditingSupplier(null);
    setDeletingSupplier(null);
    resetForm();
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fornecedores</h1>
          <p className="text-gray-600">Gerencie os fornecedores do sistema</p>
        </div>
        <Button onClick={handleAddSupplier} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Novo Fornecedor
        </Button>
      </div>

      {/* Barra de busca */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar por nome, CNPJ ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Tabela de fornecedores */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Código
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                CNPJ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Telefone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  Carregando fornecedores...
                </td>
              </tr>
            ) : filteredSuppliers.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p>Nenhum fornecedor encontrado</p>
                </td>
              </tr>
            ) : (
              filteredSuppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{supplier.codigo}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{supplier.nome}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{supplier.cnpj}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{supplier.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{supplier.telefone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditSupplier(supplier)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteSupplier(supplier)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Adicionar/Editar Fornecedor */}
      <Dialog 
        isOpen={showAddModal || showEditModal} 
        onClose={closeModals}
        title={editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código *
            </label>
            <input
              type="text"
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Código único do fornecedor"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome *
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CNPJ *
            </label>
            <input
              type="text"
              value={formData.cnpj}
              onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefone
            </label>
            <input
              type="text"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Endereço
            </label>
            <textarea
              value={formData.endereco}
              onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={closeModals}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {editingSupplier ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog 
        isOpen={showDeleteModal} 
        onClose={closeModals}
        title="Confirmar Exclusão"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Tem certeza que deseja excluir o fornecedor <strong>{deletingSupplier?.nome}</strong>?
          </p>
          <p className="text-sm text-red-600">
            Esta ação não pode ser desfeita.
          </p>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={closeModals}>
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default Suppliers;