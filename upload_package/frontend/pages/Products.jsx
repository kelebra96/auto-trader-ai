import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Search, Filter, Plus, Edit, Trash2, X, ChevronDown, Package, Upload } from 'lucide-react';
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importLoading, setImportLoading] = useState(false);
  const [importResults, setImportResults] = useState(null);

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

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/json'
      ];
      
      if (allowedTypes.includes(file.type) || file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.json')) {
        setImportFile(file);
        setImportResults(null);
      } else {
        alert('Tipo de arquivo não suportado. Use apenas .csv, .xlsx ou .json');
      }
    }
  };

  const handleImportProducts = async () => {
    if (!importFile) return;

    setImportLoading(true);
    setImportProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('file', importFile);

      // Simular progresso
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await productService.importProducts(formData);
      
      clearInterval(progressInterval);
      setImportProgress(100);
      
      setImportResults(response);
      await loadProducts();
      
      setTimeout(() => {
        setImportProgress(0);
        setImportFile(null);
        setImportResults(null);
        setShowImportModal(false);
      }, 2000);
      
    } catch (error) {
      console.error('Erro ao importar produtos:', error);
      alert('Erro ao importar produtos. Verifique o formato do arquivo.');
    } finally {
      setImportLoading(false);
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
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowImportModal(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Importar
          </Button>
          <Button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Novo Produto
          </Button>
        </div>
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
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fornecedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                      <p className="text-gray-500">Carregando produtos...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((product) => {
                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{product.codigo}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{product.nome}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{product.categoria}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{product.fornecedor_nome || 'N/A'}</div>
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
                  <td colSpan="5" className="px-6 py-12 text-center">
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

      {/* Modal Importar Produtos */}
      <Dialog 
        isOpen={showImportModal} 
        onClose={() => setShowImportModal(false)}
        title="Importar Produtos"
        size="md"
      >
        <div className="space-y-6">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Selecione um arquivo para importar produtos. Formatos suportados: CSV, XLSX, JSON
            </p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".csv,.xlsx,.json"
                onChange={handleFileSelect}
                className="hidden"
                id="import-file"
              />
              <label htmlFor="import-file" className="cursor-pointer">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-sm text-gray-600">
                  Clique para selecionar um arquivo ou arraste aqui
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  CSV, XLSX ou JSON (máx. 10MB)
                </p>
              </label>
            </div>

            {importFile && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  Arquivo selecionado: {importFile.name}
                </p>
                <p className="text-xs text-blue-600">
                  Tamanho: {(importFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}
          </div>

          {importProgress > 0 && (
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Importando...</span>
                <span>{importProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${importProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {importResults && (
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="text-sm font-medium text-green-800 mb-2">
                Importação concluída!
              </h4>
              <p className="text-sm text-green-700">
                {importResults.imported || 0} produtos importados com sucesso
              </p>
              {importResults.errors && importResults.errors.length > 0 && (
                <p className="text-sm text-red-600 mt-1">
                  {importResults.errors.length} erros encontrados
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowImportModal(false)}
              disabled={importLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleImportProducts}
              disabled={!importFile || importLoading}
              className="flex items-center gap-2"
            >
              {importLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Importar
                </>
              )}
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