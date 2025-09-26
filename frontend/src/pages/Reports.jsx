import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Calendar, TrendingUp, FileText, Package, Users, DollarSign, AlertTriangle, CheckCircle, Clock, Eye, X } from 'lucide-react';
import { reportService } from '../services/api';

const Reports = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await reportService.getDashboard();
      setDashboardData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (reportType) => {
    try {
      setLoadingReport(true);
      setSelectedReport(reportType);
      
      let data;
      switch (reportType) {
        case 'validades':
          data = await reportService.getRelatorioValidades();
          break;
        case 'perdas':
          data = await reportService.getRelatorioPerdas();
          break;
        case 'estoque':
          data = await reportService.getRelatorioEstoque();
          break;
        case 'vendas':
          data = await reportService.getRelatorioVendas();
          break;
        case 'fornecedores':
          data = await reportService.getRelatorioFornecedores();
          break;
        default:
          throw new Error('Tipo de relatório não reconhecido');
      }
      
      setReportData(data);
      setShowReportModal(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingReport(false);
    }
  };

  const handleExportPDF = async () => {
    if (!selectedReport || !reportData) {
      alert('Por favor, gere um relatório primeiro');
      return;
    }

    try {
      const result = await reportService.exportarRelatorio(reportData, selectedReport, 'pdf');
      if (result.success) {
        alert(result.message || 'PDF gerado e baixado com sucesso!');
      } else {
        alert(result.message || 'Erro ao gerar PDF');
      }
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      alert('Erro ao exportar relatório: ' + error.message);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const renderReportContent = () => {
    if (!reportData) return null;

    switch (selectedReport) {
      case 'validades':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{reportData.produtos_vencidos?.length || 0}</div>
                <div className="text-sm text-red-600">Produtos Vencidos</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{reportData.vencendo_hoje?.length || 0}</div>
                <div className="text-sm text-yellow-600">Vencendo Hoje</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{reportData.vencendo_7_dias?.length || 0}</div>
                <div className="text-sm text-orange-600">Vencendo em 7 dias</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{reportData.vencendo_30_dias?.length || 0}</div>
                <div className="text-sm text-blue-600">Vencendo em 30 dias</div>
              </div>
            </div>
            
            {reportData.produtos_criticos?.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold mb-3">Produtos Críticos</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Validade</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Estoque</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {reportData.produtos_criticos.map((produto, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-gray-900">{produto.nome}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{formatDate(produto.data_validade)}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{produto.quantidade}</td>
                          <td className="px-4 py-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              produto.status === 'vencido' ? 'bg-red-100 text-red-800' :
                              produto.status === 'vencendo_hoje' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-orange-100 text-orange-800'
                            }`}>
                              {produto.status === 'vencido' ? 'Vencido' :
                               produto.status === 'vencendo_hoje' ? 'Vence Hoje' :
                               'Vencendo'}
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

      case 'perdas':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{formatCurrency(reportData.total_perdas || 0)}</div>
                <div className="text-sm text-red-600">Total de Perdas</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{reportData.produtos_com_perdas?.length || 0}</div>
                <div className="text-sm text-orange-600">Produtos com Perdas</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{Object.keys(reportData.perdas_por_categoria || {}).length}</div>
                <div className="text-sm text-yellow-600">Categorias Afetadas</div>
              </div>
            </div>

            {reportData.produtos_com_perdas?.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold mb-3">Produtos com Maiores Perdas</h4>
                <div className="space-y-3">
                  {reportData.produtos_com_perdas.slice(0, 5).map((produto, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-gray-900">{produto.nome}</span>
                          <span className="text-red-600 font-semibold">{formatCurrency(produto.valor_perdas)}</span>
                        </div>
                        <div className="text-xs text-gray-500">Quantidade perdida: {produto.quantidade_perdida}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'estoque':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{reportData.total_produtos || 0}</div>
                <div className="text-sm text-blue-600">Total de Produtos</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{formatCurrency(reportData.valor_total_estoque || 0)}</div>
                <div className="text-sm text-green-600">Valor Total</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{reportData.produtos_estoque_baixo?.length || 0}</div>
                <div className="text-sm text-yellow-600">Estoque Baixo</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{Object.keys(reportData.estoque_por_categoria || {}).length}</div>
                <div className="text-sm text-purple-600">Categorias</div>
              </div>
            </div>

            {reportData.produtos_estoque_baixo?.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold mb-3">Produtos com Estoque Baixo</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Estoque Atual</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Estoque Mínimo</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Valor Unitário</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {reportData.produtos_estoque_baixo.map((produto, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-gray-900">{produto.nome}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{produto.quantidade}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{produto.estoque_minimo}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{formatCurrency(produto.preco)}</td>
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
                <div className="text-2xl font-bold text-green-600">{formatCurrency(reportData.receita_total || 0)}</div>
                <div className="text-sm text-green-600">Receita Total</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{reportData.produtos_mais_vendidos?.length || 0}</div>
                <div className="text-sm text-blue-600">Produtos Vendidos</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{Object.keys(reportData.vendas_por_categoria || {}).length}</div>
                <div className="text-sm text-purple-600">Categorias</div>
              </div>
            </div>

            {reportData.produtos_mais_vendidos?.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold mb-3">Produtos Mais Vendidos</h4>
                <div className="space-y-3">
                  {reportData.produtos_mais_vendidos.slice(0, 5).map((produto, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-gray-900">{produto.nome}</span>
                          <span className="text-green-600 font-semibold">{formatCurrency(produto.receita)}</span>
                        </div>
                        <div className="text-xs text-gray-500">Quantidade vendida: {produto.quantidade_vendida}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'fornecedores':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{reportData.total_fornecedores || 0}</div>
                <div className="text-sm text-blue-600">Total Fornecedores</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{reportData.total_produtos_fornecidos || 0}</div>
                <div className="text-sm text-green-600">Produtos Fornecidos</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{formatCurrency(reportData.valor_total_fornecedores || 0)}</div>
                <div className="text-sm text-purple-600">Valor Total</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{reportData.fornecedores_produtos?.length || 0}</div>
                <div className="text-sm text-yellow-600">Fornecedores Ativos</div>
              </div>
            </div>

            {reportData.fornecedores_produtos?.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold mb-3">Fornecedores e Produtos</h4>
                <div className="space-y-3">
                  {reportData.fornecedores_produtos.map((fornecedor, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-900">{fornecedor.fornecedor}</span>
                        <span className="text-sm text-gray-500">{fornecedor.produtos.length} produtos</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {fornecedor.produtos.slice(0, 3).map(p => p.nome).join(', ')}
                        {fornecedor.produtos.length > 3 && ` e mais ${fornecedor.produtos.length - 3}...`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return <div>Relatório não encontrado</div>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Erro ao carregar relatórios</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
            <button 
              onClick={loadDashboard}
              className="mt-3 text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
        <button 
          onClick={handleExportPDF}
          disabled={!selectedReport}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Exportar
        </button>
      </div>

      {/* Cards do Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Produtos Vencidos</p>
              <p className="text-2xl font-semibold text-gray-900">{dashboardData?.produtos_vencidos || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Vencendo em 7 dias</p>
              <p className="text-2xl font-semibold text-gray-900">{dashboardData?.vencendo_7_dias || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Economia</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(dashboardData?.economia || 0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Perdas</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(dashboardData?.perdas || 0)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Produtos Mais Perdidos */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Produtos Mais Perdidos</h3>
          <div className="space-y-3">
            {dashboardData?.produtos_mais_perdidos?.length > 0 ? (
              dashboardData.produtos_mais_perdidos.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-900">{item.nome}</span>
                      <span className="text-gray-500">{formatCurrency(item.perdas)}</span>
                    </div>
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full" 
                        style={{ width: `${item.porcentagem}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">Nenhum produto com perdas registradas</p>
            )}
          </div>
        </div>

        {/* Relatórios Disponíveis */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Relatórios Disponíveis</h3>
          <div className="space-y-3">
            {[
              { key: 'validades', name: 'Relatório de Validades', icon: Calendar },
              { key: 'perdas', name: 'Análise de Perdas', icon: AlertTriangle },
              { key: 'estoque', name: 'Produtos em Estoque', icon: Package },
              { key: 'vendas', name: 'Histórico de Vendas', icon: TrendingUp },
              { key: 'fornecedores', name: 'Fornecedores', icon: Users }
            ].map((relatorio) => {
              const Icon = relatorio.icon;
              return (
                <div key={relatorio.key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{relatorio.name}</span>
                  </div>
                  <button 
                    onClick={() => generateReport(relatorio.key)}
                    disabled={loadingReport}
                    className="text-blue-600 hover:text-blue-700 text-sm disabled:text-gray-400 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    {loadingReport && selectedReport === relatorio.key ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    Gerar
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal de Relatório */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold">
                {selectedReport === 'validades' && 'Relatório de Validades'}
                {selectedReport === 'perdas' && 'Análise de Perdas'}
                {selectedReport === 'estoque' && 'Produtos em Estoque'}
                {selectedReport === 'vendas' && 'Histórico de Vendas'}
                {selectedReport === 'fornecedores' && 'Relatório de Fornecedores'}
              </h2>
              <button 
                onClick={() => setShowReportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {renderReportContent()}
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <button 
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Fechar
              </button>
              <button 
                onClick={handleExportPDF}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;