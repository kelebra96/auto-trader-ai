import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  Filter
} from 'lucide-react';
import { toast } from 'sonner';

export default function MobileScanner() {
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
      toast.success('Produto encontrado na base de dados!');
    } else {
      setCurrentProduct(prev => ({
        ...prev,
        codigo_ean: barcode
      }));
      toast.info('Produto não encontrado. Preencha os dados manualmente.');
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

  const handleQuantityChange = (delta) => {
    setCurrentProduct(prev => ({
      ...prev,
      quantidade: Math.max(1, prev.quantidade + delta)
    }));
  };

  const handleSaveProduct = () => {
    if (!currentProduct.codigo_ean || !currentProduct.nome || !currentProduct.data_validade) {
      toast.error('Preencha os campos obrigatórios: Código EAN, Nome e Data de Validade');
      return;
    }

    const newProduct = {
      ...currentProduct,
      id: Date.now(),
      timestamp: new Date().toISOString(),
      status: getProductStatus(currentProduct.data_validade)
    };

    setScannedProducts(prev => [newProduct, ...prev]);
    
    // Limpar formulário
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

    toast.success('Produto adicionado com sucesso!');
  };

  const getProductStatus = (dataValidade) => {
    const hoje = new Date();
    const validade = new Date(dataValidade);
    const diasRestantes = Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24));

    if (diasRestantes < 0) return 'vencido';
    if (diasRestantes <= 3) return 'critico';
    if (diasRestantes <= 7) return 'atencao';
    return 'ok';
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      vencido: { variant: 'destructive', label: 'Vencido', icon: AlertTriangle },
      critico: { variant: 'destructive', label: 'Crítico', icon: AlertTriangle },
      atencao: { variant: 'warning', label: 'Atenção', icon: AlertTriangle },
      ok: { variant: 'success', label: 'OK', icon: CheckCircle }
    };

    const config = statusConfig[status] || statusConfig.ok;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const handleSyncData = () => {
    toast.success(`${scannedProducts.length} produtos sincronizados com o servidor!`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header Mobile */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Scanner Mobile</h1>
            <p className="text-gray-600">Coleta de dados de produtos</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Package className="h-3 w-3" />
              {scannedProducts.length}
            </Badge>
          </div>
        </div>

        {/* Botões de Modo */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={scanMode === 'barcode' ? 'default' : 'outline'}
            onClick={() => setScanMode('barcode')}
            className="flex-1"
          >
            <QrCode className="h-4 w-4 mr-2" />
            Scanner
          </Button>
          <Button
            variant={scanMode === 'manual' ? 'default' : 'outline'}
            onClick={() => setScanMode('manual')}
            className="flex-1"
          >
            <Smartphone className="h-4 w-4 mr-2" />
            Manual
          </Button>
        </div>
      </div>

      {/* Scanner de Código de Barras */}
      {scanMode === 'barcode' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scan className="h-5 w-5" />
              Scanner de Código de Barras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Digite ou escaneie o código EAN"
                  value={currentProduct.codigo_ean}
                  onChange={(e) => handleBarcodeInput(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleScanBarcode}
                  disabled={isScanning}
                  className="px-4"
                >
                  {isScanning ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {isScanning && (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Posicione o código de barras na câmera</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulário de Produto */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Dados do Produto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="codigo_ean">Código EAN *</Label>
                <Input
                  id="codigo_ean"
                  value={currentProduct.codigo_ean}
                  onChange={(e) => handleInputChange('codigo_ean', e.target.value)}
                  placeholder="7891234567890"
                />
              </div>

              <div>
                <Label htmlFor="nome">Nome do Produto *</Label>
                <Input
                  id="nome"
                  value={currentProduct.nome}
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                  placeholder="Nome do produto"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="categoria">Categoria</Label>
                  <Input
                    id="categoria"
                    value={currentProduct.categoria}
                    onChange={(e) => handleInputChange('categoria', e.target.value)}
                    placeholder="Laticínios"
                  />
                </div>
                <div>
                  <Label htmlFor="fornecedor">Fornecedor</Label>
                  <Input
                    id="fornecedor"
                    value={currentProduct.fornecedor}
                    onChange={(e) => handleInputChange('fornecedor', e.target.value)}
                    placeholder="Nome do fornecedor"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="data_validade">Data de Validade *</Label>
                <Input
                  id="data_validade"
                  type="date"
                  value={currentProduct.data_validade}
                  onChange={(e) => handleInputChange('data_validade', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantidade">Quantidade</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuantityChange(-1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      id="quantidade"
                      type="number"
                      value={currentProduct.quantidade}
                      onChange={(e) => handleInputChange('quantidade', parseInt(e.target.value) || 1)}
                      className="text-center"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuantityChange(1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="preco_custo">Preço de Custo</Label>
                  <Input
                    id="preco_custo"
                    type="number"
                    step="0.01"
                    value={currentProduct.preco_custo}
                    onChange={(e) => handleInputChange('preco_custo', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lote">Lote</Label>
                  <Input
                    id="lote"
                    value={currentProduct.lote}
                    onChange={(e) => handleInputChange('lote', e.target.value)}
                    placeholder="Número do lote"
                  />
                </div>
                <div>
                  <Label htmlFor="localizacao">Localização</Label>
                  <Input
                    id="localizacao"
                    value={currentProduct.localizacao}
                    onChange={(e) => handleInputChange('localizacao', e.target.value)}
                    placeholder="Setor/Prateleira"
                  />
                </div>
              </div>
            </div>

            <Button onClick={handleSaveProduct} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Salvar Produto
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Produtos Escaneados */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Produtos Coletados ({scannedProducts.length})
            </div>
            {scannedProducts.length > 0 && (
              <Button size="sm" onClick={handleSyncData}>
                Sincronizar
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {scannedProducts.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum produto coletado ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {scannedProducts.slice(0, 10).map((produto) => (
                <div key={produto.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="font-medium">{produto.nome}</p>
                      <p className="text-sm text-gray-600">{produto.codigo_ean}</p>
                    </div>
                    {getStatusBadge(produto.status)}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Validade:</span> {
                        new Date(produto.data_validade).toLocaleDateString('pt-BR')
                      }
                    </div>
                    <div>
                      <span className="font-medium">Qtd:</span> {produto.quantidade}
                    </div>
                    <div>
                      <span className="font-medium">Categoria:</span> {produto.categoria || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Preço:</span> R$ {produto.preco_custo || '0,00'}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Coletado em: {new Date(produto.timestamp).toLocaleString('pt-BR')}
                  </div>
                </div>
              ))}

              {scannedProducts.length > 10 && (
                <div className="text-center py-2">
                  <p className="text-sm text-gray-600">
                    E mais {scannedProducts.length - 10} produtos...
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botão de Sincronização Fixo */}
      {scannedProducts.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4">
          <Button onClick={handleSyncData} className="w-full shadow-lg">
            <Save className="h-4 w-4 mr-2" />
            Sincronizar {scannedProducts.length} Produtos
          </Button>
        </div>
      )}
    </div>
  );
}

