from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, DECIMAL, ForeignKey, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from src.models.user import db
import numpy as np

# Importar extensão vector do PostgreSQL
try:
    from pgvector.sqlalchemy import Vector
    VECTOR_AVAILABLE = True
except ImportError:
    # Fallback para desenvolvimento sem pgvector
    from sqlalchemy import Text as Vector
    VECTOR_AVAILABLE = False

class EmbeddingProduto(db.Model):
    """Tabela para armazenar embeddings de produtos"""
    __tablename__ = 'embeddings_produtos'
    
    id = Column(Integer, primary_key=True)
    produto_id = Column(Integer, ForeignKey('produtos.id', ondelete='CASCADE'), nullable=False)
    embedding = Column(Vector(1536) if VECTOR_AVAILABLE else Text, nullable=False)
    metadados = Column(JSONB, default={})
    versao_modelo = Column(String(50), default='text-embedding-ada-002')
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relacionamentos
    produto = relationship("Produto", back_populates="embeddings")
    
    # Índices para performance
    __table_args__ = (
        Index('idx_embeddings_produto_id', 'produto_id'),
        Index('idx_embeddings_versao_modelo', 'versao_modelo'),
    )
    
    def __repr__(self):
        return f'<EmbeddingProduto {self.produto_id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'produto_id': self.produto_id,
            'metadados': self.metadados,
            'versao_modelo': self.versao_modelo,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def get_embedding_array(self):
        """Retorna embedding como array numpy"""
        if VECTOR_AVAILABLE:
            return np.array(self.embedding)
        else:
            # Fallback: assumir que está armazenado como JSON string
            import json
            return np.array(json.loads(self.embedding))
    
    def set_embedding_array(self, embedding_array):
        """Define embedding a partir de array numpy"""
        if VECTOR_AVAILABLE:
            self.embedding = embedding_array.tolist()
        else:
            # Fallback: armazenar como JSON string
            import json
            self.embedding = json.dumps(embedding_array.tolist())
    
    @classmethod
    def find_similar(cls, embedding_vector, limit=10, threshold=0.8):
        """Encontra embeddings similares usando similaridade de cosseno"""
        if not VECTOR_AVAILABLE:
            # Implementação fallback sem pgvector
            return cls.query.limit(limit).all()
        
        # Query com pgvector para similaridade de cosseno
        return cls.query.order_by(
            cls.embedding.cosine_distance(embedding_vector)
        ).limit(limit).all()

class PredicaoIA(db.Model):
    """Tabela para armazenar predições da IA"""
    __tablename__ = 'predicoes_ia'
    
    id = Column(Integer, primary_key=True)
    empresa_id = Column(Integer, ForeignKey('empresas.id'), nullable=False)
    produto_id = Column(Integer, ForeignKey('produtos.id'))
    tipo_predicao = Column(String(50), nullable=False)  # 'expiry_risk', 'pricing', 'demand', etc.
    entrada = Column(JSONB, nullable=False)  # Dados de entrada
    resultado = Column(JSONB, nullable=False)  # Resultado da predição
    confianca = Column(DECIMAL(5, 4))  # Score de confiança (0.0000 a 1.0000)
    modelo_utilizado = Column(String(100))
    versao_modelo = Column(String(50))
    tempo_processamento = Column(Integer)  # Tempo em milissegundos
    created_at = Column(DateTime, default=func.now())
    
    # Relacionamentos
    empresa = relationship("Empresa")
    produto = relationship("Produto")
    
    # Índices para performance
    __table_args__ = (
        Index('idx_predicoes_empresa_tipo', 'empresa_id', 'tipo_predicao'),
        Index('idx_predicoes_produto_tipo', 'produto_id', 'tipo_predicao'),
        Index('idx_predicoes_created_at', 'created_at'),
    )
    
    def __repr__(self):
        return f'<PredicaoIA {self.tipo_predicao} - {self.produto_id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'empresa_id': self.empresa_id,
            'produto_id': self.produto_id,
            'tipo_predicao': self.tipo_predicao,
            'entrada': self.entrada,
            'resultado': self.resultado,
            'confianca': float(self.confianca) if self.confianca else None,
            'modelo_utilizado': self.modelo_utilizado,
            'versao_modelo': self.versao_modelo,
            'tempo_processamento': self.tempo_processamento,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def is_recent(self, hours=24):
        """Verifica se a predição é recente"""
        from datetime import datetime, timedelta
        if not self.created_at:
            return False
        return datetime.now() - self.created_at < timedelta(hours=hours)
    
    def get_confidence_level(self):
        """Retorna nível de confiança como string"""
        if not self.confianca:
            return 'desconhecido'
        
        confidence = float(self.confianca)
        if confidence >= 0.9:
            return 'muito_alto'
        elif confidence >= 0.7:
            return 'alto'
        elif confidence >= 0.5:
            return 'medio'
        elif confidence >= 0.3:
            return 'baixo'
        else:
            return 'muito_baixo'

