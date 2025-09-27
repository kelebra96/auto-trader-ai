#!/usr/bin/env python3
"""
Script para criar e inicializar o banco de dados
"""

from src.main_simple import app, db, User
from werkzeug.security import generate_password_hash

def create_database():
    """Cria todas as tabelas do banco de dados"""
    with app.app_context():
        # Remove todas as tabelas existentes e recria
        db.drop_all()
        db.create_all()
        print("✅ Banco de dados criado com sucesso!")
        
        # Criar usuário admin padrão
        admin_user = User(
            email='admin@example.com',
            nome_estabelecimento='Estabelecimento Admin',
            nome_completo='Administrador do Sistema',
            cargo='admin',
            permissoes=['all'],
            ativo=True
        )
        admin_user.set_password('admin123')
        
        # Criar usuário gerente
        gerente_user = User(
            email='gerente@example.com',
            nome_estabelecimento='Estabelecimento Gerente',
            nome_completo='Gerente do Sistema',
            cargo='gerente',
            permissoes=['view_dashboard', 'view_products', 'create_product', 'edit_product', 'view_alerts', 'view_reports', 'view_sales', 'create_sale'],
            ativo=True
        )
        gerente_user.set_password('gerente123')
        
        # Criar usuário comum
        usuario_user = User(
            email='usuario@example.com',
            nome_estabelecimento='Estabelecimento Usuario',
            nome_completo='Usuário do Sistema',
            cargo='usuario',
            permissoes=['view_dashboard', 'view_products', 'create_product', 'view_alerts'],
            ativo=True
        )
        usuario_user.set_password('usuario123')
        
        # Criar visualizador
        visualizador_user = User(
            email='visualizador@example.com',
            nome_estabelecimento='Estabelecimento Visualizador',
            nome_completo='Visualizador do Sistema',
            cargo='visualizador',
            permissoes=['view_dashboard', 'view_products', 'view_alerts', 'view_reports'],
            ativo=True
        )
        visualizador_user.set_password('visualizador123')
        
        try:
            db.session.add(admin_user)
            db.session.add(gerente_user)
            db.session.add(usuario_user)
            db.session.add(visualizador_user)
            db.session.commit()
            print("✅ Usuários de teste criados com sucesso!")
            print("📧 Admin: admin@example.com / admin123")
            print("📧 Gerente: gerente@example.com / gerente123")
            print("📧 Usuário: usuario@example.com / usuario123")
            print("📧 Visualizador: visualizador@example.com / visualizador123")
        except Exception as e:
            db.session.rollback()
            print(f"❌ Erro ao criar usuários: {e}")

if __name__ == '__main__':
    create_database()