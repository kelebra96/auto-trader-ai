#!/usr/bin/env python3
"""
Script para simular exatamente o comportamento do frontend
"""

import requests
import json

def test_frontend_exact_behavior():
    """Simula exatamente o que o frontend faz"""
    
    print("🔍 SIMULANDO COMPORTAMENTO EXATO DO FRONTEND")
    print("=" * 60)
    
    try:
        # 1. Login (como o frontend faz)
        print("1️⃣ Fazendo login como admin...")
        
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
        
        print(f"✅ Login bem-sucedido")
        print(f"   Token: {token[:30]}...")
        print(f"   User: {user_data}")
        print()
        
        # 2. Simular o que o PermissionsContext faz
        print("2️⃣ Simulando PermissionsContext.loadPermissions()...")
        
        # Exatamente como o frontend faz
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        permissions_response = requests.get(
            'http://localhost:5000/api/usuarios/permissoes',
            headers=headers
        )
        
        print(f"   Status da resposta: {permissions_response.status_code}")
        
        if permissions_response.status_code == 200:
            response_data = permissions_response.json()
            print(f"   Dados da resposta: {response_data}")
            
            # Simular exatamente como o frontend processa
            permissions = response_data.get('permissoes', [])
            cargo = response_data.get('cargo', '')
            user = response_data.get('user', None)
            
            print(f"   Permissões extraídas: {permissions}")
            print(f"   Cargo extraído: {cargo}")
            print(f"   User extraído: {user}")
            print()
            
            # 3. Simular as funções hasPermission do frontend
            print("3️⃣ Simulando funções do frontend...")
            
            def has_permission(permission):
                """Exatamente como no frontend"""
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
                print(f"   🔍 isAdmin():")
                print(f"      Cargo atual: {cargo}")
                result = cargo == 'admin'
                print(f"      {'✅' if result else '❌'} É admin: {result}")
                return result
            
            # Testar as funções principais
            print("   Testando funções principais:")
            
            test_permissions = [
                'view_dashboard',
                'view_products',
                'view_all_users',
                'create_user',
                'edit_user',
                'delete_user'
            ]
            
            for perm in test_permissions:
                result = has_permission(perm)
                print(f"   {perm}: {'✅' if result else '❌'}")
            
            print()
            admin_result = is_admin()
            print(f"   isAdmin(): {'✅' if admin_result else '❌'}")
            print()
            
            # 4. Verificar se há algum problema com o tipo de dados
            print("4️⃣ Verificando tipos de dados...")
            print(f"   Tipo de permissions: {type(permissions)}")
            print(f"   Tipo de cargo: {type(cargo)}")
            print(f"   Tipo de user: {type(user)}")
            
            if isinstance(permissions, list):
                print(f"   ✅ permissions é uma lista")
                print(f"   Tamanho da lista: {len(permissions)}")
                for i, perm in enumerate(permissions):
                    print(f"   [{i}]: '{perm}' (tipo: {type(perm)})")
            else:
                print(f"   ❌ permissions NÃO é uma lista: {permissions}")
            
            print()
            
            # 5. Resultado final
            print("5️⃣ RESULTADO FINAL:")
            
            if permissions == ['all'] and cargo == 'admin' and admin_result:
                print("✅ TUDO FUNCIONANDO CORRETAMENTE!")
                print("   - Permissões: ['all'] ✅")
                print("   - Cargo: 'admin' ✅") 
                print("   - isAdmin(): True ✅")
                print("   - hasPermission() funcionando ✅")
            else:
                print("❌ PROBLEMAS DETECTADOS:")
                if permissions != ['all']:
                    print(f"   - Permissões incorretas: {permissions} (esperado: ['all'])")
                if cargo != 'admin':
                    print(f"   - Cargo incorreto: '{cargo}' (esperado: 'admin')")
                if not admin_result:
                    print(f"   - isAdmin() retornou False")
        
        else:
            print(f"❌ Falha ao obter permissões: {permissions_response.status_code}")
            print(f"   Resposta: {permissions_response.text}")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro durante o teste: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_frontend_exact_behavior()