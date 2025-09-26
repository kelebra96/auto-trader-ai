from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, DECIMAL, ForeignKey, Index
from sqlalchemy.dialects.postgresql import JSONB, ENUM
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from src.models.user import db
from datetime import datetime, timedelta
import enum

class StatusChamado(enum.Enum):
    """Status possíveis para chamados"""
    ABERTO = "aberto"
    EM_ANDAMENTO = "em_andamento"
    AGUARDANDO_CLIENTE = "aguardando_cliente"
    RESOLVIDO = "resolvido"
    FECHADO = "fechado"
    CANCELADO = "cancelado"

class PrioridadeChamado(enum.Enum):
    """Prioridades para chamados"""
    BAIXA = "baixa"
    NORMAL = "normal"
    ALTA = "alta"
    URGENTE = "urgente"
    CRITICA = "critica"

class CategoriaChamado(enum.Enum):
    """Categorias de chamados"""
    TECNICO = "tecnico"
    FINANCEIRO = "financeiro"
    FUNCIONALIDADE = "funcionalidade"
    BUG = "bug"
    DUVIDA = "duvida"
    SUGESTAO = "sugestao"
    OUTROS = "outros"

class Chamado(db.Model):
    """Tabela principal para chamados de suporte"""
    __tablename__ = 'chamados'
    
    id = Column(Integer, primary_key=True)
    numero = Column(String(20), unique=True, nullable=False)  # Formato: SUP-YYYYMMDD-XXXX
    empresa_id = Column(Integer, ForeignKey('empresas.id'), nullable=False)
    usuario_id = Column(Integer, ForeignKey('usuarios.id'), nullable=False)
    atendente_id = Column(Integer, ForeignKey('usuarios.id'))
    
    titulo = Column(String(200), nullable=False)
    descricao = Column(Text, nullable=False)
    categoria = Column(ENUM(CategoriaChamado), nullable=False, default=CategoriaChamado.DUVIDA)
    prioridade = Column(ENUM(PrioridadeChamado), nullable=False, default=PrioridadeChamado.NORMAL)
    status = Column(ENUM(StatusChamado), nullable=False, default=StatusChamado.ABERTO)
    
    # Controle de SLA
    sla_resposta_horas = Column(Integer, default=1)  # 1 hora padrão
    sla_resolucao_horas = Column(Integer, default=24)  # 24 horas padrão
    data_limite_resposta = Column(DateTime)
    data_limite_resolucao = Column(DateTime)
    primeira_resposta_em = Column(DateTime)
    resolvido_em = Column(DateTime)
    
    # Avaliação
    avaliacao_nota = Column(Integer)  # 1-5
    avaliacao_comentario = Column(Text)
    avaliado_em = Column(DateTime)
    
    # Metadados
    tags = Column(JSONB, default=[])
    metadados = Column(JSONB, default={})
    ip_origem = Column(String(45))
    user_agent = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    fechado_em = Column(DateTime)
    
    # Relacionamentos
    empresa = relationship("Empresa")
    usuario = relationship("Usuario", foreign_keys=[usuario_id], back_populates="chamados_abertos")
    atendente = relationship("Usuario", foreign_keys=[atendente_id], back_populates="chamados_atendidos")
    mensagens = relationship("MensagemChamado", back_populates="chamado", cascade="all, delete-orphan")
    anexos = relationship("AnexoChamado", back_populates="chamado", cascade="all, delete-orphan")
    historico = relationship("HistoricoChamado", back_populates="chamado", cascade="all, delete-orphan")
    
    # Índices
    __table_args__ = (
        Index('idx_chamados_empresa_status', 'empresa_id', 'status'),
        Index('idx_chamados_usuario', 'usuario_id'),
        Index('idx_chamados_atendente', 'atendente_id'),
        Index('idx_chamados_numero', 'numero'),
        Index('idx_chamados_prioridade', 'prioridade'),
        Index('idx_chamados_categoria', 'categoria'),
        Index('idx_chamados_sla_resposta', 'data_limite_resposta'),
        Index('idx_chamados_created_at', 'created_at'),
    )
    
    def __repr__(self):
        return f'<Chamado {self.numero}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'numero': self.numero,
            'empresa_id': self.empresa_id,
            'usuario_id': self.usuario_id,
            'atendente_id': self.atendente_id,
            'titulo': self.titulo,
            'descricao': self.descricao,
            'categoria': self.categoria.value if self.categoria else None,
            'prioridade': self.prioridade.value if self.prioridade else None,
            'status': self.status.value if self.status else None,
            'sla_resposta_horas': self.sla_resposta_horas,
            'sla_resolucao_horas': self.sla_resolucao_horas,
            'data_limite_resposta': self.data_limite_resposta.isoformat() if self.data_limite_resposta else None,
            'data_limite_resolucao': self.data_limite_resolucao.isoformat() if self.data_limite_resolucao else None,
            'primeira_resposta_em': self.primeira_resposta_em.isoformat() if self.primeira_resposta_em else None,
            'resolvido_em': self.resolvido_em.isoformat() if self.resolvido_em else None,
            'avaliacao_nota': self.avaliacao_nota,
            'avaliacao_comentario': self.avaliacao_comentario,
            'avaliado_em': self.avaliado_em.isoformat() if self.avaliado_em else None,
            'tags': self.tags,
            'metadados': self.metadados,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'fechado_em': self.fechado_em.isoformat() if self.fechado_em else None,
            'total_mensagens': len(self.mensagens),
            'total_anexos': len(self.anexos),
            'sla_resposta_vencido': self.is_sla_resposta_vencido(),
            'sla_resolucao_vencido': self.is_sla_resolucao_vencido(),
            'tempo_primeira_resposta': self.get_tempo_primeira_resposta(),
            'tempo_resolucao': self.get_tempo_resolucao()
        }
    
    def to_dict_with_relations(self):
        """Retorna dict com dados dos relacionamentos"""
        data = self.to_dict()
        
        if self.usuario:
            data['usuario'] = {
                'id': self.usuario.id,
                'nome': self.usuario.nome,
                'email': self.usuario.email
            }
        
        if self.atendente:
            data['atendente'] = {
                'id': self.atendente.id,
                'nome': self.atendente.nome,
                'email': self.atendente.email
            }
        
        if self.empresa:
            data['empresa'] = {
                'id': self.empresa.id,
                'nome': self.empresa.nome_fantasia or self.empresa.razao_social
            }
        
        return data
    
    @classmethod
    def generate_numero(cls):
        """Gera número único para o chamado"""
        hoje = datetime.now()
        prefix = f"SUP-{hoje.strftime('%Y%m%d')}"
        
        # Buscar último número do dia
        ultimo_chamado = cls.query.filter(
            cls.numero.like(f"{prefix}-%")
        ).order_by(cls.numero.desc()).first()
        
        if ultimo_chamado:
            # Extrair sequencial do último número
            try:
                ultimo_seq = int(ultimo_chamado.numero.split('-')[-1])
                novo_seq = ultimo_seq + 1
            except (ValueError, IndexError):
                novo_seq = 1
        else:
            novo_seq = 1
        
        return f"{prefix}-{novo_seq:04d}"
    
    def calcular_sla(self):
        """Calcula datas limite de SLA"""
        if not self.created_at:
            return
        
        # Calcular data limite de resposta
        if self.sla_resposta_horas:
            self.data_limite_resposta = self.created_at + timedelta(hours=self.sla_resposta_horas)
        
        # Calcular data limite de resolução
        if self.sla_resolucao_horas:
            self.data_limite_resolucao = self.created_at + timedelta(hours=self.sla_resolucao_horas)
    
    def is_sla_resposta_vencido(self):
        """Verifica se SLA de resposta está vencido"""
        if not self.data_limite_resposta or self.primeira_resposta_em:
            return False
        return datetime.now() > self.data_limite_resposta
    
    def is_sla_resolucao_vencido(self):
        """Verifica se SLA de resolução está vencido"""
        if not self.data_limite_resolucao or self.resolvido_em:
            return False
        return datetime.now() > self.data_limite_resolucao
    
    def get_tempo_primeira_resposta(self):
        """Retorna tempo até primeira resposta em minutos"""
        if not self.primeira_resposta_em or not self.created_at:
            return None
        
        delta = self.primeira_resposta_em - self.created_at
        return int(delta.total_seconds() / 60)
    
    def get_tempo_resolucao(self):
        """Retorna tempo de resolução em minutos"""
        if not self.resolvido_em or not self.created_at:
            return None
        
        delta = self.resolvido_em - self.created_at
        return int(delta.total_seconds() / 60)
    
    def marcar_primeira_resposta(self):
        """Marca primeira resposta se ainda não foi marcada"""
        if not self.primeira_resposta_em:
            self.primeira_resposta_em = datetime.now()
    
    def resolver(self, atendente_id=None):
        """Marca chamado como resolvido"""
        self.status = StatusChamado.RESOLVIDO
        self.resolvido_em = datetime.now()
        if atendente_id:
            self.atendente_id = atendente_id
    
    def fechar(self):
        """Fecha o chamado"""
        self.status = StatusChamado.FECHADO
        self.fechado_em = datetime.now()
    
    def avaliar(self, nota, comentario=None):
        """Adiciona avaliação ao chamado"""
        if 1 <= nota <= 5:
            self.avaliacao_nota = nota
            self.avaliacao_comentario = comentario
            self.avaliado_em = datetime.now()
    
    def get_sla_status(self):
        """Retorna status do SLA"""
        now = datetime.now()
        
        if self.status in [StatusChamado.RESOLVIDO, StatusChamado.FECHADO]:
            # Chamado finalizado - verificar se cumpriu SLA
            resposta_ok = not self.primeira_resposta_em or (
                self.data_limite_resposta and self.primeira_resposta_em <= self.data_limite_resposta
            )
            resolucao_ok = not self.resolvido_em or (
                self.data_limite_resolucao and self.resolvido_em <= self.data_limite_resolucao
            )
            
            if resposta_ok and resolucao_ok:
                return 'cumprido'
            else:
                return 'violado'
        else:
            # Chamado em aberto - verificar status atual
            if self.is_sla_resposta_vencido() or self.is_sla_resolucao_vencido():
                return 'vencido'
            elif (self.data_limite_resposta and now >= self.data_limite_resposta - timedelta(minutes=30)) or \
                 (self.data_limite_resolucao and now >= self.data_limite_resolucao - timedelta(hours=2)):
                return 'alerta'
            else:
                return 'normal'

