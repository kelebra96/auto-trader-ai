#!/usr/bin/env python3
"""
Script para testar problemas de timing no carregamento de permissões do frontend
"""

import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:5000"

def test_timing_issues():
    """Testa problemas de timing no carregamento de permissões"""
    
    print("=== TESTE DE PROBLEMAS DE TIMING NO FRONTEND ===\n")
    
    # 1. Login
    print("1. Fazendo login...")
    login_data = {
        "email": "admin@example.com",
        "password": "admin123"
    }
    
    response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
    if response.status_code != 200:
        print(f"❌ Erro no login: {response.status_code}")
        return
    
    login_result = response.json()
    token = login_result.get("access_token")
    print(f"✅ Login realizado com sucesso")
    print(f"Token: {token[:20]}...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Teste de múltiplas chamadas rápidas (simula comportamento do React)
    print("\n2. Testando múltiplas chamadas rápidas...")
    
    for i in range(5):
        start_time = time.time()
        response = requests.get(f"{BASE_URL}/api/usuarios/permissoes", headers=headers)
        end_time = time.time()
        
        if response.status_code == 200:
            data = response.json()
            permissions = data.get("permissoes", [])
            cargo = data.get("cargo")
            print(f"   Chamada {i+1}: ✅ {len(permissions)} permissões, cargo: {cargo} (tempo: {end_time - start_time:.3f}s)")
        else:
            print(f"   Chamada {i+1}: ❌ Erro {response.status_code}")
        
        # Pequeno delay entre chamadas
        time.sleep(0.1)
    
    # 3. Teste com diferentes User-Agents (simula diferentes browsers)
    print("\n3. Testando com diferentes User-Agents...")
    
    user_agents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"
    ]
    
    for i, ua in enumerate(user_agents):
        test_headers = {**headers, "User-Agent": ua}
        response = requests.get(f"{BASE_URL}/api/usuarios/permissoes", headers=test_headers)
        
        if response.status_code == 200:
            data = response.json()
            permissions = data.get("permissoes", [])
            print(f"   UA {i+1}: ✅ {len(permissions)} permissões")
        else:
            print(f"   UA {i+1}: ❌ Erro {response.status_code}")
    
    # 4. Teste de cache/headers
    print("\n4. Testando headers de cache...")
    
    cache_headers = {
        **headers,
        "Cache-Control": "no-cache",
        "Pragma": "no-cache"
    }
    
    response = requests.get(f"{BASE_URL}/api/usuarios/permissoes", headers=cache_headers)
    if response.status_code == 200:
        data = response.json()
        permissions = data.get("permissoes", [])
        print(f"   Com no-cache: ✅ {len(permissions)} permissões")
    else:
        print(f"   Com no-cache: ❌ Erro {response.status_code}")
    
    # 5. Teste de token inválido (simula problema de localStorage)
    print("\n5. Testando token inválido...")
    
    invalid_headers = {"Authorization": "Bearer token_invalido"}
    response = requests.get(f"{BASE_URL}/api/usuarios/permissoes", headers=invalid_headers)
    print(f"   Token inválido: Status {response.status_code} (esperado: 401)")
    
    # 6. Teste sem token (simula localStorage vazio)
    print("\n6. Testando sem token...")
    
    response = requests.get(f"{BASE_URL}/api/usuarios/permissoes")
    print(f"   Sem token: Status {response.status_code} (esperado: 401)")
    
    # 7. Teste de timing extremo
    print("\n7. Testando timing extremo (chamadas simultâneas)...")
    
    import threading
    import queue
    
    results = queue.Queue()
    
    def make_request(thread_id):
        try:
            response = requests.get(f"{BASE_URL}/api/usuarios/permissoes", headers=headers)
            if response.status_code == 200:
                data = response.json()
                permissions = data.get("permissoes", [])
                results.put(f"Thread {thread_id}: ✅ {len(permissions)} permissões")
            else:
                results.put(f"Thread {thread_id}: ❌ Erro {response.status_code}")
        except Exception as e:
            results.put(f"Thread {thread_id}: ❌ Exceção: {str(e)}")
    
    threads = []
    for i in range(3):
        thread = threading.Thread(target=make_request, args=(i+1,))
        threads.append(thread)
        thread.start()
    
    for thread in threads:
        thread.join()
    
    while not results.empty():
        print(f"   {results.get()}")
    
    print("\n=== ANÁLISE FINAL ===")
    print("Se todos os testes acima passaram, o problema está no frontend:")
    print("1. ✅ Backend funcionando corretamente")
    print("2. ✅ API de permissões respondendo")
    print("3. ✅ Token sendo aceito")
    print("4. ✅ Permissões sendo retornadas")
    print("\nProblemas possíveis no frontend:")
    print("- Estado do React não sendo atualizado")
    print("- useEffect não sendo executado")
    print("- Erro silencioso no JavaScript")
    print("- Problema com localStorage")
    print("- Timing entre componentes")
    print("- Cache do browser")
    
    print("\nRecomendações:")
    print("1. Verificar console do browser (F12)")
    print("2. Verificar Network tab no DevTools")
    print("3. Limpar localStorage: localStorage.clear()")
    print("4. Hard refresh: Ctrl+Shift+R")
    print("5. Verificar se o componente PermissionsDebug está aparecendo")

if __name__ == "__main__":
    test_timing_issues()