from src import db
import uuid
from datetime import datetime

class InventarioMovimentacao(db.Model):
    __tablename__ = 'inventario_movimentacoes'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    produto_id = db.Column(db.String(36), db.ForeignKey('produtos.id'), nullable=False)
    loja_id = db.Column(db.String(36), db.ForeignKey('lojas.id'), nullable=False)
    tipo_movimentacao = db.Column(db.Enum('Entrada', 'Saida', 'Transferencia', 'Ajuste', 'Perda', 'Devolucao', name='tipo_movimentacao_enum'), nullable=False)
    quantidade = db.Column(db.Numeric(10, 2), nullable=False)
    quantidade_anterior = db.Column(db.Numeric(10, 2), nullable=False)
    quantidade_atual = db.Column(db.Numeric(10, 2), nullable=False)
    lote = db.Column(db.String(100), nullable=True)
    data_validade = db.Column(db.Date, nullable=True)
    preco_custo = db.Column(db.Numeric(10, 2), nullable=True)
    preco_venda = db.Column(db.Numeric(10, 2), nullable=True)
    fornecedor_id = db.Column(db.String(36), db.ForeignKey('fornecedores.id'), nullable=True)
    documento_fiscal = db.Column(db.String(255), nullable=True)
    motivo = db.Column(db.Text, nullable=True)
    usuario_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    data_movimentacao = db.Column(db.DateTime, default=datetime.utcnow)
    localizacao = db.Column(db.String(255), nullable=True)
    temperatura_armazenamento = db.Column(db.Numeric(5, 2), nullable=True)
    observacoes = db.Column(db.Text, nullable=True)
    status = db.Column(db.Enum('Pendente', 'Confirmada', 'Cancelada', name='status_movimentacao_enum'), default='Confirmada')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    produto = db.relationship('Produto', backref='movimentacoes_inventario')
    loja = db.relationship('Loja', backref='movimentacoes_inventario')
    fornecedor = db.relationship('Fornecedor', backref='movimentacoes_inventario')
    usuario = db.relationship('User', backref='movimentacoes_inventario')

    def __repr__(self):
        return f'<InventarioMovimentacao {self.id} - {self.tipo_movimentacao} {self.quantidade} de {self.produto_id}>'


