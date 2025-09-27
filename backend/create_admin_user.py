#!/usr/bin/env python3
"""
Script para criar usuário admin específico
"""

import sys
import os

# Adicionar o diretório src ao path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from main_simple import app, db, User
from werkzeug.security import generate_password_hash

def create_admin_user():
    """Cria o usuário admin com as credenciais fornecidas"""
    try:
        with app.app_context():
            # Verificar se o usuário já existe
            existing_user = User.query.filter_by(email='kelebra96@gmail.com').first()
            if existing_user:
                print(f"❌ Usuário com email 'kelebra96@gmail.com' já existe!")
                print(f"   ID: {existing_user.id}")
                print(f"   Nome: {existing_user.nome_completo}")
                print(f"   Cargo: {existing_user.cargo}")
                print(f"   Ativo: {existing_user.ativo}")
                
                # Perguntar se deseja atualizar
                resposta = input("\n🔄 Deseja atualizar este usuário para admin? (s/n): ")
                if resposta.lower() in ['s', 'sim', 'y', 'yes']:
                    existing_user.cargo = 'admin'
                    existing_user.permissoes = ['all']
                    existing_user.ativo = True
                    existing_user.set_password('Ro04041932..#@')
                    
                    db.session.commit()
                    print("✅ Usuário atualizado para admin com sucesso!")
                    return True
                else:
                    print("❌ Operação cancelada.")
                    return False
            
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
            admin_user.set_password('Ro04041932..#@')
            
            db.session.add(admin_user)
            db.session.commit()
            
            print("✅ Usuário admin criado com sucesso!")
            print("📧 Email: kelebra96@gmail.com")
            print("🔑 Senha: Ro04041932..#@")
            print("👤 Cargo: admin")
            print("🔐 Permissões: ['all']")
            print("✅ Status: ativo")
            
            return True
            
    except Exception as e:
        print(f"❌ Erro ao criar usuário admin: {e}")
        db.session.rollback()
        return False

def verify_admin_user():
    """Verifica se o usuário admin foi criado corretamente"""
    try:
        with app.app_context():
            user = User.query.filter_by(email='kelebra96@gmail.com').first()
            if user:
                print("\n" + "="*50)
                print("VERIFICAÇÃO DO USUÁRIO ADMIN")
                print("="*50)
                print(f"✅ ID: {user.id}")
                print(f"✅ Email: {user.email}")
                print(f"✅ Nome: {user.nome_completo}")
                print(f"✅ Estabelecimento: {user.nome_estabelecimento}")
                print(f"✅ Cargo: {user.cargo}")
                print(f"✅ Permissões: {user.permissoes}")
                print(f"✅ Ativo: {user.ativo}")
                print(f"✅ Criado em: {user.created_at}")
                
                # Testar senha
                if user.check_password('Ro04041932..#@'):
                    print("✅ Senha: Verificada com sucesso")
                else:
                    print("❌ Senha: Falha na verificação")
                
                return True
            else:
                print("❌ Usuário admin não encontrado!")
                return False
                
    except Exception as e:
        print(f"❌ Erro ao verificar usuário admin: {e}")
        return False

if __name__ == '__main__':
    print("🚀 Iniciando criação do usuário admin...")
    
    if create_admin_user():
        print("\n🔍 Verificando usuário criado...")
        verify_admin_user()
        print("\n🎉 Processo concluído com sucesso!")
    else:
        print("\n❌ Falha na criação do usuário admin.")
        sys.exit(1)