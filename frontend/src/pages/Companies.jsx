import React, { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2, X, Building } from "lucide-react";
import { Button } from "../components/ui/button";
import Dialog from "../components/ui/Dialog";
import { useNotifications } from "../contexts/NotificationContext";
import { companyService } from "../services/api";

const Companies = () => {
  const { addNotification } = useNotifications();

  const [companies, setCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Estados para modais
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [deletingCompany, setDeletingCompany] = useState(null);
  const [loading, setLoading] = useState(false);

  // Estados para formulário
  const [formData, setFormData] = useState({
    nome: "",
    cnpj: "",
    email: "",
    telefone: "",
    endereco: "",
  });

  // Função para carregar empresas da API
  const loadCompanies = async () => {
    try {
      setLoading(true);
      const data = await companyService.getCompanies();
      setCompanies(data);
    } catch (error) {
      addNotification({
        type: "error",
        title: "Erro",
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  // Filtrar empresas baseado na busca
  const filteredCompanies = companies.filter(
    (company) =>
      company.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.cnpj.includes(searchTerm) ||
      company.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Resetar formulário
  const resetForm = () => {
    setFormData({
      nome: "",
      cnpj: "",
      email: "",
      telefone: "",
      endereco: "",
    });
  };

  // Abrir modal de adicionar
  const handleAddCompany = () => {
    resetForm();
    setShowAddModal(true);
  };

  // Abrir modal de editar
  const handleEditCompany = (company) => {
    setEditingCompany(company);
    setFormData({
      nome: company.nome || "",
      cnpj: company.cnpj || "",
      email: company.email || "",
      telefone: company.telefone || "",
      endereco: company.endereco || "",
    });
    setShowEditModal(true);
  };

  // Abrir modal de deletar
  const handleDeleteCompany = (company) => {
    setDeletingCompany(company);
    setShowDeleteModal(true);
  };

  // Submeter formulário
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validação básica
    if (!formData.nome || !formData.cnpj) {
      addNotification({
        type: "error",
        title: "Erro",
        message: "Nome e CNPJ são obrigatórios",
      });
      return;
    }

    try {
      // Normalizar CNPJ: enviar apenas dígitos
      const cnpjDigits = String(formData.cnpj || "").replace(/\D/g, "");

      const payload = {
        ...formData,
        cnpj: cnpjDigits,
      };

      if (editingCompany) {
        // Atualizar empresa
        await companyService.updateCompany(editingCompany.id, payload);
        addNotification({
          type: "success",
          title: "Sucesso",
          message: "Empresa atualizada com sucesso!",
        });
        setShowEditModal(false);
      } else {
        // Criar nova empresa
        await companyService.createCompany(payload);
        addNotification({
          type: "success",
          title: "Sucesso",
          message: "Empresa criada com sucesso!",
        });
        setShowAddModal(false);
      }

      loadCompanies();
      resetForm();
    } catch (error) {
      addNotification({
        type: "error",
        title: "Erro",
        message: error.message,
      });
    }
  };

  // Confirmar exclusão
  const confirmDelete = async () => {
    try {
      await companyService.deleteCompany(deletingCompany.id);
      addNotification({
        type: "success",
        title: "Sucesso",
        message: "Empresa excluída com sucesso!",
      });
      setShowDeleteModal(false);
      loadCompanies();
    } catch (error) {
      addNotification({
        type: "error",
        title: "Erro",
        message: error.message,
      });
    }
  };

  // Fechar modais
  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setEditingCompany(null);
    setDeletingCompany(null);
    resetForm();
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Empresas</h1>
          <p className="text-gray-600">Gerencie as empresas do sistema</p>
        </div>
        <Button
          onClick={handleAddCompany}
          className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Nova Empresa
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

      {/* Tabela de empresas */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
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
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  Carregando empresas...
                </td>
              </tr>
            ) : filteredCompanies.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  <Building className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p>Nenhuma empresa encontrada</p>
                </td>
              </tr>
            ) : (
              filteredCompanies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {company.nome}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{company.cnpj}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{company.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {company.telefone}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditCompany(company)}
                        className="text-blue-600 hover:text-blue-900">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCompany(company)}
                        className="text-red-600 hover:text-red-900">
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

      {/* Modal de Adicionar/Editar Empresa */}
      <Dialog
        isOpen={showAddModal || showEditModal}
        onClose={closeModals}
        title={editingCompany ? "Editar Empresa" : "Nova Empresa"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome *
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) =>
                setFormData({ ...formData, nome: e.target.value })
              }
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
              onChange={(e) =>
                setFormData({ ...formData, cnpj: e.target.value })
              }
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
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
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
              onChange={(e) =>
                setFormData({ ...formData, telefone: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Endereço
            </label>
            <textarea
              value={formData.endereco}
              onChange={(e) =>
                setFormData({ ...formData, endereco: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={closeModals}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {editingCompany ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog
        isOpen={showDeleteModal}
        onClose={closeModals}
        title="Confirmar Exclusão">
        <div className="space-y-4">
          <p className="text-gray-600">
            Tem certeza que deseja excluir a empresa{" "}
            <strong>{deletingCompany?.nome}</strong>?
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
              className="bg-red-600 hover:bg-red-700">
              Excluir
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default Companies;
