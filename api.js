class ApiService {
  constructor() {
    this.baseURL = '/api';
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  removeToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          this.removeToken();
          window.location.href = '/login';
        }
        throw new Error(data.error || 'Erro na requisição');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Autenticação
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  async updateProfile(profileData) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async changePassword(passwordData) {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(passwordData),
    });
  }

  // Produtos
  async getProdutos(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/produtos${queryString ? '?' + queryString : ''}`);
  }

  async createProduto(produtoData) {
    return this.request('/produtos', {
      method: 'POST',
      body: JSON.stringify(produtoData),
    });
  }

  async getProduto(id) {
    return this.request(`/produtos/${id}`);
  }

  async updateProduto(id, produtoData) {
    return this.request(`/produtos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(produtoData),
    });
  }

  async deleteProduto(id) {
    return this.request(`/produtos/${id}`, {
      method: 'DELETE',
    });
  }

  async getCategorias() {
    return this.request('/produtos/categorias');
  }

  async getProdutosVencendo(dias = 7) {
    return this.request(`/produtos/vencendo?dias=${dias}`);
  }

  async registrarVenda(produtoId, vendaData) {
    return this.request(`/produtos/${produtoId}/venda`, {
      method: 'POST',
      body: JSON.stringify(vendaData),
    });
  }

  // Alertas
  async getAlertas(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/alertas${queryString ? '?' + queryString : ''}`);
  }

  async resolverAlerta(alertaId, resolucaoData) {
    return this.request(`/alertas/${alertaId}/resolver`, {
      method: 'POST',
      body: JSON.stringify(resolucaoData),
    });
  }

  // IA e Sugestões
  async getSugestoes() {
    return this.request('/ia/sugestoes');
  }

  async treinarIA() {
    return this.request('/ia/treinar', {
      method: 'POST',
    });
  }

  // Relatórios
  async getDashboard(periodo = '30d') {
    return this.request(`/relatorios/dashboard?periodo=${periodo}`);
  }

  async getRelatoriosPerdas(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/relatorios/perdas${queryString ? '?' + queryString : ''}`);
  }

  // Gamificação
  async getGamificacao() {
    return this.request('/gamificacao/perfil');
  }

  async getMetas() {
    return this.request('/gamificacao/metas');
  }

  async createMeta(metaData) {
    return this.request('/gamificacao/metas', {
      method: 'POST',
      body: JSON.stringify(metaData),
    });
  }

  // Utilitários
  isAuthenticated() {
    return !!this.token;
  }

  logout() {
    this.removeToken();
    window.location.href = '/';
  }
}

export default new ApiService();

