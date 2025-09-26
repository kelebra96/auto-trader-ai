from src import db
import uuid
from datetime import datetime

class InventarioAlerta(db.Model):
    __tablename__ = 'inventario_alertas'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    produto_id = db.Column(db.String(36), db.ForeignKey('produtos.id'), nullable=False)
    loja_id = db.Column(db.String(36), db.ForeignKey('lojas.id'), nullable=False)
    tipo_alerta = db.Column(db.Enum('Estoque_Baixo', 'Estoque_Alto', 'Sem_Movimentacao', 'Divergencia_Recorrente', name='tipo_alerta_inventario_enum'), nullable=False)
    nivel_prioridade = db.Column(db.Enum('Baixa', 'Media', 'Alta', 'Critica', name='nivel_prioridade_inventario_enum'), nullable=False)
    quantidade_atual = db.Column(db.Numeric(10, 2), nullable=True)
    quantidade_minima = db.Column(db.Numeric(10, 2), nullable=True)
    quantidade_maxima = db.Column(db.Numeric(10, 2), nullable=True)
    dias_sem_movimentacao = db.Column(db.Integer, nullable=True)
    percentual_divergencia = db.Column(db.Numeric(5, 2), nullable=True)
    mensagem = db.Column(db.Text, nullable=False)
    data_alerta = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.Enum('Ativo', 'Resolvido', 'Ignorado', name='status_alerta_inventario_enum'), default='Ativo')
    resolvido_por = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)
    data_resolucao = db.Column(db.DateTime, nullable=True)
    acao_tomada = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    produto = db.relationship('Produto', backref='alertas_inventario')
    loja = db.relationship('Loja', backref='alertas_inventario')
    resolvido_por_user = db.relationship('User', backref='alertas_inventario_resolvidos')

    def __repr__(self):
        return f'<InventarioAlerta {self.id} - {self.tipo_alerta} - Produto: {self.produto_id}>'


