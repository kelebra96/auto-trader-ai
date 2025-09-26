from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey, Index
from sqlalchemy.dialects.postgresql import JSONB, INET
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from src.models.user import db
from datetime import datetime, timedelta

class LogAuditoria(db.Model):
    """Tabela para logs de auditoria do sistema"""
    __tablename__ = 'logs_auditoria'
    
    id = Column(Integer, primary_key=True)
    empresa_id = Column(Integer, ForeignKey('empresas.id'))
    usuario_id = Column(Integer, ForeignKey('usuarios.id'))
    acao = Column(String(100), nullable=False)
    tabela_afetada = Column(String(50))
    registro_id = Column(Integer)
    dados_anteriores = Column(JSONB)
    dados_novos = Column(JSONB)
    ip_address = Column(INET)
    user_agent = Column(Text)
    endpoint = Column(String(200))
    metodo_http = Column(String(10))
    status_code = Column(Integer)
    tempo_execucao = Column(Integer)  # em milissegundos
    sessao_id = Column(String(100))
    nivel = Column(String(20), default='info')  # debug, info, warning, error, critical
    categoria = Column(String(50))  # auth, crud, payment, system, etc.
    created_at = Column(DateTime, default=func.now())
    
    # Relacionamentos
    empresa = relationship("Empresa")
    usuario = relationship("Usuario")
    
    # Índices para performance
    __table_args__ = (
        Index('idx_logs_empresa_data', 'empresa_id', 'created_at'),
        Index('idx_logs_usuario_data', 'usuario_id', 'created_at'),
        Index('idx_logs_acao', 'acao'),
        Index('idx_logs_categoria', 'categoria'),
        Index('idx_logs_nivel', 'nivel'),
        Index('idx_logs_ip', 'ip_address'),
        Index('idx_logs_created_at', 'created_at'),
    )
    
    def __repr__(self):
        return f'<LogAuditoria {self.acao} - {self.usuario_id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'empresa_id': self.empresa_id,
            'usuario_id': self.usuario_id,
            'acao': self.acao,
            'tabela_afetada': self.tabela_afetada,
            'registro_id': self.registro_id,
            'dados_anteriores': self.dados_anteriores,
            'dados_novos': self.dados_novos,
            'ip_address': str(self.ip_address) if self.ip_address else None,
            'user_agent': self.user_agent,
            'endpoint': self.endpoint,
            'metodo_http': self.metodo_http,
            'status_code': self.status_code,
            'tempo_execucao': self.tempo_execucao,
            'sessao_id': self.sessao_id,
            'nivel': self.nivel,
            'categoria': self.categoria,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    @classmethod
    def log_action(cls, acao, empresa_id=None, usuario_id=None, **kwargs):
        """Método helper para criar logs de auditoria"""
        log = cls(
            acao=acao,
            empresa_id=empresa_id,
            usuario_id=usuario_id,
            **kwargs
        )
        db.session.add(log)
        return log
    
    @classmethod
    def log_crud_operation(cls, operation, table_name, record_id, old_data=None, new_data=None, **kwargs):
        """Log específico para operações CRUD"""
        return cls.log_action(
            acao=f"{operation}_{table_name}",
            tabela_afetada=table_name,
            registro_id=record_id,
            dados_anteriores=old_data,
            dados_novos=new_data,
            categoria='crud',
            **kwargs
        )
    
    @classmethod
    def log_auth_event(cls, event_type, usuario_id=None, success=True, **kwargs):
        """Log específico para eventos de autenticação"""
        nivel = 'info' if success else 'warning'
        return cls.log_action(
            acao=f"auth_{event_type}",
            usuario_id=usuario_id,
            categoria='auth',
            nivel=nivel,
            **kwargs
        )
    
    @classmethod
    def log_payment_event(cls, event_type, empresa_id, payment_data=None, **kwargs):
        """Log específico para eventos de pagamento"""
        return cls.log_action(
            acao=f"payment_{event_type}",
            empresa_id=empresa_id,
            dados_novos=payment_data,
            categoria='payment',
            nivel='info',
            **kwargs
        )
    
    @classmethod
    def log_system_event(cls, event_type, details=None, nivel='info', **kwargs):
        """Log específico para eventos do sistema"""
        return cls.log_action(
            acao=f"system_{event_type}",
            dados_novos=details,
            categoria='system',
            nivel=nivel,
            **kwargs
        )
    
    @classmethod
    def cleanup_old_logs(cls, days_to_keep=30):
        """Remove logs antigos baseado na configuração"""
        cutoff_date = datetime.now() - timedelta(days=days_to_keep)
        
        deleted_count = cls.query.filter(
            cls.created_at < cutoff_date
        ).delete()
        
        db.session.commit()
        return deleted_count

