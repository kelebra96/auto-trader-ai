#!/usr/bin/env python3
"""
Script para debugar problemas específicos do frontend
"""

import requests
import json
import time

def test_token_persistence():
    """Testa se o token persiste e funciona corretamente"""
    
    print("🔍 DEBUGANDO PROBLEMAS DO FRONTEND")
    print("=" * 60)
    
    admin_email = "rodrigo@rodrigo.com"
    admin_password = "rodrigo123"
    
    try:
        # 1. Login inicial
        print("1️⃣ Fazendo login inicial...")
        login_response = requests.post(
            'http://localhost:5000/api/auth/login',
            json={'email': admin_email, 'password': admin_password},
            headers={'Content-Type': 'application/json'}
        )
        
        if login_response.status_code != 200:
            print(f"❌ Falha no login")
            return False
        
        login_data = login_response.json()
        token = login_data.get('access_token')
        user_data = login_data.get('user', {})
        
        print(f"✅ Login realizado!")
        print(f"   Token válido: {'✅' if token else '❌'}")
        print(f"   Dados do usuário: {json.dumps(user_data, indent=2, ensure_ascii=False)}")
        print()
        
        # 2. Testar permissões imediatamente
        print("2️⃣ Testando permissões imediatamente após login...")
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
        print(f"✅ Permissões obtidas:")
        print(f"   Dados completos: {json.dumps(permissions_data, indent=2, ensure_ascii=False)}")
        print()
        
        # 3. Aguardar um pouco e testar novamente (simular comportamento do frontend)
        print("3️⃣ Aguardando 2 segundos e testando novamente...")
        time.sleep(2)
        
        permissions_response2 = requests.get(
            'http://localhost:5000/api/usuarios/permissoes',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        if permissions_response2.status_code != 200:
            print(f"❌ Token expirou ou falha na segunda chamada")
            print(f"   Status: {permissions_response2.status_code}")
            return False
        
        permissions_data2 = permissions_response2.json()
        print(f"✅ Permissões ainda válidas:")
        print(f"   Permissões: {permissions_data2.get('permissoes', [])}")
        print()
        
        # 4. Testar múltiplas chamadas consecutivas
        print("4️⃣ Testando múltiplas chamadas consecutivas...")
        
        for i in range(3):
            response = requests.get(
                'http://localhost:5000/api/usuarios/permissoes',
                headers={'Authorization': f'Bearer {token}'}
            )
            
            if response.status_code == 200:
                data = response.json()
                permissions = data.get('permissoes', [])
                print(f"   Chamada {i+1}: ✅ Permissões: {permissions}")
            else:
                print(f"   Chamada {i+1}: ❌ Status: {response.status_code}")
        
        print()
        
        # 5. Verificar se o problema é com headers específicos
        print("5️⃣ Testando diferentes formatos de header...")
        
        headers_to_test = [
            {'Authorization': f'Bearer {token}'},
            {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'},
            {'Authorization': f'Bearer {token}', 'Accept': 'application/json'},
        ]
        
        for i, headers in enumerate(headers_to_test):
            response = requests.get(
                'http://localhost:5000/api/usuarios/permissoes',
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                permissions = data.get('permissoes', [])
                print(f"   Header {i+1}: ✅ Permissões: {permissions}")
            else:
                print(f"   Header {i+1}: ❌ Status: {response.status_code}")
        
        print()
        
        # 6. Verificar estrutura completa da resposta
        print("6️⃣ Estrutura completa da resposta de permissões:")
        final_response = requests.get(
            'http://localhost:5000/api/usuarios/permissoes',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        if final_response.status_code == 200:
            data = final_response.json()
            print(f"   Resposta completa:")
            for key, value in data.items():
                print(f"     {key}: {value}")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro durante debug: {e}")
        return False

def test_cors_and_headers():
    """Testa problemas relacionados a CORS e headers"""
    
    print("\n" + "=" * 60)
    print("🌐 TESTANDO CORS E HEADERS")
    print("=" * 60)
    
    try:
        # Testar OPTIONS request (preflight)
        options_response = requests.options('http://localhost:5000/api/usuarios/permissoes')
        print(f"OPTIONS request: Status {options_response.status_code}")
        print(f"Headers: {dict(options_response.headers)}")
        
        # Testar sem token
        no_token_response = requests.get('http://localhost:5000/api/usuarios/permissoes')
        print(f"Sem token: Status {no_token_response.status_code}")
        
        # Testar com token inválido
        invalid_token_response = requests.get(
            'http://localhost:5000/api/usuarios/permissoes',
            headers={'Authorization': 'Bearer token_invalido'}
        )
        print(f"Token inválido: Status {invalid_token_response.status_code}")
        
    except Exception as e:
        print(f"❌ Erro ao testar CORS: {e}")

if __name__ == "__main__":
    test_token_persistence()
    test_cors_and_headers()