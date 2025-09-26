from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, DECIMAL, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from src.models.user import db

class Empresa(db.Model):
    __tablename__ = 'empresas'
    
    id = Column(Integer, primary_key=True)
    razao_social = Column(String(200), nullable=False)
    nome_fantasia = Column(String(200))
    cnpj = Column(String(18), unique=True, nullable=False)
    email_corporativo = Column(String(120), nullable=False)
    telefone = Column(String(20))
    endereco = Column(JSONB)
    plano_id = Column(Integer, ForeignKey('planos.id'))
    status = Column(String(20), default='ativo')
    data_contratacao = Column(DateTime, default=func.now())
    data_vencimento = Column(DateTime)
    configuracoes = Column(JSONB, default={})
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relacionamentos
    usuarios = relationship("Usuario", back_populates="empresa", cascade="all, delete-orphan")
    lojas = relationship("Loja", back_populates="empresa", cascade="all, delete-orphan")
    fornecedores = relationship("Fornecedor", back_populates="empresa", cascade="all, delete-orphan")
    produtos = relationship("Produto", back_populates="empresa", cascade="all, delete-orphan")
    assinaturas = relationship("Assinatura", back_populates="empresa", cascade="all, delete-orphan")
    chamados = relationship("Chamado", back_populates="empresa", cascade="all, delete-orphan")
    plano = relationship("Plano", back_populates="empresas")
    
    def __repr__(self):
        return f'<Empresa {self.nome_fantasia or self.razao_social}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'razao_social': self.razao_social,
            'nome_fantasia': self.nome_fantasia,
            'cnpj': self.cnpj,
            'email_corporativo': self.email_corporativo,
            'telefone': self.telefone,
            'endereco': self.endereco,
            'plano_id': self.plano_id,
            'status': self.status,
            'data_contratacao': self.data_contratacao.isoformat() if self.data_contratacao else None,
            'data_vencimento': self.data_vencimento.isoformat() if self.data_vencimento else None,
            'configuracoes': self.configuracoes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def is_active(self):
        """Verifica se a empresa está ativa"""
        return self.status == 'ativo'
    
    def is_subscription_valid(self):
        """Verifica se a assinatura está válida"""
        if not self.data_vencimento:
            return False
        from datetime import datetime
        return datetime.now() <= self.data_vencimento
    
    def get_active_subscription(self):
        """Retorna a assinatura ativa da empresa"""
        return next((assinatura for assinatura in self.assinaturas 
                    if assinatura.status == 'ativa'), None)
    
    def can_access_feature(self, feature_name):
        """Verifica se a empresa pode acessar uma funcionalidade"""
        if not self.is_active() or not self.is_subscription_valid():
            return False
        
        subscription = self.get_active_subscription()
        if not subscription or not subscription.plano:
            return False
        
        funcionalidades = subscription.plano.funcionalidades or {}
        return funcionalidades.get(feature_name, False)
    
    def get_usage_limits(self):
        """Retorna os limites de uso da empresa"""
        subscription = self.get_active_subscription()
        if not subscription or not subscription.plano:
            return {
                'produtos': 0,
                'usuarios': 0,
                'lojas': 0
            }
        
        plano = subscription.plano
        return {
            'produtos': plano.limite_produtos,
            'usuarios': plano.limite_usuarios,
            'lojas': plano.limite_lojas
        }
    
    def check_usage_limits(self):
        """Verifica se a empresa está dentro dos limites de uso"""
        limits = self.get_usage_limits()
        current_usage = {
            'produtos': len([p for p in self.produtos if p.status == 'ativo']),
            'usuarios': len([u for u in self.usuarios if u.status == 'ativo']),
            'lojas': len([l for l in self.lojas if l.status == 'ativa'])
        }
        
        violations = []
        for resource, limit in limits.items():
            if limit > 0 and current_usage[resource] >= limit:
                violations.append({
                    'resource': resource,
                    'current': current_usage[resource],
                    'limit': limit
                })
        
        return {
            'within_limits': len(violations) == 0,
            'violations': violations,
            'current_usage': current_usage,
            'limits': limits
        }

class Plano(db.Model):
    __tablename__ = 'planos'
    
    id = Column(Integer, primary_key=True)
    nome = Column(String(100), nullable=False)
    descricao = Column(Text)
    preco_mensal = Column(DECIMAL(10, 2), nullable=False)
    preco_anual = Column(DECIMAL(10, 2))
    limite_produtos = Column(Integer)
    limite_usuarios = Column(Integer)
    limite_lojas = Column(Integer)
    funcionalidades = Column(JSONB, nullable=False)
    status = Column(String(20), default='ativo')
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relacionamentos
    empresas = relationship("Empresa", back_populates="plano")
    assinaturas = relationship("Assinatura", back_populates="plano")
    
    def __repr__(self):
        return f'<Plano {self.nome}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'descricao': self.descricao,
            'preco_mensal': float(self.preco_mensal) if self.preco_mensal else None,
            'preco_anual': float(self.preco_anual) if self.preco_anual else None,
            'limite_produtos': self.limite_produtos,
            'limite_usuarios': self.limite_usuarios,
            'limite_lojas': self.limite_lojas,
            'funcionalidades': self.funcionalidades,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def get_discount_percentage(self):
        """Calcula o desconto do plano anual"""
        if not self.preco_anual or not self.preco_mensal:
            return 0
        
        preco_mensal_anual = float(self.preco_mensal) * 12
        desconto = (preco_mensal_anual - float(self.preco_anual)) / preco_mensal_anual * 100
        return round(desconto, 2)

