#!/usr/bin/env python3
"""
Script para criar usuário admin na VPS - Auto Trader AI
VPS: 212.85.17.99
Credenciais: kelebra96@gmail.com / admin123456

Este script deve ser executado na VPS após o deployment da aplicação.
"""

import sys
import os
import sqlite3
from datetime import datetime
import hashlib
import secrets

def hash_password(password):
    """Gera hash da senha usando o mesmo método do Flask-Bcrypt"""
    try:
        import bcrypt
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    except ImportError:
        # Fallback para hash simples se bcrypt não estiver disponível
        salt = secrets.token_hex(16)
        return hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000).hex() + ':' + salt

def create_admin_user_direct():
    """Cria o usuário admin diretamente no banco SQLite da VPS"""
    
    # Caminhos possíveis do banco de dados na VPS
    possible_db_paths = [
        '/var/www/auto-trader-ai/backend/auto_trader.db',
        '/var/www/auto-trader-ai/backend/src/auto_trader.db',
        '/tmp/auto_trader.db',
        './auto_trader.db',
        './backend/auto_trader.db',
        './src/auto_trader.db'
    ]
    
    db_path = None
    for path in possible_db_paths:
        if os.path.exists(path):
            db_path = path
            break
    
    if not db_path:
        print("❌ Banco de dados não encontrado!")
        print("Caminhos verificados:")
        for path in possible_db_paths:
            print(f"   - {path}")
        return False
    
    print(f"📁 Banco de dados encontrado: {db_path}")
    
    try:
        # Conectar ao banco SQLite
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Verificar se a tabela users existe
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users';")
        if not cursor.fetchone():
            print("❌ Tabela 'users' não encontrada no banco de dados!")
            print("Execute primeiro a inicialização do banco de dados.")
            return False
        
        # Verificar se o usuário já existe
        cursor.execute("SELECT id, email, nome_completo, cargo, ativo FROM users WHERE email = ?", 
                      ('kelebra96@gmail.com',))
        existing_user = cursor.fetchone()
        
        if existing_user:
            print(f"⚠️  Usuário com email 'kelebra96@gmail.com' já existe!")
            print(f"   ID: {existing_user[0]}")
            print(f"   Nome: {existing_user[2]}")
            print(f"   Cargo: {existing_user[3]}")
            print(f"   Ativo: {existing_user[4]}")
            
            # Atualizar usuário existente
            print("\n🔄 Atualizando usuário para admin...")
            password_hash = hash_password('admin123456')
            
            cursor.execute("""
                UPDATE users 
                SET cargo = ?, 
                    permissoes = ?, 
                    ativo = ?, 
                    password_hash = ?,
                    updated_at = ?
                WHERE email = ?
            """, ('admin', '["all"]', True, password_hash, datetime.now().isoformat(), 'kelebra96@gmail.com'))
            
            conn.commit()
            print("✅ Usuário atualizado para admin com sucesso!")
            
        else:
            # Criar novo usuário admin
            print("🆕 Criando novo usuário admin...")
            password_hash = hash_password('admin123456')
            now = datetime.now().isoformat()
            
            cursor.execute("""
                INSERT INTO users (
                    email, 
                    nome_estabelecimento, 
                    nome_completo, 
                    cargo, 
                    permissoes, 
                    ativo, 
                    empresa, 
                    bio, 
                    password_hash,
                    created_at,
                    updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                'kelebra96@gmail.com',
                'Administração do Sistema',
                'Administrador Principal',
                'admin',
                '["all"]',
                True,
                'Auto Trader AI',
                'Usuário administrador principal do sistema',
                password_hash,
                now,
                now
            ))
            
            conn.commit()
            print("✅ Usuário admin criado com sucesso!")
        
        # Verificar criação
        cursor.execute("SELECT id, email, nome_completo, cargo, ativo, created_at FROM users WHERE email = ?", 
                      ('kelebra96@gmail.com',))
        user = cursor.fetchone()
        
        if user:
            print("\n" + "="*60)
            print("VERIFICAÇÃO DO USUÁRIO ADMIN CRIADO")
            print("="*60)
            print(f"✅ ID: {user[0]}")
            print(f"✅ Email: {user[1]}")
            print(f"✅ Nome: {user[2]}")
            print(f"✅ Cargo: {user[3]}")
            print(f"✅ Ativo: {user[4]}")
            print(f"✅ Criado em: {user[5]}")
            print(f"✅ Senha: admin123456")
            print("="*60)
            
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Erro ao criar usuário admin: {e}")
        import traceback
        traceback.print_exc()
        return False

def create_admin_user_flask():
    """Cria o usuário admin usando o contexto Flask (se disponível)"""
    try:
        # Tentar importar e usar o contexto Flask
        sys.path.append('/var/www/auto-trader-ai/backend/src')
        sys.path.append('/var/www/auto-trader-ai/backend')
        sys.path.append('./src')
        sys.path.append('./backend/src')
        
        from main_simple import app, db, User
        
        with app.app_context():
            # Verificar se o usuário já existe
            existing_user = User.query.filter_by(email='kelebra96@gmail.com').first()
            if existing_user:
                print(f"⚠️  Usuário com email 'kelebra96@gmail.com' já existe!")
                print(f"   ID: {existing_user.id}")
                print(f"   Nome: {existing_user.nome_completo}")
                print(f"   Cargo: {existing_user.cargo}")
                print(f"   Ativo: {existing_user.ativo}")
                
                # Atualizar usuário existente
                print("\n🔄 Atualizando usuário para admin...")
                existing_user.cargo = 'admin'
                existing_user.permissoes = ['all']
                existing_user.ativo = True
                existing_user.set_password('admin123456')
                
                db.session.commit()
                print("✅ Usuário atualizado para admin com sucesso!")
                return True
            
            # Criar novo usuário admin
            admin_user = User(
                email='kelebra96@gmail.com',
                nome_estabelecimento='Administração do Sistema',
                nome_completo='Administrador Principal',
                cargo='admin',
                permissoes=['all'],
                ativo=True,
                empresa='Auto Trader AI',
                bio='Usuário administrador principal do sistema'
            )
            
            admin_user.set_password('admin123456')
            
            db.session.add(admin_user)
            db.session.commit()
            
            print("✅ Usuário admin criado com sucesso!")
            return True
            
    except Exception as e:
        print(f"⚠️  Método Flask falhou: {e}")
        return False

def main():
    """Função principal que tenta diferentes métodos de criação"""
    print("🚀 Iniciando criação do usuário admin na VPS...")
    print("🌐 VPS: 212.85.17.99")
    print("📧 Email: kelebra96@gmail.com")
    print("🔑 Senha: admin123456")
    print("-" * 60)
    
    # Tentar método Flask primeiro
    print("🔄 Tentando método Flask...")
    if create_admin_user_flask():
        print("\n🎉 Usuário admin criado com sucesso via Flask!")
        return True
    
    # Se Flask falhar, usar método direto SQLite
    print("\n🔄 Tentando método direto SQLite...")
    if create_admin_user_direct():
        print("\n🎉 Usuário admin criado com sucesso via SQLite!")
        return True
    
    print("\n❌ Falha na criação do usuário admin.")
    print("\n🔧 Soluções possíveis:")
    print("   1. Verificar se o banco de dados foi inicializado")
    print("   2. Verificar permissões de acesso ao arquivo do banco")
    print("   3. Executar o script no diretório correto da aplicação")
    print("   4. Verificar se as dependências Python estão instaladas")
    
    return False

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)