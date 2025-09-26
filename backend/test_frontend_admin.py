#!/usr/bin/env python3
"""
Script para testar o comportamento completo do admin no frontend
"""

import requests
import json

def test_admin_login_and_permissions():
    """Testa login e permissões do admin"""
    
    print("🧪 TESTE COMPLETO DO ADMIN NO FRONTEND")
    print("=" * 60)
    
    # Credenciais do admin
    admin_email = "rodrigo@rodrigo.com"
    admin_password = "rodrigo123"
    
    try:
        # 1. Fazer login
        print(f"1️⃣ Fazendo login com {admin_email}...")
        login_response = requests.post(
            'http://localhost:5000/api/auth/login',
            json={'email': admin_email, 'password': admin_password},
            headers={'Content-Type': 'application/json'}
        )
        
        if login_response.status_code != 200:
            print(f"❌ Falha no login")
            print(f"   Status: {login_response.status_code}")
            print(f"   Resposta: {login_response.text}")
            return False
        
        login_data = login_response.json()
        token = login_data.get('access_token')
        user_data = login_data.get('user', {})
        
        print(f"✅ Login realizado com sucesso!")
        print(f"   Token: {token[:50]}...")
        print(f"   Usuário: {user_data.get('nome_completo', 'N/A')}")
        print(f"   Cargo: {user_data.get('cargo', 'N/A')}")
        print()
        
        # 2. Obter permissões
        print("2️⃣ Obtendo permissões...")
        permissions_response = requests.get(
            'http://localhost:5000/api/usuarios/permissoes',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        if permissions_response.status_code != 200:
            print(f"❌ Falha ao obter permissões")
            print(f"   Status: {permissions_response.status_code}")
            print(f"   Resposta: {permissions_response.text}")
            return False
        
        permissions_data = permissions_response.json()
        permissions = permissions_data.get('permissoes', [])
        
        print(f"✅ Permissões obtidas:")
        print(f"   Permissões: {permissions}")
        print(f"   Tem 'all': {'✅' if 'all' in permissions else '❌'}")
        print(f"   Cargo: {permissions_data.get('cargo', 'N/A')}")
        print()
        
        # 3. Testar endpoints específicos que um admin deveria acessar
        print("3️⃣ Testando acesso a endpoints específicos...")
        
        endpoints_to_test = [
            ('/api/dashboard', 'Dashboard'),
            ('/api/usuarios', 'Lista de usuários'),
            ('/api/produtos', 'Lista de produtos'),
            ('/api/alertas', 'Lista de alertas'),
        ]
        
        all_access_ok = True
        
        for endpoint, description in endpoints_to_test:
            try:
                response = requests.get(
                    f'http://localhost:5000{endpoint}',
                    headers={'Authorization': f'Bearer {token}'}
                )
                
                if response.status_code == 200:
                    print(f"   ✅ {description}: Acesso permitido")
                else:
                    print(f"   ❌ {description}: Acesso negado (Status: {response.status_code})")
                    all_access_ok = False
                    
            except Exception as e:
                print(f"   ❌ {description}: Erro - {e}")
                all_access_ok = False
        
        print()
        
        # 4. Simular verificações que o frontend faria
        print("4️⃣ Simulando verificações do frontend...")
        
        # Simular a função hasPermission do frontend
        def has_permission(permission):
            if 'all' in permissions:
                return True
            return permission in permissions
        
        frontend_checks = [
            ('view_dashboard', 'Ver Dashboard'),
            ('view_products', 'Ver Produtos'),
            ('view_all_users', 'Ver Usuários'),
            ('create_user', 'Criar Usuário'),
            ('edit_user', 'Editar Usuário'),
            ('delete_user', 'Deletar Usuário'),
            ('view_alerts', 'Ver Alertas'),
            ('view_reports', 'Ver Relatórios'),
        ]
        
        all_frontend_ok = True
        
        for permission, description in frontend_checks:
            has_perm = has_permission(permission)
            print(f"   {'✅' if has_perm else '❌'} {description}: {'Permitido' if has_perm else 'Negado'}")
            if not has_perm:
                all_frontend_ok = False
        
        print()
        
        # 5. Resultado final
        print("5️⃣ RESULTADO FINAL:")
        if 'all' in permissions and all_access_ok and all_frontend_ok:
            print("✅ ADMIN FUNCIONANDO CORRETAMENTE!")
            print("   - Login: ✅")
            print("   - Permissões: ✅")
            print("   - Acesso a endpoints: ✅")
            print("   - Verificações do frontend: ✅")
        else:
            print("❌ PROBLEMAS DETECTADOS:")
            if 'all' not in permissions:
                print("   - Permissão 'all' não encontrada")
            if not all_access_ok:
                print("   - Falha no acesso a alguns endpoints")
            if not all_frontend_ok:
                print("   - Falha nas verificações do frontend")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro durante o teste: {e}")
        return False

def test_admin_example():
    """Testa também o admin@example.com"""
    
    print("\n" + "=" * 60)
    print("🧪 TESTE DO ADMIN@EXAMPLE.COM")
    print("=" * 60)
    
    admin_email = "admin@example.com"
    admin_password = "admin123"
    
    try:
        # Login
        login_response = requests.post(
            'http://localhost:5000/api/auth/login',
            json={'email': admin_email, 'password': admin_password},
            headers={'Content-Type': 'application/json'}
        )
        
        if login_response.status_code != 200:
            print(f"❌ Falha no login para {admin_email}")
            return False
        
        login_data = login_response.json()
        token = login_data.get('access_token')
        
        # Permissões
        permissions_response = requests.get(
            'http://localhost:5000/api/usuarios/permissoes',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        if permissions_response.status_code != 200:
            print(f"❌ Falha ao obter permissões para {admin_email}")
            return False
        
        permissions_data = permissions_response.json()
        permissions = permissions_data.get('permissoes', [])
        
        print(f"✅ {admin_email}:")
        print(f"   Permissões: {permissions}")
        print(f"   Tem 'all': {'✅' if 'all' in permissions else '❌'}")
        
        return 'all' in permissions
        
    except Exception as e:
        print(f"❌ Erro ao testar {admin_email}: {e}")
        return False

if __name__ == "__main__":
    # Testar ambos os admins
    test_admin_login_and_permissions()
    test_admin_example()