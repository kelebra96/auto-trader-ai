import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, jsonify, request, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
import json
import uuid
import csv
import io
from functools import wraps
from sqlalchemy import Text

# Configuração básica
app = Flask(__name__)

# Configuração MySQL explícita para VPS
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['JWT_SECRET_KEY'] = 'your-jwt-secret-key-here'

# Configuração MySQL explícita
MYSQL_USER = 'autotrader'
MYSQL_PASSWORD = 'autotrader123'
MYSQL_HOST = 'localhost'
MYSQL_PORT = 3306
MYSQL_DATABASE = 'autotrader_db'

app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}?charset=utf8mb4'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_pre_ping': True,
    'pool_recycle': 300,
    'pool_timeout': 20,
    'max_overflow': 0,
}

print(f"Using database: {app.config['SQLALCHEMY_DATABASE_URI']}")

# Configurações específicas para desenvolvimento (se necessário)
if not app.config.get('UPLOAD_FOLDER'):
    basedir = os.path.abspath(os.path.dirname(__file__))
    app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(basedir), 'uploads')

# Inicializar extensões
db = SQLAlchemy(app)
jwt = JWTManager(app)
CORS(app, origins="*")

# Classe auxiliar para campos JSON compatíveis com MySQL
class JSONField(db.TypeDecorator):
    """Campo JSON compatível com MySQL"""
    impl = Text
    
    def process_bind_param(self, value, dialect):
        if value is not None:
            return json.dumps(value)
        return value
    
    def process_result_value(self, value, dialect):
        if value is not None:
            try:
                return json.loads(value)
            except (ValueError, TypeError):
                return value
        return value

# Logging de requisições
@app.before_request
def log_request_info():
    print(f"Request: {request.method} {request.url}")
    if request.is_json:
        print(f"Request JSON: {request.get_json()}")

@app.after_request
def log_response_info(response):
    print(f"Response: {response.status_code}")
    if response.is_json:
        try:
            data = response.get_json()
            if isinstance(data, dict) and 'password' in str(data):
                print("Response JSON: [REDACTED - contains password]")
            else:
                print(f"Response JSON: {data}")
        except:
            print("Response: [Could not parse JSON]")
    return response

# JWT error handlers
@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({'error': 'Token expirado'}), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({'error': 'Token inválido'}), 401

@jwt.unauthorized_loader
def missing_token_callback(error):
    return jsonify({'error': 'Token de acesso necessário'}), 401

# Models
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    nome_estabelecimento = db.Column(db.String(200), nullable=False)
    
    # Campos adicionais do perfil
    nome_completo = db.Column(db.String(200), nullable=True)
    telefone = db.Column(db.String(20), nullable=True)
    empresa = db.Column(db.String(200), nullable=True)
    bio = db.Column(db.Text, nullable=True)
    foto_perfil = db.Column(db.String(500), nullable=True)  # URL ou caminho da foto
    
    # Sistema de permissões
    cargo = db.Column(db.String(100), default='usuario')  # admin, gerente, usuario, visualizador
    permissoes = db.Column(JSONField, nullable=True)  # Lista de permissões específicas
    ativo = db.Column(db.Boolean, default=True)
    
    # Campos de segurança
    ultimo_login = db.Column(db.DateTime, nullable=True)
    tentativas_login = db.Column(db.Integer, default=0)
    bloqueado_ate = db.Column(db.DateTime, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def set_password(self, password):
        """Define a senha do usuário usando hash seguro"""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Verifica se a senha fornecida está correta"""
        print(f"Checking password for user {self.email}")
        print(f"User password hash in DB: {self.password_hash}")
        result = check_password_hash(self.password_hash, password)
        print(f"Password check result: {result}")
        return result

    def to_dict(self, include_sensitive=False):
        """Converte o usuário para dicionário"""
        data = {
            'id': self.id,
            'email': self.email,
            'nome_estabelecimento': self.nome_estabelecimento,
            'nome_completo': self.nome_completo,
            'telefone': self.telefone,
            'empresa': self.empresa,
            'bio': self.bio,
            'foto_perfil': self.foto_perfil,
            'cargo': self.cargo,
            'permissoes': self.permissoes,
            'ativo': self.ativo,
            'ultimo_login': self.ultimo_login.isoformat() if self.ultimo_login else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_sensitive:
            data.update({
                'tentativas_login': self.tentativas_login,
                'bloqueado_ate': self.bloqueado_ate.isoformat() if self.bloqueado_ate else None
            })
        
        return data

# Login route
@app.route('/api/auth/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        print(f"Login attempt for: {data.get('email')}")
        
        if not data or not data.get('email') or not data.get('password'):
            print("Missing email or password")
            return jsonify({'error': 'Dados inválidos'}), 400
        
        email = data.get('email').strip().lower()
        password = data.get('password')
        
        print(f"Looking for user with email: {email}")
        user = User.query.filter_by(email=email).first()
        
        if not user:
            print(f"User not found: {email}")
            return jsonify({'error': 'Credenciais inválidas'}), 401
        
        print(f"User found: {user.email}, checking password...")
        
        if not user.check_password(password):
            print("Password check failed")
            return jsonify({'error': 'Credenciais inválidas'}), 401
        
        print("Password check successful, creating token...")
        
        # Criar token de acesso
        access_token = create_access_token(
            identity=user.id,
            expires_delta=timedelta(hours=24)
        )
        
        # Atualizar último login
        user.ultimo_login = datetime.utcnow()
        user.tentativas_login = 0
        db.session.commit()
        
        print("Login successful!")
        
        return jsonify({
            'access_token': access_token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@app.route('/api/test', methods=['GET'])
def test():
    return jsonify({'message': 'API funcionando!', 'database': app.config['SQLALCHEMY_DATABASE_URI']})

if __name__ == '__main__':
    with app.app_context():
        try:
            db.create_all()
            print("Database initialized successfully")
            print(f"Database URL: {app.config['SQLALCHEMY_DATABASE_URI']}")
        except Exception as e:
            print(f"Database initialization error: {e}")

    print("Starting Flask server on http://0.0.0.0:5001")
    app.run(host='0.0.0.0', port=5001, debug=True)