class Assinatura(db.Model):
    __tablename__ = 'assinaturas'
    
    id = Column(Integer, primary_key=True)
    empresa_id = Column(Integer, ForeignKey('empresas.id'), nullable=False)
    plano_id = Column(Integer, ForeignKey('planos.id'), nullable=False)
    status = Column(String(20), nullable=False)
    data_inicio = Column(DateTime, nullable=False)
    data_fim = Column(DateTime, nullable=False)
    data_cancelamento = Column(DateTime)
    motivo_cancelamento = Column(Text)
    valor_mensal = Column(DECIMAL(10, 2), nullable=False)
    desconto_percentual = Column(DECIMAL(5, 2), default=0)
    valor_final = Column(DECIMAL(10, 2), nullable=False)
    renovacao_automatica = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relacionamentos
    empresa = relationship("Empresa", back_populates="assinaturas")
    plano = relationship("Plano", back_populates="assinaturas")
    pagamentos = relationship("Pagamento", back_populates="assinatura", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f'<Assinatura {self.empresa.nome_fantasia} - {self.plano.nome}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'empresa_id': self.empresa_id,
            'plano_id': self.plano_id,
            'status': self.status,
            'data_inicio': self.data_inicio.isoformat() if self.data_inicio else None,
            'data_fim': self.data_fim.isoformat() if self.data_fim else None,
            'data_cancelamento': self.data_cancelamento.isoformat() if self.data_cancelamento else None,
            'motivo_cancelamento': self.motivo_cancelamento,
            'valor_mensal': float(self.valor_mensal) if self.valor_mensal else None,
            'desconto_percentual': float(self.desconto_percentual) if self.desconto_percentual else None,
            'valor_final': float(self.valor_final) if self.valor_final else None,
            'renovacao_automatica': self.renovacao_automatica,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def is_active(self):
        """Verifica se a assinatura está ativa"""
        return self.status == 'ativa'
    
    def is_expired(self):
        """Verifica se a assinatura está vencida"""
        from datetime import datetime
        return datetime.now() > self.data_fim
    
    def days_until_expiry(self):
        """Retorna quantos dias faltam para vencer"""
        from datetime import datetime
        if self.is_expired():
            return 0
        
        delta = self.data_fim - datetime.now()
        return delta.days
    
    def cancel(self, motivo=None):
        """Cancela a assinatura"""
        from datetime import datetime
        self.status = 'cancelada'
        self.data_cancelamento = datetime.now()
        self.motivo_cancelamento = motivo
        self.renovacao_automatica = False

class Pagamento(db.Model):
    __tablename__ = 'pagamentos'
    
    id = Column(Integer, primary_key=True)
    assinatura_id = Column(Integer, ForeignKey('assinaturas.id'))
    empresa_id = Column(Integer, ForeignKey('empresas.id'))
    valor = Column(DECIMAL(10, 2), nullable=False)
    metodo_pagamento = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False)
    gateway_pagamento = Column(String(50), default='mercadopago')
    transaction_id = Column(String(100))
    gateway_response = Column(JSONB)
    data_vencimento = Column(DateTime)
    data_pagamento = Column(DateTime)
    tentativas = Column(Integer, default=0)
    observacoes = Column(Text)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relacionamentos
    assinatura = relationship("Assinatura", back_populates="pagamentos")
    empresa = relationship("Empresa")
    
    def __repr__(self):
        return f'<Pagamento {self.id} - {self.status}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'assinatura_id': self.assinatura_id,
            'empresa_id': self.empresa_id,
            'valor': float(self.valor) if self.valor else None,
            'metodo_pagamento': self.metodo_pagamento,
            'status': self.status,
            'gateway_pagamento': self.gateway_pagamento,
            'transaction_id': self.transaction_id,
            'gateway_response': self.gateway_response,
            'data_vencimento': self.data_vencimento.isoformat() if self.data_vencimento else None,
            'data_pagamento': self.data_pagamento.isoformat() if self.data_pagamento else None,
            'tentativas': self.tentativas,
            'observacoes': self.observacoes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def is_paid(self):
        """Verifica se o pagamento foi aprovado"""
        return self.status == 'aprovado'
    
    def is_pending(self):
        """Verifica se o pagamento está pendente"""
        return self.status in ['pendente', 'processando']
    
    def is_failed(self):
        """Verifica se o pagamento falhou"""
        return self.status in ['rejeitado', 'cancelado']

