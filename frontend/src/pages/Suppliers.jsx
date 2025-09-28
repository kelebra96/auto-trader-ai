import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, X, Building2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import Dialog from '../components/ui/Dialog';
import { useNotifications } from '../contexts/NotificationContext';
import { supplierService, companyService } from '../services/api';

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

  // Empresas e seleção
  const [companies, setCompanies] = useState([]);
  const [selectedEmpresaId, setSelectedEmpresaId] = useState(null);

  // Helper: formata CNPJ para exibição e mantém apenas dígitos para envio
  const formatCNPJ = (digits) => {
    const v = String(digits || '').replace(/\D/g, '').slice(0, 14);
    if (v.length <= 2) return v;
    if (v.length <= 5) return `${v.slice(0, 2)}.${v.slice(2)}`;
    if (v.length <= 8) return `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5)}`;
    if (v.length <= 12) return `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5, 8)}/${v.slice(8)}`;
    return `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5, 8)}/${v.slice(8, 12)}-${v.slice(12)}`;
  };
  
  const getEmpresaId = () => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return null;
      const user = JSON.parse(raw);
      return user?.empresa_id ?? user?.empresa?.id ?? (Array.isArray(user?.empresas) ? user.empresas[0]?.id : null) ?? null;
    } catch (e) {
      return null;
    }
  };

  // Estados para formulário
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '', // armazenar apenas dígitos
    email: '',
    telefone: '',
    endereco: ''
  });

  // Carregar empresas do usuário
  const loadCompanies = async () => {
    try {
      const empresas = await companyService.getCompanies();
      setCompanies(empresas || []);
      if (empresas && empresas.length === 1) {
        setSelectedEmpresaId(empresas[0].id);
      }
    } catch (error) {
      // apenas notificar, não bloquear
      addNotification({
        type: 'error',
        title: 'Erro',
        message: error.message || 'Erro ao carregar empresas'
      });
    }
  };

  // Função para carregar fornecedores da API
  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const data = await supplierService.getSuppliers(selectedEmpresaId || undefined);
      setSuppliers(data || []);
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
    loadCompanies();
  }, []);

  useEffect(() => {
    loadSuppliers();
  }, [selectedEmpresaId]);

  // Filtrar fornecedores baseado na busca
  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (supplier.cnpj || '').includes(searchTerm) ||
    (supplier.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Resetar formulário
  const resetForm = () => {
    setFormData({
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
      nome: supplier.nome || '',
      cnpj: String(supplier.cnpj || '').replace(/\D/g, ''),
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
    
    const empresa_id = selectedEmpresaId || getEmpresaId();
    const cnpjDigits = String(formData.cnpj || '').replace(/\D/g, '');
  
    // Validação básica
    if (!formData.nome || !cnpjDigits) {
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Nome e CNPJ são obrigatórios'
      });
      return;
    }
    if (cnpjDigits.length !== 14) {
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'CNPJ deve conter exatamente 14 dígitos (somente números)'
      });
      return;
    }
    if (!empresa_id) {
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'empresa_id não encontrado para o usuário logado. Selecione uma empresa no topo da página ou faça login novamente.'
      });
      return;
    }
  
    const payload = {
      ...formData,
      cnpj: cnpjDigits, // enviar apenas dígitos para o backend
      empresa_id
    };
  
    try {
      if (editingSupplier) {
        // Atualizar fornecedor
        await supplierService.updateSupplier(editingSupplier.id, payload);
        addNotification({
          type: 'success',
          title: 'Sucesso',
          message: 'Fornecedor atualizado com sucesso!'
        });
        setShowEditModal(false);
      } else {
        // Criar novo fornecedor
        await supplierService.createSupplier(payload);
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
        <div className="flex items-center space-x-3">
          <div className="w-64">
            <label className="block text-xs font-medium text-gray-600 mb-1">Empresa</label>
            <select
              value={selectedEmpresaId || ''}
              onChange={(e) => setSelectedEmpresaId(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas as empresas</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
          <Button onClick={handleAddSupplier} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Novo Fornecedor
          </Button>
        </div>
      </div>

      {/* Aviso se não houver empresa selecionada e usuário não possuir empresa no perfil */}
      {!selectedEmpresaId && companies.length === 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded">
          Nenhuma empresa encontrada para o usuário. Crie uma empresa em "Empresas" antes de cadastrar fornecedores.
        </div>
      )}

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
          {/* Campo Código removido - gerado automaticamente pelo banco */}

          {/* Empresa selecionada */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Empresa *</label>
            <select
              value={selectedEmpresaId || ''}
              onChange={(e) => setSelectedEmpresaId(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="" disabled>Selecione uma empresa</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
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
              value={formatCNPJ(formData.cnpj)}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 14);
                setFormData({ ...formData, cnpj: digits });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="00.000.000/0000-00"
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