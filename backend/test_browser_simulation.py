#!/usr/bin/env python3
"""
Script para simular exatamente o que acontece no navegador
"""

import requests
import json
import time

def simulate_browser_behavior():
    """Simula exatamente o que acontece no navegador"""
    
    print("🌐 SIMULANDO COMPORTAMENTO DO NAVEGADOR")
    print("=" * 60)
    
    try:
        # 1. Simular login e armazenamento no localStorage
        print("1️⃣ Simulando login e localStorage...")
        
        login_data = {
            "email": "admin@example.com",
            "password": "admin123"
        }
        
        login_response = requests.post(
            'http://localhost:5000/api/auth/login',
            json=login_data,
            headers={'Content-Type': 'application/json'}
        )
        
        if login_response.status_code != 200:
            print(f"❌ Falha no login: {login_response.status_code}")
            return False
        
        login_data = login_response.json()
        token = login_data.get('access_token')
        user_data = login_data.get('user')
        
        # Simular localStorage
        localStorage = {
            'token': token,
            'user': json.dumps(user_data) if user_data else None
        }
        
        print(f"✅ Login bem-sucedido")
        print(f"   localStorage.token: {localStorage['token'][:30]}...")
        print(f"   localStorage.user: {localStorage['user']}")
        print()
        
        # 2. Simular o carregamento inicial do PermissionsContext
        print("2️⃣ Simulando carregamento inicial do PermissionsContext...")
        
        # Verificar se tem token no localStorage
        stored_token = localStorage.get('token')
        if not stored_token:
            print("❌ Nenhum token encontrado no localStorage")
            return False
        
        print(f"✅ Token encontrado no localStorage: {stored_token[:30]}...")
        
        # 3. Simular a chamada loadPermissions
        print("3️⃣ Simulando loadPermissions()...")
        
        headers = {
            'Authorization': f'Bearer {stored_token}',
            'Content-Type': 'application/json'
        }
        
        print(f"   Headers enviados: {headers}")
        
        permissions_response = requests.get(
            'http://localhost:5000/api/usuarios/permissoes',
            headers=headers
        )
        
        print(f"   Status da resposta: {permissions_response.status_code}")
        
        if permissions_response.status_code == 200:
            response_data = permissions_response.json()
            print(f"   Resposta completa: {json.dumps(response_data, indent=2)}")
            
            # Simular exatamente o processamento do PermissionsContext
            if response_data:
                new_permissions = response_data.get('permissoes', [])
                new_cargo = response_data.get('cargo', '')
                new_user = response_data.get('usuario', None)
                
                print(f"   📝 Atualizando estado:")
                print(f"      Permissões: {new_permissions}")
                print(f"      Cargo: {new_cargo}")
                print(f"      Usuário: {new_user}")
                
                # Simular o estado do React
                react_state = {
                    'permissions': new_permissions,
                    'cargo': new_cargo,
                    'user': new_user,
                    'loading': False
                }
                
                print(f"   📊 Estado do React simulado: {react_state}")
                print()
                
                # 4. Simular as verificações que o frontend faria
                print("4️⃣ Simulando verificações do frontend...")
                
                def has_permission(permission):
                    """Exatamente como no frontend"""
                    permissions = react_state['permissions']
                    print(f"   🔍 hasPermission('{permission}'):")
                    print(f"      Permissões atuais: {permissions}")
                    
                    # Se o usuário tem permissão 'all', ele pode fazer tudo
                    if 'all' in permissions:
                        print(f"      ✅ Tem permissão 'all', retornando true")
                        return True
                    
                    has_specific = permission in permissions
                    print(f"      {'✅' if has_specific else '❌'} Permissão específica: {has_specific}")
                    return has_specific
                
                def is_admin():
                    """Exatamente como no frontend"""
                    cargo = react_state['cargo']
                    print(f"   🔍 isAdmin():")
                    print(f"      Cargo atual: {cargo}")
                    result = cargo == 'admin'
                    print(f"      {'✅' if result else '❌'} É admin: {result}")
                    return result
                
                # Testar as principais verificações
                test_cases = [
                    ('view_dashboard', 'Ver Dashboard'),
                    ('view_products', 'Ver Produtos'),
                    ('view_all_users', 'Ver Usuários'),
                    ('create_user', 'Criar Usuário'),
                    ('edit_user', 'Editar Usuário'),
                    ('delete_user', 'Deletar Usuário')
                ]
                
                all_permissions_ok = True
                
                for permission, description in test_cases:
                    result = has_permission(permission)
                    print(f"   {description}: {'✅' if result else '❌'}")
                    if not result:
                        all_permissions_ok = False
                
                print()
                admin_result = is_admin()
                print(f"   isAdmin(): {'✅' if admin_result else '❌'}")
                print()
                
                # 5. Verificar possíveis problemas de timing
                print("5️⃣ Verificando possíveis problemas de timing...")
                
                # Simular múltiplas chamadas rápidas (como pode acontecer no React)
                for i in range(3):
                    print(f"   Chamada {i+1}:")
                    quick_response = requests.get(
                        'http://localhost:5000/api/usuarios/permissoes',
                        headers=headers
                    )
                    if quick_response.status_code == 200:
                        quick_data = quick_response.json()
                        quick_permissions = quick_data.get('permissoes', [])
                        print(f"      Permissões: {quick_permissions}")
                    else:
                        print(f"      ❌ Erro: {quick_response.status_code}")
                    
                    time.sleep(0.1)  # Pequeno delay
                
                print()
                
                # 6. Resultado final
                print("6️⃣ RESULTADO FINAL:")
                
                if (react_state['permissions'] == ['all'] and 
                    react_state['cargo'] == 'admin' and 
                    admin_result and 
                    all_permissions_ok):
                    print("✅ SIMULAÇÃO COMPLETA - TUDO FUNCIONANDO!")
                    print("   - Estado do React: ✅")
                    print("   - Permissões: ['all'] ✅")
                    print("   - Cargo: 'admin' ✅")
                    print("   - Verificações: ✅")
                    print()
                    print("🤔 Se o backend está funcionando perfeitamente,")
                    print("   o problema pode estar em:")
                    print("   1. Cache do navegador")
                    print("   2. Estado inicial do React")
                    print("   3. Timing de renderização")
                    print("   4. Interceptors do axios")
                    print("   5. Problemas de CORS")
                else:
                    print("❌ PROBLEMAS DETECTADOS NA SIMULAÇÃO:")
                    if react_state['permissions'] != ['all']:
                        print(f"   - Permissões incorretas: {react_state['permissions']}")
                    if react_state['cargo'] != 'admin':
                        print(f"   - Cargo incorreto: {react_state['cargo']}")
                    if not admin_result:
                        print(f"   - isAdmin() falhou")
                    if not all_permissions_ok:
                        print(f"   - Algumas verificações falharam")
            
            else:
                print("❌ Resposta vazia da API")
        
        else:
            print(f"❌ Falha na API: {permissions_response.status_code}")
            print(f"   Resposta: {permissions_response.text}")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro durante a simulação: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    simulate_browser_behavior()