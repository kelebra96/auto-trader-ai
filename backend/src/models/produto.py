from datetime import datetime, date
from src.models.user import db

class Produto(db.Model):
    __tablename__ = 'produtos'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    nome = db.Column(db.String(200), nullable=False)
    codigo_barras = db.Column(db.String(50), unique=True, nullable=True)
    categoria = db.Column(db.String(100), nullable=False)
    data_validade = db.Column(db.Date, nullable=False)
    lote = db.Column(db.String(100), nullable=True)
    quantidade = db.Column(db.Integer, nullable=False, default=0)
    preco_custo = db.Column(db.Float, nullable=True)
    preco_venda = db.Column(db.Float, nullable=False)
    fornecedor = db.Column(db.String(200), nullable=True)
    status = db.Column(db.String(50), default='normal')  # normal, proximo_vencimento, vencido
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relacionamentos
    user = db.relationship('User', backref=db.backref('produtos', lazy=True))
    alertas = db.relationship('Alerta', backref='produto', lazy=True, cascade='all, delete-orphan')
    historico_vendas = db.relationship('HistoricoVenda', backref='produto', lazy=True, cascade='all, delete-orphan')
    
    @property
    def dias_para_vencer(self):
        """Calcula quantos dias faltam para o produto vencer"""
        if isinstance(self.data_validade, str):
            data_validade = datetime.strptime(self.data_validade, '%Y-%m-%d').date()
        else:
            data_validade = self.data_validade
        
        hoje = date.today()
        delta = data_validade - hoje
        return delta.days
    
    def atualizar_status(self):
        """Atualiza o status do produto baseado na data de validade"""
        dias = self.dias_para_vencer
        
        if dias < 0:
            self.status = 'vencido'
        elif dias <= 7:
            self.status = 'proximo_vencimento'
        else:
            self.status = 'normal'
    
    def to_dict(self):
        """Converte o produto para dicionário"""
        return {
            'id': self.id,
            'nome': self.nome,
            'codigo_barras': self.codigo_barras,
            'categoria': self.categoria,
            'data_validade': self.data_validade.isoformat() if self.data_validade else None,
            'lote': self.lote,
            'quantidade': self.quantidade,
            'preco_custo': self.preco_custo,
            'preco_venda': self.preco_venda,
            'fornecedor': self.fornecedor,
            'status': self.status,
            'dias_para_vencer': self.dias_para_vencer,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Alerta(db.Model):
    __tablename__ = 'alertas'
    
    id = db.Column(db.Integer, primary_key=True)
    produto_id = db.Column(db.Integer, db.ForeignKey('produtos.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    tipo = db.Column(db.String(50), nullable=False)  # vencimento, promocao, doacao, estoque_baixo
    urgencia = db.Column(db.String(20), nullable=False)  # alta, media, baixa
    titulo = db.Column(db.String(200), nullable=False)
    descricao = db.Column(db.Text, nullable=True)
    quantidade_afetada = db.Column(db.Integer, nullable=False)
    valor_estimado_perda = db.Column(db.Float, nullable=True)
    status = db.Column(db.String(20), default='ativo')  # ativo, resolvido, ignorado
    lido = db.Column(db.Boolean, default=False)  # Campo para marcar como lido
    acao_tomada = db.Column(db.String(100), nullable=True)
    detalhes_resolucao = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    resolved_at = db.Column(db.DateTime, nullable=True)
    
    # Relacionamentos
    user = db.relationship('User', backref=db.backref('alertas', lazy=True))
    
    def to_dict(self):
        return {
            'id': self.id,
            'produto_id': self.produto_id,
            'produto_nome': self.produto.nome if self.produto else None,
            'produto': self.produto.to_dict() if self.produto else None,
            'tipo': self.tipo,
            'urgencia': self.urgencia,
            'titulo': self.titulo,
            'descricao': self.descricao,
            'quantidade_afetada': self.quantidade_afetada,
            'valor_estimado_perda': self.valor_estimado_perda,
            'status': self.status,
            'lido': self.lido,
            'acao_tomada': self.acao_tomada,
            'detalhes_resolucao': self.detalhes_resolucao,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None
        }

class ConfiguracaoAlerta(db.Model):
    __tablename__ = 'configuracoes_alertas'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    tipo_alerta = db.Column(db.String(50), nullable=False)  # vencimento, estoque_baixo, personalizado
    ativo = db.Column(db.Boolean, default=True)
    dias_antecedencia = db.Column(db.Integer, default=7)  # Para alertas de vencimento
    estoque_minimo = db.Column(db.Integer, default=5)  # Para alertas de estoque baixo
    categorias = db.Column(db.JSON, nullable=True)  # Lista de categorias para filtrar
    notificar_email = db.Column(db.Boolean, default=True)
    notificar_sistema = db.Column(db.Boolean, default=True)
    horario_notificacao = db.Column(db.Time, nullable=True)  # Horário preferido para notificações
    recorrencia = db.Column(db.String(20), default='diaria')  # diaria, semanal, mensal
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relacionamentos
    user = db.relationship('User', backref=db.backref('configuracoes_alertas', lazy=True))
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'tipo_alerta': self.tipo_alerta,
            'ativo': self.ativo,
            'dias_antecedencia': self.dias_antecedencia,
            'estoque_minimo': self.estoque_minimo,
            'categorias': self.categorias,
            'notificar_email': self.notificar_email,
            'notificar_sistema': self.notificar_sistema,
            'horario_notificacao': self.horario_notificacao.strftime('%H:%M') if self.horario_notificacao else None,
            'recorrencia': self.recorrencia,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class HistoricoVenda(db.Model):
    __tablename__ = 'historico_vendas'
    
    id = db.Column(db.Integer, primary_key=True)
    produto_id = db.Column(db.Integer, db.ForeignKey('produtos.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    data_venda = db.Column(db.Date, nullable=False)
    quantidade_vendida = db.Column(db.Integer, nullable=False)
    preco_unitario = db.Column(db.Float, nullable=False)
    receita_total = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionamentos
    user = db.relationship('User', backref=db.backref('historico_vendas', lazy=True))
    
    def to_dict(self):
        return {
            'id': self.id,
            'produto_id': self.produto_id,
            'data_venda': self.data_venda.isoformat() if self.data_venda else None,
            'quantidade_vendida': self.quantidade_vendida,
            'preco_unitario': self.preco_unitario,
            'receita_total': self.receita_total,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Gamificacao(db.Model):
    __tablename__ = 'gamificacao'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    nivel = db.Column(db.Integer, default=1)
    pontos_totais = db.Column(db.Integer, default=0)
    pontos_mes = db.Column(db.Integer, default=0)
    reducao_desperdicio = db.Column(db.Float, default=0.0)
    economia_gerada = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relacionamentos
    user = db.relationship('User', backref=db.backref('gamificacao', uselist=False))
    medalhas = db.relationship('Medalha', backref='gamificacao', lazy=True)
    metas = db.relationship('Meta', backref='gamificacao', lazy=True)
    
    def to_dict(self):
        return {
            'user_id': self.user_id,
            'nivel': self.nivel,
            'pontos_totais': self.pontos_totais,
            'pontos_mes': self.pontos_mes,
            'reducao_desperdicio': self.reducao_desperdicio,
            'economia_gerada': self.economia_gerada,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Medalha(db.Model):
    __tablename__ = 'medalhas'
    
    id = db.Column(db.Integer, primary_key=True)
    gamificacao_id = db.Column(db.Integer, db.ForeignKey('gamificacao.id'), nullable=False)
    nome = db.Column(db.String(100), nullable=False)
    descricao = db.Column(db.String(200), nullable=True)
    icone = db.Column(db.String(10), nullable=True)
    data_conquista = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'descricao': self.descricao,
            'icone': self.icone,
            'data_conquista': self.data_conquista.isoformat() if self.data_conquista else None
        }

class Meta(db.Model):
    __tablename__ = 'metas'
    
    id = db.Column(db.Integer, primary_key=True)
    gamificacao_id = db.Column(db.Integer, db.ForeignKey('gamificacao.id'), nullable=False)
    titulo = db.Column(db.String(200), nullable=False)
    descricao = db.Column(db.Text, nullable=True)
    valor_objetivo = db.Column(db.Float, nullable=False)
    valor_atual = db.Column(db.Float, default=0.0)
    tipo = db.Column(db.String(50), nullable=False)  # reducao_perda, economia, vendas
    prazo = db.Column(db.Date, nullable=False)
    recompensa_pontos = db.Column(db.Integer, default=0)
    status = db.Column(db.String(20), default='ativa')  # ativa, concluida, expirada
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)
    
    @property
    def progresso(self):
        """Calcula o progresso da meta (0.0 a 1.0)"""
        if self.valor_objetivo == 0:
            return 0.0
        return min(self.valor_atual / self.valor_objetivo, 1.0)
    
    def to_dict(self):
        return {
            'id': self.id,
            'titulo': self.titulo,
            'descricao': self.descricao,
            'valor_objetivo': self.valor_objetivo,
            'valor_atual': self.valor_atual,
            'progresso': self.progresso,
            'tipo': self.tipo,
            'prazo': self.prazo.isoformat() if self.prazo else None,
            'recompensa_pontos': self.recompensa_pontos,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }

