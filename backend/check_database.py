#!/usr/bin/env python3
"""
Script para verificar a estrutura do banco de dados
"""

import sys
sys.path.insert(0, 'src')
from main_simple import app, db
import sqlite3

def check_database():
    """Verifica a estrutura do banco de dados"""
    
    print("=== VERIFICAÇÃO DO BANCO DE DADOS ===\n")
    
    with app.app_context():
        # Conectar diretamente ao SQLite para ver as tabelas
        conn = sqlite3.connect('app.db')
        cursor = conn.cursor()
        
        # Listar tabelas
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        print('Tabelas no banco:')
        for table in tables:
            print(f'  {table[0]}')
        
        # Se existe tabela usuarios, verificar dados
        if any('usuarios' in table[0] for table in tables):
            print('\nDados da tabela usuarios:')
            cursor.execute("SELECT * FROM usuarios LIMIT 5;")
            usuarios = cursor.fetchall()
            for usuario in usuarios:
                print(f'  {usuario}')
        
        # Se existe tabela users, verificar dados
        if any('users' in table[0] for table in tables):
            print('\nDados da tabela users:')
            cursor.execute("SELECT * FROM users LIMIT 5;")
            users = cursor.fetchall()
            for user in users:
                print(f'  {user}')
        
        conn.close()

if __name__ == "__main__":
    check_database()