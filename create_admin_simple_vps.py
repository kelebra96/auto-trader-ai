#!/usr/bin/env python3
"""
Script simples para criar usuário admin na VPS
Execute: python3 create_admin_simple_vps.py
"""

import sqlite3
import bcrypt
import os
import sys

def find_database():
    """Encontra o arquivo do banco de dados"""
    possible_paths = [
        'instance/database.db',
        'database.db', 
        '../database.db',
        '/tmp/database.db',
        'src/instance/database.db',
        './backend/instance/database.db'
    ]
    
    for path in possible_paths:
        if os.path.exists(path):
            return path
    return None

def create_admin_user():
    """Cria o usuário admin"""
    print("🔍 Procurando banco de dados...")
    
    db_path = find_database()
    if not db_path:
        print("❌ Banco de dados não encontrado!")
        print("Caminhos testados:")
        for path in ['instance/database.db', 'database.db', '../database.db', '/tmp/database.db']:
            print(f"  - {path}")
        return False
    
    print(f"✅ Banco encontrado: {db_path}")
    
    try:
        # Conectar ao banco
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Verificar se tabela users existe
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users';")
        if not cursor.fetchone():
            print("❌ Tabela 'users' não existe!")
            return False
        
        # Dados do admin
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
            print(f"✅ Verificação bem-sucedida:")
            print(f"   📧 Email: {user[0]}")
            print(f"   👤 Role: {user[1]}")
            print(f"   🔑 Permissions: {user[2]}")
            print(f"   ✅ Ativo: {'Sim' if user[3] else 'Não'}")
            print(f"")
            print(f"🎯 CREDENCIAIS PARA LOGIN:")
            print(f"   📧 Email: {email}")
            print(f"   🔑 Senha: {password}")
            return True
        else:
            print("❌ Erro na verificação!")
            return False
            
    except Exception as e:
        print(f"❌ Erro: {e}")
        return False
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    print("=" * 50)
    print("🚀 CRIANDO USUÁRIO ADMIN NA VPS")
    print("=" * 50)
    
    success = create_admin_user()
    
    if success:
        print("\n" + "=" * 50)
        print("✅ SUCESSO! Usuário admin criado/atualizado!")
        print("🌐 Agora você pode fazer login na aplicação")
        print("=" * 50)
    else:
        print("\n" + "=" * 50)
        print("❌ FALHA! Não foi possível criar o usuário")
        print("=" * 50)
        sys.exit(1)