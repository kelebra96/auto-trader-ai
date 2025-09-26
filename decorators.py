from functools import wraps
from flask import request, jsonify, g
from flask_jwt_extended import get_jwt_identity, get_jwt, verify_jwt_in_request
from src.models.user import Usuario, db
from src.models.empresa import Empresa

def admin_required(f):
    """Decorator que requer perfil de administrador"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
            
            if not current_user_id:
                return jsonify({'error': 'Token inválido'}), 401
            
            user = Usuario.query.get(current_user_id)
            if not user:
                return jsonify({'error': 'Usuário não encontrado'}), 404
            
            if user.perfil != 'admin':
                return jsonify({'error': 'Acesso negado. Apenas administradores.'}), 403
            
            # Adicionar usuário ao contexto da requisição
            g.current_user = user
            
            return f(*args, **kwargs)
            
        except Exception as e:
            return jsonify({'error': 'Erro de autenticação'}), 401
    
    return decorated_function

def empresa_access_required(f):
    """Decorator que verifica acesso à empresa"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
            
            if not current_user_id:
                return jsonify({'error': 'Token inválido'}), 401
            
            user = Usuario.query.get(current_user_id)
            if not user:
                return jsonify({'error': 'Usuário não encontrado'}), 404
            
            if not user.is_active():
                return jsonify({'error': 'Usuário inativo'}), 403
            
            # Verificar se a empresa está ativa
            empresa = user.empresa
            if not empresa or not empresa.is_active():
                return jsonify({'error': 'Empresa inativa ou não encontrada'}), 403
            
            # Verificar se a assinatura está válida
            if not empresa.is_subscription_valid():
                return jsonify({'error': 'Assinatura vencida'}), 402
            
            # Adicionar ao contexto da requisição
            g.current_user = user
            g.current_empresa = empresa
            request.empresa_id = empresa.id
            request.user_id = user.id
            
            return f(*args, **kwargs)
            
        except Exception as e:
            return jsonify({'error': 'Erro de autenticação'}), 401
    
    return decorated_function

def permission_required(permission):
    """Decorator que verifica permissão específica"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                verify_jwt_in_request()
                current_user_id = get_jwt_identity()
                
                if not current_user_id:
                    return jsonify({'error': 'Token inválido'}), 401
                
                user = Usuario.query.get(current_user_id)
                if not user:
                    return jsonify({'error': 'Usuário não encontrado'}), 404
                
                # Admin tem todas as permissões
                if user.perfil == 'admin':
                    g.current_user = user
                    return f(*args, **kwargs)
                
                # Verificar permissão específica
                empresa = user.empresa
                if not empresa or not empresa.can_access_feature(permission):
                    return jsonify({'error': f'Acesso negado. Permissão {permission} necessária.'}), 403
                
                g.current_user = user
                g.current_empresa = empresa
                request.empresa_id = empresa.id
                request.user_id = user.id
                
                return f(*args, **kwargs)
                
            except Exception as e:
                return jsonify({'error': 'Erro de autenticação'}), 401
        
        return decorated_function
    return decorator

def role_required(*roles):
    """Decorator que verifica se o usuário tem um dos perfis especificados"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                verify_jwt_in_request()
                current_user_id = get_jwt_identity()
                
                if not current_user_id:
                    return jsonify({'error': 'Token inválido'}), 401
                
                user = Usuario.query.get(current_user_id)
                if not user:
                    return jsonify({'error': 'Usuário não encontrado'}), 404
                
                if user.perfil not in roles:
                    return jsonify({'error': f'Acesso negado. Perfis permitidos: {", ".join(roles)}'}), 403
                
                g.current_user = user
                if user.empresa:
                    g.current_empresa = user.empresa
                    request.empresa_id = user.empresa.id
                request.user_id = user.id
                
                return f(*args, **kwargs)
                
            except Exception as e:
                return jsonify({'error': 'Erro de autenticação'}), 401
        
        return decorated_function
    return decorator

