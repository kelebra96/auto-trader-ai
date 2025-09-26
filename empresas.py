from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from sqlalchemy.exc import IntegrityError
from src.models.user import db
from src.models.empresa import Empresa, Plano, Assinatura, Pagamento
from src.utils.validators import validate_cnpj, validate_email
from src.utils.decorators import admin_required, empresa_access_required
from datetime import datetime, timedelta

empresas_bp = Blueprint('empresas', __name__)

@empresas_bp.route('/empresas', methods=['GET'])
@jwt_required()
@admin_required
def list_empresas():
    """Lista todas as empresas (apenas admin)"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        status = request.args.get('status')
        search = request.args.get('search')
        
        query = Empresa.query
        
        if status:
            query = query.filter(Empresa.status == status)
        
        if search:
            query = query.filter(
                db.or_(
                    Empresa.razao_social.ilike(f'%{search}%'),
                    Empresa.nome_fantasia.ilike(f'%{search}%'),
                    Empresa.cnpj.ilike(f'%{search}%')
                )
            )
        
        empresas = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'empresas': [empresa.to_dict() for empresa in empresas.items],
            'total': empresas.total,
            'pages': empresas.pages,
            'current_page': page,
            'per_page': per_page
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@empresas_bp.route('/empresas', methods=['POST'])
@jwt_required()
@admin_required
def create_empresa():
    """Cria uma nova empresa (apenas admin)"""
    try:
        data = request.get_json()
        
        # Validações obrigatórias
        required_fields = ['razao_social', 'cnpj', 'email_corporativo', 'plano_id']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Campo {field} é obrigatório'}), 400
        
        # Validar CNPJ
        if not validate_cnpj(data['cnpj']):
            return jsonify({'error': 'CNPJ inválido'}), 400
        
        # Validar email
        if not validate_email(data['email_corporativo']):
            return jsonify({'error': 'Email inválido'}), 400
        
        # Verificar se plano existe
        plano = Plano.query.get(data['plano_id'])
        if not plano:
            return jsonify({'error': 'Plano não encontrado'}), 404
        
        # Criar empresa
        empresa = Empresa(
            razao_social=data['razao_social'],
            nome_fantasia=data.get('nome_fantasia'),
            cnpj=data['cnpj'],
            email_corporativo=data['email_corporativo'],
            telefone=data.get('telefone'),
            endereco=data.get('endereco'),
            plano_id=data['plano_id'],
            data_contratacao=datetime.now(),
            data_vencimento=datetime.now() + timedelta(days=31),
            configuracoes=data.get('configuracoes', {})
        )
        
        db.session.add(empresa)
        db.session.commit()
        
        # Criar assinatura inicial
        assinatura = Assinatura(
            empresa_id=empresa.id,
            plano_id=plano.id,
            status='ativa',
            data_inicio=datetime.now(),
            data_fim=datetime.now() + timedelta(days=31),
            valor_mensal=plano.preco_mensal,
            valor_final=plano.preco_mensal
        )
        
        db.session.add(assinatura)
        db.session.commit()
        
        return jsonify({
            'message': 'Empresa criada com sucesso',
            'empresa': empresa.to_dict()
        }), 201
        
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'CNPJ já cadastrado'}), 409
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@empresas_bp.route('/empresas/<int:empresa_id>', methods=['GET'])
@jwt_required()
@empresa_access_required
def get_empresa(empresa_id):
    """Obtém dados de uma empresa"""
    try:
        empresa = Empresa.query.get_or_404(empresa_id)
        
        empresa_data = empresa.to_dict()
        
        # Adicionar informações da assinatura ativa
        assinatura_ativa = empresa.get_active_subscription()
        if assinatura_ativa:
            empresa_data['assinatura'] = assinatura_ativa.to_dict()
            empresa_data['assinatura']['plano'] = assinatura_ativa.plano.to_dict()
        
        # Adicionar estatísticas
        empresa_data['estatisticas'] = {
            'total_usuarios': len([u for u in empresa.usuarios if u.status == 'ativo']),
            'total_lojas': len([l for l in empresa.lojas if l.status == 'ativa']),
            'total_produtos': len([p for p in empresa.produtos if p.status == 'ativo']),
            'total_fornecedores': len([f for f in empresa.fornecedores if f.status == 'ativo'])
        }
        
        # Verificar limites de uso
        usage_check = empresa.check_usage_limits()
        empresa_data['usage_limits'] = usage_check
        
        return jsonify(empresa_data)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@empresas_bp.route('/empresas/<int:empresa_id>', methods=['PUT'])
@jwt_required()
@empresa_access_required
def update_empresa(empresa_id):
    """Atualiza dados de uma empresa"""
    try:
        empresa = Empresa.query.get_or_404(empresa_id)
        data = request.get_json()
        
        # Campos que podem ser atualizados
        updatable_fields = [
            'razao_social', 'nome_fantasia', 'email_corporativo', 
            'telefone', 'endereco', 'configuracoes'
        ]
        
        for field in updatable_fields:
            if field in data:
                if field == 'email_corporativo' and not validate_email(data[field]):
                    return jsonify({'error': 'Email inválido'}), 400
                setattr(empresa, field, data[field])
        
        empresa.updated_at = datetime.now()
        db.session.commit()
        
        return jsonify({
            'message': 'Empresa atualizada com sucesso',
            'empresa': empresa.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@empresas_bp.route('/empresas/<int:empresa_id>/status', methods=['PUT'])
@jwt_required()
@admin_required
def update_empresa_status(empresa_id):
    """Atualiza status de uma empresa (apenas admin)"""
    try:
        empresa = Empresa.query.get_or_404(empresa_id)
        data = request.get_json()
        
        if 'status' not in data:
            return jsonify({'error': 'Status é obrigatório'}), 400
        
        valid_statuses = ['ativo', 'suspenso', 'cancelado']
        if data['status'] not in valid_statuses:
            return jsonify({'error': f'Status deve ser um de: {valid_statuses}'}), 400
        
        empresa.status = data['status']
        empresa.updated_at = datetime.now()
        
        # Se suspender ou cancelar, desativar assinatura
        if data['status'] in ['suspenso', 'cancelado']:
            assinatura_ativa = empresa.get_active_subscription()
            if assinatura_ativa:
                assinatura_ativa.status = 'suspensa' if data['status'] == 'suspenso' else 'cancelada'
                if data['status'] == 'cancelado':
                    assinatura_ativa.cancel(data.get('motivo'))
        
        db.session.commit()
        
        return jsonify({
            'message': 'Status da empresa atualizado com sucesso',
            'empresa': empresa.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@empresas_bp.route('/empresas/<int:empresa_id>/dashboard', methods=['GET'])
@jwt_required()
@empresa_access_required
def get_empresa_dashboard(empresa_id):
    """Obtém dados do dashboard da empresa"""
    try:
        empresa = Empresa.query.get_or_404(empresa_id)
        
        # Estatísticas gerais
        total_produtos = len([p for p in empresa.produtos if p.status == 'ativo'])
        total_usuarios = len([u for u in empresa.usuarios if u.status == 'ativo'])
        total_lojas = len([l for l in empresa.lojas if l.status == 'ativa'])
        total_fornecedores = len([f for f in empresa.fornecedores if f.status == 'ativo'])
        
        # Produtos vencendo
        from datetime import date, timedelta
        data_limite = date.today() + timedelta(days=7)
        produtos_vencendo = [
            p for p in empresa.produtos 
            if p.status == 'ativo' and p.data_validade and p.data_validade <= data_limite
        ]
        
        # Valor em risco
        valor_risco = sum(
            float(p.preco_venda) * p.estoque_atual 
            for p in produtos_vencendo 
            if p.preco_venda and p.estoque_atual
        )
        
        # Alertas ativos
        alertas_ativos = len([a for a in empresa.alertas if a.status == 'ativo'])
        alertas_criticos = len([
            a for a in empresa.alertas 
            if a.status == 'ativo' and a.urgencia == 'alta'
        ])
        
        # Status da assinatura
        assinatura = empresa.get_active_subscription()
        dias_vencimento = assinatura.days_until_expiry() if assinatura else 0
        
        dashboard_data = {
            'estatisticas': {
                'total_produtos': total_produtos,
                'total_usuarios': total_usuarios,
                'total_lojas': total_lojas,
                'total_fornecedores': total_fornecedores,
                'produtos_vencendo': len(produtos_vencendo),
                'valor_risco': valor_risco,
                'alertas_ativos': alertas_ativos,
                'alertas_criticos': alertas_criticos
            },
            'assinatura': {
                'status': assinatura.status if assinatura else 'inativa',
                'plano': assinatura.plano.nome if assinatura else None,
                'dias_vencimento': dias_vencimento,
                'valor_mensal': float(assinatura.valor_final) if assinatura else 0
            },
            'produtos_vencendo': [p.to_dict() for p in produtos_vencendo[:10]],
            'usage_limits': empresa.check_usage_limits()
        }
        
        return jsonify(dashboard_data)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@empresas_bp.route('/planos', methods=['GET'])
def list_planos():
    """Lista todos os planos disponíveis"""
    try:
        planos = Plano.query.filter_by(status='ativo').all()
        
        planos_data = []
        for plano in planos:
            plano_data = plano.to_dict()
            plano_data['desconto_anual'] = plano.get_discount_percentage()
            planos_data.append(plano_data)
        
        return jsonify({'planos': planos_data})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@empresas_bp.route('/planos', methods=['POST'])
@jwt_required()
@admin_required
def create_plano():
    """Cria um novo plano (apenas admin)"""
    try:
        data = request.get_json()
        
        required_fields = ['nome', 'preco_mensal', 'funcionalidades']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Campo {field} é obrigatório'}), 400
        
        plano = Plano(
            nome=data['nome'],
            descricao=data.get('descricao'),
            preco_mensal=data['preco_mensal'],
            preco_anual=data.get('preco_anual'),
            limite_produtos=data.get('limite_produtos'),
            limite_usuarios=data.get('limite_usuarios'),
            limite_lojas=data.get('limite_lojas'),
            funcionalidades=data['funcionalidades']
        )
        
        db.session.add(plano)
        db.session.commit()
        
        return jsonify({
            'message': 'Plano criado com sucesso',
            'plano': plano.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@empresas_bp.route('/planos/<int:plano_id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_plano(plano_id):
    """Atualiza um plano (apenas admin)"""
    try:
        plano = Plano.query.get_or_404(plano_id)
        data = request.get_json()
        
        updatable_fields = [
            'nome', 'descricao', 'preco_mensal', 'preco_anual',
            'limite_produtos', 'limite_usuarios', 'limite_lojas',
            'funcionalidades', 'status'
        ]
        
        for field in updatable_fields:
            if field in data:
                setattr(plano, field, data[field])
        
        plano.updated_at = datetime.now()
        db.session.commit()
        
        return jsonify({
            'message': 'Plano atualizado com sucesso',
            'plano': plano.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

