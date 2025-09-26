from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from src.models.user import db

class Loja(db.Model):
    __tablename__ = 'lojas'
    
    id = Column(Integer, primary_key=True)
    empresa_id = Column(Integer, ForeignKey('empresas.id'), nullable=False)
    numero_loja = Column(String(10), nullable=False)
    razao_social = Column(String(200))
    nome_loja = Column(String(200), nullable=False)
    codigo_gerente = Column(String(20))
    codigo_fiscal_prevencao = Column(String(50))
    endereco = Column(JSONB)
    telefone = Column(String(20))
    email = Column(String(120))
    status = Column(String(20), default='ativa')
    configuracoes = Column(JSONB, default={})
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relacionamentos
    empresa = relationship("Empresa", back_populates="lojas")
    produtos = relationship("Produto", back_populates="loja")
    
    # Constraint única
    __table_args__ = (
        db.UniqueConstraint('empresa_id', 'numero_loja', name='uq_empresa_numero_loja'),
    )
    
    def __repr__(self):
        return f'<Loja {self.numero_loja} - {self.nome_loja}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'empresa_id': self.empresa_id,
            'numero_loja': self.numero_loja,
            'razao_social': self.razao_social,
            'nome_loja': self.nome_loja,
            'codigo_gerente': self.codigo_gerente,
            'codigo_fiscal_prevencao': self.codigo_fiscal_prevencao,
            'endereco': self.endereco,
            'telefone': self.telefone,
            'email': self.email,
            'status': self.status,
            'configuracoes': self.configuracoes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def is_active(self):
        """Verifica se a loja está ativa"""
        return self.status == 'ativa'
    
    def get_produtos_count(self):
        """Retorna a quantidade de produtos da loja"""
        return len([p for p in self.produtos if p.status == 'ativo'])
    
    def get_produtos_vencendo(self, dias=7):
        """Retorna produtos que vencem em X dias"""
        from datetime import date, timedelta
        data_limite = date.today() + timedelta(days=dias)
        
        return [p for p in self.produtos 
                if p.status == 'ativo' and p.data_validade and p.data_validade <= data_limite]
    
    def get_valor_estoque(self):
        """Calcula o valor total do estoque da loja"""
        total = 0
        for produto in self.produtos:
            if produto.status == 'ativo' and produto.preco_venda and produto.estoque_atual:
                total += float(produto.preco_venda) * produto.estoque_atual
        return total
    
    def get_endereco_completo(self):
        """Retorna o endereço formatado"""
        if not self.endereco:
            return None
        
        endereco_parts = []
        if self.endereco.get('rua'):
            endereco_parts.append(self.endereco['rua'])
        if self.endereco.get('numero'):
            endereco_parts.append(f"nº {self.endereco['numero']}")
        if self.endereco.get('bairro'):
            endereco_parts.append(self.endereco['bairro'])
        if self.endereco.get('cidade'):
            endereco_parts.append(self.endereco['cidade'])
        if self.endereco.get('estado'):
            endereco_parts.append(self.endereco['estado'])
        if self.endereco.get('cep'):
            endereco_parts.append(f"CEP: {self.endereco['cep']}")
        
        return ', '.join(endereco_parts) if endereco_parts else None

