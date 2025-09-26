import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Search, Filter, Plus, Edit, Trash2, X, ChevronDown, Package } from 'lucide-react';
import { Button } from '../components/ui/button';
import Dialog from '../components/ui/Dialog';
import AddProductForm from '../components/forms/AddProductForm';
import { useNotifications } from '../contexts/NotificationContext';
import { formatCurrency, formatDate, getExpiryStatus, getExpiryStatusColor, getExpiryStatusText } from '../lib/utils';
import { productService } from '../services/api';

const ProductList = () => {
  const { addNotification } = useNotifications();
  
  const [products, setProducts] = useState([]);

  // Estados para filtros e busca
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    categoria: '',
    precoMin: '',
    precoMax: '',
    estoqueMin: '',
    estoqueMax: '',
    status: '',
    fornecedor: ''
  });

  // Estados para modais
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [loading, setLoading] = useState(false);

  // Função para carregar produtos da API
  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getProducts();
      setProducts(data);
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao carregar produtos: ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  // Efeito para carregar dados iniciais
  useEffect(() => {
    loadProducts();
  }, []);

  // Produtos filtrados
  const [filteredProducts, setFilteredProducts] = useState(products);

  // Categorias disponíveis
  const categorias = [
    'Laticínios',
    'Padaria',
    'Frios',
    'Bebidas',
    'Carnes',
    'Frutas e Verduras',
    'Congelados',
    'Higiene',
    'Limpeza',
    'Outros'
  ];

  // Efeito para aplicar filtros
  useEffect(() => {
    let filtered = products;

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.fornecedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.codigo_barras.includes(searchTerm)
      );
    }

    // Filtros avançados
    if (filters.categoria) {
      filtered = filtered.filter(product => product.categoria === filters.categoria);
    }

    if (filters.precoMin) {
      filtered = filtered.filter(product => product.preco >= parseFloat(filters.precoMin));
    }

    if (filters.precoMax) {
      filtered = filtered.filter(product => product.preco <= parseFloat(filters.precoMax));
    }

    if (filters.estoqueMin) {
      filtered = filtered.filter(product => product.estoque >= parseInt(filters.estoqueMin));
    }

    if (filters.estoqueMax) {
      filtered = filtered.filter(product => product.estoque <= parseInt(filters.estoqueMax));
    }

    if (filters.status) {
      filtered = filtered.filter(product => {
        const status = getExpiryStatus(product.data_validade);
        return status === filters.status;
      });
    }

    if (filters.fornecedor) {
      filtered = filtered.filter(product => 
        product.fornecedor.toLowerCase().includes(filters.fornecedor.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, filters]);

  // Funções de manipulação
  const handleAddProduct = (newProduct) => {
    const productWithId = {
      ...newProduct,
      id: Math.max(...products.map(p => p.id)) + 1
    };
    setProducts(prev => [...prev, productWithId]);
    addNotification('Produto adicionado com sucesso!', 'success');
  };

  const handleProductSuccess = () => {
    // Recarregar a lista de produtos após adicionar/editar
    loadProducts();
  };

  const handleEditProduct = (updatedProduct) => {
    setProducts(prev => prev.map(p => 
      p.id === updatedProduct.id ? updatedProduct : p
    ));
    addNotification('Produto atualizado com sucesso!', 'success');
    setShowEditModal(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = async () => {
    if (deletingProduct) {
      try {
        await productService.deleteProduct(deletingProduct.id);
        setProducts(prev => prev.filter(p => p.id !== deletingProduct.id));
        addNotification({
          type: 'success',
          title: 'Sucesso',
          message: `Produto "${deletingProduct.nome}" removido com sucesso!`
        });
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Erro',
          message: 'Erro ao deletar produto: ' + error.message
        });
      } finally {
        setShowDeleteModal(false);
        setDeletingProduct(null);
      }
    }
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setShowEditModal(true);
  };

  const openDeleteModal = (product) => {
    setDeletingProduct(product);
    setShowDeleteModal(true);
  };

  const clearFilters = () => {
    setFilters({
      categoria: '',
      precoMin: '',
      precoMax: '',
      estoqueMin: '',
      estoqueMax: '',
      status: '',
      fornecedor: ''
    });
    setSearchTerm('');
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="text-gray-600 mt-1">
            {filteredProducts.length} de {products.length} produtos
          </p>
        </div>
        <Button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo Produto
        </Button>
      </div>

      {/* Busca e Filtros */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar por nome, categoria, fornecedor ou código de barras..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtros
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
            {(searchTerm || Object.values(filters).some(v => v)) && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Limpar
              </Button>
            )}
          </div>

          {/* Filtros Avançados */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <select
                  value={filters.categoria}
                  onChange={(e) => handleFilterChange('categoria', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todas as categorias</option>
                  {categorias.map(categoria => (
                    <option key={categoria} value={categoria}>
                      {categoria}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preço Mínimo
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="R$ 0,00"
                  value={filters.precoMin}
                  onChange={(e) => handleFilterChange('precoMin', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preço Máximo
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="R$ 999,99"
                  value={filters.precoMax}
                  onChange={(e) => handleFilterChange('precoMax', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status de Validade
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todos os status</option>
                  <option value="expired">Vencido</option>
                  <option value="expiring">Vencendo</option>
                  <option value="warning">Atenção</option>
                  <option value="normal">Normal</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estoque Mínimo
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={filters.estoqueMin}
                  onChange={(e) => handleFilterChange('estoqueMin', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estoque Máximo
                </label>
                <input
                  type="number"
                  placeholder="999"
                  value={filters.estoqueMax}
                  onChange={(e) => handleFilterChange('estoqueMax', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fornecedor
                </label>
                <input
                  type="text"
                  placeholder="Nome do fornecedor"
                  value={filters.fornecedor}
                  onChange={(e) => handleFilterChange('fornecedor', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Tabela de Produtos */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Validade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estoque
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Preço
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fornecedor
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
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                      <p className="text-gray-500">Carregando produtos...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((product) => {
                  const expiryStatus = getExpiryStatus(product.data_validade);
                  const statusColor = getExpiryStatusColor(expiryStatus);
                  const statusText = getExpiryStatusText(expiryStatus);
                  
                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.nome}</div>
                          <div className="text-sm text-gray-500">{product.codigo_barras}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{product.categoria}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(product.data_validade)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{product.estoque} un</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatCurrency(product.preco)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{product.fornecedor}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColor}`}>
                          {statusText}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(product)}
                            className="flex items-center gap-1"
                          >
                            <Edit className="h-3 w-3" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteModal(product)}
                            className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:border-red-300"
                          >
                            <Trash2 className="h-3 w-3" />
                            Excluir
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Nenhum produto encontrado
                      </h3>
                      <p className="text-gray-500">
                        {searchTerm || Object.values(filters).some(v => v)
                          ? 'Tente ajustar os filtros de busca.'
                          : 'Comece adicionando seu primeiro produto.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Adicionar Produto */}
      <Dialog 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)}
        title="Adicionar Novo Produto"
        size="lg"
      >
        <AddProductForm
          onSuccess={handleProductSuccess}
          onClose={() => setShowAddModal(false)}
          onCancel={() => setShowAddModal(false)}
        />
      </Dialog>

      {/* Modal Editar Produto */}
      <Dialog 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)}
        title="Editar Produto"
        size="lg"
      >
        {editingProduct && (
          <AddProductForm
            initialData={editingProduct}
            onSuccess={handleEditProduct}
            onCancel={() => setShowEditModal(false)}
            isEditing={true}
          />
        )}
      </Dialog>

      {/* Modal Confirmar Exclusão */}
      <Dialog 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)}
        title="Confirmar Exclusão"
        size="sm"
      >
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <Trash2 className="h-6 w-6 text-red-600" />
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Tem certeza que deseja excluir o produto "{deletingProduct?.nome}"? 
            Esta ação não pode ser desfeita.
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteProduct}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

const Products = () => {
  return (
    <Routes>
      <Route index element={<ProductList />} />
    </Routes>
  );
};

export default Products;