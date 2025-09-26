from flask import Blueprint, request, jsonify, make_response
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from datetime import datetime, timedelta
from src.models.user import db
from src.models.auditoria import LogAuditoria, SessaoUsuario, TentativaLogin
from src.services.auth_service import auth_service
from src.utils.decorators import admin_required, empresa_access_required
import secrets

auth_advanced_bp = Blueprint('auth_advanced', __name__)

@auth_advanced_bp.route('/auth/login', methods=['POST'])
def login():
    """Login avançado com controle de segurança"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Dados não fornecidos'}), 400
        
        email = data.get('email')
        password = data.get('password')
        remember_me = data.get('remember_me', False)
        
        if not email or not password:
            return jsonify({'error': 'Email e senha são obrigatórios'}), 400
        
        # Obter informações da requisição
        ip_address = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
        user_agent = request.headers.get('User-Agent')
        
        # Autenticar usuário
        result = auth_service.authenticate_user(email, password, ip_address, user_agent)
        
        if not result['success']:
            return jsonify({
                'error': result['error'],
                'code': result['code']
            }), 401
        
        # Criar resposta com cookies seguros
        response_data = {
            'success': True,
            'user': result['user'],
            'session_expires_at': result['session_expires_at']
        }
        
        response = make_response(jsonify(response_data))
        
        # Configurar cookies seguros
        cookie_options = {
            'httponly': True,
            'secure': request.is_secure,
            'samesite': 'Lax'
        }
        
        if remember_me:
            cookie_options['max_age'] = 30 * 24 * 60 * 60  # 30 dias
        
        # Definir cookies
        response.set_cookie('access_token', result['tokens']['access_token'], **cookie_options)
        response.set_cookie('refresh_token', result['tokens']['refresh_token'], **cookie_options)
        
        # Também retornar tokens no body para clientes que preferem headers
        response_data['tokens'] = result['tokens']
        
        return response
        
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@auth_advanced_bp.route('/auth/refresh', methods=['POST'])
def refresh_token():
    """Renova token de acesso"""
    try:
        # Tentar obter refresh token do cookie ou body
        refresh_token = request.cookies.get('refresh_token')
        
        if not refresh_token:
            data = request.get_json()
            refresh_token = data.get('refresh_token') if data else None
        
        if not refresh_token:
            return jsonify({'error': 'Refresh token não fornecido'}), 400
        
        # Obter informações da requisição
        ip_address = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
        user_agent = request.headers.get('User-Agent')
        
        # Renovar sessão
        result = auth_service.refresh_user_session(refresh_token, ip_address, user_agent)
        
        if not result['success']:
            return jsonify({
                'error': result['error'],
                'code': result['code']
            }), 401
        
        # Criar resposta com novos cookies
        response_data = {
            'success': True,
            'tokens': result['tokens'],
            'session_expires_at': result['session_expires_at']
        }
        
        response = make_response(jsonify(response_data))
        
        # Atualizar cookies
        cookie_options = {
            'httponly': True,
            'secure': request.is_secure,
            'samesite': 'Lax'
        }
        
        response.set_cookie('access_token', result['tokens']['access_token'], **cookie_options)
        response.set_cookie('refresh_token', result['tokens']['refresh_token'], **cookie_options)
        
        return response
        
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@auth_advanced_bp.route('/auth/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout com revogação de sessão"""
    try:
        # Obter token atual
        access_token = request.cookies.get('access_token')
        
        if not access_token:
            # Tentar obter do header Authorization
            auth_header = request.headers.get('Authorization')
            if auth_header and auth_header.startswith('Bearer '):
                access_token = auth_header.split(' ')[1]
        
        if not access_token:
            return jsonify({'error': 'Token não encontrado'}), 400
        
        # Obter informações da requisição
        ip_address = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
        
        # Fazer logout
        result = auth_service.logout_user(access_token, ip_address)
        
        # Criar resposta e limpar cookies
        response = make_response(jsonify(result))
        response.set_cookie('access_token', '', expires=0)
        response.set_cookie('refresh_token', '', expires=0)
        
        return response
        
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@auth_advanced_bp.route('/auth/logout-all', methods=['POST'])
@jwt_required()
def logout_all():
    """Logout de todas as sessões"""
    try:
        user_id = get_jwt_identity()
        current_jti = get_jwt().get('jti')
        ip_address = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
        
        result = auth_service.logout_all_sessions(user_id, current_jti, ip_address)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@auth_advanced_bp.route('/auth/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Altera senha do usuário"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Dados não fornecidos'}), 400
        
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if not current_password or not new_password:
            return jsonify({'error': 'Senha atual e nova senha são obrigatórias'}), 400
        
        ip_address = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
        
        result = auth_service.change_password(user_id, current_password, new_password, ip_address)
        
        if not result['success']:
            return jsonify({
                'error': result['error'],
                'code': result['code'],
                'feedback': result.get('feedback')
            }), 400
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@auth_advanced_bp.route('/auth/forgot-password', methods=['POST'])
def forgot_password():
    """Solicita reset de senha"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Dados não fornecidos'}), 400
        
        email = data.get('email')
        
        if not email:
            return jsonify({'error': 'Email é obrigatório'}), 400
        
        ip_address = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
        
        result = auth_service.request_password_reset(email, ip_address)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@auth_advanced_bp.route('/auth/reset-password', methods=['POST'])
def reset_password():
    """Reseta senha usando token"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Dados não fornecidos'}), 400
        
        token = data.get('token')
        new_password = data.get('new_password')
        
        if not token or not new_password:
            return jsonify({'error': 'Token e nova senha são obrigatórios'}), 400
        
        ip_address = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
        
        result = auth_service.reset_password(token, new_password, ip_address)
        
        if not result['success']:
            return jsonify({
                'error': result['error'],
                'code': result['code'],
                'feedback': result.get('feedback')
            }), 400
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@auth_advanced_bp.route('/auth/validate', methods=['GET'])
@jwt_required()
def validate_token():
    """Valida token atual"""
    try:
        user_id = get_jwt_identity()
        access_token = request.cookies.get('access_token')
        
        if not access_token:
            auth_header = request.headers.get('Authorization')
            if auth_header and auth_header.startswith('Bearer '):
                access_token = auth_header.split(' ')[1]
        
        if not access_token:
            return jsonify({'valid': False, 'error': 'Token não encontrado'}), 400
        
        result = auth_service.validate_session(access_token)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'valid': False, 'error': 'Erro interno do servidor'}), 500

