#!/usr/bin/env python3
"""
Script para verificar o usuário admin criado
"""

import sys
import os

# Adicionar o diretório src ao path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from main_simple import app, db, User

def verify_admin():
    with app.app_context():
        user = User.query.filter_by(email='kelebra96@gmail.com').first()
        if user:
            print(f"✅ Usuário encontrado: {user.email}")
            print(f"✅ Cargo: {user.cargo}")
            print(f"✅ Ativo: {user.ativo}")
            print(f"✅ Permissões: {user.permissoes}")
            print(f"✅ ID: {user.id}")
            print(f"✅ Nome: {user.nome_completo}")
            
            # Testar login
            if user.check_password('Ro04041932..#@'):
                print("✅ Senha: Verificada com sucesso")
            else:
                print("❌ Senha: Falha na verificação")
        else:
            print("❌ Usuário não encontrado!")

if __name__ == '__main__':
    verify_admin()