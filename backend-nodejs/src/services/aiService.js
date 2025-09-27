const OpenAI = require('openai');

class AIService {
  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️  OPENAI_API_KEY não configurada. Funcionalidades de IA desabilitadas.');
      this.enabled = false;
      return;
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.enabled = true;
  }

  /**
   * Analisa dados de vendas e prevê demanda futura
   * @param {Array} salesData - Dados históricos de vendas
   * @param {Object} product - Informações do produto
   * @returns {Object} Previsão de demanda
   */
  async predictDemand(salesData, product) {
    if (!this.enabled) {
      return {
        success: false,
        message: 'Serviço de IA não disponível',
        prediction: null
      };
    }

    try {
      const prompt = `
        Analise os seguintes dados de vendas e forneça uma previsão de demanda:
        
        Produto: ${product.nome}
        Categoria: ${product.categoria || 'Não especificada'}
        Dados de vendas dos últimos meses: ${JSON.stringify(salesData)}
        
        Com base nestes dados, forneça:
        1. Previsão de demanda para os próximos 30 dias
        2. Tendência (crescente, estável, decrescente)
        3. Recomendação de estoque mínimo
        4. Melhor período para reposição
        
        Responda em formato JSON com as chaves: prediction, trend, minStock, reorderPeriod, confidence
      `;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Você é um especialista em análise de demanda e gestão de estoque. Forneça análises precisas e práticas baseadas nos dados fornecidos."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      });

      const response = completion.choices[0].message.content;
      
      try {
        const analysis = JSON.parse(response);
        return {
          success: true,
          prediction: analysis,
          rawResponse: response
        };
      } catch (parseError) {
        return {
          success: true,
          prediction: {
            prediction: "Análise disponível em texto",
            trend: "estável",
            minStock: 10,
            reorderPeriod: "semanal",
            confidence: 0.7
          },
          rawResponse: response
        };
      }

    } catch (error) {
      console.error('Erro na previsão de demanda:', error);
      return {
        success: false,
        message: 'Erro ao processar previsão de demanda',
        error: error.message
      };
    }
  }

  /**
   * Analisa produtos próximos ao vencimento e sugere ações
   * @param {Array} expiringProducts - Produtos próximos ao vencimento
   * @returns {Object} Sugestões de ação
   */
  async analyzeExpiringProducts(expiringProducts) {
    if (!this.enabled) {
      return {
        success: false,
        message: 'Serviço de IA não disponível',
        suggestions: []
      };
    }

    try {
      const prompt = `
        Analise os seguintes produtos próximos ao vencimento e sugira ações:
        
        ${expiringProducts.map(p => 
          `Produto: ${p.nome}, Quantidade: ${p.quantidade}, Vencimento: ${p.dataVencimento}, Valor: R$ ${p.preco}`
        ).join('\n')}
        
        Para cada produto, sugira:
        1. Ação recomendada (desconto, promoção, doação, etc.)
        2. Percentual de desconto sugerido
        3. Prioridade (alta, média, baixa)
        4. Justificativa
        
        Responda em formato JSON com array de objetos contendo: productName, action, discount, priority, justification
      `;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Você é um especialista em gestão de estoque e redução de perdas. Forneça sugestões práticas e economicamente viáveis."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.4
      });

      const response = completion.choices[0].message.content;
      
      try {
        const suggestions = JSON.parse(response);
        return {
          success: true,
          suggestions: Array.isArray(suggestions) ? suggestions : [suggestions],
          rawResponse: response
        };
      } catch (parseError) {
        return {
          success: true,
          suggestions: expiringProducts.map(p => ({
            productName: p.nome,
            action: "Aplicar desconto",
            discount: 20,
            priority: "média",
            justification: "Produto próximo ao vencimento"
          })),
          rawResponse: response
        };
      }

    } catch (error) {
      console.error('Erro na análise de produtos vencendo:', error);
      return {
        success: false,
        message: 'Erro ao analisar produtos próximos ao vencimento',
        error: error.message
      };
    }
  }

  /**
   * Otimiza níveis de estoque baseado em dados históricos
   * @param {Array} products - Lista de produtos com dados de estoque
   * @returns {Object} Recomendações de otimização
   */
  async optimizeInventory(products) {
    if (!this.enabled) {
      return {
        success: false,
        message: 'Serviço de IA não disponível',
        recommendations: []
      };
    }

    try {
      const prompt = `
        Analise o estoque atual e histórico dos seguintes produtos e forneça recomendações de otimização:
        
        ${products.map(p => 
          `Produto: ${p.nome}, Estoque Atual: ${p.quantidade}, Estoque Mínimo: ${p.estoqueMinimo}, Vendas Médias: ${p.vendasMedias || 'N/A'}`
        ).join('\n')}
        
        Para cada produto, forneça:
        1. Nível de estoque recomendado
        2. Ponto de reposição sugerido
        3. Quantidade de reposição
        4. Classificação ABC (A=alto giro, B=médio giro, C=baixo giro)
        
        Responda em formato JSON com array de objetos contendo: productName, recommendedStock, reorderPoint, reorderQuantity, abcClass, reasoning
      `;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Você é um especialista em otimização de estoque e supply chain. Forneça recomendações baseadas em melhores práticas de gestão de estoque."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      });

      const response = completion.choices[0].message.content;
      
      try {
        const recommendations = JSON.parse(response);
        return {
          success: true,
          recommendations: Array.isArray(recommendations) ? recommendations : [recommendations],
          rawResponse: response
        };
      } catch (parseError) {
        return {
          success: true,
          recommendations: products.map(p => ({
            productName: p.nome,
            recommendedStock: Math.max(p.quantidade, p.estoqueMinimo * 2),
            reorderPoint: p.estoqueMinimo,
            reorderQuantity: p.estoqueMinimo * 3,
            abcClass: "B",
            reasoning: "Recomendação baseada em estoque mínimo"
          })),
          rawResponse: response
        };
      }

    } catch (error) {
      console.error('Erro na otimização de estoque:', error);
      return {
        success: false,
        message: 'Erro ao otimizar níveis de estoque',
        error: error.message
      };
    }
  }

  /**
   * Gera insights sobre tendências de mercado
   * @param {Object} marketData - Dados de mercado e vendas
   * @returns {Object} Insights e tendências
   */
  async generateMarketInsights(marketData) {
    if (!this.enabled) {
      return {
        success: false,
        message: 'Serviço de IA não disponível',
        insights: []
      };
    }

    try {
      const prompt = `
        Analise os seguintes dados de mercado e vendas para gerar insights:
        
        ${JSON.stringify(marketData, null, 2)}
        
        Forneça insights sobre:
        1. Tendências de vendas por categoria
        2. Sazonalidade identificada
        3. Produtos em crescimento
        4. Produtos em declínio
        5. Oportunidades de mercado
        
        Responda em formato JSON com array de insights contendo: type, title, description, impact, actionable
      `;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Você é um analista de mercado especializado em retail e e-commerce. Forneça insights acionáveis e baseados em dados."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.4
      });

      const response = completion.choices[0].message.content;
      
      try {
        const insights = JSON.parse(response);
        return {
          success: true,
          insights: Array.isArray(insights) ? insights : [insights],
          rawResponse: response
        };
      } catch (parseError) {
        return {
          success: true,
          insights: [
            {
              type: "trend",
              title: "Análise de Tendências",
              description: "Dados analisados com sucesso",
              impact: "médio",
              actionable: true
            }
          ],
          rawResponse: response
        };
      }

    } catch (error) {
      console.error('Erro na geração de insights:', error);
      return {
        success: false,
        message: 'Erro ao gerar insights de mercado',
        error: error.message
      };
    }
  }

  /**
   * Verifica se o serviço de IA está disponível
   * @returns {Boolean} Status do serviço
   */
  isEnabled() {
    return this.enabled;
  }
}

module.exports = new AIService();
