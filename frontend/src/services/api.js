import axios from 'axios';

// Configuração base da API
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:3001/api' 
  : `http://${window.location.hostname}:3001/api`;

// Criar instância do axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar respostas
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Serviços de autenticação
export const authService = {
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, senha: password });
      const { token, user } = response.data.data;
      
      // Salvar token e dados do usuário
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      return { user, token };
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao fazer login');
    }
  },

  register: async (userData) => {
    try {
      // Convert password field to senha for backend compatibility
      const dataToSend = { ...userData };
      if (dataToSend.password) {
        dataToSend.senha = dataToSend.password;
        delete dataToSend.password;
      }
      
      const response = await api.post('/auth/register', dataToSend);
      const { token, user } = response.data.data;
      
      // Salvar token e dados do usuário
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      return { user, token };
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao criar conta');
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getToken: () => {
    return localStorage.getItem('token');
  }
};

// Serviços de produtos
export const productService = {
  // Listar todos os produtos
  getProducts: async () => {
    try {
      const response = await api.get('/produtos');
      return response.data.produtos;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao carregar produtos');
    }
  },

  // Criar novo produto
  createProduct: async (productData) => {
    try {
      const response = await api.post('/produtos', productData);
      return response.data.produto;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao criar produto');
    }
  },

  // Atualizar produto
  updateProduct: async (productId, productData) => {
    try {
      const response = await api.put(`/produtos/${productId}`, productData);
      return response.data.produto;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao atualizar produto');
    }
  },

  // Deletar produto
  deleteProduct: async (productId) => {
    try {
      const response = await api.delete(`/produtos/${productId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao deletar produto');
    }
  },

  // Importar produtos
  importProducts: async (formData) => {
    try {
      const response = await api.post('/produtos/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao importar produtos');
    }
  },

  // Buscar produtos vencendo
  getProdutosVencendo: async (dias = 7) => {
    try {
      const response = await api.get(`/produtos/vencendo?dias=${dias}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao carregar produtos vencendo');
    }
  }
};

// Serviços de alertas
export const alertService = {
  // Listar alertas
  getAlertas: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.tipo) params.append('tipo', filters.tipo);
      if (filters.lido !== undefined) params.append('lido', filters.lido);
      
      const response = await api.get(`/alertas?${params.toString()}`);
      return response.data.alertas;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao carregar alertas');
    }
  },

  // Marcar alerta como lido
  marcarAlertaLido: async (alertaId) => {
    try {
      const response = await api.put(`/alertas/${alertaId}/marcar-lido`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao marcar alerta como lido');
    }
  },

  // Marcar todos os alertas como lidos
  marcarTodosLidos: async () => {
    try {
      const response = await api.put('/alertas/marcar-todos-lidos');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao marcar todos os alertas como lidos');
    }
  },

  // Gerar alertas automáticos
  gerarAlertas: async () => {
    try {
      const response = await api.post('/alertas/gerar');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao gerar alertas');
    }
  },

  // Resolver alerta (manter compatibilidade)
  resolverAlerta: async (alertaId) => {
    try {
      const response = await api.put(`/alertas/${alertaId}/marcar-lido`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao resolver alerta');
    }
  }
};

// Serviços de configurações de alertas
export const alertConfigService = {
  // Listar configurações de alertas
  getConfiguracoes: async () => {
    try {
      const response = await api.get('/configuracoes-alertas');
      return response.data.configuracoes;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao carregar configurações de alertas');
    }
  },

  // Criar ou atualizar configuração de alerta
  salvarConfiguracao: async (configuracao) => {
    try {
      const response = await api.post('/configuracoes-alertas', configuracao);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao salvar configuração de alerta');
    }
  },

  // Criar configuração de alerta (alias para salvarConfiguracao)
  createAlertConfig: async (configuracao) => {
    try {
      const response = await api.post('/configuracoes-alertas', configuracao);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao criar configuração de alerta');
    }
  }
};

// Serviço de teste
// Serviços de dashboard
export const dashboardService = {
  // Dados do dashboard principal
  getDashboardData: async () => {
    try {
      const response = await api.get('/dashboard');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao carregar dados do dashboard');
    }
  }
};

// Serviços de relatórios
export const reportService = {
  // Dashboard de relatórios
  getDashboard: async () => {
    try {
      const response = await api.get('/relatorios/dashboard');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao carregar dashboard');
    }
  },

  // Relatório de validades
  getRelatorioValidades: async () => {
    try {
      const response = await api.get('/relatorios/validades');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao gerar relatório de validades');
    }
  },

  // Relatório de perdas
  getRelatorioPerdas: async () => {
    try {
      const response = await api.get('/relatorios/perdas');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao gerar relatório de perdas');
    }
  },

  // Relatório de estoque
  getRelatorioEstoque: async () => {
    try {
      const response = await api.get('/relatorios/estoque');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao gerar relatório de estoque');
    }
  },

  // Relatório de vendas
  getRelatorioVendas: async () => {
    try {
      const response = await api.get('/relatorios/vendas');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao gerar relatório de vendas');
    }
  },

  // Relatório de fornecedores
  getRelatorioFornecedores: async () => {
    try {
      const response = await api.get('/relatorios/fornecedores');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao gerar relatório de fornecedores');
    }
  },

  getRelatorioFinanceiro: async () => {
    try {
      const response = await api.get('/relatorios/financeiro');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar relatório financeiro:', error);
      throw error;
    }
  },

  // Exportar relatório (placeholder para futuras implementações)
  exportarRelatorio: async (relatorioData, tipo, formato = 'pdf') => {
    try {
      // Importar jsPDF dinamicamente
      const { jsPDF } = await import('jspdf');
      await import('jspdf-autotable');
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      
      // Configurar título
      doc.setFontSize(20);
      doc.text(`Relatório: ${tipo}`, 20, 20);
      
      // Data de geração
      doc.setFontSize(10);
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, 30);
      
      let yPosition = 50;
      
      // Adicionar resumo se existir
      if (relatorioData.resumo) {
        doc.setFontSize(14);
        doc.text('Resumo:', 20, yPosition);
        yPosition += 10;
        
        doc.setFontSize(10);
        Object.entries(relatorioData.resumo).forEach(([key, value]) => {
          const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          const displayValue = typeof value === 'number' && key.includes('valor') 
            ? `R$ ${value.toFixed(2)}` 
            : value;
          doc.text(`${label}: ${displayValue}`, 20, yPosition);
          yPosition += 8;
        });
        yPosition += 10;
      }
      
      // Adicionar tabelas baseadas no tipo de relatório
      if (tipo === 'Produtos em Estoque' && relatorioData.estoque_por_categoria) {
        doc.setFontSize(14);
        doc.text('Estoque por Categoria:', 20, yPosition);
        yPosition += 10;
        
        const tableData = relatorioData.estoque_por_categoria.map(cat => [
          cat.categoria,
          cat.quantidade_produtos.toString(),
          cat.quantidade_total.toString(),
          `R$ ${cat.valor_total.toFixed(2)}`
        ]);
        
        doc.autoTable({
          startY: yPosition,
          head: [['Categoria', 'Produtos', 'Quantidade Total', 'Valor Total']],
          body: tableData,
          theme: 'grid',
          styles: { fontSize: 8 }
        });
      }
      
      if (tipo === 'Relatório de Validades' && relatorioData.produtos_vencidos) {
        doc.setFontSize(14);
        doc.text('Produtos Vencidos:', 20, yPosition);
        yPosition += 10;
        
        const tableData = relatorioData.produtos_vencidos.map(prod => [
          prod.nome,
          prod.categoria,
          prod.quantidade?.toString() || '0',
          prod.data_validade || 'N/A',
          `R$ ${(prod.valor_estimado_perda || 0).toFixed(2)}`
        ]);
        
        doc.autoTable({
          startY: yPosition,
          head: [['Produto', 'Categoria', 'Quantidade', 'Data Validade', 'Perda Estimada']],
          body: tableData,
          theme: 'grid',
          styles: { fontSize: 8 }
        });
      }
      
      if (tipo === 'Análise de Perdas' && relatorioData.perdas_por_categoria) {
        doc.setFontSize(14);
        doc.text('Perdas por Categoria:', 20, yPosition);
        yPosition += 10;
        
        const tableData = relatorioData.perdas_por_categoria.map(cat => [
          cat.categoria,
          cat.produtos_perdidos.toString(),
          cat.quantidade_perdida.toString(),
          `R$ ${cat.valor_perdido.toFixed(2)}`
        ]);
        
        doc.autoTable({
          startY: yPosition,
          head: [['Categoria', 'Produtos Perdidos', 'Quantidade', 'Valor Perdido']],
          body: tableData,
          theme: 'grid',
          styles: { fontSize: 8 }
        });
      }
      
      if (tipo === 'Histórico de Vendas' && relatorioData.produtos_cadastrados) {
        doc.setFontSize(14);
        doc.text('Produtos Cadastrados:', 20, yPosition);
        yPosition += 10;
        
        const tableData = relatorioData.produtos_cadastrados.map(prod => [
          prod.nome,
          prod.categoria,
          prod.quantidade_estoque.toString(),
          `R$ ${prod.preco_unitario.toFixed(2)}`,
          `R$ ${prod.valor_potencial.toFixed(2)}`
        ]);
        
        doc.autoTable({
          startY: yPosition,
          head: [['Produto', 'Categoria', 'Estoque', 'Preço Unit.', 'Valor Potencial']],
          body: tableData,
          theme: 'grid',
          styles: { fontSize: 8 }
        });
      }
      
      if (tipo === 'Fornecedores' && relatorioData.fornecedores) {
        doc.setFontSize(14);
        doc.text('Fornecedores:', 20, yPosition);
        yPosition += 10;
        
        const tableData = relatorioData.fornecedores.map(forn => [
          forn.nome,
          forn.produtos_fornecidos.toString(),
          forn.quantidade_total.toString(),
          `R$ ${forn.valor_total.toFixed(2)}`
        ]);
        
        doc.autoTable({
          startY: yPosition,
          head: [['Fornecedor', 'Produtos', 'Quantidade', 'Valor Total']],
          body: tableData,
          theme: 'grid',
          styles: { fontSize: 8 }
        });
      }
      
      // Salvar o PDF
      const fileName = `relatorio_${tipo.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      return { success: true, message: 'PDF gerado e baixado com sucesso!' };
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      return { success: false, message: 'Erro ao gerar PDF: ' + error.message };
    }
  }
};

// Serviços de configurações do usuário
export const configService = {
  // Obter configurações do usuário
  getConfiguracoes: async () => {
    try {
      const response = await api.get('/configuracoes');
      return response.data.configuracao;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao carregar configurações');
    }
  },

  // Salvar configurações do usuário
  salvarConfiguracoes: async (configuracoes) => {
    try {
      const response = await api.put('/configuracoes', configuracoes);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao salvar configurações');
    }
  },

  // Exportar dados do usuário
  exportarDados: async () => {
    try {
      const response = await api.get('/configuracoes/exportar');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao exportar dados');
    }
  }
};

// Serviços de vendas
export const salesService = {
  // Listar vendas
  getVendas: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);
      if (filters.produtoId) params.append('produto_id', filters.produtoId);
      
      const response = await api.get(`/vendas?${params.toString()}`);
      return response.data.vendas;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao carregar vendas');
    }
  },

  // Criar nova venda
  criarVenda: async (vendaData) => {
    try {
      const response = await api.post('/vendas', vendaData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao criar venda');
    }
  }
};

// Serviços de usuários
export const userService = {
  // Listar todos os usuários (apenas admin/gerente)
  getUsuarios: async () => {
    try {
      const response = await api.get('/usuarios');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao carregar usuários');
    }
  },

  // Criar novo usuário
  createUsuario: async (userData) => {
    try {
      const response = await api.post('/usuarios', userData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao criar usuário');
    }
  },

  // Obter usuário específico
  getUsuario: async (usuarioId) => {
    try {
      const response = await api.get(`/usuarios/${usuarioId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao carregar usuário');
    }
  },

  // Atualizar usuário
  updateUsuario: async (usuarioId, userData) => {
    try {
      const response = await api.put(`/usuarios/${usuarioId}`, userData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao atualizar usuário');
    }
  },

  // Deletar/desativar usuário
  deleteUsuario: async (usuarioId) => {
    try {
      const response = await api.delete(`/usuarios/${usuarioId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao deletar usuário');
    }
  },

  // Alterar senha de usuário
  alterarSenha: async (usuarioId, senhaData) => {
    try {
      const response = await api.put(`/usuarios/${usuarioId}/alterar-senha`, senhaData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao alterar senha');
    }
  },

  // Upload de foto de perfil
  uploadFoto: async (usuarioId, fotoUrl) => {
    try {
      const response = await api.post(`/usuarios/${usuarioId}/upload-foto`, { foto_url: fotoUrl });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao fazer upload da foto');
    }
  },

  // Obter perfil do usuário atual
  getPerfil: async () => {
    try {
      const response = await api.get('/usuarios/perfil');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao carregar perfil');
    }
  },

  // Atualizar perfil do usuário atual
  updatePerfil: async (userData) => {
    try {
      const response = await api.put('/usuarios/perfil', userData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao atualizar perfil');
    }
  }
};

// Serviços de fornecedores
export const supplierService = {
  // Listar todos os fornecedores
  getSuppliers: async () => {
    try {
      const response = await api.get('/fornecedores');
      return response.data.fornecedores;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao carregar fornecedores');
    }
  },

  // Criar novo fornecedor
  createSupplier: async (supplierData) => {
    try {
      const response = await api.post('/fornecedores', supplierData);
      return response.data.fornecedor;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao criar fornecedor');
    }
  },

  // Atualizar fornecedor
  updateSupplier: async (supplierId, supplierData) => {
    try {
      const response = await api.put(`/fornecedores/${supplierId}`, supplierData);
      return response.data.fornecedor;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao atualizar fornecedor');
    }
  },

  // Deletar fornecedor
  deleteSupplier: async (supplierId) => {
    try {
      const response = await api.delete(`/fornecedores/${supplierId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao deletar fornecedor');
    }
  }
};

// Serviços de empresas
export const companyService = {
  // Listar todas as empresas
  getCompanies: async () => {
    try {
      const response = await api.get('/empresas');
      return response.data.empresas;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao carregar empresas');
    }
  },

  // Criar nova empresa
  createCompany: async (companyData) => {
    try {
      const response = await api.post('/empresas', companyData);
      return response.data.empresa;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao criar empresa');
    }
  },

  // Atualizar empresa
  updateCompany: async (companyId, companyData) => {
    try {
      const response = await api.put(`/empresas/${companyId}`, companyData);
      return response.data.empresa;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao atualizar empresa');
    }
  },

  // Deletar empresa
  deleteCompany: async (companyId) => {
    try {
      const response = await api.delete(`/empresas/${companyId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao deletar empresa');
    }
  }
};

export const permissionsService = {
  getPermissions: async () => {
    try {
      const response = await api.get('/usuarios/permissoes');
      return response.data;
    } catch (error) {
      console.error('Erro ao carregar permissões:', error);
      throw error;
    }
  }
};

export const testService = {
  test: async () => {
    try {
      const response = await api.get('/test');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao testar API');
    }
  }
};

export default api;