const OpenAI = require('openai');

class OpenAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async analyzeTradeData(tradeData) {
    try {
      const { ativo, tendencia, macd, rsi, bollinger } = tradeData;
      
      const prompt = `
        Analise os seguintes dados técnicos para o ativo ${ativo}:
        
        Tendência: ${tendencia}
        MACD: ${macd}
        RSI: ${rsi}
        Bandas de Bollinger: ${bollinger}
        
        Com base nestes indicadores técnicos, forneça uma decisão de trading (buy, sell, hold) e uma breve justificativa.
        
        Critérios de análise:
        - RSI < 30: possível sobrevenda (considerar compra)
        - RSI > 70: possível sobrecompra (considerar venda)
        - MACD positivo com tendência alta: sinal de compra
        - MACD negativo com tendência baixa: sinal de venda
        - Considere a posição do preço em relação às Bandas de Bollinger
        
        Responda APENAS com um JSON no formato:
        {
          "decision": "buy|sell|hold",
          "confidence": 0.85,
          "reasoning": "Justificativa da decisão"
        }
      `;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Você é um analista técnico especializado em Forex. Forneça análises precisas e objetivas baseadas nos indicadores técnicos fornecidos."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 200
      });

      const response = completion.choices[0].message.content;
      
      // Tentar parsear a resposta JSON
      try {
        const analysis = JSON.parse(response);
        return {
          decision: analysis.decision,
          confidence: analysis.confidence || 0.5,
          reasoning: analysis.reasoning || 'Análise baseada em indicadores técnicos',
          fullAnalysis: response
        };
      } catch (parseError) {
        // Fallback se não conseguir parsear JSON
        console.warn('Erro ao parsear resposta da IA:', parseError);
        return this.fallbackAnalysis(tradeData, response);
      }

    } catch (error) {
      console.error('Erro na análise OpenAI:', error);
      return this.fallbackAnalysis(tradeData, 'Erro na comunicação com IA');
    }
  }

  fallbackAnalysis(tradeData, errorMessage) {
    const { rsi, macd, tendencia } = tradeData;
    
    let decision = 'hold';
    let reasoning = 'Análise técnica básica: ';
    
    if (rsi < 30 && macd > 0 && tendencia === 'alta') {
      decision = 'buy';
      reasoning += 'RSI em sobrevenda com MACD positivo e tendência alta';
    } else if (rsi > 70 && macd < 0 && tendencia === 'baixa') {
      decision = 'sell';
      reasoning += 'RSI em sobrecompra com MACD negativo e tendência baixa';
    } else {
      reasoning += 'Sinais mistos, aguardando melhor oportunidade';
    }
    
    return {
      decision,
      confidence: 0.6,
      reasoning,
      fullAnalysis: `Fallback analysis: ${errorMessage}`
    };
  }

  async sendMessageToAI(message, context = '') {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Você é um assistente de trading especializado. Responda de forma clara e profissional sobre estratégias de trading e análise técnica."
          },
          {
            role: "user",
            content: `Contexto: ${context}\n\nMensagem: ${message}`
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      return {
        response: completion.choices[0].message.content,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Erro ao enviar mensagem para IA:', error);
      return {
        response: 'Desculpe, não foi possível processar sua mensagem no momento.',
        timestamp: new Date(),
        error: true
      };
    }
  }
}

module.exports = new OpenAIService();