@auth_advanced_bp.route('/auth/sessions', methods=['GET'])
@jwt_required()
def get_user_sessions():
    """Lista sessões ativas do usuário"""
    try:
        user_id = get_jwt_identity()
        
        sessions = auth_service.get_user_sessions(user_id)
        
        return jsonify({
            'sessions': sessions,
            'total': len(sessions)
        })
        
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@auth_advanced_bp.route('/auth/sessions/<int:session_id>/revoke', methods=['POST'])
@jwt_required()
def revoke_session(session_id):
    """Revoga uma sessão específica"""
    try:
        user_id = get_jwt_identity()
        
        sessao = SessaoUsuario.query.filter_by(
            id=session_id,
            usuario_id=user_id,
            ativo=True
        ).first()
        
        if not sessao:
            return jsonify({'error': 'Sessão não encontrada'}), 404
        
        sessao.revoke('user_request')
        
        # Log de auditoria
        LogAuditoria.log_auth_event(
            'session_revoked',
            usuario_id=user_id,
            success=True,
            dados_novos={'session_id': session_id}
        )
        
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Sessão revogada com sucesso'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Erro interno do servidor'}), 500

@auth_advanced_bp.route('/auth/security/login-attempts', methods=['GET'])
@jwt_required()
@empresa_access_required
def get_login_attempts():
    """Lista tentativas de login da empresa"""
    try:
        empresa_id = request.empresa_id
        user_id = request.user_id
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        
        # Buscar usuários da empresa
        from src.models.user import Usuario
        usuarios_empresa = Usuario.query.filter_by(empresa_id=empresa_id).all()
        emails_empresa = [u.email for u in usuarios_empresa]
        
        # Buscar tentativas de login
        query = TentativaLogin.query.filter(
            TentativaLogin.email.in_(emails_empresa)
        ).order_by(TentativaLogin.created_at.desc())
        
        tentativas = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'tentativas': [t.to_dict() for t in tentativas.items],
            'total': tentativas.total,
            'pages': tentativas.pages,
            'current_page': page,
            'per_page': per_page
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_advanced_bp.route('/auth/security/audit-logs', methods=['GET'])
@jwt_required()
@empresa_access_required
def get_audit_logs():
    """Lista logs de auditoria da empresa"""
    try:
        empresa_id = request.empresa_id
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        categoria = request.args.get('categoria')
        nivel = request.args.get('nivel')
        usuario_id = request.args.get('usuario_id', type=int)
        
        query = LogAuditoria.query.filter_by(empresa_id=empresa_id)
        
        if categoria:
            query = query.filter(LogAuditoria.categoria == categoria)
        
        if nivel:
            query = query.filter(LogAuditoria.nivel == nivel)
        
        if usuario_id:
            query = query.filter(LogAuditoria.usuario_id == usuario_id)
        
        logs = query.order_by(LogAuditoria.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        logs_data = []
        for log in logs.items:
            log_data = log.to_dict()
            if log.usuario:
                log_data['usuario_nome'] = log.usuario.nome
            logs_data.append(log_data)
        
        return jsonify({
            'logs': logs_data,
            'total': logs.total,
            'pages': logs.pages,
            'current_page': page,
            'per_page': per_page
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_advanced_bp.route('/auth/admin/sessions', methods=['GET'])
@jwt_required()
@admin_required
def admin_get_all_sessions():
    """Lista todas as sessões ativas (apenas admin)"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        empresa_id = request.args.get('empresa_id', type=int)
        
        query = SessaoUsuario.query.filter_by(ativo=True)
        
        if empresa_id:
            # Filtrar por empresa através dos usuários
            from src.models.user import Usuario
            usuarios_empresa = Usuario.query.filter_by(empresa_id=empresa_id).all()
            user_ids = [u.id for u in usuarios_empresa]
            query = query.filter(SessaoUsuario.usuario_id.in_(user_ids))
        
        sessoes = query.order_by(SessaoUsuario.ultimo_acesso.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        sessoes_data = []
        for sessao in sessoes.items:
            sessao_data = sessao.to_dict()
            if sessao.usuario:
                sessao_data['usuario_nome'] = sessao.usuario.nome
                sessao_data['usuario_email'] = sessao.usuario.email
                if sessao.usuario.empresa:
                    sessao_data['empresa_nome'] = sessao.usuario.empresa.nome_fantasia
            sessoes_data.append(sessao_data)
        
        return jsonify({
            'sessoes': sessoes_data,
            'total': sessoes.total,
            'pages': sessoes.pages,
            'current_page': page,
            'per_page': per_page
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_advanced_bp.route('/auth/admin/sessions/<int:session_id>/revoke', methods=['POST'])
@jwt_required()
@admin_required
def admin_revoke_session(session_id):
    """Revoga sessão específica (apenas admin)"""
    try:
        admin_user_id = get_jwt_identity()
        data = request.get_json()
        motivo = data.get('motivo', 'admin_action') if data else 'admin_action'
        
        sessao = SessaoUsuario.query.filter_by(id=session_id, ativo=True).first()
        
        if not sessao:
            return jsonify({'error': 'Sessão não encontrada'}), 404
        
        sessao.revoke(motivo)
        
        # Log de auditoria
        LogAuditoria.log_auth_event(
            'admin_session_revoked',
            usuario_id=admin_user_id,
            success=True,
            dados_novos={
                'revoked_session_id': session_id,
                'revoked_user_id': sessao.usuario_id,
                'motivo': motivo
            }
        )
        
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Sessão revogada com sucesso'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Erro interno do servidor'}), 500

@auth_advanced_bp.route('/auth/admin/cleanup', methods=['POST'])
@jwt_required()
@admin_required
def admin_cleanup_expired_data():
    """Limpa dados expirados (apenas admin)"""
    try:
        admin_user_id = get_jwt_identity()
        
        result = auth_service.cleanup_expired_data()
        
        # Log de auditoria
        LogAuditoria.log_system_event(
            'data_cleanup',
            details=result,
            nivel='info'
        )
        
        return jsonify({
            'success': True,
            'message': 'Limpeza realizada com sucesso',
            'result': result
        })
        
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

