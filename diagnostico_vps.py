#!/usr/bin/env python3
"""
Script de diagnóstico completo para VPS
Execute: python3 diagnostico_vps.py
"""

import sqlite3
import bcrypt
import os
import sys
from pathlib import Path

def print_header(title):
    print("\n" + "=" * 60)
    print(f"🔍 {title}")
    print("=" * 60)

def find_databases():
    """Encontra todos os bancos de dados SQLite"""
    print_header("PROCURANDO BANCOS DE DADOS")
    
    possible_paths = [
        'instance/database.db',
        'database.db', 
        '../database.db',
        '/tmp/database.db',
        'src/instance/database.db',
        './backend/instance/database.db',
        '/root/auto-trader-ai/backend/instance/database.db',
        '/root/auto-trader-ai/backend/database.db',
        '/home/*/auto-trader-ai/backend/instance/database.db',
        '/opt/auto-trader-ai/backend/instance/database.db'
    ]
    
    found_dbs = []
    
    for path in possible_paths:
        if os.path.exists(path):
            found_dbs.append(path)
            print(f"✅ Encontrado: {path}")
    
    # Busca recursiva por arquivos .db
    print("\n🔍 Busca recursiva por arquivos .db:")
    for root, dirs, files in os.walk('.'):
        for file in files:
            if file.endswith('.db'):
                full_path = os.path.join(root, file)
                if full_path not in found_dbs:
                    found_dbs.append(full_path)
                    print(f"✅ Encontrado: {full_path}")
    
    if not found_dbs:
        print("❌ Nenhum banco de dados encontrado!")
    
    return found_dbs

def check_database_structure(db_path):
    """Verifica a estrutura do banco de dados"""
    print_header(f"VERIFICANDO ESTRUTURA: {db_path}")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Listar todas as tabelas
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        print("📋 Tabelas encontradas:")
        for table in tables:
            print(f"  - {table[0]}")
        
        # Verificar se tabela users existe
        if ('users',) in tables:
            print("\n✅ Tabela 'users' encontrada!")
            
            # Verificar estrutura da tabela users
            cursor.execute("PRAGMA table_info(users);")
            columns = cursor.fetchall()
            
            print("\n📊 Estrutura da tabela 'users':")
            for col in columns:
                print(f"  - {col[1]} ({col[2]})")
            
            # Contar usuários
            cursor.execute("SELECT COUNT(*) FROM users;")
            count = cursor.fetchone()[0]
            print(f"\n👥 Total de usuários: {count}")
            
            # Verificar se admin existe
            cursor.execute("SELECT email, role, permissions, is_active FROM users WHERE email = ?", ("kelebra96@gmail.com",))
            admin = cursor.fetchone()
            
            if admin:
                print(f"\n✅ Usuário admin encontrado:")
                print(f"  📧 Email: {admin[0]}")
                print(f"  👤 Role: {admin[1]}")
                print(f"  🔑 Permissions: {admin[2]}")
                print(f"  ✅ Ativo: {'Sim' if admin[3] else 'Não'}")
            else:
                print("\n❌ Usuário admin NÃO encontrado!")
                
                # Listar todos os usuários
                cursor.execute("SELECT email, role FROM users LIMIT 5;")
                users = cursor.fetchall()
                if users:
                    print("\n👥 Usuários existentes:")
                    for user in users:
                        print(f"  - {user[0]} ({user[1]})")
        else:
            print("\n❌ Tabela 'users' NÃO encontrada!")
        
        conn.close()
        return ('users',) in tables
        
    except Exception as e:
        print(f"❌ Erro ao verificar banco: {e}")
        return False

def create_admin_user(db_path):
    """Cria o usuário admin"""
    print_header(f"CRIANDO USUÁRIO ADMIN: {db_path}")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        email = "kelebra96@gmail.com"
        password = "admin123456"
        
        # Gerar hash da senha
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Verificar se usuário já existe
        cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
        existing_user = cursor.fetchone()
        
        if existing_user:
            # Atualizar usuário existente
            cursor.execute("""
                UPDATE users 
                SET password_hash = ?, role = ?, permissions = ?, is_active = 1
                WHERE email = ?
            """, (password_hash, "admin", "all", email))
            print("✅ Usuário admin atualizado!")
        else:
            # Criar novo usuário
            cursor.execute("""
                INSERT INTO users (email, password_hash, role, permissions, is_active, created_at)
                VALUES (?, ?, ?, ?, 1, datetime('now'))
            """, (email, password_hash, "admin", "all"))
            print("✅ Usuário admin criado!")
        
        conn.commit()
        
        # Verificar criação
        cursor.execute("SELECT email, role, permissions, is_active FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()
        
        if user:
            print(f"\n✅ Verificação bem-sucedida:")
            print(f"   📧 Email: {user[0]}")
            print(f"   👤 Role: {user[1]}")
            print(f"   🔑 Permissions: {user[2]}")
            print(f"   ✅ Ativo: {'Sim' if user[3] else 'Não'}")
            
            conn.close()
            return True
        else:
            print("❌ Erro na verificação!")
            conn.close()
            return False
            
    except Exception as e:
        print(f"❌ Erro: {e}")
        return False

def test_login():
    """Testa o login via API"""
    print_header("TESTANDO LOGIN VIA API")
    
    import subprocess
    import json
    
    # Teste na porta 5000
    print("🧪 Testando login na porta 5000...")
    try:
        result = subprocess.run([
            'curl', '-s', '-X', 'POST', 
            'http://localhost:5000/api/auth/login',
            '-H', 'Content-Type: application/json',
            '-d', '{"email":"kelebra96@gmail.com","password":"admin123456"}'
        ], capture_output=True, text=True, timeout=10)
        
        print(f"Status: {result.returncode}")
        print(f"Resposta: {result.stdout}")
        
        if result.stdout and 'token' in result.stdout:
            print("✅ Login funcionando na porta 5000!")
        else:
            print("❌ Login falhou na porta 5000")
            
    except Exception as e:
        print(f"❌ Erro no teste: {e}")

def main():
    print("🚀 DIAGNÓSTICO COMPLETO DA VPS")
    print("=" * 60)
    
    # 1. Encontrar bancos de dados
    databases = find_databases()
    
    if not databases:
        print("\n❌ FALHA: Nenhum banco de dados encontrado!")
        return
    
    # 2. Verificar cada banco
    valid_dbs = []
    for db in databases:
        if check_database_structure(db):
            valid_dbs.append(db)
    
    if not valid_dbs:
        print("\n❌ FALHA: Nenhum banco válido encontrado!")
        return
    
    # 3. Criar admin no primeiro banco válido
    main_db = valid_dbs[0]
    print(f"\n🎯 Usando banco principal: {main_db}")
    
    if create_admin_user(main_db):
        print("\n✅ Usuário admin criado/atualizado com sucesso!")
        
        # 4. Testar login
        test_login()
        
        print_header("RESUMO FINAL")
        print("✅ Diagnóstico concluído!")
        print("📧 Email: kelebra96@gmail.com")
        print("🔑 Senha: admin123456")
        print(f"💾 Banco: {main_db}")
        print("\n🌐 Teste o login em:")
        print("   - http://212.85.17.99:5000 (API direta)")
        print("   - http://212.85.17.99 (se Nginx configurado)")
    else:
        print("\n❌ FALHA: Não foi possível criar o usuário admin!")

if __name__ == "__main__":
    main()