class SessaoUsuario(db.Model):
    """Tabela para controle de sessões de usuário"""
    __tablename__ = 'sessoes_usuarios'
    
    id = Column(Integer, primary_key=True)
    usuario_id = Column(Integer, ForeignKey('usuarios.id', ondelete='CASCADE'), nullable=False)
    token_jti = Column(String(100), unique=True, nullable=False)  # JWT ID
    token_access = Column(Text, nullable=False)
    token_refresh = Column(Text)
    ip_address = Column(INET)
    user_agent = Column(Text)
    dispositivo = Column(String(100))
    localizacao = Column(JSONB)
    expires_at = Column(DateTime, nullable=False)
    refresh_expires_at = Column(DateTime)
    ativo = Column(Boolean, default=True)
    ultimo_acesso = Column(DateTime, default=func.now())
    created_at = Column(DateTime, default=func.now())
    revogado_em = Column(DateTime)
    motivo_revogacao = Column(String(100))
    
    # Relacionamentos
    usuario = relationship("Usuario", back_populates="sessoes")
    
    # Índices
    __table_args__ = (
        Index('idx_sessoes_usuario_ativo', 'usuario_id', 'ativo'),
        Index('idx_sessoes_token_jti', 'token_jti'),
        Index('idx_sessoes_expires_at', 'expires_at'),
        Index('idx_sessoes_ip', 'ip_address'),
    )
    
    def __repr__(self):
        return f'<SessaoUsuario {self.usuario_id} - {self.token_jti[:8]}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'usuario_id': self.usuario_id,
            'token_jti': self.token_jti,
            'ip_address': str(self.ip_address) if self.ip_address else None,
            'user_agent': self.user_agent,
            'dispositivo': self.dispositivo,
            'localizacao': self.localizacao,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'refresh_expires_at': self.refresh_expires_at.isoformat() if self.refresh_expires_at else None,
            'ativo': self.ativo,
            'ultimo_acesso': self.ultimo_acesso.isoformat() if self.ultimo_acesso else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'revogado_em': self.revogado_em.isoformat() if self.revogado_em else None,
            'motivo_revogacao': self.motivo_revogacao
        }
    
    def is_valid(self):
        """Verifica se a sessão ainda é válida"""
        if not self.ativo:
            return False
        
        if self.expires_at and datetime.now() > self.expires_at:
            return False
        
        return True
    
    def revoke(self, motivo='logout'):
        """Revoga a sessão"""
        self.ativo = False
        self.revogado_em = datetime.now()
        self.motivo_revogacao = motivo
    
    def refresh_access(self):
        """Atualiza último acesso"""
        self.ultimo_acesso = datetime.now()
    
    @classmethod
    def cleanup_expired_sessions(cls):
        """Remove sessões expiradas"""
        now = datetime.now()
        
        # Marcar como inativas as sessões expiradas
        expired_count = cls.query.filter(
            cls.ativo == True,
            cls.expires_at < now
        ).update({
            'ativo': False,
            'revogado_em': now,
            'motivo_revogacao': 'expired'
        })
        
        # Remover sessões muito antigas (mais de 90 dias)
        old_cutoff = now - timedelta(days=90)
        deleted_count = cls.query.filter(
            cls.created_at < old_cutoff
        ).delete()
        
        db.session.commit()
        return {'expired': expired_count, 'deleted': deleted_count}
    
    @classmethod
    def revoke_all_user_sessions(cls, usuario_id, except_jti=None, motivo='security'):
        """Revoga todas as sessões de um usuário"""
        query = cls.query.filter_by(usuario_id=usuario_id, ativo=True)
        
        if except_jti:
            query = query.filter(cls.token_jti != except_jti)
        
        revoked_count = query.update({
            'ativo': False,
            'revogado_em': datetime.now(),
            'motivo_revogacao': motivo
        })
        
        db.session.commit()
        return revoked_count

class TentativaLogin(db.Model):
    """Tabela para rastrear tentativas de login"""
    __tablename__ = 'tentativas_login'
    
    id = Column(Integer, primary_key=True)
    email = Column(String(120), nullable=False)
    ip_address = Column(INET, nullable=False)
    user_agent = Column(Text)
    sucesso = Column(Boolean, nullable=False)
    motivo_falha = Column(String(100))
    usuario_id = Column(Integer, ForeignKey('usuarios.id'))
    bloqueado_ate = Column(DateTime)
    created_at = Column(DateTime, default=func.now())
    
    # Relacionamentos
    usuario = relationship("Usuario")
    
    # Índices
    __table_args__ = (
        Index('idx_tentativas_email_ip', 'email', 'ip_address'),
        Index('idx_tentativas_ip_data', 'ip_address', 'created_at'),
        Index('idx_tentativas_email_data', 'email', 'created_at'),
    )
    
    def __repr__(self):
        return f'<TentativaLogin {self.email} - {"✓" if self.sucesso else "✗"}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'ip_address': str(self.ip_address) if self.ip_address else None,
            'user_agent': self.user_agent,
            'sucesso': self.sucesso,
            'motivo_falha': self.motivo_falha,
            'usuario_id': self.usuario_id,
            'bloqueado_ate': self.bloqueado_ate.isoformat() if self.bloqueado_ate else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    @classmethod
    def record_attempt(cls, email, ip_address, success, user_agent=None, motivo_falha=None, usuario_id=None):
        """Registra uma tentativa de login"""
        tentativa = cls(
            email=email,
            ip_address=ip_address,
            user_agent=user_agent,
            sucesso=success,
            motivo_falha=motivo_falha,
            usuario_id=usuario_id
        )
        
        db.session.add(tentativa)
        return tentativa
    
    @classmethod
    def get_failed_attempts_count(cls, email=None, ip_address=None, hours=1):
        """Conta tentativas falhadas recentes"""
        cutoff_time = datetime.now() - timedelta(hours=hours)
        
        query = cls.query.filter(
            cls.sucesso == False,
            cls.created_at >= cutoff_time
        )
        
        if email:
            query = query.filter(cls.email == email)
        
        if ip_address:
            query = query.filter(cls.ip_address == ip_address)
        
        return query.count()
    
    @classmethod
    def is_blocked(cls, email=None, ip_address=None):
        """Verifica se email ou IP está bloqueado"""
        now = datetime.now()
        
        query = cls.query.filter(
            cls.bloqueado_ate.isnot(None),
            cls.bloqueado_ate > now
        )
        
        if email:
            query = query.filter(cls.email == email)
        
        if ip_address:
            query = query.filter(cls.ip_address == ip_address)
        
        return query.first() is not None
    
    @classmethod
    def cleanup_old_attempts(cls, days_to_keep=30):
        """Remove tentativas antigas"""
        cutoff_date = datetime.now() - timedelta(days=days_to_keep)
        
        deleted_count = cls.query.filter(
            cls.created_at < cutoff_date
        ).delete()
        
        db.session.commit()
        return deleted_count

