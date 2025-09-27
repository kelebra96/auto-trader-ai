import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration

# Importações locais
from config.settings import get_config
from models.user import db
from routes.auth import auth_bp
from routes.produtos import produtos_bp
from utils.logger import setup_logging, RequestLogger
from middleware.security import SecurityMiddleware

def create_app():
    """Factory function para criar a aplicação Flask"""
    app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
    
    # Configurações
    config = get_config()
    app.config.from_object(config)
    
    # Configurar Sentry se disponível
    if app.config.get('SENTRY_DSN'):
        sentry_sdk.init(
            dsn=app.config['SENTRY_DSN'],
            integrations=[FlaskIntegration()],
            traces_sample_rate=1.0
        )
    
    # Configurar logs
    setup_logging(app)
    
    # Inicializar extensões
    jwt = JWTManager(app)
    CORS(app, origins="*")
    
    # Rate limiting
    limiter = Limiter(
        key_func=get_remote_address,
        default_limits=[app.config.get('RATELIMIT_DEFAULT', '100 per hour')]
    )
    limiter.init_app(app)
    
    # Middleware de logs
    RequestLogger(app)
    
    # Configuração do banco de dados
    db.init_app(app)
    
    # Registrar blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(produtos_bp, url_prefix='/api')

    # Importar todos os modelos para criar as tabelas
    from models.produto import Produto, Alerta, HistoricoVenda, Gamificacao, Medalha, Meta

    with app.app_context():
        db.create_all()

    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path):
        static_folder_path = app.static_folder
        if static_folder_path is None:
                return "Static folder not configured", 404

        if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
            return send_from_directory(static_folder_path, path)
        else:
            index_path = os.path.join(static_folder_path, 'index.html')
            if os.path.exists(index_path):
                return send_from_directory(static_folder_path, 'index.html')
            else:
                return "index.html not found", 404

    # Handler para tokens expirados
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return {'error': 'Token expirado'}, 401

    # Handler para tokens inválidos
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return {'error': 'Token inválido'}, 401

    # Handler para tokens ausentes
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return {'error': 'Token de autorização necessário'}, 401

    return app

# Criar instância da aplicação
app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
