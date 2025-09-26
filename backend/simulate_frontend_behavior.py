#!/usr/bin/env python3
"""
Script para simular exatamente o comportamento do frontend
"""

import requests
import json

def simulate_frontend_login_flow():
    """Simula exatamente o fluxo de login do frontend"""
    
    print("🎭 SIMULANDO COMPORTAMENTO DO FRONTEND")
    print("=" * 60)
    
    admin_email = "rodrigo@rodrigo.com"
    admin_password = "rodrigo123"
    
    try:
        # 1. Simular login do frontend
        print("1️⃣ Simulando login do frontend...")
        
        # Exatamente como o authService.login faz
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
        access_token = login_data.get('access_token')
        user_data = login_data.get('user', {})
        
        print(f"✅ Login simulado com sucesso!")
        print(f"   Token: {access_token[:50]}...")
        print(f"   User data: {json.dumps(user_data, indent=2, ensure_ascii=False)}")
        
        # Simular armazenamento no localStorage
        local_storage = {
            'token': access_token,
            'user': json.dumps(user_data)
        }
        
        print(f"   LocalStorage simulado: token e user salvos")
        print()
        
        # 2. Simular loadPermissions do PermissionsContext
        print("2️⃣ Simulando loadPermissions do PermissionsContext...")
        
        # Recuperar token do "localStorage"
        token = local_storage.get('token')
        
        if not token:
            print("❌ Token não encontrado no localStorage simulado")
            return False
        
        # Fazer chamada para /usuarios/permissoes como o frontend faz
        permissions_response = requests.get(
            'http://localhost:5000/api/usuarios/permissoes',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        if permissions_response.status_code != 200:
            print(f"❌ Falha ao carregar permissões")
            print(f"   Status: {permissions_response.status_code}")
            print(f"   Resposta: {permissions_response.text}")
            return False
        
        permissions_data = permissions_response.json()
        permissions = permissions_data.get('permissoes', [])
        cargo = permissions_data.get('cargo', '')
        usuario = permissions_data.get('usuario', None)
        
        print(f"✅ Permissões carregadas:")
        print(f"   Permissões: {permissions}")
        print(f"   Cargo: {cargo}")
        print(f"   Usuário: {json.dumps(usuario, indent=2, ensure_ascii=False)}")
        print()
        
        # 3. Simular função hasPermission do frontend
        print("3️⃣ Simulando função hasPermission...")
        
        def has_permission(permission):
            # Exatamente como no frontend
            if 'all' in permissions:
                return True
            return permission in permissions
        
        # Testar várias permissões
        permissions_to_test = [
            'view_dashboard',
            'view_products', 
            'view_all_users',
            'create_user',
            'edit_user',
            'delete_user',
            'view_alerts',
            'view_reports',
            'create_product',
            'edit_product',
            'delete_product'
        ]
        
        print("   Testando permissões específicas:")
        all_permissions_ok = True
        
        for perm in permissions_to_test:
            has_perm = has_permission(perm)
            print(f"     {perm}: {'✅' if has_perm else '❌'}")
            if not has_perm:
                all_permissions_ok = False
        
        print()
        
        # 4. Simular verificações de cargo
        print("4️⃣ Simulando verificações de cargo...")
        
        def is_role(role):
            return cargo == role
        
        def is_admin():
            return cargo == 'admin'
        
        print(f"   is_admin(): {'✅' if is_admin() else '❌'}")
        print(f"   is_role('admin'): {'✅' if is_role('admin') else '❌'}")
        print(f"   Cargo atual: '{cargo}'")
        print()
        
        # 5. Simular verificações específicas do frontend
        print("5️⃣ Simulando verificações específicas do frontend...")
        
        # Como definido no PermissionsContext
        def can_view_users():
            return has_permission('view_all_users')
        
        def can_edit_users():
            return has_permission('edit_user')
        
        def can_delete_users():
            return has_permission('delete_user')
        
        def can_create_users():
            return has_permission('create_user')
        
        def can_view_dashboard():
            return has_permission('view_dashboard')
        
        frontend_checks = [
            (can_view_users, 'canViewUsers'),
            (can_edit_users, 'canEditUsers'),
            (can_delete_users, 'canDeleteUsers'),
            (can_create_users, 'canCreateUsers'),
            (can_view_dashboard, 'canViewDashboard'),
        ]
        
        print("   Verificações específicas do frontend:")
        for check_func, name in frontend_checks:
            result = check_func()
            print(f"     {name}(): {'✅' if result else '❌'}")
        
        print()
        
        # 6. Resultado final
        print("6️⃣ RESULTADO DA SIMULAÇÃO:")
        
        has_all_permission = 'all' in permissions
        is_admin_user = is_admin()
        
        if has_all_permission and is_admin_user and all_permissions_ok:
            print("✅ FRONTEND DEVERIA FUNCIONAR CORRETAMENTE!")
            print("   - Permissão 'all': ✅")
            print("   - Cargo admin: ✅")
            print("   - Todas as verificações: ✅")
        else:
            print("❌ PROBLEMAS DETECTADOS NA SIMULAÇÃO:")
            if not has_all_permission:
                print("   - Permissão 'all' não encontrada")
            if not is_admin_user:
                print("   - Cargo não é admin")
            if not all_permissions_ok:
                print("   - Algumas verificações falharam")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro durante simulação: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_specific_frontend_scenarios():
    """Testa cenários específicos que podem estar causando problemas"""
    
    print("\n" + "=" * 60)
    print("🔬 TESTANDO CENÁRIOS ESPECÍFICOS")
    print("=" * 60)
    
    admin_email = "rodrigo@rodrigo.com"
    admin_password = "rodrigo123"
    
    try:
        # Login
        login_response = requests.post(
            'http://localhost:5000/api/auth/login',
            json={'email': admin_email, 'password': admin_password},
            headers={'Content-Type': 'application/json'}
        )
        
        if login_response.status_code != 200:
            print("❌ Falha no login para testes específicos")
            return False
        
        token = login_response.json().get('access_token')
        
        # Cenário 1: Múltiplas chamadas rápidas (como o frontend pode fazer)
        print("1️⃣ Testando múltiplas chamadas rápidas...")
        
        for i in range(5):
            response = requests.get(
                'http://localhost:5000/api/usuarios/permissoes',
                headers={'Authorization': f'Bearer {token}'}
            )
            
            if response.status_code == 200:
                data = response.json()
                permissions = data.get('permissoes', [])
                has_all = 'all' in permissions
                print(f"   Chamada {i+1}: {'✅' if has_all else '❌'} - Permissões: {permissions}")
            else:
                print(f"   Chamada {i+1}: ❌ Status: {response.status_code}")
        
        print()
        
        # Cenário 2: Testar com diferentes User-Agents (simular navegador)
        print("2️⃣ Testando com diferentes User-Agents...")
        
        user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'axios/1.6.0'  # Como o axios usa
        ]
        
        for i, ua in enumerate(user_agents):
            response = requests.get(
                'http://localhost:5000/api/usuarios/permissoes',
                headers={
                    'Authorization': f'Bearer {token}',
                    'User-Agent': ua
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                permissions = data.get('permissoes', [])
                has_all = 'all' in permissions
                print(f"   UA {i+1}: {'✅' if has_all else '❌'} - Permissões: {permissions}")
            else:
                print(f"   UA {i+1}: ❌ Status: {response.status_code}")
        
        print()
        
        # Cenário 3: Testar cache/timing
        print("3️⃣ Testando possíveis problemas de cache/timing...")
        
        import time
        
        # Primeira chamada
        response1 = requests.get(
            'http://localhost:5000/api/usuarios/permissoes',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        # Aguardar um pouco
        time.sleep(1)
        
        # Segunda chamada
        response2 = requests.get(
            'http://localhost:5000/api/usuarios/permissoes',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        if response1.status_code == 200 and response2.status_code == 200:
            data1 = response1.json()
            data2 = response2.json()
            
            perm1 = data1.get('permissoes', [])
            perm2 = data2.get('permissoes', [])
            
            print(f"   Primeira chamada: {perm1}")
            print(f"   Segunda chamada: {perm2}")
            print(f"   Consistente: {'✅' if perm1 == perm2 else '❌'}")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro nos testes específicos: {e}")
        return False

if __name__ == "__main__":
    simulate_frontend_login_flow()
    test_specific_frontend_scenarios()