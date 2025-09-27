from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date
from sqlalchemy import or_, and_
from src.models.user import db
from src.models.produto import Produto, Alerta, HistoricoVenda
from src.services.ia_service import IAService

produtos_bp = Blueprint('produtos', __name__)

@produtos_bp.route('/produtos', methods=['GET'])
@jwt_required()
def listar_produtos():
    """Lista produtos do usuário com filtros e paginação"""
    try:
        user_id = get_jwt_identity()
        
        # Parâmetros de query
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        categoria = request.args.get('categoria')
        status = request.args.get('status')
        search = request.args.get('search')
        
        # Query base
        query = Produto.query.filter_by(user_id=user_id)
        
        # Aplicar filtros
        if categoria:
            query = query.filter(Produto.categoria == categoria)
        
        if status:
            query = query.filter(Produto.status == status)
        
        if search:
            query = query.filter(
                or_(
                    Produto.nome.ilike(f'%{search}%'),
                    Produto.codigo_barras.ilike(f'%{search}%'),
                    Produto.fornecedor.ilike(f'%{search}%')
                )
            )
        
        # Ordenar por data de validade (mais próximos primeiro)
        query = query.order_by(Produto.data_validade.asc())
        
        # Paginação
        produtos_paginados = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        # Atualizar status dos produtos
        for produto in produtos_paginados.items:
            produto.atualizar_status()
        
        db.session.commit()
        
        return jsonify({
            'produtos': [produto.to_dict() for produto in produtos_paginados.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': produtos_paginados.total,
                'pages': produtos_paginados.pages
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@produtos_bp.route('/produtos', methods=['POST'])
@jwt_required()
def criar_produto():
    """Cria um novo produto"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validação básica
        required_fields = ['nome', 'categoria', 'data_validade', 'quantidade', 'preco_venda']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Campo {field} é obrigatório'}), 400
        
        # Verifica se código de barras já existe (se fornecido)
        if data.get('codigo_barras'):
            existing = Produto.query.filter_by(
                codigo_barras=data['codigo_barras'],
                user_id=user_id
            ).first()
            if existing:
                return jsonify({'error': 'Código de barras já cadastrado'}), 400
        
        # Converte data de validade
        try:
            data_validade = datetime.strptime(data['data_validade'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Formato de data inválido. Use YYYY-MM-DD'}), 400
        
        # Cria produto
        produto = Produto(
            user_id=user_id,
            nome=data['nome'],
            codigo_barras=data.get('codigo_barras'),
            categoria=data['categoria'],
            data_validade=data_validade,
            lote=data.get('lote'),
            quantidade=data['quantidade'],
            preco_custo=data.get('preco_custo'),
            preco_venda=data['preco_venda'],
            fornecedor=data.get('fornecedor')
        )
        
        produto.atualizar_status()
        
        db.session.add(produto)
        db.session.commit()
        
        # Criar alerta se necessário
        if produto.status in ['proximo_vencimento', 'vencido']:
            criar_alerta_vencimento(produto)
        
        return jsonify({
            'message': 'Produto criado com sucesso',
            'produto': produto.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@produtos_bp.route('/produtos/<int:produto_id>', methods=['GET'])
@jwt_required()
def obter_produto(produto_id):
    """Obtém detalhes de um produto específico"""
    try:
        user_id = get_jwt_identity()
        
        produto = Produto.query.filter_by(id=produto_id, user_id=user_id).first()
        if not produto:
            return jsonify({'error': 'Produto não encontrado'}), 404
        
        produto.atualizar_status()
        db.session.commit()
        
        # Buscar histórico de vendas
        historico = HistoricoVenda.query.filter_by(produto_id=produto_id).order_by(
            HistoricoVenda.data_venda.desc()
        ).limit(10).all()
        
        # Obter sugestões da IA
        ia_service = IAService()
        sugestoes = ia_service.obter_sugestoes_produto(produto)
        
        produto_dict = produto.to_dict()
        produto_dict['historico_vendas'] = [h.to_dict() for h in historico]
        produto_dict['sugestoes_ia'] = sugestoes
        
        return jsonify({'produto': produto_dict}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@produtos_bp.route('/produtos/<int:produto_id>', methods=['PUT'])
@jwt_required()
def atualizar_produto(produto_id):
    """Atualiza um produto existente"""
    try:
        user_id = get_jwt_identity()
        
        produto = Produto.query.filter_by(id=produto_id, user_id=user_id).first()
        if not produto:
            return jsonify({'error': 'Produto não encontrado'}), 404
        
        data = request.get_json()
        
        # Campos que podem ser atualizados
        updatable_fields = [
            'nome', 'categoria', 'data_validade', 'lote', 'quantidade',
            'preco_custo', 'preco_venda', 'fornecedor'
        ]
        
        for field in updatable_fields:
            if field in data:
                if field == 'data_validade':
                    try:
                        data_validade = datetime.strptime(data[field], '%Y-%m-%d').date()
                        produto.data_validade = data_validade
                    except ValueError:
                        return jsonify({'error': 'Formato de data inválido. Use YYYY-MM-DD'}), 400
                else:
                    setattr(produto, field, data[field])
        
        produto.atualizar_status()
        produto.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Produto atualizado com sucesso',
            'produto': produto.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@produtos_bp.route('/produtos/<int:produto_id>', methods=['DELETE'])
@jwt_required()
def deletar_produto(produto_id):
    """Remove um produto"""
    try:
        user_id = get_jwt_identity()
        
        produto = Produto.query.filter_by(id=produto_id, user_id=user_id).first()
        if not produto:
            return jsonify({'error': 'Produto não encontrado'}), 404
        
        db.session.delete(produto)
        db.session.commit()
        
        return jsonify({'message': 'Produto removido com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@produtos_bp.route('/produtos/categorias', methods=['GET'])
@jwt_required()
def listar_categorias():
    """Lista categorias de produtos do usuário"""
    try:
        user_id = get_jwt_identity()
        
        categorias = db.session.query(Produto.categoria).filter_by(
            user_id=user_id
        ).distinct().all()
        
        return jsonify({
            'categorias': [cat[0] for cat in categorias]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@produtos_bp.route('/produtos/vencendo', methods=['GET'])
@jwt_required()
def produtos_vencendo():
    """Lista produtos próximos ao vencimento"""
    try:
        user_id = get_jwt_identity()
        dias = request.args.get('dias', 7, type=int)
        
        data_limite = date.today() + timedelta(days=dias)
        
        produtos = Produto.query.filter(
            and_(
                Produto.user_id == user_id,
                Produto.data_validade <= data_limite,
                Produto.quantidade > 0
            )
        ).order_by(Produto.data_validade.asc()).all()
        
        # Atualizar status
        for produto in produtos:
            produto.atualizar_status()
        
        db.session.commit()
        
        return jsonify({
            'produtos': [produto.to_dict() for produto in produtos],
            'total': len(produtos)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@produtos_bp.route('/produtos/<int:produto_id>/venda', methods=['POST'])
@jwt_required()
def registrar_venda(produto_id):
    """Registra uma venda do produto"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        produto = Produto.query.filter_by(id=produto_id, user_id=user_id).first()
        if not produto:
            return jsonify({'error': 'Produto não encontrado'}), 404
        
        quantidade_vendida = data.get('quantidade_vendida', 0)
        preco_unitario = data.get('preco_unitario', produto.preco_venda)
        
        if quantidade_vendida <= 0:
            return jsonify({'error': 'Quantidade deve ser maior que zero'}), 400
        
        if quantidade_vendida > produto.quantidade:
            return jsonify({'error': 'Quantidade insuficiente em estoque'}), 400
        
        # Registra venda
        venda = HistoricoVenda(
            produto_id=produto_id,
            user_id=user_id,
            data_venda=date.today(),
            quantidade_vendida=quantidade_vendida,
            preco_unitario=preco_unitario,
            receita_total=quantidade_vendida * preco_unitario
        )
        
        # Atualiza estoque
        produto.quantidade -= quantidade_vendida
        produto.updated_at = datetime.utcnow()
        
        db.session.add(venda)
        db.session.commit()
        
        return jsonify({
            'message': 'Venda registrada com sucesso',
            'venda': venda.to_dict(),
            'produto': produto.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

def criar_alerta_vencimento(produto):
    """Cria alerta de vencimento para um produto"""
    try:
        dias = produto.dias_para_vencer
        
        if dias < 0:
            urgencia = 'alta'
            titulo = f'Produto vencido há {abs(dias)} dias'
        elif dias <= 3:
            urgencia = 'alta'
            titulo = f'Produto vence em {dias} dias'
        elif dias <= 7:
            urgencia = 'media'
            titulo = f'Produto vence em {dias} dias'
        else:
            urgencia = 'baixa'
            titulo = f'Produto vence em {dias} dias'
        
        # Verifica se já existe alerta ativo para este produto
        alerta_existente = Alerta.query.filter_by(
            produto_id=produto.id,
            tipo='vencimento',
            status='ativo'
        ).first()
        
        if alerta_existente:
            return
        
        alerta = Alerta(
            produto_id=produto.id,
            user_id=produto.user_id,
            tipo='vencimento',
            urgencia=urgencia,
            titulo=titulo,
            descricao=f'{produto.quantidade} unidades do produto {produto.nome} vencem em {dias} dias',
            quantidade_afetada=produto.quantidade,
            valor_estimado_perda=produto.quantidade * produto.preco_venda
        )
        
        db.session.add(alerta)
        db.session.commit()
        
    except Exception as e:
        print(f"Erro ao criar alerta: {e}")
        db.session.rollback()

