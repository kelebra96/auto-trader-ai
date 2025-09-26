import numpy as np
import pandas as pd
from datetime import datetime, date, timedelta
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
from src.models.produto import HistoricoVenda
from src.models.user import db

class IAService:
    """Serviço de Inteligência Artificial para sugestões de ações"""
    
    def __init__(self):
        self.model = None
        self.label_encoders = {}
    
    def obter_sugestoes_produto(self, produto):
        """Obtém sugestões da IA para um produto específico"""
        try:
            dias_vencimento = produto.dias_para_vencer
            
            if dias_vencimento > 30:
                return {
                    'acao_recomendada': 'monitorar',
                    'confianca': 0.9,
                    'justificativa': 'Produto com validade distante, apenas monitorar'
                }
            
            # Buscar histórico de vendas
            historico = self._obter_historico_vendas(produto)
            
            if not historico:
                return self._sugestao_sem_historico(produto)
            
            # Calcular métricas
            vendas_media_diaria = self._calcular_vendas_media_diaria(historico)
            dias_para_escoar = produto.quantidade / max(vendas_media_diaria, 0.1)
            
            # Determinar ação baseada na análise
            if dias_para_escoar <= dias_vencimento:
                return {
                    'acao_recomendada': 'monitorar',
                    'confianca': 0.8,
                    'justificativa': f'Produto deve escoar naturalmente em {dias_para_escoar:.0f} dias'
                }
            
            # Produto precisa de ação
            if dias_vencimento <= 3:
                return self._sugestao_urgente(produto, historico)
            elif dias_vencimento <= 7:
                return self._sugestao_promocao(produto, historico)
            else:
                return self._sugestao_promocao_leve(produto, historico)
                
        except Exception as e:
            print(f"Erro na IA: {e}")
            return self._sugestao_padrao(produto)
    
    def _obter_historico_vendas(self, produto):
        """Obtém histórico de vendas do produto"""
        return HistoricoVenda.query.filter_by(
            produto_id=produto.id
        ).order_by(HistoricoVenda.data_venda.desc()).limit(30).all()
    
    def _calcular_vendas_media_diaria(self, historico):
        """Calcula média de vendas diárias"""
        if not historico:
            return 0
        
        # Agrupar vendas por dia
        vendas_por_dia = {}
        for venda in historico:
            data = venda.data_venda
            if data not in vendas_por_dia:
                vendas_por_dia[data] = 0
            vendas_por_dia[data] += venda.quantidade_vendida
        
        if not vendas_por_dia:
            return 0
        
        return sum(vendas_por_dia.values()) / len(vendas_por_dia)
    
    def _sugestao_sem_historico(self, produto):
        """Sugestão para produtos sem histórico"""
        dias = produto.dias_para_vencer
        
        if dias <= 3:
            return {
                'acao_recomendada': 'promocao',
                'confianca': 0.6,
                'desconto_sugerido': 30,
                'preco_promocional': produto.preco_venda * 0.7,
                'justificativa': 'Produto próximo ao vencimento, desconto agressivo recomendado'
            }
        elif dias <= 7:
            return {
                'acao_recomendada': 'promocao',
                'confianca': 0.7,
                'desconto_sugerido': 15,
                'preco_promocional': produto.preco_venda * 0.85,
                'justificativa': 'Produto vence em breve, promoção moderada recomendada'
            }
        else:
            return {
                'acao_recomendada': 'monitorar',
                'confianca': 0.8,
                'justificativa': 'Produto sem histórico, monitorar comportamento de vendas'
            }
    
    def _sugestao_urgente(self, produto, historico):
        """Sugestão para produtos com vencimento urgente"""
        return {
            'acao_recomendada': 'promocao_urgente',
            'confianca': 0.9,
            'desconto_sugerido': 40,
            'preco_promocional': produto.preco_venda * 0.6,
            'probabilidade_venda': 0.8,
            'receita_estimada': produto.quantidade * produto.preco_venda * 0.6 * 0.8,
            'economia_vs_perda': produto.quantidade * produto.preco_venda * 0.6 * 0.8,
            'justificativa': 'Produto vence em até 3 dias, desconto agressivo necessário',
            'acoes_alternativas': [
                {
                    'tipo': 'doacao',
                    'instituicao': 'Banco de Alimentos',
                    'beneficio_fiscal': produto.preco_custo * produto.quantidade if produto.preco_custo else 0
                }
            ]
        }
    
    def _sugestao_promocao(self, produto, historico):
        """Sugestão de promoção moderada"""
        vendas_media = self._calcular_vendas_media_diaria(historico)
        
        # Calcular desconto baseado na urgência e histórico
        desconto_base = 20
        if vendas_media < 1:
            desconto_base = 25
        
        preco_promocional = produto.preco_venda * (1 - desconto_base / 100)
        probabilidade_venda = min(0.9, 0.5 + (desconto_base / 100))
        
        return {
            'acao_recomendada': 'promocao',
            'confianca': 0.85,
            'desconto_sugerido': desconto_base,
            'preco_promocional': preco_promocional,
            'probabilidade_venda': probabilidade_venda,
            'receita_estimada': produto.quantidade * preco_promocional * probabilidade_venda,
            'economia_vs_perda': produto.quantidade * preco_promocional * probabilidade_venda,
            'justificativa': f'Baseado no histórico de vendas, desconto de {desconto_base}% deve acelerar as vendas'
        }
    
    def _sugestao_promocao_leve(self, produto, historico):
        """Sugestão de promoção leve"""
        return {
            'acao_recomendada': 'promocao_leve',
            'confianca': 0.75,
            'desconto_sugerido': 10,
            'preco_promocional': produto.preco_venda * 0.9,
            'probabilidade_venda': 0.7,
            'receita_estimada': produto.quantidade * produto.preco_venda * 0.9 * 0.7,
            'economia_vs_perda': produto.quantidade * produto.preco_venda * 0.9 * 0.7,
            'justificativa': 'Promoção preventiva para acelerar vendas antes do vencimento'
        }
    
    def _sugestao_padrao(self, produto):
        """Sugestão padrão em caso de erro"""
        return {
            'acao_recomendada': 'monitorar',
            'confianca': 0.5,
            'justificativa': 'Análise indisponível, monitorar manualmente'
        }
    
    def treinar_modelo(self, user_id):
        """Treina modelo de ML com dados do usuário"""
        try:
            # Buscar dados históricos
            historico = db.session.query(HistoricoVenda).join(
                Produto
            ).filter(Produto.user_id == user_id).all()
            
            if len(historico) < 10:
                return False, "Dados insuficientes para treinamento"
            
            # Preparar dados
            dados = []
            for venda in historico:
                produto = venda.produto
                dados.append({
                    'categoria': produto.categoria,
                    'dias_para_vencer': (produto.data_validade - venda.data_venda).days,
                    'preco_venda': produto.preco_venda,
                    'quantidade_estoque': produto.quantidade,
                    'quantidade_vendida': venda.quantidade_vendida,
                    'dia_semana': venda.data_venda.weekday(),
                    'mes': venda.data_venda.month
                })
            
            df = pd.DataFrame(dados)
            
            # Preparar features
            le_categoria = LabelEncoder()
            df['categoria_encoded'] = le_categoria.fit_transform(df['categoria'])
            
            features = [
                'categoria_encoded', 'dias_para_vencer', 'preco_venda',
                'quantidade_estoque', 'dia_semana', 'mes'
            ]
            
            X = df[features]
            y = df['quantidade_vendida']
            
            # Treinar modelo
            self.model = RandomForestRegressor(n_estimators=100, random_state=42)
            self.model.fit(X, y)
            
            self.label_encoders['categoria'] = le_categoria
            
            return True, "Modelo treinado com sucesso"
            
        except Exception as e:
            return False, f"Erro no treinamento: {str(e)}"
    
    def prever_vendas(self, produto, dias_futuro=7):
        """Prevê vendas futuras do produto"""
        if not self.model:
            return None
        
        try:
            # Preparar dados para predição
            categoria_encoded = self.label_encoders['categoria'].transform([produto.categoria])[0]
            
            features = [
                categoria_encoded,
                produto.dias_para_vencer,
                produto.preco_venda,
                produto.quantidade,
                datetime.now().weekday(),
                datetime.now().month
            ]
            
            predicao = self.model.predict([features])[0]
            return max(0, predicao)
            
        except Exception as e:
            print(f"Erro na predição: {e}")
            return None
    
    def calcular_preco_otimo(self, produto):
        """Calcula preço ótimo baseado em elasticidade"""
        try:
            # Simulação simples de elasticidade
            dias = produto.dias_para_vencer
            preco_base = produto.preco_venda
            
            if dias <= 3:
                fator_desconto = 0.6  # 40% desconto
            elif dias <= 7:
                fator_desconto = 0.8  # 20% desconto
            elif dias <= 15:
                fator_desconto = 0.9  # 10% desconto
            else:
                fator_desconto = 1.0  # Sem desconto
            
            preco_otimo = preco_base * fator_desconto
            
            return {
                'preco_otimo': preco_otimo,
                'desconto_percentual': (1 - fator_desconto) * 100,
                'receita_estimada': produto.quantidade * preco_otimo * 0.8  # 80% probabilidade venda
            }
            
        except Exception as e:
            print(f"Erro no cálculo de preço ótimo: {e}")
            return None

