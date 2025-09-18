const OpenAI = require('openai');
const AIKnowledge = require('../models/AIKnowledge');
const AISession = require('../models/AISession');

class ResearcherAI {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.agentName = 'researcher';
    this.version = '1.0.0';
    this.searchTools = this.initializeSearchTools();
  }

  initializeSearchTools() {
    // Simulação de ferramentas de pesquisa
    // Em produção, integraria com APIs reais de notícias, dados econômicos, etc.
    return {
      newsAPI: 'simulated',
      economicDataAPI: 'simulated',
      forexAnalysisAPI: 'simulated'
    };
  }

  async conductMarketResearch(sessionId, asset, topics, priority = 'medium') {
    try {
      console.log(`[Researcher AI] Iniciando pesquisa de mercado para ${asset}`);
      
      const session = await AISession.findOne({ sessionId, status: 'active' });
      if (!session) {
        throw new Error('Sessão não encontrada');
      }

      // 1. Buscar conhecimento existente sobre o ativo
      const existingResearch = await this.getExistingResearch(asset);
      
      // 2. Identificar lacunas de conhecimento
      const knowledgeGaps = await this.identifyKnowledgeGaps(asset, topics, existingResearch);
      
      // 3. Realizar pesquisas específicas
      const researchResults = await this.performResearch(asset, knowledgeGaps);
      
      // 4. Compilar insights
      const insights = await this.compileInsights(asset, researchResults, topics);
      
      // 5. Registrar resultados na sessão
      await session.addMessage(
        this.agentName,
        'all',
        'data',
        `Pesquisa de mercado concluída para ${asset}`,
        {
          insights,
          researchResults,
          topics,
          knowledgeGaps,
          priority
        },
        insights.confidence
      );

      // 6. Salvar conhecimento na base
      await this.saveResearchKnowledge(asset, insights, researchResults);

      // 7. Fornecer recomendações para as outras IAs
      await this.provideRecommendations(session, asset, insights);

      return {
        insights,
        researchResults,
        knowledgeGaps: knowledgeGaps.length,
        confidence: insights.confidence
      };

    } catch (error) {
      console.error('[Researcher AI] Erro na pesquisa:', error);
      return this.fallbackResearch(asset, topics, error.message);
    }
  }

  async performResearch(asset, knowledgeGaps) {
    const results = {
      economicFactors: await this.researchEconomicFactors(asset),
      marketSentiment: await this.researchMarketSentiment(asset),
      technicalPatterns: await this.researchTechnicalPatterns(asset),
      newsAnalysis: await this.researchNewsImpact(asset),
      correlations: await this.researchCorrelations(asset)
    };

    return results;
  }

  async researchEconomicFactors(asset) {
    // Simular pesquisa de fatores econômicos
    const prompt = `
PESQUISA DE FATORES ECONÔMICOS - ${asset}

Analise os principais fatores econômicos que podem afetar o par de moedas ${asset}:

1. Política monetária dos bancos centrais
2. Indicadores econômicos (PIB, inflação, emprego)
3. Eventos geopolíticos
4. Fluxos de capital
5. Commodities relacionadas

Forneça uma análise atualizada dos fatores mais relevantes.

Responda em JSON:
{
  "factors": [
    {
      "type": "monetary_policy|economic_indicator|geopolitical|capital_flows|commodities",
      "description": "descrição do fator",
      "impact": "positive|negative|neutral",
      "strength": "low|medium|high",
      "timeframe": "short|medium|long"
    }
  ],
  "overallSentiment": "bullish|bearish|neutral",
  "confidence": 0.8,
  "lastUpdated": "2024-01-15"
}`;

    try {
      const response = await this.callOpenAI(prompt);
      return JSON.parse(response);
    } catch (error) {
      return this.getFallbackEconomicData(asset);
    }
  }

  async researchMarketSentiment(asset) {
    // Simular análise de sentimento do mercado
    const prompt = `
ANÁLISE DE SENTIMENTO DO MERCADO - ${asset}

Analise o sentimento atual do mercado para ${asset} baseado em:

1. Posicionamento de traders (COT reports)
2. Volatilidade implícita
3. Fluxos de ordens
4. Análise de redes sociais e fóruns
5. Relatórios de analistas

Responda em JSON:
{
  "sentiment": {
    "retail": "bullish|bearish|neutral",
    "institutional": "bullish|bearish|neutral",
    "overall": "bullish|bearish|neutral"
  },
  "indicators": [
    {
      "name": "nome do indicador",
      "value": "valor",
      "interpretation": "interpretação"
    }
  ],
  "confidence": 0.75,
  "riskFactors": ["fator1", "fator2"]
}`;

    try {
      const response = await this.callOpenAI(prompt);
      return JSON.parse(response);
    } catch (error) {
      return this.getFallbackSentimentData(asset);
    }
  }

  async researchTechnicalPatterns(asset) {
    // Simular pesquisa de padrões técnicos
    const prompt = `
ANÁLISE DE PADRÕES TÉCNICOS - ${asset}

Identifique padrões técnicos relevantes para ${asset}:

1. Padrões de candlestick
2. Suportes e resistências
3. Tendências de longo prazo
4. Padrões de reversão/continuação
5. Níveis de Fibonacci

Responda em JSON:
{
  "patterns": [
    {
      "type": "support|resistance|trend|reversal|continuation",
      "description": "descrição do padrão",
      "strength": "weak|moderate|strong",
      "timeframe": "1H|4H|1D|1W",
      "level": "preço do nível se aplicável"
    }
  ],
  "keyLevels": {
    "support": [1.1750, 1.1700],
    "resistance": [1.1850, 1.1900]
  },
  "trend": "uptrend|downtrend|sideways",
  "confidence": 0.8
}`;

    try {
      const response = await this.callOpenAI(prompt);
      return JSON.parse(response);
    } catch (error) {
      return this.getFallbackTechnicalData(asset);
    }
  }

  async researchNewsImpact(asset) {
    // Simular análise de impacto de notícias
    const prompt = `
ANÁLISE DE IMPACTO DE NOTÍCIAS - ${asset}

Analise o impacto potencial de notícias recentes em ${asset}:

1. Decisões de política monetária
2. Dados econômicos importantes
3. Eventos geopolíticos
4. Mudanças regulatórias
5. Notícias corporativas relevantes

Responda em JSON:
{
  "newsItems": [
    {
      "headline": "título da notícia",
      "impact": "high|medium|low",
      "direction": "positive|negative|neutral",
      "timeframe": "immediate|short|medium|long",
      "probability": 0.8
    }
  ],
  "overallImpact": "positive|negative|neutral",
  "volatilityExpectation": "low|medium|high",
  "confidence": 0.7
}`;

    try {
      const response = await this.callOpenAI(prompt);
      return JSON.parse(response);
    } catch (error) {
      return this.getFallbackNewsData(asset);
    }
  }

  async researchCorrelations(asset) {
    // Simular análise de correlações
    const prompt = `
ANÁLISE DE CORRELAÇÕES - ${asset}

Analise as correlações de ${asset} com:

1. Outros pares de moedas
2. Commodities (ouro, petróleo)
3. Índices de ações
4. Bonds/Títulos
5. Criptomoedas

Responda em JSON:
{
  "correlations": [
    {
      "instrument": "nome do instrumento",
      "correlation": 0.75,
      "strength": "weak|moderate|strong",
      "type": "positive|negative",
      "reliability": "low|medium|high"
    }
  ],
  "riskFactors": ["fator1", "fator2"],
  "hedgingOpportunities": ["oportunidade1", "oportunidade2"],
  "confidence": 0.8
}`;

    try {
      const response = await this.callOpenAI(prompt);
      return JSON.parse(response);
    } catch (error) {
      return this.getFallbackCorrelationData(asset);
    }
  }

  async compileInsights(asset, researchResults, topics) {
    const prompt = `
COMPILAÇÃO DE INSIGHTS DE MERCADO - ${asset}

Com base na pesquisa realizada, compile insights acionáveis:

DADOS DA PESQUISA:
${JSON.stringify(researchResults, null, 2)}

TÓPICOS SOLICITADOS:
${topics.join(', ')}

Compile insights que sejam úteis para decisões de trading.

Responda em JSON:
{
  "keyInsights": [
    {
      "category": "economic|technical|sentiment|news|correlation",
      "insight": "insight específico",
      "impact": "high|medium|low",
      "actionable": true,
      "timeframe": "short|medium|long"
    }
  ],
  "tradingImplications": {
    "bullishFactors": ["fator1", "fator2"],
    "bearishFactors": ["fator1", "fator2"],
    "neutralFactors": ["fator1", "fator2"]
  },
  "riskAssessment": {
    "level": "low|medium|high",
    "mainRisks": ["risco1", "risco2"],
    "mitigation": "estratégias de mitigação"
  },
  "recommendations": [
    {
      "for": "trading|supervisor",
      "recommendation": "recomendação específica",
      "priority": "low|medium|high"
    }
  ],
  "confidence": 0.8,
  "validUntil": "2024-01-20"
}`;

    try {
      const response = await this.callOpenAI(prompt);
      return JSON.parse(response);
    } catch (error) {
      return this.getFallbackInsights(asset, topics);
    }
  }

  async callOpenAI(prompt) {
    const completion = await this.openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: "Você é uma IA especializada em pesquisa de mercado financeiro. Forneça análises detalhadas, objetivas e sempre no formato JSON solicitado."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.4,
      max_tokens: 1500
    });

    return completion.choices[0].message.content;
  }

  async getExistingResearch(asset, limit = 10) {
    return await AIKnowledge.find({
      aiAgent: this.agentName,
      asset,
      knowledgeType: 'market_research',
      status: 'active'
    })
    .sort({ createdAt: -1 })
    .limit(limit);
  }

  async identifyKnowledgeGaps(asset, topics, existingResearch) {
    // Identificar lacunas no conhecimento existente
    const existingTopics = existingResearch.map(r => r.tags).flat();
    const gaps = topics.filter(topic => !existingTopics.includes(topic));
    
    // Adicionar gaps baseados em idade do conhecimento
    const oldResearch = existingResearch.filter(r => {
      const daysSinceUpdate = (new Date() - r.updatedAt) / (1000 * 60 * 60 * 24);
      return daysSinceUpdate > 7; // Pesquisa com mais de 7 dias
    });

    return [...gaps, ...oldResearch.map(r => `update_${r.knowledgeType}`)];
  }

  async saveResearchKnowledge(asset, insights, researchResults) {
    // Salvar insights principais
    for (const insight of insights.keyInsights) {
      const knowledge = new AIKnowledge({
        aiAgent: this.agentName,
        knowledgeType: 'market_research',
        asset,
        content: insight.insight,
        data: {
          category: insight.category,
          impact: insight.impact,
          actionable: insight.actionable,
          timeframe: insight.timeframe,
          researchData: researchResults
        },
        confidence: insights.confidence,
        createdBy: this.agentName,
        tags: ['market_research', insight.category, 'auto-generated'],
        expiresAt: new Date(insights.validUntil || Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      await knowledge.save();
    }

    // Salvar recomendações
    for (const rec of insights.recommendations) {
      const knowledge = new AIKnowledge({
        aiAgent: this.agentName,
        knowledgeType: 'strategy',
        asset,
        content: rec.recommendation,
        data: {
          targetAgent: rec.for,
          priority: rec.priority,
          researchBased: true
        },
        confidence: insights.confidence,
        createdBy: this.agentName,
        tags: ['recommendation', rec.for, rec.priority]
      });

      await knowledge.save();
    }
  }

  async provideRecommendations(session, asset, insights) {
    // Enviar recomendações específicas para cada IA
    for (const rec of insights.recommendations) {
      const targetAgent = rec.for === 'trading' ? 'trading' : 'supervisor';
      
      await session.addMessage(
        this.agentName,
        targetAgent,
        'suggestion',
        rec.recommendation,
        {
          category: 'research_recommendation',
          priority: rec.priority,
          asset,
          basedOn: 'market_research',
          insights: insights.keyInsights.filter(i => i.actionable)
        }
      );
    }
  }

  // Métodos de fallback para dados simulados
  getFallbackEconomicData(asset) {
    return {
      factors: [
        {
          type: 'monetary_policy',
          description: 'Política monetária neutra',
          impact: 'neutral',
          strength: 'medium',
          timeframe: 'medium'
        }
      ],
      overallSentiment: 'neutral',
      confidence: 0.5,
      lastUpdated: new Date().toISOString().split('T')[0]
    };
  }

  getFallbackSentimentData(asset) {
    return {
      sentiment: {
        retail: 'neutral',
        institutional: 'neutral',
        overall: 'neutral'
      },
      indicators: [
        {
          name: 'Market Sentiment',
          value: '50%',
          interpretation: 'Neutro'
        }
      ],
      confidence: 0.5,
      riskFactors: ['Dados limitados']
    };
  }

  getFallbackTechnicalData(asset) {
    return {
      patterns: [
        {
          type: 'trend',
          description: 'Tendência lateral',
          strength: 'moderate',
          timeframe: '1D',
          level: null
        }
      ],
      keyLevels: {
        support: [],
        resistance: []
      },
      trend: 'sideways',
      confidence: 0.5
    };
  }

  getFallbackNewsData(asset) {
    return {
      newsItems: [
        {
          headline: 'Dados econômicos mistos',
          impact: 'low',
          direction: 'neutral',
          timeframe: 'short',
          probability: 0.5
        }
      ],
      overallImpact: 'neutral',
      volatilityExpectation: 'low',
      confidence: 0.5
    };
  }

  getFallbackCorrelationData(asset) {
    return {
      correlations: [
        {
          instrument: 'USD Index',
          correlation: 0.5,
          strength: 'moderate',
          type: 'negative',
          reliability: 'medium'
        }
      ],
      riskFactors: ['Correlações podem mudar'],
      hedgingOpportunities: ['Diversificação'],
      confidence: 0.5
    };
  }

  getFallbackInsights(asset, topics) {
    return {
      keyInsights: [
        {
          category: 'technical',
          insight: 'Mercado em consolidação, aguardar breakout',
          impact: 'medium',
          actionable: true,
          timeframe: 'short'
        }
      ],
      tradingImplications: {
        bullishFactors: [],
        bearishFactors: [],
        neutralFactors: ['Falta de dados específicos']
      },
      riskAssessment: {
        level: 'medium',
        mainRisks: ['Dados limitados'],
        mitigation: 'Monitoramento contínuo'
      },
      recommendations: [
        {
          for: 'trading',
          recommendation: 'Aguardar sinais mais claros',
          priority: 'medium'
        }
      ],
      confidence: 0.4,
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
  }

  fallbackResearch(asset, topics, errorMessage) {
    return {
      insights: this.getFallbackInsights(asset, topics),
      researchResults: {
        economicFactors: this.getFallbackEconomicData(asset),
        marketSentiment: this.getFallbackSentimentData(asset),
        technicalPatterns: this.getFallbackTechnicalData(asset),
        newsAnalysis: this.getFallbackNewsData(asset),
        correlations: this.getFallbackCorrelationData(asset)
      },
      knowledgeGaps: topics.length,
      confidence: 0.4,
      error: true,
      errorMessage
    };
  }
}

module.exports = new ResearcherAI();
