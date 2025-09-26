#!/usr/bin/env python3
"""
Script para testar problemas reais do frontend
"""

import requests
import json
import time

def test_frontend_issue():
    """Testa problemas específicos que podem estar acontecendo no frontend"""
    
    print("🔍 TESTE DE PROBLEMAS REAIS DO FRONTEND")
    print("=" * 60)
    
    # Credenciais do admin
    admin_email = "rodrigo@rodrigo.com"
    admin_password = "rodrigo123"
    
    try:
        # 1. Login
        print("1️⃣ Fazendo login...")
        login_response = requests.post(
            'http://localhost:5000/api/auth/login',
            json={'email': admin_email, 'password': admin_password},
            headers={'Content-Type': 'application/json'}
        )
        
        if login_response.status_code != 200:
            print(f"❌ Falha no login: {login_response.status_code}")
            return False
        
        login_data = login_response.json()
        token = login_data.get('access_token')
        user_data = login_data.get('user', {})
        
        print(f"✅ Login realizado!")
        print(f"   Token: {token[:30]}...")
        print(f"   User data: {json.dumps(user_data, indent=2, ensure_ascii=False)}")
        print()
        
        # 2. Testar endpoint de permissões exatamente como o frontend faz
        print("2️⃣ Testando endpoint de permissões...")
        
        # Simular exatamente o que o axios faz
        headers = {
            'Authorization': f'Bearer {token}',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
        
        permissions_response = requests.get(
            'http://localhost:5000/api/usuarios/permissoes',
            headers=headers
        )
        
        print(f"   Status: {permissions_response.status_code}")
        print(f"   Headers da resposta: {dict(permissions_response.headers)}")
        
        if permissions_response.status_code != 200:
            print(f"❌ Falha ao obter permissões")
            print(f"   Resposta: {permissions_response.text}")
            return False
        
        permissions_data = permissions_response.json()
        print(f"✅ Permissões obtidas:")
        print(f"   Dados completos: {json.dumps(permissions_data, indent=2, ensure_ascii=False)}")
        print()
        
        # 3. Verificar se há problemas com CORS
        print("3️⃣ Testando CORS...")
        
        # Fazer uma requisição OPTIONS (preflight)
        options_response = requests.options(
            'http://localhost:5000/api/usuarios/permissoes',
            headers={
                'Origin': 'http://localhost:5173',
                'Access-Control-Request-Method': 'GET',
                'Access-Control-Request-Headers': 'authorization,content-type'
            }
        )
        
        print(f"   OPTIONS Status: {options_response.status_code}")
        print(f"   CORS Headers: {dict(options_response.headers)}")
        print()
        
        # 4. Testar com Origin header (como o navegador faria)
        print("4️⃣ Testando com Origin header...")
        
        headers_with_origin = {
            'Authorization': f'Bearer {token}',
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Origin': 'http://localhost:5173'
        }
        
        permissions_response_with_origin = requests.get(
            'http://localhost:5000/api/usuarios/permissoes',
            headers=headers_with_origin
        )
        
        print(f"   Status com Origin: {permissions_response_with_origin.status_code}")
        if permissions_response_with_origin.status_code == 200:
            data = permissions_response_with_origin.json()
            print(f"   Permissões: {data.get('permissoes', [])}")
        else:
            print(f"   Erro: {permissions_response_with_origin.text}")
        print()
        
        # 5. Testar múltiplas chamadas rápidas (como pode acontecer no frontend)
        print("5️⃣ Testando múltiplas chamadas rápidas...")
        
        for i in range(5):
            response = requests.get(
                'http://localhost:5000/api/usuarios/permissoes',
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                permissions = data.get('permissoes', [])
                print(f"   Chamada {i+1}: ✅ Permissões: {permissions}")
            else:
                print(f"   Chamada {i+1}: ❌ Status: {response.status_code}")
            
            # Pequeno delay entre chamadas
            time.sleep(0.1)
        
        print()
        
        # 6. Verificar se o problema é com o token format
        print("6️⃣ Testando diferentes formatos de token...")
        
        token_formats = [
            f'Bearer {token}',
            f'bearer {token}',
            f'{token}',
            f'JWT {token}'
        ]
        
        for i, token_format in enumerate(token_formats):
            test_headers = {
                'Authorization': token_format,
                'Accept': 'application/json'
            }
            
            response = requests.get(
                'http://localhost:5000/api/usuarios/permissoes',
                headers=test_headers
            )
            
            print(f"   Formato {i+1} ('{token_format[:20]}...'): ", end="")
            if response.status_code == 200:
                data = response.json()
                permissions = data.get('permissoes', [])
                print(f"✅ Permissões: {permissions}")
            else:
                print(f"❌ Status: {response.status_code}")
        
        print()
        
        # 7. Verificar se há problemas com cache
        print("7️⃣ Testando problemas de cache...")
        
        cache_headers = {
            'Authorization': f'Bearer {token}',
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        }
        
        response = requests.get(
            'http://localhost:5000/api/usuarios/permissoes',
            headers=cache_headers
        )
        
        if response.status_code == 200:
            data = response.json()
            permissions = data.get('permissoes', [])
            print(f"   Com no-cache: ✅ Permissões: {permissions}")
        else:
            print(f"   Com no-cache: ❌ Status: {response.status_code}")
        
        print()
        
        # 8. Resultado final
        print("8️⃣ ANÁLISE FINAL:")
        
        # Verificar se as permissões estão corretas
        final_permissions = permissions_data.get('permissoes', [])
        final_cargo = permissions_data.get('cargo', '')
        
        if 'all' in final_permissions and final_cargo == 'admin':
            print("✅ BACKEND ESTÁ FUNCIONANDO CORRETAMENTE!")
            print("   - Permissões: ✅")
            print("   - Cargo: ✅")
            print("   - Token: ✅")
            print("   - CORS: ✅")
            print()
            print("🤔 O PROBLEMA PODE SER:")
            print("   1. Cache do navegador")
            print("   2. LocalStorage corrompido")
            print("   3. Problema no código JavaScript do frontend")
            print("   4. Timing issue no carregamento das permissões")
            print("   5. Erro silencioso no console do navegador")
            print()
            print("💡 SOLUÇÕES SUGERIDAS:")
            print("   1. Limpar cache do navegador (Ctrl+Shift+R)")
            print("   2. Abrir DevTools e verificar console")
            print("   3. Verificar Network tab para ver se as requisições estão sendo feitas")
            print("   4. Limpar localStorage: localStorage.clear()")
            print("   5. Fazer logout e login novamente")
        else:
            print("❌ PROBLEMA NO BACKEND DETECTADO!")
            print(f"   Permissões: {final_permissions}")
            print(f"   Cargo: {final_cargo}")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro durante teste: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_frontend_issue()