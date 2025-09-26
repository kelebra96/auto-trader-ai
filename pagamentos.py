from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from src.models.user import db
from src.models.empresa import Empresa, Plano, Assinatura, Pagamento
from src.services.mercadopago_service import mercadopago_service
from src.utils.decorators import empresa_access_required, admin_required
from src.utils.validators import validate_email
import uuid

pagamentos_bp = Blueprint('pagamentos', __name__)

@pagamentos_bp.route('/planos/publicos', methods=['GET'])
def get_public_planos():
    """Lista planos públicos para contratação"""
    try:
        planos = Plano.query.filter_by(status='ativo').all()
        
        planos_data = []
        for plano in planos:
            plano_data = plano.to_dict()
            plano_data['desconto_anual'] = plano.get_discount_percentage()
            
            # Remover informações sensíveis
            plano_data.pop('created_at', None)
            plano_data.pop('updated_at', None)
            
            planos_data.append(plano_data)
        
        return jsonify({'planos': planos_data})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@pagamentos_bp.route('/checkout/create', methods=['POST'])
def create_checkout():
    """Cria checkout para nova assinatura"""
    try:
        data = request.get_json()
        
        # Validações obrigatórias
        required_fields = [
            'plano_id', 'empresa_data', 'usuario_data', 'billing_type'
        ]
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Campo {field} é obrigatório'}), 400
        
        # Validar plano
        plano = Plano.query.get(data['plano_id'])
        if not plano or plano.status != 'ativo':
            return jsonify({'error': 'Plano não encontrado ou inativo'}), 404
        
        # Validar dados da empresa
        empresa_data = data['empresa_data']
        required_empresa_fields = ['razao_social', 'cnpj', 'email_corporativo']
        for field in required_empresa_fields:
            if not empresa_data.get(field):
                return jsonify({'error': f'Campo empresa.{field} é obrigatório'}), 400
        
        # Validar dados do usuário
        usuario_data = data['usuario_data']
        required_usuario_fields = ['nome', 'email', 'password']
        for field in required_usuario_fields:
            if not usuario_data.get(field):
                return jsonify({'error': f'Campo usuario.{field} é obrigatório'}), 400
        
        # Validar emails
        if not validate_email(empresa_data['email_corporativo']):
            return jsonify({'error': 'Email corporativo inválido'}), 400
        
        if not validate_email(usuario_data['email']):
            return jsonify({'error': 'Email do usuário inválido'}), 400
        
        # Verificar se CNPJ já existe
        existing_empresa = Empresa.query.filter_by(cnpj=empresa_data['cnpj']).first()
        if existing_empresa:
            return jsonify({'error': 'CNPJ já cadastrado'}), 409
        
        # Verificar se email já existe
        from src.models.user import Usuario
        existing_user = Usuario.query.filter_by(email=usuario_data['email']).first()
        if existing_user:
            return jsonify({'error': 'Email do usuário já cadastrado'}), 409
        
        # Calcular valor baseado no tipo de cobrança
        billing_type = data['billing_type']  # 'monthly' ou 'annual'
        
        if billing_type == 'monthly':
            valor = plano.preco_mensal
            descricao = f"Assinatura Mensal - {plano.nome}"
        elif billing_type == 'annual':
            valor = plano.preco_anual or (plano.preco_mensal * 12)
            descricao = f"Assinatura Anual - {plano.nome}"
        else:
            return jsonify({'error': 'Tipo de cobrança inválido'}), 400
        
        # Gerar referência externa única
        external_reference = f"checkout_{uuid.uuid4().hex[:8]}"
        
        # Criar preferência de pagamento no Mercado Pago
        if not mercadopago_service:
            return jsonify({'error': 'Serviço de pagamento não configurado'}), 500
        
        payment_data = {
            'items': [{
                'title': descricao,
                'quantity': 1,
                'unit_price': float(valor),
                'currency_id': 'BRL'
            }],
            'payer': {
                'name': usuario_data['nome'],
                'email': usuario_data['email'],
                'identification': {
                    'type': 'CNPJ',
                    'number': empresa_data['cnpj']
                }
            },
            'external_reference': external_reference,
            'success_url': data.get('success_url', 'https://validadeinteligente.com/success'),
            'failure_url': data.get('failure_url', 'https://validadeinteligente.com/failure'),
            'pending_url': data.get('pending_url', 'https://validadeinteligente.com/pending'),
            'notification_url': data.get('notification_url', 'https://validadeinteligente.com/api/webhooks/mercadopago'),
            'expires': True,
            'expiration_date_to': (datetime.now() + timedelta(hours=24)).isoformat()
        }
        
        preference = mercadopago_service.create_payment_preference(payment_data)
        
        # Salvar dados temporários para processar após pagamento
        checkout_data = {
            'external_reference': external_reference,
            'plano_id': plano.id,
            'billing_type': billing_type,
            'valor': float(valor),
            'empresa_data': empresa_data,
            'usuario_data': usuario_data,
            'preference_id': preference['id'],
            'created_at': datetime.now().isoformat()
        }
        
        # Em produção, salvar em cache/Redis com TTL de 24h
        # Por simplicidade, vamos salvar em uma tabela temporária
        
        return jsonify({
            'checkout_id': external_reference,
            'preference_id': preference['id'],
            'init_point': preference['init_point'],
            'sandbox_init_point': preference.get('sandbox_init_point'),
            'valor': float(valor),
            'descricao': descricao,
            'expires_at': (datetime.now() + timedelta(hours=24)).isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@pagamentos_bp.route('/checkout/pix', methods=['POST'])
def create_pix_payment():
    """Cria pagamento PIX"""
    try:
        data = request.get_json()
        
        # Validações similares ao checkout normal
        required_fields = ['plano_id', 'empresa_data', 'usuario_data']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Campo {field} é obrigatório'}), 400
        
        plano = Plano.query.get(data['plano_id'])
        if not plano or plano.status != 'ativo':
            return jsonify({'error': 'Plano não encontrado'}), 404
        
        # Usar preço mensal para PIX (pagamento único)
        valor = plano.preco_mensal
        external_reference = f"pix_{uuid.uuid4().hex[:8]}"
        
        # Criar pagamento PIX
        pix_data = {
            'amount': float(valor),
            'description': f"Assinatura {plano.nome} - Validade Inteligente",
            'payer_email': data['usuario_data']['email'],
            'payer_name': data['usuario_data']['nome'],
            'payer_doc_type': 'CNPJ',
            'payer_doc_number': data['empresa_data']['cnpj'],
            'external_reference': external_reference,
            'notification_url': data.get('notification_url', 'https://validadeinteligente.com/api/webhooks/mercadopago')
        }
        
        pix_payment = mercadopago_service.create_pix_payment(pix_data)
        
        return jsonify({
            'payment_id': pix_payment['id'],
            'qr_code': pix_payment['qr_code'],
            'qr_code_base64': pix_payment['qr_code_base64'],
            'ticket_url': pix_payment['ticket_url'],
            'valor': float(valor),
            'expires_at': pix_payment.get('date_of_expiration'),
            'external_reference': external_reference
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@pagamentos_bp.route('/assinaturas', methods=['GET'])
@jwt_required()
@empresa_access_required
def list_assinaturas():
    """Lista assinaturas da empresa"""
    try:
        empresa_id = request.empresa_id
        
        assinaturas = Assinatura.query.filter_by(empresa_id=empresa_id).order_by(
            Assinatura.created_at.desc()
        ).all()
        
        assinaturas_data = []
        for assinatura in assinaturas:
            assinatura_data = assinatura.to_dict()
            assinatura_data['plano'] = assinatura.plano.to_dict()
            assinatura_data['dias_vencimento'] = assinatura.days_until_expiry()
            assinaturas_data.append(assinatura_data)
        
        return jsonify({'assinaturas': assinaturas_data})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@pagamentos_bp.route('/assinaturas/<int:assinatura_id>/cancelar', methods=['POST'])
@jwt_required()
@empresa_access_required
def cancel_assinatura(assinatura_id):
    """Cancela uma assinatura"""
    try:
        empresa_id = request.empresa_id
        data = request.get_json()
        
        assinatura = Assinatura.query.filter_by(
            id=assinatura_id, empresa_id=empresa_id
        ).first_or_404()
        
        if assinatura.status == 'cancelada':
            return jsonify({'error': 'Assinatura já está cancelada'}), 400
        
        # Cancelar no Mercado Pago se houver subscription_id
        # (implementar quando tiver assinaturas recorrentes)
        
        # Cancelar assinatura
        motivo = data.get('motivo', 'Cancelamento solicitado pelo cliente')
        assinatura.cancel(motivo)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Assinatura cancelada com sucesso',
            'assinatura': assinatura.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@pagamentos_bp.route('/pagamentos', methods=['GET'])
@jwt_required()
@empresa_access_required
def list_pagamentos():
    """Lista pagamentos da empresa"""
    try:
        empresa_id = request.empresa_id
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        status = request.args.get('status')
        
        query = Pagamento.query.filter_by(empresa_id=empresa_id)
        
        if status:
            query = query.filter(Pagamento.status == status)
        
        pagamentos = query.order_by(Pagamento.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        pagamentos_data = []
        for pagamento in pagamentos.items:
            pagamento_data = pagamento.to_dict()
            if pagamento.assinatura:
                pagamento_data['assinatura'] = {
                    'id': pagamento.assinatura.id,
                    'plano_nome': pagamento.assinatura.plano.nome
                }
            pagamentos_data.append(pagamento_data)
        
        return jsonify({
            'pagamentos': pagamentos_data,
            'total': pagamentos.total,
            'pages': pagamentos.pages,
            'current_page': page,
            'per_page': per_page
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@pagamentos_bp.route('/pagamentos/<int:pagamento_id>', methods=['GET'])
@jwt_required()
@empresa_access_required
def get_pagamento(pagamento_id):
    """Obtém detalhes de um pagamento"""
    try:
        empresa_id = request.empresa_id
        
        pagamento = Pagamento.query.filter_by(
            id=pagamento_id, empresa_id=empresa_id
        ).first_or_404()
        
        pagamento_data = pagamento.to_dict()
        
        # Adicionar informações da assinatura
        if pagamento.assinatura:
            pagamento_data['assinatura'] = pagamento.assinatura.to_dict()
            pagamento_data['assinatura']['plano'] = pagamento.assinatura.plano.to_dict()
        
        # Buscar informações atualizadas no Mercado Pago
        if pagamento.transaction_id and mercadopago_service:
            try:
                mp_info = mercadopago_service.get_payment_info(pagamento.transaction_id)
                pagamento_data['mercadopago_info'] = mp_info
            except:
                pass  # Ignorar erros da API externa
        
        return jsonify(pagamento_data)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@pagamentos_bp.route('/webhooks/mercadopago', methods=['POST'])
def mercadopago_webhook():
    """Webhook para notificações do Mercado Pago"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Dados não fornecidos'}), 400
        
        # Processar notificação
        if mercadopago_service:
            result = mercadopago_service.process_webhook_notification(data)
            
            # Log da notificação
            print(f"Webhook Mercado Pago processado: {result}")
            
            return jsonify({'status': 'processed', 'result': result})
        else:
            return jsonify({'error': 'Serviço não configurado'}), 500
        
    except Exception as e:
        print(f"Erro no webhook Mercado Pago: {str(e)}")
        return jsonify({'error': str(e)}), 500

@pagamentos_bp.route('/admin/pagamentos', methods=['GET'])
@jwt_required()
@admin_required
def admin_list_pagamentos():
    """Lista todos os pagamentos (apenas admin)"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        status = request.args.get('status')
        empresa_id = request.args.get('empresa_id', type=int)
        
        query = Pagamento.query
        
        if status:
            query = query.filter(Pagamento.status == status)
        
        if empresa_id:
            query = query.filter(Pagamento.empresa_id == empresa_id)
        
        pagamentos = query.order_by(Pagamento.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        pagamentos_data = []
        for pagamento in pagamentos.items:
            pagamento_data = pagamento.to_dict()
            pagamento_data['empresa'] = {
                'id': pagamento.empresa.id,
                'nome_fantasia': pagamento.empresa.nome_fantasia,
                'razao_social': pagamento.empresa.razao_social
            }
            if pagamento.assinatura:
                pagamento_data['assinatura'] = {
                    'id': pagamento.assinatura.id,
                    'plano_nome': pagamento.assinatura.plano.nome
                }
            pagamentos_data.append(pagamento_data)
        
        return jsonify({
            'pagamentos': pagamentos_data,
            'total': pagamentos.total,
            'pages': pagamentos.pages,
            'current_page': page,
            'per_page': per_page
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@pagamentos_bp.route('/admin/pagamentos/<int:pagamento_id>/estornar', methods=['POST'])
@jwt_required()
@admin_required
def admin_refund_payment(pagamento_id):
    """Estorna um pagamento (apenas admin)"""
    try:
        data = request.get_json()
        
        pagamento = Pagamento.query.get_or_404(pagamento_id)
        
        if not pagamento.is_paid():
            return jsonify({'error': 'Pagamento não está aprovado'}), 400
        
        if not pagamento.transaction_id:
            return jsonify({'error': 'ID da transação não encontrado'}), 400
        
        # Processar estorno no Mercado Pago
        amount = data.get('amount')  # Estorno parcial se especificado
        
        refund_result = mercadopago_service.refund_payment(
            pagamento.transaction_id, amount
        )
        
        # Atualizar status do pagamento
        pagamento.status = 'estornado'
        pagamento.observacoes = f"Estorno processado: {refund_result['id']}"
        pagamento.gateway_response = refund_result
        
        # Suspender assinatura se estorno total
        if not amount or amount >= pagamento.valor:
            if pagamento.assinatura:
                pagamento.assinatura.status = 'suspensa'
                pagamento.assinatura.empresa.status = 'suspenso'
        
        db.session.commit()
        
        return jsonify({
            'message': 'Estorno processado com sucesso',
            'refund': refund_result,
            'pagamento': pagamento.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@pagamentos_bp.route('/metodos-pagamento', methods=['GET'])
def get_payment_methods():
    """Obtém métodos de pagamento disponíveis"""
    try:
        if not mercadopago_service:
            return jsonify({'error': 'Serviço não configurado'}), 500
        
        methods = mercadopago_service.get_payment_methods()
        
        return jsonify(methods)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