class SessaoChat(db.Model):
    """Tabela para armazenar sessões de chat com IA"""
    __tablename__ = 'sessoes_chat'
    
    id = Column(Integer, primary_key=True)
    empresa_id = Column(Integer, ForeignKey('empresas.id'), nullable=False)
    usuario_id = Column(Integer, ForeignKey('usuarios.id'), nullable=False)
    titulo = Column(String(200))
    contexto = Column(JSONB, default={})
    ativa = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relacionamentos
    empresa = relationship("Empresa")
    usuario = relationship("Usuario")
    mensagens = relationship("MensagemChat", back_populates="sessao", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f'<SessaoChat {self.id} - {self.titulo}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'empresa_id': self.empresa_id,
            'usuario_id': self.usuario_id,
            'titulo': self.titulo,
            'contexto': self.contexto,
            'ativa': self.ativa,
            'total_mensagens': len(self.mensagens),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def get_last_messages(self, limit=10):
        """Retorna últimas mensagens da sessão"""
        return sorted(self.mensagens, key=lambda x: x.created_at, reverse=True)[:limit]

class MensagemChat(db.Model):
    """Tabela para armazenar mensagens do chat com IA"""
    __tablename__ = 'mensagens_chat'
    
    id = Column(Integer, primary_key=True)
    sessao_id = Column(Integer, ForeignKey('sessoes_chat.id', ondelete='CASCADE'), nullable=False)
    tipo = Column(String(20), nullable=False)  # 'user', 'assistant', 'system'
    conteudo = Column(Text, nullable=False)
    metadados = Column(JSONB, default={})
    tokens_utilizados = Column(Integer)
    tempo_resposta = Column(Integer)  # Tempo em milissegundos
    created_at = Column(DateTime, default=func.now())
    
    # Relacionamentos
    sessao = relationship("SessaoChat", back_populates="mensagens")
    
    def __repr__(self):
        return f'<MensagemChat {self.tipo} - {self.sessao_id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'sessao_id': self.sessao_id,
            'tipo': self.tipo,
            'conteudo': self.conteudo,
            'metadados': self.metadados,
            'tokens_utilizados': self.tokens_utilizados,
            'tempo_resposta': self.tempo_resposta,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class AnaliseTexto(db.Model):
    """Tabela para armazenar análises de texto com IA"""
    __tablename__ = 'analises_texto'
    
    id = Column(Integer, primary_key=True)
    empresa_id = Column(Integer, ForeignKey('empresas.id'), nullable=False)
    usuario_id = Column(Integer, ForeignKey('usuarios.id'))
    tipo_analise = Column(String(50), nullable=False)  # 'sentiment', 'classification', 'extraction'
    texto_original = Column(Text, nullable=False)
    resultado_analise = Column(JSONB, nullable=False)
    confianca = Column(DECIMAL(5, 4))
    modelo_utilizado = Column(String(100))
    created_at = Column(DateTime, default=func.now())
    
    # Relacionamentos
    empresa = relationship("Empresa")
    usuario = relationship("Usuario")
    
    def __repr__(self):
        return f'<AnaliseTexto {self.tipo_analise} - {self.id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'empresa_id': self.empresa_id,
            'usuario_id': self.usuario_id,
            'tipo_analise': self.tipo_analise,
            'texto_original': self.texto_original[:200] + '...' if len(self.texto_original) > 200 else self.texto_original,
            'resultado_analise': self.resultado_analise,
            'confianca': float(self.confianca) if self.confianca else None,
            'modelo_utilizado': self.modelo_utilizado,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class RecomendacaoIA(db.Model):
    """Tabela para armazenar recomendações geradas pela IA"""
    __tablename__ = 'recomendacoes_ia'
    
    id = Column(Integer, primary_key=True)
    empresa_id = Column(Integer, ForeignKey('empresas.id'), nullable=False)
    produto_id = Column(Integer, ForeignKey('produtos.id'))
    tipo_recomendacao = Column(String(50), nullable=False)  # 'pricing', 'inventory', 'promotion'
    titulo = Column(String(200), nullable=False)
    descricao = Column(Text)
    dados_suporte = Column(JSONB, default={})
    prioridade = Column(String(20), default='media')  # 'baixa', 'media', 'alta', 'critica'
    status = Column(String(20), default='pendente')  # 'pendente', 'aceita', 'rejeitada', 'implementada'
    impacto_estimado = Column(JSONB, default={})
    confianca = Column(DECIMAL(5, 4))
    valida_ate = Column(DateTime)
    implementada_em = Column(DateTime)
    feedback_usuario = Column(JSONB, default={})
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relacionamentos
    empresa = relationship("Empresa")
    produto = relationship("Produto")
    
    # Índices
    __table_args__ = (
        Index('idx_recomendacoes_empresa_status', 'empresa_id', 'status'),
        Index('idx_recomendacoes_prioridade', 'prioridade'),
        Index('idx_recomendacoes_valida_ate', 'valida_ate'),
    )
    
    def __repr__(self):
        return f'<RecomendacaoIA {self.tipo_recomendacao} - {self.titulo}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'empresa_id': self.empresa_id,
            'produto_id': self.produto_id,
            'tipo_recomendacao': self.tipo_recomendacao,
            'titulo': self.titulo,
            'descricao': self.descricao,
            'dados_suporte': self.dados_suporte,
            'prioridade': self.prioridade,
            'status': self.status,
            'impacto_estimado': self.impacto_estimado,
            'confianca': float(self.confianca) if self.confianca else None,
            'valida_ate': self.valida_ate.isoformat() if self.valida_ate else None,
            'implementada_em': self.implementada_em.isoformat() if self.implementada_em else None,
            'feedback_usuario': self.feedback_usuario,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def is_valid(self):
        """Verifica se a recomendação ainda é válida"""
        if not self.valida_ate:
            return True
        from datetime import datetime
        return datetime.now() <= self.valida_ate
    
    def mark_as_implemented(self, feedback=None):
        """Marca recomendação como implementada"""
        from datetime import datetime
        self.status = 'implementada'
        self.implementada_em = datetime.now()
        if feedback:
            self.feedback_usuario = feedback
    
    def get_priority_score(self):
        """Retorna score numérico da prioridade"""
        priority_scores = {
            'baixa': 1,
            'media': 2,
            'alta': 3,
            'critica': 4
        }
        return priority_scores.get(self.prioridade, 2)

# Função para inicializar extensões do PostgreSQL
def init_vector_extension():
    """Inicializa extensão pgvector no PostgreSQL"""
    try:
        if VECTOR_AVAILABLE:
            # Executar comando SQL para criar extensão
            db.session.execute('CREATE EXTENSION IF NOT EXISTS vector;')
            db.session.commit()
            print("Extensão pgvector inicializada com sucesso")
        else:
            print("Aviso: pgvector não disponível, usando fallback")
    except Exception as e:
        print(f"Erro ao inicializar extensão pgvector: {str(e)}")

# Função para criar índices de performance
def create_vector_indexes():
    """Cria índices otimizados para busca vetorial"""
    try:
        if VECTOR_AVAILABLE:
            # Criar índice IVFFlat para busca aproximada
            db.session.execute("""
                CREATE INDEX IF NOT EXISTS idx_embeddings_produtos_vector 
                ON embeddings_produtos 
                USING ivfflat (embedding vector_cosine_ops) 
                WITH (lists = 100);
            """)
            db.session.commit()
            print("Índices vetoriais criados com sucesso")
    except Exception as e:
        print(f"Erro ao criar índices vetoriais: {str(e)}")

# Adicionar relacionamentos aos modelos existentes
def add_ai_relationships():
    """Adiciona relacionamentos de IA aos modelos existentes"""
    try:
        # Importar modelos necessários
        from src.models.produto import Produto
        from src.models.user import Usuario
        
        # Adicionar relacionamento de embeddings ao Produto
        if not hasattr(Produto, 'embeddings'):
            Produto.embeddings = relationship("EmbeddingProduto", back_populates="produto", cascade="all, delete-orphan")
        
        print("Relacionamentos de IA adicionados com sucesso")
    except Exception as e:
        print(f"Erro ao adicionar relacionamentos de IA: {str(e)}")

