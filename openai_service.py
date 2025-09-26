import openai
import json
import numpy as np
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from src.models.user import db
from src.models.produto import Produto
from src.models.empresa import Empresa

class OpenAIService:
    """Serviço para integração com a API da OpenAI"""
    
    def __init__(self, api_key: str, api_base: str = None):
        self.client = openai.OpenAI(
            api_key=api_key,
            base_url=api_base
        )
        self.embedding_model = "text-embedding-ada-002"
        self.chat_model = "gpt-4"
        self.max_tokens = 4000
    
    def generate_embedding(self, text: str) -> List[float]:
        """Gera embedding para um texto"""
        try:
            # Limpar e preparar o texto
            clean_text = self._clean_text(text)
            
            if not clean_text:
                return [0.0] * 1536  # Embedding vazio padrão
            
            response = self.client.embeddings.create(
                input=clean_text,
                model=self.embedding_model
            )
            
            return response.data[0].embedding
            
        except Exception as e:
            print(f"Erro ao gerar embedding: {str(e)}")
            return [0.0] * 1536  # Retornar embedding vazio em caso de erro
    
    def generate_product_embedding(self, produto: Produto) -> List[float]:
        """Gera embedding específico para um produto"""
        try:
            # Criar texto descritivo do produto
            product_text = self._create_product_text(produto)
            return self.generate_embedding(product_text)
            
        except Exception as e:
            print(f"Erro ao gerar embedding do produto {produto.id}: {str(e)}")
            return [0.0] * 1536
    
    def _create_product_text(self, produto: Produto) -> str:
        """Cria texto descritivo do produto para embedding"""
        parts = []
        
        if produto.nome:
            parts.append(f"Nome: {produto.nome}")
        
        if produto.descricao:
            parts.append(f"Descrição: {produto.descricao}")
        
        if produto.categoria and produto.categoria.nome:
            parts.append(f"Categoria: {produto.categoria.nome}")
        
        if produto.setor and produto.setor.nome:
            parts.append(f"Setor: {produto.setor.nome}")
        
        if produto.fornecedor and produto.fornecedor.nome:
            parts.append(f"Fornecedor: {produto.fornecedor.nome}")
        
        if produto.codigo_ean:
            parts.append(f"EAN: {produto.codigo_ean}")
        
        if produto.preco_venda:
            parts.append(f"Preço: R$ {produto.preco_venda}")
        
        if produto.data_validade:
            parts.append(f"Validade: {produto.data_validade}")
        
        if produto.estoque_atual is not None:
            parts.append(f"Estoque: {produto.estoque_atual}")
        
        return " | ".join(parts)
    
    def predict_expiry_risk(self, produto: Produto) -> Dict[str, Any]:
        """Prediz risco de vencimento usando IA"""
        try:
            # Preparar dados do produto
            product_data = self._prepare_product_data(produto)
            
            # Criar prompt para análise
            prompt = self._create_expiry_prediction_prompt(product_data)
            
            response = self.client.chat.completions.create(
                model=self.chat_model,
                messages=[
                    {
                        "role": "system",
                        "content": "Você é um especialista em gestão de estoque e prevenção de perdas no varejo alimentar. Analise os dados do produto e forneça uma avaliação precisa do risco de vencimento."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=self.max_tokens,
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            
            # Adicionar timestamp e produto ID
            result['produto_id'] = produto.id
            result['timestamp'] = datetime.now().isoformat()
            result['modelo_utilizado'] = self.chat_model
            
            return result
            
        except Exception as e:
            print(f"Erro na predição de vencimento: {str(e)}")
            return {
                'risco_nivel': 'medio',
                'risco_score': 0.5,
                'dias_estimados': 7,
                'recomendacoes': ['Monitorar produto regularmente'],
                'confianca': 0.0,
                'erro': str(e)
            }
    
    def generate_pricing_suggestions(self, produto: Produto) -> Dict[str, Any]:
        """Gera sugestões de preços usando IA"""
        try:
            # Buscar produtos similares
            similar_products = self._find_similar_products(produto)
            
            # Preparar dados para análise
            pricing_data = {
                'produto': self._prepare_product_data(produto),
                'produtos_similares': [self._prepare_product_data(p) for p in similar_products],
                'mercado_info': self._get_market_context(produto)
            }
            
            prompt = self._create_pricing_prompt(pricing_data)
            
            response = self.client.chat.completions.create(
                model=self.chat_model,
                messages=[
                    {
                        "role": "system",
                        "content": "Você é um especialista em precificação de produtos no varejo. Analise os dados fornecidos e sugira estratégias de preços otimizadas."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=self.max_tokens,
                temperature=0.4,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            result['produto_id'] = produto.id
            result['timestamp'] = datetime.now().isoformat()
            
            return result
            
        except Exception as e:
            print(f"Erro na sugestão de preços: {str(e)}")
            return {
                'preco_sugerido': float(produto.preco_venda) if produto.preco_venda else 0,
                'margem_sugerida': 20.0,
                'estrategia': 'manter_atual',
                'justificativa': 'Erro na análise de IA',
                'confianca': 0.0
            }
    
    def analyze_inventory_patterns(self, empresa_id: int) -> Dict[str, Any]:
        """Analisa padrões de estoque usando IA"""
        try:
            # Buscar dados históricos da empresa
            produtos = Produto.query.filter_by(
                empresa_id=empresa_id, status='ativo'
            ).limit(100).all()
            
            if not produtos:
                return {'erro': 'Nenhum produto encontrado'}
            
            # Preparar dados agregados
            inventory_data = self._prepare_inventory_analysis_data(produtos)
            
            prompt = self._create_inventory_analysis_prompt(inventory_data)
            
            response = self.client.chat.completions.create(
                model=self.chat_model,
                messages=[
                    {
                        "role": "system",
                        "content": "Você é um especialista em análise de estoque e otimização de inventário. Analise os padrões e forneça insights acionáveis."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=self.max_tokens,
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            result['empresa_id'] = empresa_id
            result['timestamp'] = datetime.now().isoformat()
            result['total_produtos_analisados'] = len(produtos)
            
            return result
            
        except Exception as e:
            print(f"Erro na análise de estoque: {str(e)}")
            return {
                'insights': ['Erro na análise'],
                'recomendacoes': ['Verificar dados'],
                'score_otimizacao': 0.0,
                'erro': str(e)
            }
    
    def generate_smart_alerts(self, empresa_id: int) -> List[Dict[str, Any]]:
        """Gera alertas inteligentes baseados em IA"""
        try:
            # Buscar produtos com risco de vencimento
            from datetime import date
            data_limite = date.today() + timedelta(days=30)
            
            produtos_risco = Produto.query.filter(
                Produto.empresa_id == empresa_id,
                Produto.status == 'ativo',
                Produto.data_validade <= data_limite,
                Produto.data_validade.isnot(None)
            ).all()
            
            alerts = []
            
            for produto in produtos_risco:
                # Analisar cada produto
                risk_analysis = self.predict_expiry_risk(produto)
                
                if risk_analysis.get('risco_score', 0) > 0.6:
                    alert = {
                        'produto_id': produto.id,
                        'produto_nome': produto.nome,
                        'tipo': 'vencimento_iminente',
                        'urgencia': self._calculate_urgency(risk_analysis['risco_score']),
                        'mensagem': self._generate_alert_message(produto, risk_analysis),
                        'recomendacoes': risk_analysis.get('recomendacoes', []),
                        'data_validade': produto.data_validade.isoformat() if produto.data_validade else None,
                        'dias_restantes': (produto.data_validade - date.today()).days if produto.data_validade else 0,
                        'valor_risco': float(produto.preco_venda * produto.estoque_atual) if produto.preco_venda and produto.estoque_atual else 0,
                        'confianca': risk_analysis.get('confianca', 0.0),
                        'timestamp': datetime.now().isoformat()
                    }
                    alerts.append(alert)
            
            return alerts
            
        except Exception as e:
            print(f"Erro ao gerar alertas inteligentes: {str(e)}")
            return []
    
    def chat_with_data(self, empresa_id: int, question: str, context: Dict = None) -> Dict[str, Any]:
        """Chat inteligente com dados da empresa"""
        try:
            # Buscar contexto relevante
            if not context:
                context = self._get_company_context(empresa_id)
            
            # Criar prompt contextualizado
            prompt = self._create_chat_prompt(question, context)
            
            response = self.client.chat.completions.create(
                model=self.chat_model,
                messages=[
                    {
                        "role": "system",
                        "content": "Você é um assistente especializado em gestão de estoque e validade de produtos. Use os dados fornecidos para responder de forma precisa e útil."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=self.max_tokens,
                temperature=0.5
            )
            
            return {
                'resposta': response.choices[0].message.content,
                'empresa_id': empresa_id,
                'pergunta': question,
                'timestamp': datetime.now().isoformat(),
                'modelo': self.chat_model
            }
            
        except Exception as e:
            print(f"Erro no chat com dados: {str(e)}")
            return {
                'resposta': 'Desculpe, ocorreu um erro ao processar sua pergunta.',
                'erro': str(e)
            }
    
    def _clean_text(self, text: str) -> str:
        """Limpa e prepara texto para processamento"""
        if not text:
            return ""
        
        # Remover caracteres especiais e normalizar
        import re
        text = re.sub(r'[^\w\s\-\.\,\:\;\!\?]', ' ', text)
        text = re.sub(r'\s+', ' ', text)
        return text.strip()[:8000]  # Limitar tamanho
    
    def _prepare_product_data(self, produto: Produto) -> Dict[str, Any]:
        """Prepara dados do produto para análise"""
        return {
            'id': produto.id,
            'nome': produto.nome,
            'descricao': produto.descricao,
            'categoria': produto.categoria.nome if produto.categoria else None,
            'setor': produto.setor.nome if produto.setor else None,
            'fornecedor': produto.fornecedor.nome if produto.fornecedor else None,
            'preco_custo': float(produto.preco_custo) if produto.preco_custo else None,
            'preco_venda': float(produto.preco_venda) if produto.preco_venda else None,
            'margem_lucro': float(produto.margem_lucro) if produto.margem_lucro else None,
            'estoque_atual': produto.estoque_atual,
            'estoque_minimo': produto.estoque_minimo,
            'data_validade': produto.data_validade.isoformat() if produto.data_validade else None,
            'dias_ate_vencimento': (produto.data_validade - datetime.now().date()).days if produto.data_validade else None,
            'lote': produto.lote,
            'codigo_ean': produto.codigo_ean
        }
    
    def _create_expiry_prediction_prompt(self, product_data: Dict) -> str:
        """Cria prompt para predição de vencimento"""
        return f"""
        Analise o seguinte produto e avalie o risco de vencimento:
        
        Dados do Produto:
        {json.dumps(product_data, indent=2, ensure_ascii=False)}
        
        Forneça uma análise em JSON com:
        - risco_nivel: "baixo", "medio", "alto", "critico"
        - risco_score: número de 0.0 a 1.0
        - dias_estimados: estimativa de dias até ação necessária
        - recomendacoes: lista de ações sugeridas
        - justificativa: explicação da análise
        - confianca: nível de confiança da predição (0.0 a 1.0)
        
        Considere fatores como:
        - Dias restantes até vencimento
        - Quantidade em estoque
        - Valor financeiro em risco
        - Tipo de produto/categoria
        - Histórico de vendas (se disponível)
        """
    
    def _create_pricing_prompt(self, pricing_data: Dict) -> str:
        """Cria prompt para sugestão de preços"""
        return f"""
        Analise os dados de precificação e sugira estratégias otimizadas:
        
        Dados:
        {json.dumps(pricing_data, indent=2, ensure_ascii=False)}
        
        Forneça sugestões em JSON com:
        - preco_sugerido: preço recomendado
        - margem_sugerida: margem de lucro recomendada (%)
        - estrategia: "penetracao", "skimming", "competitiva", "valor"
        - justificativa: explicação da estratégia
        - impacto_estimado: impacto esperado nas vendas
        - confianca: nível de confiança (0.0 a 1.0)
        - alertas: possíveis riscos ou considerações
        """
    
    def _create_inventory_analysis_prompt(self, inventory_data: Dict) -> str:
        """Cria prompt para análise de estoque"""
        return f"""
        Analise os padrões de estoque da empresa:
        
        Dados do Inventário:
        {json.dumps(inventory_data, indent=2, ensure_ascii=False)}
        
        Forneça análise em JSON com:
        - insights: principais descobertas
        - padroes_identificados: padrões encontrados
        - recomendacoes: ações sugeridas
        - score_otimizacao: score de 0.0 a 1.0
        - areas_melhoria: áreas que precisam atenção
        - oportunidades: oportunidades identificadas
        - riscos: riscos potenciais
        """
    
    def _find_similar_products(self, produto: Produto, limit: int = 5) -> List[Produto]:
        """Encontra produtos similares"""
        query = Produto.query.filter(
            Produto.empresa_id == produto.empresa_id,
            Produto.id != produto.id,
            Produto.status == 'ativo'
        )
        
        # Filtrar por categoria se disponível
        if produto.categoria_id:
            query = query.filter(Produto.categoria_id == produto.categoria_id)
        
        return query.limit(limit).all()
    
    def _get_market_context(self, produto: Produto) -> Dict[str, Any]:
        """Obtém contexto de mercado"""
        return {
            'categoria': produto.categoria.nome if produto.categoria else None,
            'setor': produto.setor.nome if produto.setor else None,
            'sazonalidade': 'media',  # Implementar lógica de sazonalidade
            'tendencia_preco': 'estavel'  # Implementar análise de tendências
        }
    
    def _prepare_inventory_analysis_data(self, produtos: List[Produto]) -> Dict[str, Any]:
        """Prepara dados agregados para análise de estoque"""
        total_produtos = len(produtos)
        produtos_vencendo = len([p for p in produtos if p.data_validade and (p.data_validade - datetime.now().date()).days <= 7])
        valor_total_estoque = sum(float(p.preco_venda * p.estoque_atual) for p in produtos if p.preco_venda and p.estoque_atual)
        
        # Agrupar por categoria
        categorias = {}
        for produto in produtos:
            cat_nome = produto.categoria.nome if produto.categoria else 'Sem categoria'
            if cat_nome not in categorias:
                categorias[cat_nome] = {'count': 0, 'valor': 0}
            categorias[cat_nome]['count'] += 1
            if produto.preco_venda and produto.estoque_atual:
                categorias[cat_nome]['valor'] += float(produto.preco_venda * produto.estoque_atual)
        
        return {
            'total_produtos': total_produtos,
            'produtos_vencendo_7dias': produtos_vencendo,
            'valor_total_estoque': valor_total_estoque,
            'distribuicao_categorias': categorias,
            'produtos_sem_estoque': len([p for p in produtos if p.estoque_atual == 0]),
            'produtos_estoque_baixo': len([p for p in produtos if p.estoque_atual and p.estoque_minimo and p.estoque_atual <= p.estoque_minimo])
        }
    
    def _calculate_urgency(self, risk_score: float) -> str:
        """Calcula urgência baseada no score de risco"""
        if risk_score >= 0.8:
            return 'critica'
        elif risk_score >= 0.6:
            return 'alta'
        elif risk_score >= 0.4:
            return 'media'
        else:
            return 'baixa'
    
    def _generate_alert_message(self, produto: Produto, risk_analysis: Dict) -> str:
        """Gera mensagem de alerta"""
        dias_restantes = (produto.data_validade - datetime.now().date()).days if produto.data_validade else 0
        
        if dias_restantes <= 1:
            return f"URGENTE: {produto.nome} vence hoje ou já venceu!"
        elif dias_restantes <= 3:
            return f"ATENÇÃO: {produto.nome} vence em {dias_restantes} dias"
        elif dias_restantes <= 7:
            return f"AVISO: {produto.nome} vence em {dias_restantes} dias"
        else:
            return f"Monitorar: {produto.nome} vence em {dias_restantes} dias"
    
    def _get_company_context(self, empresa_id: int) -> Dict[str, Any]:
        """Obtém contexto da empresa para chat"""
        empresa = Empresa.query.get(empresa_id)
        if not empresa:
            return {}
        
        produtos = Produto.query.filter_by(empresa_id=empresa_id, status='ativo').limit(50).all()
        
        return {
            'empresa': {
                'nome': empresa.nome_fantasia or empresa.razao_social,
                'total_produtos': len(produtos)
            },
            'produtos_amostra': [self._prepare_product_data(p) for p in produtos[:10]],
            'estatisticas': self._prepare_inventory_analysis_data(produtos)
        }
    
    def _create_chat_prompt(self, question: str, context: Dict) -> str:
        """Cria prompt para chat contextualizado"""
        return f"""
        Pergunta do usuário: {question}
        
        Contexto da empresa:
        {json.dumps(context, indent=2, ensure_ascii=False)}
        
        Responda de forma clara e útil, usando os dados fornecidos quando relevante.
        Se a pergunta não puder ser respondida com os dados disponíveis, seja transparente sobre isso.
        """

# Instância global do serviço
openai_service = None

def init_openai_service(api_key: str, api_base: str = None):
    """Inicializa o serviço da OpenAI"""
    global openai_service
    openai_service = OpenAIService(api_key, api_base)
    return openai_service

