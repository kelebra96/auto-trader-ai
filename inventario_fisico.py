from src import db
import uuid
from datetime import datetime

class InventarioFisico(db.Model):
    __tablename__ = 'inventario_fisico'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    loja_id = db.Column(db.String(36), db.ForeignKey('lojas.id'), nullable=False)
    nome = db.Column(db.String(255), nullable=False)
    data_inicio = db.Column(db.DateTime, default=datetime.utcnow)
    data_fim = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.Enum('Planejado', 'Em_Andamento', 'Finalizado', 'Cancelado', name='status_inventario_enum'), default='Planejado')
    tipo = db.Column(db.Enum('Completo', 'Parcial', 'Ciclico', 'Emergencial', name='tipo_inventario_enum'), nullable=False)
    responsavel_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    observacoes = db.Column(db.Text, nullable=True)
    total_produtos_contados = db.Column(db.Integer, default=0)
    total_divergencias = db.Column(db.Integer, default=0)
    valor_divergencia_positiva = db.Column(db.Numeric(10, 2), default=0.00)
    valor_divergencia_negativa = db.Column(db.Numeric(10, 2), default=0.00)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    loja = db.relationship('Loja', backref='inventarios_fisicos')
    responsavel = db.relationship('User', backref='inventarios_fisicos_responsavel')

    def __repr__(self):
        return f'<InventarioFisico {self.id} - {self.nome} ({self.status})>'


