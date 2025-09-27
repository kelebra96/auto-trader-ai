"""
Sistema de logs estruturado para o Auto Trade AI / Validade Inteligente
"""
import os
import sys
import logging
import structlog
from datetime import datetime
from pythonjsonlogger import jsonlogger

def setup_logging(app):
    """Configura o sistema de logs estruturado"""
    
    # Configuração do nível de log
    log_level = getattr(logging, app.config.get('LOG_LEVEL', 'INFO').upper())
    
    # Configuração do structlog
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer()
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )
    
    # Configuração do handler para arquivo
    log_file = app.config.get('LOG_FILE', 'app.log')
    log_dir = os.path.dirname(log_file) if os.path.dirname(log_file) else 'logs'
    
    # Cria diretório de logs se não existir
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
    
    # Handler para arquivo com rotação
    from logging.handlers import RotatingFileHandler
    file_handler = RotatingFileHandler(
        log_file,
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=5
    )
    file_handler.setLevel(log_level)
    
    # Handler para console
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    
    # Formatador JSON
    json_formatter = jsonlogger.JsonFormatter(
        '%(asctime)s %(name)s %(levelname)s %(message)s'
    )
    
    file_handler.setFormatter(json_formatter)
    console_handler.setFormatter(json_formatter)
    
    # Configuração do logger do Flask
    app.logger.setLevel(log_level)
    app.logger.addHandler(file_handler)
    app.logger.addHandler(console_handler)
    
    # Remove handlers padrão do Flask
    app.logger.handlers.clear()
    app.logger.addHandler(file_handler)
    app.logger.addHandler(console_handler)
    
    # Logger para SQLAlchemy (opcional)
    if app.config.get('DEBUG'):
        logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)
    
    return structlog.get_logger()

class RequestLogger:
    """Middleware para log de requisições HTTP"""
    
    def __init__(self, app=None):
        self.app = app
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        app.before_request(self.log_request)
        app.after_request(self.log_response)
    
    def log_request(self):
        """Log da requisição recebida"""
        from flask import request
        
        logger = structlog.get_logger()
        logger.info(
            "Requisição recebida",
            method=request.method,
            path=request.path,
            remote_addr=request.remote_addr,
            user_agent=request.headers.get('User-Agent', ''),
            content_length=request.content_length,
            args=dict(request.args)
        )
    
    def log_response(self, response):
        """Log da resposta enviada"""
        from flask import request
        
        logger = structlog.get_logger()
        logger.info(
            "Resposta enviada",
            method=request.method,
            path=request.path,
            status_code=response.status_code,
            content_length=response.content_length
        )
        return response

class DatabaseLogger:
    """Logger para operações de banco de dados"""
    
    @staticmethod
    def log_query(query_type, table, user_id=None, **kwargs):
        """Log de operações no banco"""
        logger = structlog.get_logger()
        logger.info(
            "Operação no banco de dados",
            query_type=query_type,
            table=table,
            user_id=user_id,
            timestamp=datetime.utcnow().isoformat(),
            **kwargs
        )
    
    @staticmethod
    def log_error(error, query_type, table, user_id=None, **kwargs):
        """Log de erros no banco"""
        logger = structlog.get_logger()
        logger.error(
            "Erro no banco de dados",
            error=str(error),
            query_type=query_type,
            table=table,
            user_id=user_id,
            timestamp=datetime.utcnow().isoformat(),
            **kwargs
        )

class SecurityLogger:
    """Logger para eventos de segurança"""
    
    @staticmethod
    def log_login_attempt(email, success, ip_address, user_agent):
        """Log de tentativas de login"""
        logger = structlog.get_logger()
        logger.info(
            "Tentativa de login",
            email=email,
            success=success,
            ip_address=ip_address,
            user_agent=user_agent,
            timestamp=datetime.utcnow().isoformat()
        )
    
    @staticmethod
    def log_failed_auth(reason, ip_address, user_agent, **kwargs):
        """Log de falhas de autenticação"""
        logger = structlog.get_logger()
        logger.warning(
            "Falha de autenticação",
            reason=reason,
            ip_address=ip_address,
            user_agent=user_agent,
            timestamp=datetime.utcnow().isoformat(),
            **kwargs
        )
    
    @staticmethod
    def log_suspicious_activity(activity_type, details, user_id=None, ip_address=None):
        """Log de atividades suspeitas"""
        logger = structlog.get_logger()
        logger.warning(
            "Atividade suspeita detectada",
            activity_type=activity_type,
            details=details,
            user_id=user_id,
            ip_address=ip_address,
            timestamp=datetime.utcnow().isoformat()
        )

class BusinessLogger:
    """Logger para eventos de negócio"""
    
    @staticmethod
    def log_product_expiring(product_id, product_name, days_to_expire, user_id):
        """Log de produtos próximos ao vencimento"""
        logger = structlog.get_logger()
        logger.info(
            "Produto próximo ao vencimento",
            product_id=product_id,
            product_name=product_name,
            days_to_expire=days_to_expire,
            user_id=user_id,
            timestamp=datetime.utcnow().isoformat()
        )
    
    @staticmethod
    def log_sale_registered(product_id, quantity, price, user_id):
        """Log de vendas registradas"""
        logger = structlog.get_logger()
        logger.info(
            "Venda registrada",
            product_id=product_id,
            quantity=quantity,
            price=price,
            user_id=user_id,
            timestamp=datetime.utcnow().isoformat()
        )
    
    @staticmethod
    def log_ai_suggestion(product_id, suggestion_type, details, user_id):
        """Log de sugestões da IA"""
        logger = structlog.get_logger()
        logger.info(
            "Sugestão da IA gerada",
            product_id=product_id,
            suggestion_type=suggestion_type,
            details=details,
            user_id=user_id,
            timestamp=datetime.utcnow().isoformat()
        )