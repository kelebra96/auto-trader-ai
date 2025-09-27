#!/usr/bin/env python3
"""
Script para testar o login via API
"""

import requests
import json

def test_login():
    """Testa o login com as credenciais do admin"""
    url = "http://localhost:5000/api/auth/login"
    
    data = {
        "email": "kelebra96@gmail.com",
        "password": "Ro04041932..#@"
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        print("🔍 Testando login...")
        print(f"URL: {url}")
        print(f"Email: {data['email']}")
        print(f"Senha: {'*' * len(data['password'])}")
        
        response = requests.post(url, json=data, headers=headers)
        
        print(f"\n📊 Status Code: {response.status_code}")
        print(f"📄 Response Headers: {dict(response.headers)}")
        
        try:
            response_data = response.json()
            print(f"📝 Response Body:")
            print(json.dumps(response_data, indent=2, ensure_ascii=False))
            
            if response.status_code == 200:
                print("✅ Login realizado com sucesso!")
                if 'access_token' in response_data:
                    print(f"🔑 Token recebido: {response_data['access_token'][:50]}...")
            else:
                print("❌ Falha no login!")
                
        except json.JSONDecodeError:
            print(f"📝 Response Body (text): {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Erro: Não foi possível conectar ao backend!")
        print("   Verifique se o backend está rodando em http://localhost:5000")
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")

if __name__ == '__main__':
    test_login()