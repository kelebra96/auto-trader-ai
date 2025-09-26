from src import db
import uuid
from datetime import datetime

class InventarioContagem(db.Model):
    __tablename__ = 'inventario_contagens'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    inventario_id = db.Column(db.String(36), db.ForeignKey('inventario_fisico.id'), nullable=False)
    produto_id = db.Column(db.String(36), db.ForeignKey('produtos.id'), nullable=False)
    lote = db.Column(db.String(100), nullable=True)
    data_validade = db.Column(db.Date, nullable=True)
    quantidade_sistema = db.Column(db.Numeric(10, 2), nullable=False)
    quantidade_contada = db.Column(db.Numeric(10, 2), nullable=False)
    divergencia = db.Column(db.Numeric(10, 2), nullable=False)
    preco_custo_unitario = db.Column(db.Numeric(10, 2), nullable=True)
    valor_divergencia = db.Column(db.Numeric(10, 2), nullable=True)
    contador_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    data_contagem = db.Column(db.DateTime, default=datetime.utcnow)
    localizacao = db.Column(db.String(255), nullable=True)
    condicao_produto = db.Column(db.Enum('Perfeito', 'Danificado', 'Vencido', 'Proximo_Vencimento', name='condicao_produto_enum'), nullable=True)
    observacoes = db.Column(db.Text, nullable=True)
    foto_evidencia = db.Column(db.String(255), nullable=True)
    recontagem = db.Column(db.Boolean, default=False)
    aprovado = db.Column(db.Boolean, default=False)
    aprovado_por = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)
    data_aprovacao = db.Column(db.DateTime, nullable=True)

    inventario = db.relationship('InventarioFisico', backref='contagens')
    produto = db.relationship('Produto', backref='contagens_inventario')
    contador = db.relationship('User', foreign_keys=[contador_id], backref='contagens_realizadas')
    aprovador = db.relationship('User', foreign_keys=[aprovado_por], backref='contagens_aprovadas')

    def __repr__(self):
        return f'<InventarioContagem {self.id} - Produto: {self.produto_id} - Contado: {self.quantidade_contada}>'


