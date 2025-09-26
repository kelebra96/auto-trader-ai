from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import IntegrityError
from src.models.user import db
from src.models.loja import Loja, Fornecedor, Setor, Categoria
from src.utils.decorators import empresa_access_required
from src.utils.validators import validate_cnpj, validate_email
from datetime import datetime

lojas_bp = Blueprint('lojas', __name__)

# ==================== ROTAS DE LOJAS ====================

@lojas_bp.route('/lojas', methods=['GET'])
@jwt_required()
@empresa_access_required
def list_lojas():
    """Lista todas as lojas da empresa"""
    try:
        empresa_id = request.empresa_id
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        status = request.args.get('status')
        search = request.args.get('search')
        
        query = Loja.query.filter_by(empresa_id=empresa_id)
        
        if status:
            query = query.filter(Loja.status == status)
        
        if search:
            query = query.filter(
                db.or_(
                    Loja.nome_loja.ilike(f'%{search}%'),
                    Loja.numero_loja.ilike(f'%{search}%'),
                    Loja.codigo_gerente.ilike(f'%{search}%')
                )
            )
        
        lojas = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'lojas': [loja.to_dict() for loja in lojas.items],
            'total': lojas.total,
            'pages': lojas.pages,
            'current_page': page,
            'per_page': per_page
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@lojas_bp.route('/lojas', methods=['POST'])
@jwt_required()
@empresa_access_required
def create_loja():
    """Cria uma nova loja"""
    try:
        empresa_id = request.empresa_id
        data = request.get_json()
        
        # Validações obrigatórias
        required_fields = ['numero_loja', 'nome_loja']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Campo {field} é obrigatório'}), 400
        
        # Verificar se número da loja já existe na empresa
        existing_loja = Loja.query.filter_by(
            empresa_id=empresa_id,
            numero_loja=data['numero_loja']
        ).first()
        
        if existing_loja:
            return jsonify({'error': 'Número da loja já existe'}), 409
        
        # Validar email se fornecido
        if data.get('email') and not validate_email(data['email']):
            return jsonify({'error': 'Email inválido'}), 400
        
        loja = Loja(
            empresa_id=empresa_id,
            numero_loja=data['numero_loja'],
            razao_social=data.get('razao_social'),
            nome_loja=data['nome_loja'],
            codigo_gerente=data.get('codigo_gerente'),
            codigo_fiscal_prevencao=data.get('codigo_fiscal_prevencao'),
            endereco=data.get('endereco'),
            telefone=data.get('telefone'),
            email=data.get('email'),
            configuracoes=data.get('configuracoes', {})
        )
        
        db.session.add(loja)
        db.session.commit()
        
        return jsonify({
            'message': 'Loja criada com sucesso',
            'loja': loja.to_dict()
        }), 201
        
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Dados duplicados'}), 409
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@lojas_bp.route('/lojas/<int:loja_id>', methods=['GET'])
@jwt_required()
@empresa_access_required
def get_loja(loja_id):
    """Obtém dados de uma loja específica"""
    try:
        empresa_id = request.empresa_id
        loja = Loja.query.filter_by(id=loja_id, empresa_id=empresa_id).first_or_404()
        
        loja_data = loja.to_dict()
        
        # Adicionar estatísticas
        loja_data['estatisticas'] = {
            'total_produtos': loja.get_produtos_count(),
            'produtos_vencendo': len(loja.get_produtos_vencendo()),
            'valor_estoque': loja.get_valor_estoque(),
            'endereco_completo': loja.get_endereco_completo()
        }
        
        return jsonify(loja_data)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@lojas_bp.route('/lojas/<int:loja_id>', methods=['PUT'])
