"""
Middleware de segurança para o Auto Trade AI / Validade Inteligente
"""
import re
import html
from functools import wraps
from flask import request, jsonify, current_app
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from marshmallow import ValidationError
import structlog

logger = structlog.get_logger()

class SecurityMiddleware:
    """Middleware de segurança centralizado"""
    
    # Padrões para validação
    EMAIL_PATTERN = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    CNPJ_PATTERN = re.compile(r'^\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}$')
    PHONE_PATTERN = re.compile(r'^\(\d{2}\)\s\d{4,5}-\d{4}$')
    
    # Lista de palavras proibidas (SQL Injection, XSS)
    FORBIDDEN_PATTERNS = [
        r'<script[^>]*>.*?</script>',
        r'javascript:',
        r'on\w+\s*=',
        r'union\s+select',
        r'drop\s+table',
        r'delete\s+from',
        r'insert\s+into',
        r'update\s+set',
    ]
    
    @staticmethod
    def sanitize_input(data):
        """Sanitiza entrada de dados"""
        if isinstance(data, str):
            # Remove tags HTML
            data = html.escape(data)
            
            # Verifica padrões maliciosos
            for pattern in SecurityMiddleware.FORBIDDEN_PATTERNS:
                if re.search(pattern, data, re.IGNORECASE):
                    logger.warning("Tentativa de injeção detectada", pattern=pattern, data=data[:100])
                    raise ValidationError("Entrada inválida detectada")
            
            return data.strip()
        
        elif isinstance(data, dict):
            return {key: SecurityMiddleware.sanitize_input(value) for key, value in data.items()}
        
        elif isinstance(data, list):
            return [SecurityMiddleware.sanitize_input(item) for item in data]
        
        return data
    
    @staticmethod
    def validate_email(email):
        """Valida formato de email"""
        if not email or not SecurityMiddleware.EMAIL_PATTERN.match(email):
            raise ValidationError("Email inválido")
        return email.lower()
    
    @staticmethod
    def validate_cnpj(cnpj):
        """Valida formato de CNPJ"""
        if not cnpj or not SecurityMiddleware.CNPJ_PATTERN.match(cnpj):
            raise ValidationError("CNPJ inválido")
        return cnpj
    
    @staticmethod
    def validate_phone(phone):
        """Valida formato de telefone"""
        if not phone or not SecurityMiddleware.PHONE_PATTERN.match(phone):
            raise ValidationError("Telefone inválido")
        return phone
    
    @staticmethod
    def validate_password_strength(password):
        """Valida força da senha"""
        if not password or len(password) < 8:
            raise ValidationError("Senha deve ter pelo menos 8 caracteres")
        
        if not re.search(r'[A-Z]', password):
            raise ValidationError("Senha deve conter pelo menos uma letra maiúscula")
        
        if not re.search(r'[a-z]', password):
            raise ValidationError("Senha deve conter pelo menos uma letra minúscula")
        
        if not re.search(r'\d', password):
            raise ValidationError("Senha deve conter pelo menos um número")
        
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            raise ValidationError("Senha deve conter pelo menos um caractere especial")
        
        return password

def require_auth(f):
    """Decorator para rotas que requerem autenticação"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            verify_jwt_in_request()
            return f(*args, **kwargs)
        except Exception as e:
            logger.warning("Falha na autenticação", error=str(e))
            return jsonify({'error': 'Token inválido ou expirado'}), 401
    return decorated_function

def require_admin(f):
    """Decorator para rotas que requerem privilégios de admin"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            
            # Aqui você verificaria se o usuário é admin
            # Por enquanto, vamos assumir que existe uma função para isso
            from ..models.user import User
            user = User.query.get(user_id)
            
            if not user or not user.is_admin:
                logger.warning("Tentativa de acesso admin negada", user_id=user_id)
                return jsonify({'error': 'Acesso negado'}), 403
            
            return f(*args, **kwargs)
        except Exception as e:
            logger.warning("Falha na verificação de admin", error=str(e))
            return jsonify({'error': 'Acesso negado'}), 403
    return decorated_function

def validate_json(schema_class):
    """Decorator para validação de JSON usando Marshmallow"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                if not request.is_json:
                    return jsonify({'error': 'Content-Type deve ser application/json'}), 400
                
                data = request.get_json()
                if not data:
                    return jsonify({'error': 'JSON inválido ou vazio'}), 400
                
                # Sanitiza os dados
                sanitized_data = SecurityMiddleware.sanitize_input(data)
                
                # Valida com schema
                schema = schema_class()
                validated_data = schema.load(sanitized_data)
                
                # Adiciona dados validados ao request
                request.validated_data = validated_data
                
                return f(*args, **kwargs)
                
            except ValidationError as e:
                logger.warning("Erro de validação", errors=e.messages)
                return jsonify({'error': 'Dados inválidos', 'details': e.messages}), 400
            except Exception as e:
                logger.error("Erro na validação JSON", error=str(e))
                return jsonify({'error': 'Erro interno do servidor'}), 500
        
        return decorated_function
    return decorator

def log_request():
    """Middleware para log de requisições"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            logger.info(
                "Requisição recebida",
                method=request.method,
                path=request.path,
                remote_addr=request.remote_addr,
                user_agent=request.headers.get('User-Agent', '')
            )
            
            try:
                response = f(*args, **kwargs)
                logger.info("Requisição processada com sucesso", status_code=200)
                return response
            except Exception as e:
                logger.error("Erro no processamento da requisição", error=str(e))
                raise
        
        return decorated_function
    return decorator