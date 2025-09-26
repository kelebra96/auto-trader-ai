import React, { useState } from 'react';
import { Button } from '../ui/button';
import { BarChart3, TrendingUp, Package, AlertTriangle, Download, Calendar } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { reportService } from '../../services/api';

const ReportsViewer = ({ onClose }) => {
  const { addNotification } = useNotifications();
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  const reportTypes = [
    {
      id: 'estoque',
      title: 'Relatório de Estoque',
      description: 'Visão geral do estoque atual, produtos em falta e excesso',
      icon: Package,
      color: 'blue'
    },
    {
      id: 'validade',
      title: 'Relatório de Validade',
      description: 'Produtos vencidos, vencendo e próximos do vencimento',
      icon: AlertTriangle,
      color: 'orange'
    },
    {
      id: 'vendas',
      title: 'Relatório de Vendas',
      description: 'Análise de vendas por período, produtos mais vendidos',
      icon: TrendingUp,
      color: 'green'
    },
    {
      id: 'financeiro',
      title: 'Relatório Financeiro',
      description: 'Receitas, custos e margem de lucro por produto/categoria',
      icon: BarChart3,
      color: 'purple'
    }
  ];

  // Função para buscar dados reais dos relatórios
  const fetchReportData = async (reportType) => {
    try {
      setLoading(true);
      
      let data;
      switch (reportType) {
        case 'estoque':
          data = await reportService.getRelatorioEstoque();
          break;
        case 'validade':
          data = await reportService.getRelatorioValidades();
          break;
        case 'vendas':
          data = await reportService.getRelatorioVendas();
          break;
        case 'financeiro':
          data = await reportService.getRelatorioFinanceiro();
          break;
        default:
          throw new Error('Tipo de relatório inválido');
      }
      
      setReportData(data);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
      addNotification('Erro ao carregar relatório', 'error');
      setLoading(false);
    }
  };



  const handleGenerateReport = async (reportId) => {
    setSelectedReport(reportId);
    await fetchReportData(reportId);
    addNotification({
      type: 'success',
      title: 'Relatório Gerado',
      message: `${reportTypes.find(r => r.id === reportId)?.title} foi gerado com sucesso!`
    });
  };

  const handleDownloadReport = (reportId) => {
    addNotification({
      type: 'info',
      title: 'Download Iniciado',
      message: 'O download do relatório foi iniciado.'
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const renderReportData = (reportId) => {
    if (!reportData) return null;

    switch (reportId) {
      case 'estoque':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800">Total de Produtos</h4>
                <p className="text-2xl font-bold text-blue-600">{reportData.resumo?.total_produtos || 0}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800">Valor Total do Estoque</h4>
                <p className="text-2xl font-bold text-green-600">R$ {reportData.resumo?.valor_total_estoque?.toFixed(2) || '0.00'}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-semibold text-purple-800">Categorias</h4>
                <p className="text-2xl font-bold text-purple-600">{reportData.resumo?.total_categorias || 0}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-800">Estoque Baixo</h4>
                <p className="text-2xl font-bold text-yellow-600">{reportData.resumo?.produtos_estoque_baixo || 0}</p>
              </div>
            </div>
            
            {reportData.categorias && reportData.categorias.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Produtos por Categoria</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produtos</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantidade Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.categorias.map((categoria, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{categoria.categoria}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{categoria.quantidade_produtos}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{categoria.quantidade_total}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">R$ {categoria.valor_total?.toFixed(2) || '0.00'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {reportData.produtos_estoque_baixo && reportData.produtos_estoque_baixo.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Produtos com Estoque Baixo</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estoque Atual</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Unitário</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.produtos_estoque_baixo.map((produto, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{produto.nome}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{produto.categoria}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">{produto.quantidade_estoque}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">R$ {produto.preco_venda?.toFixed(2) || '0.00'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );

      case 'validade':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-semibold text-red-800">Vencidos</h4>
                <p className="text-2xl font-bold text-red-600">{reportData.resumo?.vencidos || 0}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <h4 className="font-semibold text-orange-800">Vencem Hoje</h4>
                <p className="text-2xl font-bold text-orange-600">{reportData.resumo?.vencem_hoje || 0}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-800">Vencem em 7 dias</h4>
                <p className="text-2xl font-bold text-yellow-600">{reportData.resumo?.vencem_7_dias || 0}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800">Vencem em 30 dias</h4>
                <p className="text-2xl font-bold text-blue-600">{reportData.resumo?.vencem_30_dias || 0}</p>
              </div>
            </div>
            
            {reportData.produtos_criticos && reportData.produtos_criticos.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Produtos Críticos (Vencidos ou Vencendo)</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data de Validade</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantidade</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Urgência</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.produtos_criticos.map((produto, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{produto.nome}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{produto.categoria}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {produto.data_validade ? new Date(produto.data_validade).toLocaleDateString('pt-BR') : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{produto.quantidade}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              produto.urgencia === 'alta' ? 'bg-red-100 text-red-800' :
                              produto.urgencia === 'media' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {produto.urgencia}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );

      case 'vendas':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800">Receita Total</h4>
                <p className="text-2xl font-bold text-green-600">R$ {reportData.resumo?.receita_total?.toFixed(2) || '0.00'}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800">Produtos Cadastrados</h4>
                <p className="text-2xl font-bold text-blue-600">{reportData.resumo?.produtos_cadastrados || 0}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-semibold text-purple-800">Valor Potencial</h4>
                <p className="text-2xl font-bold text-purple-600">R$ {reportData.resumo?.valor_potencial_estoque?.toFixed(2) || '0.00'}</p>
              </div>
            </div>

            {reportData.observacao && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      <strong>Observação:</strong> {reportData.observacao}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {reportData.produtos_cadastrados && reportData.produtos_cadastrados.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Produtos Cadastrados (Top 10)</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estoque</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Potencial</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Margem Potencial</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.produtos_cadastrados.map((produto, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{produto.nome}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{produto.categoria}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{produto.quantidade_estoque}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">R$ {produto.valor_potencial?.toFixed(2) || '0.00'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">R$ {produto.margem_total_potencial?.toFixed(2) || '0.00'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {reportData.categorias_disponiveis && reportData.categorias_disponiveis.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Categorias Disponíveis</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produtos</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estoque Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Potencial</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Margem Potencial</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.categorias_disponiveis.map((categoria, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{categoria.categoria}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{categoria.quantidade_produtos}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{categoria.quantidade_total_estoque}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">R$ {categoria.valor_potencial?.toFixed(2) || '0.00'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">R$ {categoria.margem_potencial?.toFixed(2) || '0.00'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );

      case 'financeiro':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800">Valor Investido</h4>
                <p className="text-2xl font-bold text-blue-600">R$ {reportData.resumo?.valor_total_investido?.toFixed(2) || '0.00'}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800">Valor Potencial</h4>
                <p className="text-2xl font-bold text-green-600">R$ {reportData.resumo?.valor_total_potencial?.toFixed(2) || '0.00'}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-semibold text-purple-800">Margem Potencial</h4>
                <p className="text-2xl font-bold text-purple-600">R$ {reportData.resumo?.margem_total_potencial?.toFixed(2) || '0.00'}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <h4 className="font-semibold text-orange-800">Margem %</h4>
                <p className="text-2xl font-bold text-orange-600">{reportData.resumo?.margem_percentual_geral?.toFixed(1) || '0.0'}%</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800">Total Produtos</h4>
                <p className="text-2xl font-bold text-gray-600">{reportData.resumo?.total_produtos || 0}</p>
              </div>
            </div>

            {reportData.observacao && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      <strong>Observação:</strong> {reportData.observacao}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {reportData.categorias_mais_lucrativas && reportData.categorias_mais_lucrativas.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Categorias Mais Lucrativas</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produtos</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Investido</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Potencial</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Margem Potencial</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.categorias_mais_lucrativas.map((categoria, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{categoria.categoria}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{categoria.quantidade_produtos}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">R$ {categoria.valor_investido?.toFixed(2) || '0.00'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">R$ {categoria.valor_potencial?.toFixed(2) || '0.00'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">R$ {categoria.margem_potencial?.toFixed(2) || '0.00'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {reportData.produtos_mais_lucrativos && reportData.produtos_mais_lucrativos.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Produtos Mais Lucrativos (Top 10)</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Investido</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Potencial</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Margem Potencial</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Margem %</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.produtos_mais_lucrativos.map((produto, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{produto.nome}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{produto.categoria}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">R$ {produto.valor_investido?.toFixed(2) || '0.00'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">R$ {produto.valor_potencial?.toFixed(2) || '0.00'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">R$ {produto.margem_potencial?.toFixed(2) || '0.00'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{produto.margem_percentual?.toFixed(1) || '0.0'}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {!selectedReport ? (
        <>
          <div>
            <h3 className="text-lg font-medium mb-2">Selecione um Relatório</h3>
            <p className="text-gray-600">Escolha o tipo de relatório que deseja visualizar</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportTypes.map((report) => {
              const Icon = report.icon;
              return (
                <div
                  key={report.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => handleGenerateReport(report.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg bg-${report.color}-100`}>
                      <Icon className={`h-6 w-6 text-${report.color}-600`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{report.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">
                {reportTypes.find(r => r.id === selectedReport)?.title}
              </h3>
              <p className="text-gray-600">Dados atualizados em tempo real</p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadReport(selectedReport)}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedReport(null)}
              >
                Voltar
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Gerando relatório...</span>
            </div>
          ) : (
            renderReportData(selectedReport)
          )}
        </>
      )}

      <div className="flex justify-end pt-4">
        <Button variant="outline" onClick={onClose}>
          Fechar
        </Button>
      </div>
    </div>
  );
};

export default ReportsViewer;