def feature_required(feature_name):
    """Decorator que verifica se a empresa tem acesso a uma funcionalidade"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                verify_jwt_in_request()
                current_user_id = get_jwt_identity()
                
                if not current_user_id:
                    return jsonify({'error': 'Token inválido'}), 401
                
                user = Usuario.query.get(current_user_id)
                if not user or not user.empresa:
                    return jsonify({'error': 'Usuário ou empresa não encontrados'}), 404
                
                # Admin sempre tem acesso
                if user.perfil == 'admin':
                    g.current_user = user
                    g.current_empresa = user.empresa
                    return f(*args, **kwargs)
                
                # Verificar se a empresa pode acessar a funcionalidade
                if not user.empresa.can_access_feature(feature_name):
                    return jsonify({
                        'error': f'Funcionalidade {feature_name} não disponível no seu plano',
                        'upgrade_required': True
                    }), 402
                
                g.current_user = user
                g.current_empresa = user.empresa
                request.empresa_id = user.empresa.id
                request.user_id = user.id
                
                return f(*args, **kwargs)
                
            except Exception as e:
                return jsonify({'error': 'Erro de autenticação'}), 401
        
        return decorated_function
    return decorator

def usage_limit_check(resource_type):
    """Decorator que verifica limites de uso"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                verify_jwt_in_request()
                current_user_id = get_jwt_identity()
                
                if not current_user_id:
                    return jsonify({'error': 'Token inválido'}), 401
                
                user = Usuario.query.get(current_user_id)
                if not user or not user.empresa:
                    return jsonify({'error': 'Usuário ou empresa não encontrados'}), 404
                
                # Admin não tem limites
                if user.perfil == 'admin':
                    g.current_user = user
                    g.current_empresa = user.empresa
                    return f(*args, **kwargs)
                
                # Verificar limites de uso
                usage_check = user.empresa.check_usage_limits()
                
                # Verificar se o recurso específico está no limite
                for violation in usage_check['violations']:
                    if violation['resource'] == resource_type:
                        return jsonify({
                            'error': f'Limite de {resource_type} atingido',
                            'current_usage': violation['current'],
                            'limit': violation['limit'],
                            'upgrade_required': True
                        }), 402
                
                g.current_user = user
                g.current_empresa = user.empresa
                request.empresa_id = user.empresa.id
                request.user_id = user.id
                
                return f(*args, **kwargs)
                
            except Exception as e:
                return jsonify({'error': 'Erro de autenticação'}), 401
        
        return decorated_function
    return decorator

def log_activity(action_name):
    """Decorator que registra atividade do usuário"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                # Executar função original
                result = f(*args, **kwargs)
                
                # Registrar atividade se a função foi bem-sucedida
                if hasattr(g, 'current_user') and result[1] < 400:  # Status code < 400
                    from src.models.auditoria import LogAuditoria
                    
                    log = LogAuditoria(
                        empresa_id=getattr(g, 'current_empresa', {}).id if hasattr(g, 'current_empresa') else None,
                        usuario_id=g.current_user.id,
                        acao=action_name,
                        endpoint=request.endpoint,
                        metodo_http=request.method,
                        ip_address=request.remote_addr,
                        user_agent=request.headers.get('User-Agent')
                    )
                    
                    db.session.add(log)
                    db.session.commit()
                
                return result
                
            except Exception as e:
                # Se houver erro no log, não afetar a função principal
                return f(*args, **kwargs)
        
        return decorated_function
    return decorator

def validate_json_input(required_fields=None):
    """Decorator que valida entrada JSON"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                if not request.is_json:
                    return jsonify({'error': 'Content-Type deve ser application/json'}), 400
                
                data = request.get_json()
                if not data:
                    return jsonify({'error': 'Dados JSON são obrigatórios'}), 400
                
                # Verificar campos obrigatórios
                if required_fields:
                    missing_fields = []
                    for field in required_fields:
                        if field not in data or data[field] is None or data[field] == '':
                            missing_fields.append(field)
                    
                    if missing_fields:
                        return jsonify({
                            'error': 'Campos obrigatórios ausentes',
                            'missing_fields': missing_fields
                        }), 400
                
                return f(*args, **kwargs)
                
            except Exception as e:
                return jsonify({'error': 'Erro na validação dos dados'}), 400
        
        return decorated_function
    return decorator

def rate_limit_by_user(max_requests=100, window_seconds=3600):
    """Decorator que implementa rate limiting por usuário"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                verify_jwt_in_request()
                current_user_id = get_jwt_identity()
                
                if not current_user_id:
                    return jsonify({'error': 'Token inválido'}), 401
                
                # Implementar rate limiting usando Redis ou cache em memória
                # Por simplicidade, vamos pular a implementação completa aqui
                # Em produção, usar Redis com TTL
                
                return f(*args, **kwargs)
                
            except Exception as e:
                return jsonify({'error': 'Erro de rate limiting'}), 429
        
        return decorated_function
    return decorator