@jwt_required()
@empresa_access_required
def update_loja(loja_id):
    """Atualiza dados de uma loja"""
    try:
        empresa_id = request.empresa_id
        loja = Loja.query.filter_by(id=loja_id, empresa_id=empresa_id).first_or_404()
        data = request.get_json()
        
        # Campos que podem ser atualizados
        updatable_fields = [
            'razao_social', 'nome_loja', 'codigo_gerente', 
            'codigo_fiscal_prevencao', 'endereco', 'telefone', 
            'email', 'configuracoes'
        ]
        
        for field in updatable_fields:
            if field in data:
                if field == 'email' and data[field] and not validate_email(data[field]):
                    return jsonify({'error': 'Email inválido'}), 400
                setattr(loja, field, data[field])
        
        loja.updated_at = datetime.now()
        db.session.commit()
        
        return jsonify({
            'message': 'Loja atualizada com sucesso',
            'loja': loja.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@lojas_bp.route('/lojas/<int:loja_id>/status', methods=['PUT'])
@jwt_required()
@empresa_access_required
def update_loja_status(loja_id):
    """Atualiza status de uma loja"""
    try:
        empresa_id = request.empresa_id
        loja = Loja.query.filter_by(id=loja_id, empresa_id=empresa_id).first_or_404()
        data = request.get_json()
        
        if 'status' not in data:
            return jsonify({'error': 'Status é obrigatório'}), 400
        
        valid_statuses = ['ativa', 'inativa', 'suspensa']
        if data['status'] not in valid_statuses:
            return jsonify({'error': f'Status deve ser um de: {valid_statuses}'}), 400
        
        loja.status = data['status']
        loja.updated_at = datetime.now()
        db.session.commit()
        
        return jsonify({
            'message': 'Status da loja atualizado com sucesso',
            'loja': loja.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@lojas_bp.route('/lojas/import', methods=['POST'])
@jwt_required()
@empresa_access_required
def import_lojas():
    """Importa lojas em lote via CSV/JSON"""
    try:
        empresa_id = request.empresa_id
        data = request.get_json()
        
        if not data.get('lojas'):
            return jsonify({'error': 'Lista de lojas é obrigatória'}), 400
        
        created_lojas = []
        errors = []
        
        for i, loja_data in enumerate(data['lojas']):
            try:
                # Validações básicas
                if not loja_data.get('numero_loja') or not loja_data.get('nome_loja'):
                    errors.append(f'Linha {i+1}: Número da loja e nome são obrigatórios')
                    continue
                
                # Verificar duplicatas
                existing = Loja.query.filter_by(
                    empresa_id=empresa_id,
                    numero_loja=loja_data['numero_loja']
                ).first()
                
                if existing:
                    errors.append(f'Linha {i+1}: Número da loja {loja_data["numero_loja"]} já existe')
                    continue
                
                loja = Loja(
                    empresa_id=empresa_id,
                    numero_loja=loja_data['numero_loja'],
                    razao_social=loja_data.get('razao_social'),
                    nome_loja=loja_data['nome_loja'],
                    codigo_gerente=loja_data.get('codigo_gerente'),
                    codigo_fiscal_prevencao=loja_data.get('codigo_fiscal_prevencao'),
                    endereco=loja_data.get('endereco'),
                    telefone=loja_data.get('telefone'),
                    email=loja_data.get('email')
                )
                
                db.session.add(loja)
                created_lojas.append(loja)
                
            except Exception as e:
                errors.append(f'Linha {i+1}: {str(e)}')
        
        if created_lojas:
            db.session.commit()
        
        return jsonify({
            'message': f'{len(created_lojas)} lojas importadas com sucesso',
            'created': len(created_lojas),
            'errors': errors,
            'lojas': [loja.to_dict() for loja in created_lojas]
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ==================== ROTAS DE FORNECEDORES ====================

@lojas_bp.route('/fornecedores', methods=['GET'])
@jwt_required()
@empresa_access_required
def list_fornecedores():
    """Lista todos os fornecedores da empresa"""
    try:
        empresa_id = request.empresa_id
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        status = request.args.get('status')
        search = request.args.get('search')
        
        query = Fornecedor.query.filter_by(empresa_id=empresa_id)
        
        if status:
            query = query.filter(Fornecedor.status == status)
        
        if search:
            query = query.filter(
                db.or_(
                    Fornecedor.nome.ilike(f'%{search}%'),
                    Fornecedor.razao_social.ilike(f'%{search}%'),
                    Fornecedor.cnpj.ilike(f'%{search}%'),
                    Fornecedor.codigo_fornecedor.ilike(f'%{search}%')
                )
            )
        
        fornecedores = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'fornecedores': [fornecedor.to_dict() for fornecedor in fornecedores.items],
            'total': fornecedores.total,
            'pages': fornecedores.pages,
            'current_page': page,
            'per_page': per_page
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@lojas_bp.route('/fornecedores', methods=['POST'])
@jwt_required()
@empresa_access_required
def create_fornecedor():
    """Cria um novo fornecedor"""
    try:
        empresa_id = request.empresa_id
        data = request.get_json()
        
        # Validações obrigatórias
        required_fields = ['cnpj', 'nome']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Campo {field} é obrigatório'}), 400
        
        # Validar CNPJ
        if not validate_cnpj(data['cnpj']):
            return jsonify({'error': 'CNPJ inválido'}), 400
        
        # Validar email se fornecido
        if data.get('email') and not validate_email(data['email']):
            return jsonify({'error': 'Email inválido'}), 400
        
        fornecedor = Fornecedor(
            empresa_id=empresa_id,
            cnpj=data['cnpj'],
            nome=data['nome'],
            razao_social=data.get('razao_social'),
            codigo_fornecedor=data.get('codigo_fornecedor'),
            email=data.get('email'),
            telefone=data.get('telefone'),
            endereco=data.get('endereco'),
            contato_principal=data.get('contato_principal'),
            condicoes_pagamento=data.get('condicoes_pagamento')
        )
        
        db.session.add(fornecedor)
        db.session.commit()
        
        return jsonify({
            'message': 'Fornecedor criado com sucesso',
            'fornecedor': fornecedor.to_dict()
        }), 201
        
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'CNPJ já cadastrado'}), 409
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@lojas_bp.route('/fornecedores/<int:fornecedor_id>', methods=['GET'])
@jwt_required()
@empresa_access_required
def get_fornecedor(fornecedor_id):
    """Obtém dados de um fornecedor específico"""
    try:
        empresa_id = request.empresa_id
        fornecedor = Fornecedor.query.filter_by(
            id=fornecedor_id, empresa_id=empresa_id
        ).first_or_404()
        
        fornecedor_data = fornecedor.to_dict()
        
        # Adicionar estatísticas
        fornecedor_data['estatisticas'] = {
            'total_produtos': fornecedor.get_produtos_count(),
            'valor_total_produtos': fornecedor.get_valor_total_produtos(),
            'cnpj_formatado': fornecedor.format_cnpj(),
            'endereco_completo': fornecedor.get_endereco_completo()
        }
        
        return jsonify(fornecedor_data)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@lojas_bp.route('/fornecedores/<int:fornecedor_id>', methods=['PUT'])
@jwt_required()
@empresa_access_required
def update_fornecedor(fornecedor_id):
    """Atualiza dados de um fornecedor"""
    try:
        empresa_id = request.empresa_id
        fornecedor = Fornecedor.query.filter_by(
            id=fornecedor_id, empresa_id=empresa_id
        ).first_or_404()
        data = request.get_json()
        
        # Campos que podem ser atualizados
        updatable_fields = [
            'nome', 'razao_social', 'codigo_fornecedor', 'email',
            'telefone', 'endereco', 'contato_principal', 'condicoes_pagamento'
        ]
        
        for field in updatable_fields:
            if field in data:
                if field == 'email' and data[field] and not validate_email(data[field]):
                    return jsonify({'error': 'Email inválido'}), 400
                setattr(fornecedor, field, data[field])
        
        fornecedor.updated_at = datetime.now()
        db.session.commit()
        
        return jsonify({
            'message': 'Fornecedor atualizado com sucesso',
            'fornecedor': fornecedor.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@lojas_bp.route('/fornecedores/import', methods=['POST'])
@jwt_required()
@empresa_access_required
def import_fornecedores():
    """Importa fornecedores em lote via CSV/JSON"""
    try:
        empresa_id = request.empresa_id
        data = request.get_json()
        
        if not data.get('fornecedores'):
            return jsonify({'error': 'Lista de fornecedores é obrigatória'}), 400
        
        created_fornecedores = []
        errors = []
        
        for i, fornecedor_data in enumerate(data['fornecedores']):
            try:
                # Validações básicas
                if not fornecedor_data.get('cnpj') or not fornecedor_data.get('nome'):
                    errors.append(f'Linha {i+1}: CNPJ e nome são obrigatórios')
                    continue
                
                # Validar CNPJ
                if not validate_cnpj(fornecedor_data['cnpj']):
                    errors.append(f'Linha {i+1}: CNPJ inválido')
                    continue
                
                # Verificar duplicatas
                existing = Fornecedor.query.filter_by(cnpj=fornecedor_data['cnpj']).first()
                if existing:
                    errors.append(f'Linha {i+1}: CNPJ {fornecedor_data["cnpj"]} já existe')
                    continue
                
                fornecedor = Fornecedor(
                    empresa_id=empresa_id,
                    cnpj=fornecedor_data['cnpj'],
                    nome=fornecedor_data['nome'],
                    razao_social=fornecedor_data.get('razao_social'),
                    codigo_fornecedor=fornecedor_data.get('codigo_fornecedor'),
                    email=fornecedor_data.get('email'),
                    telefone=fornecedor_data.get('telefone'),
                    endereco=fornecedor_data.get('endereco'),
                    contato_principal=fornecedor_data.get('contato_principal')
                )
                
                db.session.add(fornecedor)
                created_fornecedores.append(fornecedor)
                
            except Exception as e:
                errors.append(f'Linha {i+1}: {str(e)}')
        
        if created_fornecedores:
            db.session.commit()
        
        return jsonify({
            'message': f'{len(created_fornecedores)} fornecedores importados com sucesso',
            'created': len(created_fornecedores),
            'errors': errors,
            'fornecedores': [f.to_dict() for f in created_fornecedores]
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ==================== ROTAS DE SETORES E CATEGORIAS ====================

@lojas_bp.route('/setores', methods=['GET'])
@jwt_required()
@empresa_access_required
def list_setores():
    """Lista todos os setores da empresa"""
    try:
        empresa_id = request.empresa_id
        setores = Setor.query.filter_by(empresa_id=empresa_id, status='ativo').all()
        
        setores_data = []
        for setor in setores:
            setor_data = setor.to_dict()
            setor_data['total_categorias'] = setor.get_categorias_count()
            setor_data['total_produtos'] = setor.get_produtos_count()
            setores_data.append(setor_data)
        
        return jsonify({'setores': setores_data})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@lojas_bp.route('/setores', methods=['POST'])
@jwt_required()
@empresa_access_required
def create_setor():
    """Cria um novo setor"""
    try:
        empresa_id = request.empresa_id
        data = request.get_json()
        
        if not data.get('nome'):
            return jsonify({'error': 'Nome é obrigatório'}), 400
        
        setor = Setor(
            empresa_id=empresa_id,
            nome=data['nome'],
            descricao=data.get('descricao'),
            codigo=data.get('codigo')
        )
        
        db.session.add(setor)
        db.session.commit()
        
        return jsonify({
            'message': 'Setor criado com sucesso',
            'setor': setor.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@lojas_bp.route('/categorias', methods=['GET'])
@jwt_required()
@empresa_access_required
def list_categorias():
    """Lista todas as categorias da empresa"""
    try:
        empresa_id = request.empresa_id
        setor_id = request.args.get('setor_id', type=int)
        
        query = Categoria.query.filter_by(empresa_id=empresa_id, status='ativo')
        
        if setor_id:
            query = query.filter_by(setor_id=setor_id)
        
        categorias = query.all()
        
        categorias_data = []
        for categoria in categorias:
            categoria_data = categoria.to_dict()
            categoria_data['total_produtos'] = categoria.get_produtos_count()
            categorias_data.append(categoria_data)
        
        return jsonify({'categorias': categorias_data})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@lojas_bp.route('/categorias', methods=['POST'])
@jwt_required()
@empresa_access_required
def create_categoria():
    """Cria uma nova categoria"""
    try:
        empresa_id = request.empresa_id
        data = request.get_json()
        
        if not data.get('nome'):
            return jsonify({'error': 'Nome é obrigatório'}), 400
        
        categoria = Categoria(
            empresa_id=empresa_id,
            setor_id=data.get('setor_id'),
            nome=data['nome'],
            descricao=data.get('descricao'),
            codigo=data.get('codigo'),
            margem_padrao=data.get('margem_padrao')
        )
        
        db.session.add(categoria)
        db.session.commit()
        
        return jsonify({
            'message': 'Categoria criada com sucesso',
            'categoria': categoria.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