class Fornecedor(db.Model):
    __tablename__ = 'fornecedores'
    
    id = Column(Integer, primary_key=True)
    empresa_id = Column(Integer, ForeignKey('empresas.id'), nullable=False)
    cnpj = Column(String(18), unique=True, nullable=False)
    nome = Column(String(200), nullable=False)
    razao_social = Column(String(200))
    codigo_fornecedor = Column(String(50))
    email = Column(String(120))
    telefone = Column(String(20))
    endereco = Column(JSONB)
    contato_principal = Column(String(200))
    condicoes_pagamento = Column(JSONB)
    status = Column(String(20), default='ativo')
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relacionamentos
    empresa = relationship("Empresa", back_populates="fornecedores")
    produtos = relationship("Produto", back_populates="fornecedor")
    
    def __repr__(self):
        return f'<Fornecedor {self.nome}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'empresa_id': self.empresa_id,
            'cnpj': self.cnpj,
            'nome': self.nome,
            'razao_social': self.razao_social,
            'codigo_fornecedor': self.codigo_fornecedor,
            'email': self.email,
            'telefone': self.telefone,
            'endereco': self.endereco,
            'contato_principal': self.contato_principal,
            'condicoes_pagamento': self.condicoes_pagamento,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def is_active(self):
        """Verifica se o fornecedor está ativo"""
        return self.status == 'ativo'
    
    def get_produtos_count(self):
        """Retorna a quantidade de produtos do fornecedor"""
        return len([p for p in self.produtos if p.status == 'ativo'])
    
    def get_valor_total_produtos(self):
        """Calcula o valor total dos produtos do fornecedor"""
        total = 0
        for produto in self.produtos:
            if produto.status == 'ativo' and produto.preco_custo and produto.estoque_atual:
                total += float(produto.preco_custo) * produto.estoque_atual
        return total
    
    def format_cnpj(self):
        """Formata o CNPJ para exibição"""
        if not self.cnpj or len(self.cnpj) != 14:
            return self.cnpj
        
        return f"{self.cnpj[:2]}.{self.cnpj[2:5]}.{self.cnpj[5:8]}/{self.cnpj[8:12]}-{self.cnpj[12:]}"
    
    def get_endereco_completo(self):
        """Retorna o endereço formatado"""
        if not self.endereco:
            return None
        
        endereco_parts = []
        if self.endereco.get('rua'):
            endereco_parts.append(self.endereco['rua'])
        if self.endereco.get('numero'):
            endereco_parts.append(f"nº {self.endereco['numero']}")
        if self.endereco.get('bairro'):
            endereco_parts.append(self.endereco['bairro'])
        if self.endereco.get('cidade'):
            endereco_parts.append(self.endereco['cidade'])
        if self.endereco.get('estado'):
            endereco_parts.append(self.endereco['estado'])
        if self.endereco.get('cep'):
            endereco_parts.append(f"CEP: {self.endereco['cep']}")
        
        return ', '.join(endereco_parts) if endereco_parts else None

class Setor(db.Model):
    __tablename__ = 'setores'
    
    id = Column(Integer, primary_key=True)
    empresa_id = Column(Integer, ForeignKey('empresas.id'), nullable=False)
    nome = Column(String(100), nullable=False)
    descricao = Column(Text)
    codigo = Column(String(20))
    status = Column(String(20), default='ativo')
    created_at = Column(DateTime, default=func.now())
    
    # Relacionamentos
    empresa = relationship("Empresa")
    categorias = relationship("Categoria", back_populates="setor", cascade="all, delete-orphan")
    produtos = relationship("Produto", back_populates="setor")
    
    def __repr__(self):
        return f'<Setor {self.nome}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'empresa_id': self.empresa_id,
            'nome': self.nome,
            'descricao': self.descricao,
            'codigo': self.codigo,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def is_active(self):
        """Verifica se o setor está ativo"""
        return self.status == 'ativo'
    
    def get_categorias_count(self):
        """Retorna a quantidade de categorias do setor"""
        return len([c for c in self.categorias if c.status == 'ativo'])
    
    def get_produtos_count(self):
        """Retorna a quantidade de produtos do setor"""
        return len([p for p in self.produtos if p.status == 'ativo'])

class Categoria(db.Model):
    __tablename__ = 'categorias'
    
    id = Column(Integer, primary_key=True)
    empresa_id = Column(Integer, ForeignKey('empresas.id'), nullable=False)
    setor_id = Column(Integer, ForeignKey('setores.id'))
    nome = Column(String(100), nullable=False)
    descricao = Column(Text)
    codigo = Column(String(20))
    margem_padrao = Column(db.DECIMAL(5, 2))
    status = Column(String(20), default='ativo')
    created_at = Column(DateTime, default=func.now())
    
    # Relacionamentos
    empresa = relationship("Empresa")
    setor = relationship("Setor", back_populates="categorias")
    produtos = relationship("Produto", back_populates="categoria")
    
    def __repr__(self):
        return f'<Categoria {self.nome}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'empresa_id': self.empresa_id,
            'setor_id': self.setor_id,
            'nome': self.nome,
            'descricao': self.descricao,
            'codigo': self.codigo,
            'margem_padrao': float(self.margem_padrao) if self.margem_padrao else None,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def is_active(self):
        """Verifica se a categoria está ativa"""
        return self.status == 'ativo'
    
    def get_produtos_count(self):
        """Retorna a quantidade de produtos da categoria"""
        return len([p for p in self.produtos if p.status == 'ativo'])
    
    def calcular_preco_sugerido(self, preco_custo):
        """Calcula preço de venda sugerido baseado na margem padrão"""
        if not self.margem_padrao or not preco_custo:
            return None
        
        margem_decimal = float(self.margem_padrao) / 100
        return float(preco_custo) * (1 + margem_decimal)

