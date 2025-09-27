import React, { useState, useEffect } from 'react';
import { 
  Scan, 
  Package, 
  Calendar, 
  AlertTriangle, 
  CheckCircle,
  Camera,
  Smartphone,
  QrCode,
  Plus,
  Minus,
  Save,
  History,
  Search,
  Filter,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';

export default function MobileScanner() {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [scanMode, setScanMode] = useState('barcode'); // barcode, manual
  const [scannedProducts, setScannedProducts] = useState([]);
  const [currentProduct, setCurrentProduct] = useState({
    codigo_ean: '',
    nome: '',
    categoria: '',
    data_validade: '',
    quantidade: 1,
    preco_custo: '',
    fornecedor: '',
    lote: '',
    localizacao: ''
  });
  const [isScanning, setIsScanning] = useState(false);

  // Mock data para demonstração
  const mockProductDatabase = {
    '7891234567890': {
      nome: 'Leite Integral 1L',
      categoria: 'Laticínios',
      preco_custo: '4.50',
      fornecedor: 'Laticínios ABC'
    },
    '7891234567891': {
      nome: 'Pão de Forma Integral',
      categoria: 'Panificação',
      preco_custo: '6.90',
      fornecedor: 'Panificadora XYZ'
    },
    '7891234567892': {
      nome: 'Iogurte Natural 170g',
      categoria: 'Laticínios',
      preco_custo: '2.30',
      fornecedor: 'Laticínios ABC'
    }
  };

  const handleBarcodeInput = (barcode) => {
    if (mockProductDatabase[barcode]) {
      const productData = mockProductDatabase[barcode];
      setCurrentProduct(prev => ({
        ...prev,
        codigo_ean: barcode,
        nome: productData.nome,
        categoria: productData.categoria,
        preco_custo: productData.preco_custo,
        fornecedor: productData.fornecedor
      }));
      addNotification({
        type: 'success',
        title: 'Produto encontrado',
        message: 'Produto encontrado na base de dados!'
      });
    } else {
      setCurrentProduct(prev => ({
        ...prev,
        codigo_ean: barcode
      }));
      addNotification({
        type: 'info',
        title: 'Produto não encontrado',
        message: 'Produto não encontrado. Preencha os dados manualmente.'
      });
    }
  };

  const handleScanBarcode = () => {
    setIsScanning(true);
    // Simular escaneamento
    setTimeout(() => {
      const mockBarcodes = Object.keys(mockProductDatabase);
      const randomBarcode = mockBarcodes[Math.floor(Math.random() * mockBarcodes.length)];
      handleBarcodeInput(randomBarcode);
      setIsScanning(false);
    }, 2000);
  };

  const handleInputChange = (field, value) => {
    setCurrentProduct(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleQuantityChange = (increment) => {
    setCurrentProduct(prev => ({
      ...prev,
      quantidade: Math.max(1, prev.quantidade + increment)
    }));
  };

  const handleSaveProduct = () => {
    if (!currentProduct.codigo_ean || !currentProduct.nome) {
      addNotification({
        type: 'error',
        title: 'Dados incompletos',
        message: 'Preencha pelo menos o código EAN e nome do produto.'
      });
      return;
    }

    const newProduct = {
      ...currentProduct,
      id: Date.now(),
      timestamp: new Date().toISOString()
    };

    setScannedProducts(prev => [newProduct, ...prev]);
    setCurrentProduct({
      codigo_ean: '',
      nome: '',
      categoria: '',
      data_validade: '',
      quantidade: 1,
      preco_custo: '',
      fornecedor: '',
      lote: '',
      localizacao: ''
    });

    addNotification({
      type: 'success',
      title: 'Produto salvo',
      message: 'Produto adicionado à lista de escaneados.'
    });
  };

  const handleRemoveProduct = (productId) => {
    setScannedProducts(prev => prev.filter(p => p.id !== productId));
    addNotification({
      type: 'info',
      title: 'Produto removido',
      message: 'Produto removido da lista.'
    });
  };

  const getExpiryStatus = (dataValidade) => {
    if (!dataValidade) return { status: 'unknown', color: 'bg-gray-100 text-gray-800' };
    
    const today = new Date();
    const expiry = new Date(dataValidade);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: 'expired', color: 'bg-red-100 text-red-800', text: 'Vencido' };
    } else if (diffDays <= 3) {
      return { status: 'critical', color: 'bg-red-100 text-red-800', text: 'Crítico' };
    } else if (diffDays <= 7) {
      return { status: 'warning', color: 'bg-yellow-100 text-yellow-800', text: 'Atenção' };
    } else {
      return { status: 'ok', color: 'bg-green-100 text-green-800', text: 'OK' };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          className="inline-flex items-center px-2 py-1 text-sm font-medium text-gray-700 bg-transparent hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          onClick={() => navigate('/mobile')}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scanner Mobile</h1>
          <p className="text-gray-600">Escaneie ou adicione produtos</p>
        </div>
      </div>

      {/* Modo de Escaneamento */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Modo de Entrada
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <button
              className={`h-16 flex flex-col items-center justify-center gap-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                scanMode === 'barcode' 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => setScanMode('barcode')}
            >
              <QrCode className="h-6 w-6" />
              <span className="text-sm">Scanner</span>
            </button>
            <button
              className={`h-16 flex flex-col items-center justify-center gap-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                scanMode === 'manual' 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => setScanMode('manual')}
            >
              <Smartphone className="h-6 w-6" />
              <span className="text-sm">Manual</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scanner de Código de Barras */}
      {scanMode === 'barcode' && (
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Scanner de Código de Barras</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  className="flex-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Digite ou escaneie o código EAN"
                  value={currentProduct.codigo_ean}
                  onChange={(e) => handleInputChange('codigo_ean', e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleBarcodeInput(e.target.value);
                    }
                  }}
                />
                <button
                  className="flex-shrink-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  onClick={handleScanBarcode}
                  disabled={isScanning}
                >
                  {isScanning ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
              </div>
              
              {isScanning && (
                <div className="text-center py-8">
                  <div className="animate-pulse">
                    <QrCode className="h-16 w-16 mx-auto mb-4 text-blue-600" />
                    <p className="text-gray-600">Escaneando código de barras...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Formulário de Produto */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Package className="h-5 w-5" />
            Dados do Produto
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto</label>
              <input
                id="nome"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nome do produto"
                value={currentProduct.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <input
                  id="categoria"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Categoria"
                  value={currentProduct.categoria}
                  onChange={(e) => handleInputChange('categoria', e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="fornecedor" className="block text-sm font-medium text-gray-700 mb-1">Fornecedor</label>
                <input
                  id="fornecedor"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Fornecedor"
                  value={currentProduct.fornecedor}
                  onChange={(e) => handleInputChange('fornecedor', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="data_validade" className="block text-sm font-medium text-gray-700 mb-1">Data de Validade</label>
                <input
                  id="data_validade"
                  type="date"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={currentProduct.data_validade}
                  onChange={(e) => handleInputChange('data_validade', e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="preco_custo" className="block text-sm font-medium text-gray-700 mb-1">Preço de Custo</label>
                <input
                  id="preco_custo"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0,00"
                  value={currentProduct.preco_custo}
                  onChange={(e) => handleInputChange('preco_custo', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="lote" className="block text-sm font-medium text-gray-700 mb-1">Lote</label>
                <input
                  id="lote"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Número do lote"
                  value={currentProduct.lote}
                  onChange={(e) => handleInputChange('lote', e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="localizacao" className="block text-sm font-medium text-gray-700 mb-1">Localização</label>
                <input
                  id="localizacao"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Setor/Prateleira"
                  value={currentProduct.localizacao}
                  onChange={(e) => handleInputChange('localizacao', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
              <div className="flex items-center gap-2 mt-1">
                <button
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={currentProduct.quantidade <= 1}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  type="number"
                  className="text-center w-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={currentProduct.quantidade}
                  onChange={(e) => handleInputChange('quantidade', parseInt(e.target.value) || 1)}
                  min="1"
                />
                <button
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => handleQuantityChange(1)}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <button
              className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={handleSaveProduct}
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Produto
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Produtos Escaneados */}
      {scannedProducts.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <History className="h-5 w-5" />
              Produtos Escaneados ({scannedProducts.length})
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {scannedProducts.map((product) => {
                const expiryStatus = getExpiryStatus(product.data_validade);
                return (
                  <div key={product.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-medium">{product.nome}</p>
                        <p className="text-sm text-gray-600">
                          {product.categoria} • {product.fornecedor}
                        </p>
                        <p className="text-xs text-gray-500">
                          EAN: {product.codigo_ean} • Qtd: {product.quantidade}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {product.data_validade && (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${expiryStatus.color}`}>
                            {expiryStatus.text}
                          </span>
                        )}
                        <button
                          className="inline-flex items-center px-2 py-1 text-sm font-medium text-gray-700 bg-transparent hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          onClick={() => handleRemoveProduct(product.id)}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {product.data_validade && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        Validade: {new Date(product.data_validade).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}