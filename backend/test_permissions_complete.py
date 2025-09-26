#!/usr/bin/env python3
"""
Script completo para testar o sistema de permissões
"""

import requests
import json

BASE_URL = "http://localhost:5000"

# Usuários de teste
USERS = {
    'admin': {'email': 'admin@example.com', 'password': 'admin123'},
    'gerente': {'email': 'gerente@example.com', 'password': 'gerente123'},
    'usuario': {'email': 'usuario@example.com', 'password': 'usuario123'},
    'visualizador': {'email': 'visualizador@example.com', 'password': 'visualizador123'}
}

# Rotas para testar com suas permissões necessárias
ROUTES_TO_TEST = [
    {'url': '/api/dashboard', 'method': 'GET', 'permission': 'view_dashboard'},
    {'url': '/api/produtos', 'method': 'GET', 'permission': 'view_products'},
    {'url': '/api/alertas', 'method': 'GET', 'permission': 'view_alerts'},
    {'url': '/api/relatorios/dashboard', 'method': 'GET', 'permission': 'view_reports'},
    {'url': '/api/vendas', 'method': 'GET', 'permission': 'view_sales'},
    {'url': '/api/usuarios', 'method': 'GET', 'permission': 'view_all_users'},
]

def login_user(user_type):
    """Faz login e retorna o token"""
    try:
        user_data = USERS[user_type]
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=user_data,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            data = response.json()
            return data.get('access_token')
        else:
            print(f"❌ Erro no login {user_type}: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Exceção no login {user_type}: {e}")
        return None

def test_route(token, route_info, user_type):
    """Testa uma rota específica com o token fornecido"""
    try:
        headers = {'Authorization': f'Bearer {token}'}
        
        response = requests.request(
            route_info['method'],
            f"{BASE_URL}{route_info['url']}",
            headers=headers
        )
        
        status = "✅ PERMITIDO" if response.status_code == 200 else f"❌ NEGADO ({response.status_code})"
        print(f"  {route_info['url']} ({route_info['permission']}): {status}")
        
        return response.status_code == 200
        
    except Exception as e:
        print(f"  {route_info['url']}: ❌ ERRO - {e}")
        return False

def get_user_permissions(token):
    """Obtém as permissões do usuário"""
    try:
        headers = {'Authorization': f'Bearer {token}'}
        response = requests.get(f"{BASE_URL}/api/usuarios/permissoes", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            return data.get('permissoes', []), data.get('cargo', 'unknown')
        else:
            return [], 'unknown'
    except Exception as e:
        print(f"❌ Erro ao obter permissões: {e}")
        return [], 'unknown'

def main():
    print("🔐 TESTE COMPLETO DO SISTEMA DE PERMISSÕES")
    print("=" * 60)
    
    for user_type in USERS.keys():
        print(f"\n👤 TESTANDO USUÁRIO: {user_type.upper()}")
        print("-" * 40)
        
        # Fazer login
        token = login_user(user_type)
        if not token:
            print(f"❌ Falha no login para {user_type}")
            continue
        
        print(f"✅ Login realizado com sucesso")
        
        # Obter permissões do usuário
        permissions, cargo = get_user_permissions(token)
        print(f"📋 Cargo: {cargo}")
        print(f"🔑 Permissões: {permissions}")
        
        # Testar cada rota
        print(f"🧪 Testando rotas:")
        success_count = 0
        total_count = len(ROUTES_TO_TEST)
        
        for route in ROUTES_TO_TEST:
            if test_route(token, route, user_type):
                success_count += 1
        
        print(f"📊 Resultado: {success_count}/{total_count} rotas acessíveis")
    
    print("\n" + "=" * 60)
    print("🎯 TESTE DE PERMISSÕES ESPECÍFICAS")
    print("=" * 60)
    
    # Teste específico: Admin deve acessar tudo
    print("\n🔧 Testando acesso total do ADMIN:")
    admin_token = login_user('admin')
    if admin_token:
        admin_success = 0
        for route in ROUTES_TO_TEST:
            if test_route(admin_token, route, 'admin'):
                admin_success += 1
        
        if admin_success == len(ROUTES_TO_TEST):
            print("✅ ADMIN tem acesso total - CORRETO!")
        else:
            print(f"❌ ADMIN deveria ter acesso total, mas só tem {admin_success}/{len(ROUTES_TO_TEST)}")
    
    # Teste específico: Visualizador não deve criar/editar
    print("\n👁️ Testando restrições do VISUALIZADOR:")
    vis_token = login_user('visualizador')
    if vis_token:
        # Tentar criar produto (deve falhar)
        try:
            headers = {'Authorization': f'Bearer {vis_token}'}
            response = requests.post(
                f"{BASE_URL}/api/produtos",
                json={'nome': 'Teste', 'categoria': 'Teste', 'preco_venda': 10.0, 'quantidade': 1},
                headers=headers
            )
            
            if response.status_code == 403:
                print("✅ VISUALIZADOR não pode criar produtos - CORRETO!")
            else:
                print(f"❌ VISUALIZADOR conseguiu criar produto - ERRO! Status: {response.status_code}")
        except Exception as e:
            print(f"❌ Erro no teste de criação: {e}")
    
    print("\n🎉 TESTE COMPLETO FINALIZADO!")

if __name__ == '__main__':
    main()