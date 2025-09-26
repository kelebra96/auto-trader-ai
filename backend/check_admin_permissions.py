#!/usr/bin/env python3
"""
Script para verificar e corrigir permissões de usuários admin
"""

from src.main_simple import app, db, User
import requests
import json

def check_all_admin_users():
    """Verifica todos os usuários admin no banco"""
    try:
        with app.app_context():
            admin_users = User.query.filter_by(cargo='admin').all()
            
            print("=" * 60)
            print("VERIFICAÇÃO DE USUÁRIOS ADMIN")
            print("=" * 60)
            
            if not admin_users:
                print("❌ Nenhum usuário admin encontrado!")
                return []
            
            print(f"✅ Encontrados {len(admin_users)} usuários admin:")
            print()
            
            for i, user in enumerate(admin_users, 1):
                print(f"👤 ADMIN {i}:")
                print(f"   ID: {user.id}")
                print(f"   Email: {user.email}")
                print(f"   Nome: {user.nome_completo}")
                print(f"   Estabelecimento: {user.nome_estabelecimento}")
                print(f"   Ativo: {user.ativo}")
                print(f"   Permissões: {user.permissoes}")
                print(f"   Criado em: {user.created_at}")
                print()
            
            return admin_users
            
    except Exception as e:
        print(f"❌ Erro ao verificar usuários admin: {e}")
        return []

def test_admin_permissions_api(email, password):
    """Testa as permissões de um admin via API"""
    try:
        # 1. Fazer login
        login_response = requests.post(
            'http://localhost:5000/api/auth/login',
            json={'email': email, 'password': password},
            headers={'Content-Type': 'application/json'}
        )
        
        if login_response.status_code != 200:
            print(f"❌ Falha no login para {email}")
            print(f"   Status: {login_response.status_code}")
            print(f"   Resposta: {login_response.text}")
            return False
        
        login_data = login_response.json()
        token = login_data.get('access_token')
        
        if not token:
            print(f"❌ Token não recebido para {email}")
            return False
        
        # 2. Testar endpoint de permissões
        permissions_response = requests.get(
            'http://localhost:5000/api/usuarios/permissoes',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        if permissions_response.status_code != 200:
            print(f"❌ Falha ao obter permissões para {email}")
            print(f"   Status: {permissions_response.status_code}")
            print(f"   Resposta: {permissions_response.text}")
            return False
        
        permissions_data = permissions_response.json()
        
        print(f"✅ Permissões obtidas para {email}:")
        print(f"   Permissões: {permissions_data.get('permissoes', [])}")
        print(f"   Permissões customizadas: {permissions_data.get('permissoes_customizadas', [])}")
        print(f"   Cargo: {permissions_data.get('cargo', 'N/A')}")
        
        # Verificar se tem permissão 'all'
        permissions = permissions_data.get('permissoes', [])
        has_all_permission = 'all' in permissions
        
        print(f"   Tem permissão 'all': {'✅' if has_all_permission else '❌'}")
        
        return has_all_permission
        
    except Exception as e:
        print(f"❌ Erro ao testar permissões via API para {email}: {e}")
        return False

def fix_admin_permissions(user_id):
    """Corrige as permissões de um usuário admin"""
    try:
        with app.app_context():
            user = User.query.get(user_id)
            if not user:
                print(f"❌ Usuário com ID {user_id} não encontrado")
                return False
            
            # Atualizar permissões para ['all']
            user.permissoes = ['all']
            db.session.commit()
            
            print(f"✅ Permissões corrigidas para {user.email}")
            print(f"   Novas permissões: {user.permissoes}")
            
            return True
            
    except Exception as e:
        print(f"❌ Erro ao corrigir permissões: {e}")
        return False

def main():
    print("🔍 DIAGNÓSTICO DE PERMISSÕES DE USUÁRIOS ADMIN")
    print()
    
    # 1. Verificar todos os usuários admin
    admin_users = check_all_admin_users()
    
    if not admin_users:
        return
    
    # 2. Testar permissões via API para cada admin
    print("\n" + "=" * 60)
    print("TESTE DE PERMISSÕES VIA API")
    print("=" * 60)
    
    problematic_users = []
    
    # Credenciais conhecidas dos admins
    admin_credentials = [
        ('admin@example.com', 'admin123'),
        ('rodrigo@rodrigo.com', 'rodrigo123')
    ]
    
    for email, password in admin_credentials:
        print(f"\n🧪 Testando {email}...")
        has_all_permission = test_admin_permissions_api(email, password)
        
        if not has_all_permission:
            # Encontrar o usuário correspondente
            user = next((u for u in admin_users if u.email == email), None)
            if user:
                problematic_users.append(user)
    
    # 3. Corrigir usuários com problemas
    if problematic_users:
        print("\n" + "=" * 60)
        print("CORREÇÃO DE PERMISSÕES")
        print("=" * 60)
        
        for user in problematic_users:
            print(f"\n🔧 Corrigindo permissões para {user.email}...")
            fix_admin_permissions(user.id)
        
        # 4. Testar novamente após correção
        print("\n" + "=" * 60)
        print("TESTE APÓS CORREÇÃO")
        print("=" * 60)
        
        for email, password in admin_credentials:
            if any(u.email == email for u in problematic_users):
                print(f"\n🧪 Re-testando {email}...")
                test_admin_permissions_api(email, password)
    
    else:
        print("\n✅ Todos os usuários admin têm permissões corretas!")

if __name__ == "__main__":
    main()