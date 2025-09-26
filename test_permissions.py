#!/usr/bin/env python3
"""
Script de teste para verificar o sistema de permissões
"""

import requests
import json
import sys

BASE_URL = "http://localhost:5000"

def test_user_login(email, password):
    """Testa login de usuário"""
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": password
        })
        
        if response.status_code == 200:
            data = response.json()
            return data.get('access_token'), data.get('user')
        else:
            print(f"❌ Erro no login: {response.status_code} - {response.text}")
            return None, None
    except Exception as e:
        print(f"❌ Erro na conexão: {e}")
        return None, None

def test_permissions_endpoint(token):
    """Testa o endpoint de permissões"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/usuarios/permissoes", headers=headers)
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ Erro ao buscar permissões: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Erro na conexão: {e}")
        return None

def test_protected_route(token, route, expected_status=200):
    """Testa uma rota protegida"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}{route}", headers=headers)
        
        success = response.status_code == expected_status
        status_icon = "✅" if success else "❌"
        
        print(f"  {status_icon} {route}: {response.status_code} (esperado: {expected_status})")
        return success
    except Exception as e:
        print(f"  ❌ {route}: Erro na conexão - {e}")
        return False

def create_test_user(email, password, cargo, nome="Usuário Teste"):
    """Cria um usuário de teste"""
    try:
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": password,
            "nome_estabelecimento": nome,
            "nome_completo": nome,
            "telefone": "11999999999",
            "empresa": "Teste Ltda",
            "cargo": cargo
        })
        
        if response.status_code == 201:
            print(f"✅ Usuário {cargo} criado: {email}")
            return True
        elif response.status_code == 400 and "já existe" in response.text:
            print(f"ℹ️  Usuário {cargo} já existe: {email}")
            return True
        else:
            print(f"❌ Erro ao criar usuário {cargo}: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Erro na conexão: {e}")
        return False

def main():
    print("🔐 Testando Sistema de Permissões")
    print("=" * 50)
    
    # Criar usuários de teste
    print("\n📝 Criando usuários de teste...")
    test_users = [
        ("admin@teste.com", "123456", "admin", "Admin Teste"),
        ("gerente@teste.com", "123456", "gerente", "Gerente Teste"),
        ("usuario@teste.com", "123456", "usuario", "Usuario Teste"),
        ("visualizador@teste.com", "123456", "visualizador", "Visualizador Teste")
    ]
    
    for email, password, cargo, nome in test_users:
        create_test_user(email, password, cargo, nome)
    
    print("\n🧪 Testando permissões por cargo...")
    
    # Definir rotas para testar
    test_routes = [
        ("/api/usuarios", "Listar usuários"),
        ("/api/produtos", "Listar produtos"),
        ("/api/relatorios/dashboard", "Dashboard relatórios"),
        ("/api/alertas", "Listar alertas"),
        ("/api/vendas", "Listar vendas")
    ]
    
    # Testar cada usuário
    for email, password, cargo, nome in test_users:
        print(f"\n👤 Testando usuário: {cargo.upper()} ({email})")
        
        # Fazer login
        token, user = test_user_login(email, password)
        if not token:
            continue
            
        # Buscar permissões
        permissions_data = test_permissions_endpoint(token)
        if permissions_data:
            print(f"  📋 Cargo: {permissions_data.get('cargo')}")
            print(f"  🔑 Permissões: {', '.join(permissions_data.get('permissoes', []))}")
        
        # Testar rotas
        print("  🔍 Testando acesso às rotas:")
        for route, description in test_routes:
            # Determinar status esperado baseado no cargo
            if cargo == "admin":
                expected = 200  # Admin tem acesso a tudo
            elif cargo == "gerente":
                expected = 200 if route != "/api/usuarios" else 403  # Gerente não pode ver todos os usuários
            elif cargo == "usuario":
                expected = 200 if route in ["/api/produtos", "/api/vendas"] else 403
            else:  # visualizador
                expected = 200 if route in ["/api/produtos", "/api/relatorios/dashboard", "/api/alertas"] else 403
            
            test_protected_route(token, route, expected)
    
    print("\n✅ Teste de permissões concluído!")
    print("\nPara testar no frontend:")
    print("1. Acesse http://localhost:5173")
    print("2. Faça login com diferentes usuários:")
    print("   - admin@teste.com / 123456 (acesso total)")
    print("   - gerente@teste.com / 123456 (acesso limitado)")
    print("   - usuario@teste.com / 123456 (acesso básico)")
    print("   - visualizador@teste.com / 123456 (apenas visualização)")
    print("3. Observe quais menus aparecem para cada usuário")

if __name__ == "__main__":
    main()