class MensagemChamado(db.Model):
    """Mensagens/respostas dos chamados"""
    __tablename__ = 'mensagens_chamados'
    
    id = Column(Integer, primary_key=True)
    chamado_id = Column(Integer, ForeignKey('chamados.id', ondelete='CASCADE'), nullable=False)
    usuario_id = Column(Integer, ForeignKey('usuarios.id'), nullable=False)
    
    conteudo = Column(Text, nullable=False)
    tipo = Column(String(20), default='resposta')  # resposta, nota_interna, sistema
    visivel_cliente = Column(Boolean, default=True)
    
    # Metadados
    ip_origem = Column(String(45))
    user_agent = Column(Text)
    
    created_at = Column(DateTime, default=func.now())
    
    # Relacionamentos
    chamado = relationship("Chamado", back_populates="mensagens")
    usuario = relationship("Usuario")
    anexos = relationship("AnexoMensagem", back_populates="mensagem", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f'<MensagemChamado {self.chamado_id} - {self.usuario_id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'chamado_id': self.chamado_id,
            'usuario_id': self.usuario_id,
            'conteudo': self.conteudo,
            'tipo': self.tipo,
            'visivel_cliente': self.visivel_cliente,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'total_anexos': len(self.anexos)
        }
    
    def to_dict_with_user(self):
        """Retorna dict com dados do usuário"""
        data = self.to_dict()
        
        if self.usuario:
            data['usuario'] = {
                'id': self.usuario.id,
                'nome': self.usuario.nome,
                'email': self.usuario.email,
                'perfil': self.usuario.perfil
            }
        
        return data

