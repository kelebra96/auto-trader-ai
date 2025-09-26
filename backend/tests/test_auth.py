"""
Testes para autenticação do Auto Trade AI / Validade Inteligente
"""
import pytest
import json
from src.models.user import User, db

class TestAuth:
    """Testes para rotas de autenticação"""
    
    def test_register_success(self, client):
        """Teste de registro bem-sucedido"""
        user_data = {
            'email': 'newuser@example.com',
            'password': 'NewPassword123!',
            'nome_estabelecimento': 'Nova Empresa',
            'cnpj': '11.222.333/0001-44',
            'telefone': '(11) 77777-7777',
            'endereco': 'Rua Nova, 789'
        }
        
        response = client.post('/api/auth/register', 
                             data=json.dumps(user_data),
                             content_type='application/json')
        
        assert response.status_code == 201
        data = response.get_json()
        assert 'access_token' in data
        assert data['user']['email'] == user_data['email']
    
    def test_register_duplicate_email(self, client):
        """Teste de registro com email duplicado"""
        user_data = {
            'email': 'duplicate@example.com',
            'password': 'Password123!',
            'nome_estabelecimento': 'Empresa 1',
            'cnpj': '11.111.111/0001-11',
            'telefone': '(11) 11111-1111',
            'endereco': 'Rua 1, 111'
        }
        
        # Primeiro registro
        client.post('/api/auth/register', 
                   data=json.dumps(user_data),
                   content_type='application/json')
        
        # Segundo registro com mesmo email
        response = client.post('/api/auth/register', 
                             data=json.dumps(user_data),
                             content_type='application/json')
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data
    
    def test_register_invalid_email(self, client):
        """Teste de registro com email inválido"""
        user_data = {
            'email': 'invalid-email',
            'password': 'Password123!',
            'nome_estabelecimento': 'Empresa',
            'cnpj': '11.111.111/0001-11',
            'telefone': '(11) 11111-1111',
            'endereco': 'Rua 1, 111'
        }
        
        response = client.post('/api/auth/register', 
                             data=json.dumps(user_data),
                             content_type='application/json')
        
        assert response.status_code == 400
    
    def test_register_weak_password(self, client):
        """Teste de registro com senha fraca"""
        user_data = {
            'email': 'weak@example.com',
            'password': '123',  # Senha muito fraca
            'nome_estabelecimento': 'Empresa',
            'cnpj': '11.111.111/0001-11',
            'telefone': '(11) 11111-1111',
            'endereco': 'Rua 1, 111'
        }
        
        response = client.post('/api/auth/register', 
                             data=json.dumps(user_data),
                             content_type='application/json')
        
        assert response.status_code == 400
    
    def test_login_success(self, client):
        """Teste de login bem-sucedido"""
        # Primeiro registrar usuário
        user_data = {
            'email': 'login@example.com',
            'password': 'LoginPassword123!',
            'nome_estabelecimento': 'Login Empresa',
            'cnpj': '22.222.222/0001-22',
            'telefone': '(11) 22222-2222',
            'endereco': 'Rua Login, 222'
        }
        
        client.post('/api/auth/register', 
                   data=json.dumps(user_data),
                   content_type='application/json')
        
        # Fazer login
        login_data = {
            'email': 'login@example.com',
            'password': 'LoginPassword123!'
        }
        
        response = client.post('/api/auth/login', 
                             data=json.dumps(login_data),
                             content_type='application/json')
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'access_token' in data
        assert data['user']['email'] == login_data['email']
    
    def test_login_invalid_credentials(self, client):
        """Teste de login com credenciais inválidas"""
        login_data = {
            'email': 'nonexistent@example.com',
            'password': 'WrongPassword123!'
        }
        
        response = client.post('/api/auth/login', 
                             data=json.dumps(login_data),
                             content_type='application/json')
        
        assert response.status_code == 401
        data = response.get_json()
        assert 'error' in data
    
    def test_login_missing_fields(self, client):
        """Teste de login com campos obrigatórios ausentes"""
        login_data = {
            'email': 'test@example.com'
            # password ausente
        }
        
        response = client.post('/api/auth/login', 
                             data=json.dumps(login_data),
                             content_type='application/json')
        
        assert response.status_code == 400
    
    def test_profile_access_with_token(self, client, auth_headers):
        """Teste de acesso ao perfil com token válido"""
        response = client.get('/api/auth/profile', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'user' in data
        assert data['user']['email'] == 'test@example.com'
    
    def test_profile_access_without_token(self, client):
        """Teste de acesso ao perfil sem token"""
        response = client.get('/api/auth/profile')
        
        assert response.status_code == 401
    
    def test_profile_access_invalid_token(self, client):
        """Teste de acesso ao perfil com token inválido"""
        headers = {'Authorization': 'Bearer invalid_token'}
        response = client.get('/api/auth/profile', headers=headers)
        
        assert response.status_code == 401
    
    def test_change_password_success(self, client, auth_headers):
        """Teste de alteração de senha bem-sucedida"""
        password_data = {
            'current_password': 'TestPassword123!',
            'new_password': 'NewTestPassword123!'
        }
        
        response = client.put('/api/auth/change-password', 
                            data=json.dumps(password_data),
                            content_type='application/json',
                            headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['message'] == 'Senha alterada com sucesso'
    
    def test_change_password_wrong_current(self, client, auth_headers):
        """Teste de alteração de senha com senha atual incorreta"""
        password_data = {
            'current_password': 'WrongPassword123!',
            'new_password': 'NewTestPassword123!'
        }
        
        response = client.put('/api/auth/change-password', 
                            data=json.dumps(password_data),
                            content_type='application/json',
                            headers=auth_headers)
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data