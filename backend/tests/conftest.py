"""
Configurações para testes do Auto Trade AI / Validade Inteligente
"""
import pytest
import tempfile
import os
from src.main import create_app
from src.models.user import db, User
from src.models.produto import Produto, Alerta, HistoricoVenda, Gamificacao, Medalha, Meta

@pytest.fixture
def app():
    """Fixture para criar aplicação de teste"""
    # Criar banco temporário
    db_fd, db_path = tempfile.mkstemp()
    
    # Configurar app para testes
    os.environ['FLASK_ENV'] = 'testing'
    os.environ['DATABASE_URL'] = f'sqlite:///{db_path}'
    
    app = create_app()
    
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()
    
    os.close(db_fd)
    os.unlink(db_path)

@pytest.fixture
def client(app):
    """Fixture para cliente de teste"""
    return app.test_client()

@pytest.fixture
def runner(app):
    """Fixture para runner CLI"""
    return app.test_cli_runner()

@pytest.fixture
def auth_headers(client):
    """Fixture para headers de autenticação"""
    # Criar usuário de teste
    user_data = {
        'email': 'test@example.com',
        'password': 'TestPassword123!',
        'nome_estabelecimento': 'Teste Ltda',
        'cnpj': '12.345.678/0001-90',
        'telefone': '(11) 99999-9999',
        'endereco': 'Rua Teste, 123'
    }
    
    # Registrar usuário
    client.post('/api/auth/register', json=user_data)
    
    # Fazer login
    login_data = {
        'email': 'test@example.com',
        'password': 'TestPassword123!'
    }
    
    response = client.post('/api/auth/login', json=login_data)
    token = response.get_json()['access_token']
    
    return {'Authorization': f'Bearer {token}'}

@pytest.fixture
def sample_user():
    """Fixture para usuário de exemplo"""
    user = User(
        email='sample@example.com',
        nome_estabelecimento='Sample Store',
        cnpj='98.765.432/0001-10',
        telefone='(11) 88888-8888',
        endereco='Rua Sample, 456'
    )
    user.set_password('SamplePassword123!')
    return user

@pytest.fixture
def sample_produto():
    """Fixture para produto de exemplo"""
    return {
        'nome': 'Produto Teste',
        'categoria': 'Categoria Teste',
        'data_validade': '2024-12-31',
        'quantidade': 10,
        'preco': 29.99,
        'fornecedor': 'Fornecedor Teste',
        'codigo_barras': '1234567890123'
    }