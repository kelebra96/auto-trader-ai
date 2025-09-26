from src import db
import uuid
from datetime import datetime

class InventarioConfiguracao(db.Model):
    __tablename__ = 'inventario_configuracoes'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    produto_id = db.Column(db.String(36), db.ForeignKey('produtos.id'), nullable=False)
    loja_id = db.Column(db.String(36), db.ForeignKey('lojas.id'), nullable=False)
    estoque_minimo = db.Column(db.Numeric(10, 2), default=0.00)
    estoque_maximo = db.Column(db.Numeric(10, 2), nullable=True)
    ponto_reposicao = db.Column(db.Numeric(10, 2), nullable=True)
    quantidade_reposicao = db.Column(db.Numeric(10, 2), nullable=True)
    dias_cobertura_minima = db.Column(db.Integer, nullable=True)
    giro_esperado_mensal = db.Column(db.Numeric(10, 2), nullable=True)
    sazonalidade = db.Column(db.JSON, nullable=True) # Ex: {'mes': 'valor'}
    fornecedor_preferencial_id = db.Column(db.String(36), db.ForeignKey('fornecedores.id'), nullable=True)
    tempo_entrega_dias = db.Column(db.Integer, nullable=True)
    ativo = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    produto = db.relationship('Produto', backref='configuracoes_inventario')
    loja = db.relationship('Loja', backref='configuracoes_inventario')
    fornecedor_preferencial = db.relationship('Fornecedor', backref='configuracoes_inventario_preferencial')

    def __repr__(self):
        return f'<InventarioConfiguracao {self.id} - Produto: {self.produto_id} - Loja: {self.loja_id}>'