class ConfiguracaoSistema(db.Model):
    """Tabela para configurações do sistema"""
    __tablename__ = 'configuracoes_sistema'
    
    id = Column(Integer, primary_key=True)
    chave = Column(String(100), unique=True, nullable=False)
    valor = Column(JSONB, nullable=False)
    descricao = Column(Text)
    categoria = Column(String(50))
    tipo_valor = Column(String(20))  # string, number, boolean, json
    valor_padrao = Column(JSONB)
    editavel = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f'<ConfiguracaoSistema {self.chave}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'chave': self.chave,
            'valor': self.valor,
            'descricao': self.descricao,
            'categoria': self.categoria,
            'tipo_valor': self.tipo_valor,
            'valor_padrao': self.valor_padrao,
            'editavel': self.editavel,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def get_config(cls, chave, default=None):
        """Obtém valor de configuração"""
        config = cls.query.filter_by(chave=chave).first()
        if config:
            return config.valor
        return default
    
    @classmethod
    def set_config(cls, chave, valor, descricao=None, categoria=None):
        """Define valor de configuração"""
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
                descricao=descricao,
                categoria=categoria
            )
            db.session.add(config)
        
        return config
    
    @classmethod
    def init_default_configs(cls):
        """Inicializa configurações padrão do sistema"""
        default_configs = [
            {
                'chave': 'max_login_attempts',
                'valor': 5,
                'descricao': 'Máximo de tentativas de login por hora',
                'categoria': 'security',
                'tipo_valor': 'number'
            },
            {
                'chave': 'session_timeout_hours',
                'valor': 24,
                'descricao': 'Tempo limite da sessão em horas',
                'categoria': 'security',
                'tipo_valor': 'number'
            },
            {
                'chave': 'password_min_length',
                'valor': 8,
                'descricao': 'Comprimento mínimo da senha',
                'categoria': 'security',
                'tipo_valor': 'number'
            },
            {
                'chave': 'log_retention_days',
                'valor': 30,
                'descricao': 'Dias para manter logs de auditoria',
                'categoria': 'system',
                'tipo_valor': 'number'
            },
            {
                'chave': 'enable_2fa',
                'valor': False,
                'descricao': 'Habilitar autenticação de dois fatores',
                'categoria': 'security',
                'tipo_valor': 'boolean'
            },
            {
                'chave': 'maintenance_mode',
                'valor': False,
                'descricao': 'Modo de manutenção ativo',
                'categoria': 'system',
                'tipo_valor': 'boolean'
            }
        ]
        
        for config_data in default_configs:
            existing = cls.query.filter_by(chave=config_data['chave']).first()
            if not existing:
                config = cls(**config_data)
                db.session.add(config)
        
        db.session.commit()

# Adicionar relacionamento de sessões ao modelo Usuario
def add_session_relationship():
    """Adiciona relacionamento de sessões ao modelo Usuario"""
    try:
        from src.models.user import Usuario
        if not hasattr(Usuario, 'sessoes'):
            Usuario.sessoes = relationship("SessaoUsuario", back_populates="usuario", cascade="all, delete-orphan")
        print("Relacionamento de sessões adicionado com sucesso")
    except Exception as e:
        print(f"Erro ao adicionar relacionamento de sessões: {str(e)}")

# Função para inicializar sistema de auditoria
def init_audit_system():
    """Inicializa sistema de auditoria"""
    try:
        # Criar configurações padrão
        ConfiguracaoSistema.init_default_configs()
        
        # Adicionar relacionamentos
        add_session_relationship()
        
        print("Sistema de auditoria inicializado com sucesso")
    except Exception as e:
        print(f"Erro ao inicializar sistema de auditoria: {str(e)}")