class AnexoChamado(db.Model):
    """Anexos dos chamados"""
    __tablename__ = 'anexos_chamados'
    
    id = Column(Integer, primary_key=True)
    chamado_id = Column(Integer, ForeignKey('chamados.id', ondelete='CASCADE'), nullable=False)
    usuario_id = Column(Integer, ForeignKey('usuarios.id'), nullable=False)
    
    nome_arquivo = Column(String(255), nullable=False)
    nome_original = Column(String(255), nullable=False)
    tipo_mime = Column(String(100))
    tamanho = Column(Integer)
    caminho = Column(String(500), nullable=False)
    
    created_at = Column(DateTime, default=func.now())
    
    # Relacionamentos
    chamado = relationship("Chamado", back_populates="anexos")
    usuario = relationship("Usuario")
    
    def __repr__(self):
        return f'<AnexoChamado {self.nome_original}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'chamado_id': self.chamado_id,
            'usuario_id': self.usuario_id,
            'nome_arquivo': self.nome_arquivo,
            'nome_original': self.nome_original,
            'tipo_mime': self.tipo_mime,
            'tamanho': self.tamanho,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class AnexoMensagem(db.Model):
    """Anexos das mensagens"""
    __tablename__ = 'anexos_mensagens'
    
    id = Column(Integer, primary_key=True)
    mensagem_id = Column(Integer, ForeignKey('mensagens_chamados.id', ondelete='CASCADE'), nullable=False)
    usuario_id = Column(Integer, ForeignKey('usuarios.id'), nullable=False)
    
    nome_arquivo = Column(String(255), nullable=False)
    nome_original = Column(String(255), nullable=False)
    tipo_mime = Column(String(100))
    tamanho = Column(Integer)
    caminho = Column(String(500), nullable=False)
    
    created_at = Column(DateTime, default=func.now())
    
    # Relacionamentos
    mensagem = relationship("MensagemChamado", back_populates="anexos")
    usuario = relationship("Usuario")
    
    def to_dict(self):
        return {
            'id': self.id,
            'mensagem_id': self.mensagem_id,
            'usuario_id': self.usuario_id,
            'nome_arquivo': self.nome_arquivo,
            'nome_original': self.nome_original,
            'tipo_mime': self.tipo_mime,
            'tamanho': self.tamanho,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class HistoricoChamado(db.Model):
    """Histórico de alterações dos chamados"""
    __tablename__ = 'historico_chamados'
    
    id = Column(Integer, primary_key=True)
    chamado_id = Column(Integer, ForeignKey('chamados.id', ondelete='CASCADE'), nullable=False)
    usuario_id = Column(Integer, ForeignKey('usuarios.id'))
    
    acao = Column(String(50), nullable=False)
    campo_alterado = Column(String(50))
    valor_anterior = Column(Text)
    valor_novo = Column(Text)
    observacao = Column(Text)
    
    created_at = Column(DateTime, default=func.now())
    
    # Relacionamentos
    chamado = relationship("Chamado", back_populates="historico")
    usuario = relationship("Usuario")
    
    def __repr__(self):
        return f'<HistoricoChamado {self.acao} - {self.chamado_id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'chamado_id': self.chamado_id,
            'usuario_id': self.usuario_id,
            'acao': self.acao,
            'campo_alterado': self.campo_alterado,
            'valor_anterior': self.valor_anterior,
            'valor_novo': self.valor_novo,
            'observacao': self.observacao,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    @classmethod
    def registrar_alteracao(cls, chamado_id, usuario_id, acao, campo_alterado=None, 
                          valor_anterior=None, valor_novo=None, observacao=None):
        """Registra alteração no histórico"""
        historico = cls(
            chamado_id=chamado_id,
            usuario_id=usuario_id,
            acao=acao,
            campo_alterado=campo_alterado,
            valor_anterior=str(valor_anterior) if valor_anterior is not None else None,
            valor_novo=str(valor_novo) if valor_novo is not None else None,
            observacao=observacao
        )
        
        db.session.add(historico)
        return historico

class ConfiguracaoSuporte(db.Model):
    """Configurações do sistema de suporte"""
    __tablename__ = 'configuracoes_suporte'
    
    id = Column(Integer, primary_key=True)
    chave = Column(String(100), unique=True, nullable=False)
    valor = Column(JSONB, nullable=False)
    descricao = Column(Text)
    editavel = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    def to_dict(self):
        return {
            'id': self.id,
            'chave': self.chave,
            'valor': self.valor,
            'descricao': self.descricao,
            'editavel': self.editavel,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def get_config(cls, chave, default=None):
        """Obtém configuração"""
        config = cls.query.filter_by(chave=chave).first()
        return config.valor if config else default
    
    @classmethod
    def set_config(cls, chave, valor, descricao=None):
        """Define configuração"""
        config = cls.query.filter_by(chave=chave).first()
        
        if config:
            config.valor = valor
            config.updated_at = datetime.now()
            if descricao:
                config.descricao = descricao
        else:
            config = cls(
                chave=chave,
                valor=valor,
                descricao=descricao
            )
            db.session.add(config)
        
        return config
    
    @classmethod
    def init_default_configs(cls):
        """Inicializa configurações padrão"""
        default_configs = [
            {
                'chave': 'sla_resposta_horas_padrao',
                'valor': 1,
                'descricao': 'SLA padrão para primeira resposta (horas)'
            },
            {
                'chave': 'sla_resolucao_horas_padrao',
                'valor': 24,
                'descricao': 'SLA padrão para resolução (horas)'
            },
            {
                'chave': 'email_notificacoes_ativo',
                'valor': True,
                'descricao': 'Ativar notificações por email'
            },
            {
                'chave': 'auto_assign_atendentes',
                'valor': True,
                'descricao': 'Atribuir automaticamente atendentes'
            },
            {
                'chave': 'permitir_anexos',
                'valor': True,
                'descricao': 'Permitir anexos nos chamados'
            },
            {
                'chave': 'tamanho_maximo_anexo_mb',
                'valor': 10,
                'descricao': 'Tamanho máximo de anexo em MB'
            }
        ]
        
        for config_data in default_configs:
            existing = cls.query.filter_by(chave=config_data['chave']).first()
            if not existing:
                config = cls(**config_data)
                db.session.add(config)
        
        db.session.commit()

# Adicionar relacionamentos aos modelos existentes
def add_support_relationships():
    """Adiciona relacionamentos de suporte aos modelos existentes"""
    try:
        from src.models.user import Usuario
        
        # Adicionar relacionamentos ao Usuario
        if not hasattr(Usuario, 'chamados_abertos'):
            Usuario.chamados_abertos = relationship(
                "Chamado", 
                foreign_keys="Chamado.usuario_id", 
                back_populates="usuario"
            )
        
        if not hasattr(Usuario, 'chamados_atendidos'):
            Usuario.chamados_atendidos = relationship(
                "Chamado", 
                foreign_keys="Chamado.atendente_id", 
                back_populates="atendente"
            )
        
        print("Relacionamentos de suporte adicionados com sucesso")
    except Exception as e:
        print(f"Erro ao adicionar relacionamentos de suporte: {str(e)}")

# Função para inicializar sistema de suporte
def init_support_system():
    """Inicializa sistema de suporte"""
    try:
        # Criar configurações padrão
        ConfiguracaoSuporte.init_default_configs()
        
        # Adicionar relacionamentos
        add_support_relationships()
        
        print("Sistema de suporte inicializado com sucesso")
    except Exception as e:
        print(f"Erro ao inicializar sistema de suporte: {str(e)}")

