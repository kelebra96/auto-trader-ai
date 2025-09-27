#!/usr/bin/env python3
"""
Script de migração de dados do SQLite para MySQL
Migra todos os dados da aplicação Auto Trader AI
"""

import os
import sys
import sqlite3
import json
from datetime import datetime
import pymysql
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Adicionar o diretório src ao path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

def get_sqlite_connection():
    """Conecta ao banco SQLite"""
    sqlite_path = os.path.join(os.path.dirname(__file__), 'app.db')
    if not os.path.exists(sqlite_path):
        print(f"❌ Banco SQLite não encontrado em: {sqlite_path}")
        return None
    
    try:
        conn = sqlite3.connect(sqlite_path)
        conn.row_factory = sqlite3.Row  # Para acessar colunas por nome
        print(f"✅ Conectado ao SQLite: {sqlite_path}")
        return conn
    except Exception as e:
        print(f"❌ Erro ao conectar SQLite: {e}")
        return None

def get_mysql_connection():
    """Conecta ao banco MySQL usando variáveis de ambiente"""
    mysql_config = {
        'host': os.getenv('MYSQL_HOST', 'localhost'),
        'port': int(os.getenv('MYSQL_PORT', 3306)),
        'user': os.getenv('MYSQL_USER', 'root'),
        'password': os.getenv('MYSQL_PASSWORD', ''),
        'database': os.getenv('MYSQL_DATABASE', 'auto_trader_ai'),
        'charset': 'utf8mb4'
    }
    
    try:
        # Primeiro conecta sem especificar database para criar se necessário
        conn = pymysql.connect(
            host=mysql_config['host'],
            port=mysql_config['port'],
            user=mysql_config['user'],
            password=mysql_config['password'],
            charset=mysql_config['charset']
        )
        
        # Criar database se não existir
        with conn.cursor() as cursor:
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {mysql_config['database']} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            conn.commit()
        
        conn.close()
        
        # Agora conecta ao database específico
        conn = pymysql.connect(**mysql_config)
        print(f"✅ Conectado ao MySQL: {mysql_config['host']}:{mysql_config['port']}/{mysql_config['database']}")
        return conn
        
    except Exception as e:
        print(f"❌ Erro ao conectar MySQL: {e}")
        print("Verifique as variáveis de ambiente:")
        print(f"  MYSQL_HOST: {mysql_config['host']}")
        print(f"  MYSQL_PORT: {mysql_config['port']}")
        print(f"  MYSQL_USER: {mysql_config['user']}")
        print(f"  MYSQL_DATABASE: {mysql_config['database']}")
        return None

def create_mysql_tables(mysql_conn):
    """Cria as tabelas no MySQL usando SQLAlchemy"""
    try:
        # Configurar SQLAlchemy para MySQL
        mysql_url = f"mysql+pymysql://{os.getenv('MYSQL_USER', 'root')}:{os.getenv('MYSQL_PASSWORD', '')}@{os.getenv('MYSQL_HOST', 'localhost')}:{os.getenv('MYSQL_PORT', 3306)}/{os.getenv('MYSQL_DATABASE', 'auto_trader_ai')}"
        
        engine = create_engine(mysql_url)
        
        # Importar modelos
        from main_simple import db, app
        
        # Configurar app para usar MySQL
        app.config['SQLALCHEMY_DATABASE_URI'] = mysql_url
        
        with app.app_context():
            # Criar todas as tabelas
            db.create_all()
            print("✅ Tabelas criadas no MySQL")
            return True
            
    except Exception as e:
        print(f"❌ Erro ao criar tabelas MySQL: {e}")
        return False

def migrate_table_data(sqlite_conn, mysql_conn, table_name, columns=None):
    """Migra dados de uma tabela específica"""
    try:
        # Verificar se a tabela existe no SQLite
        sqlite_cursor = sqlite_conn.cursor()
        sqlite_cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table_name,))
        if not sqlite_cursor.fetchone():
            print(f"⚠️  Tabela '{table_name}' não encontrada no SQLite")
            return True
        
        # Obter dados do SQLite
        if columns:
            columns_str = ', '.join(columns)
            sqlite_cursor.execute(f"SELECT {columns_str} FROM {table_name}")
        else:
            sqlite_cursor.execute(f"SELECT * FROM {table_name}")
        
        rows = sqlite_cursor.fetchall()
        
        if not rows:
            print(f"⚠️  Tabela '{table_name}' está vazia")
            return True
        
        # Obter nomes das colunas
        if columns:
            column_names = columns
        else:
            column_names = [description[0] for description in sqlite_cursor.description]
        
        # Preparar inserção no MySQL
        mysql_cursor = mysql_conn.cursor()
        
        # Limpar tabela MySQL primeiro
        mysql_cursor.execute(f"DELETE FROM {table_name}")
        
        # Preparar query de inserção
        placeholders = ', '.join(['%s'] * len(column_names))
        columns_str = ', '.join(column_names)
        insert_query = f"INSERT INTO {table_name} ({columns_str}) VALUES ({placeholders})"
        
        # Inserir dados
        migrated_count = 0
        for row in rows:
            try:
                # Converter dados se necessário
                row_data = []
                for i, value in enumerate(row):
                    # Converter JSON strings para campos JSON
                    if column_names[i] in ['permissoes', 'detalhes_resolucao', 'categorias'] and value:
                        if isinstance(value, str):
                            try:
                                # Verificar se já é JSON válido
                                json.loads(value)
                                row_data.append(value)
                            except:
                                # Se não for JSON, converter para string JSON
                                row_data.append(json.dumps(value))
                        else:
                            row_data.append(json.dumps(value))
                    else:
                        row_data.append(value)
                
                mysql_cursor.execute(insert_query, row_data)
                migrated_count += 1
                
            except Exception as e:
                print(f"⚠️  Erro ao migrar linha da tabela '{table_name}': {e}")
                continue
        
        mysql_conn.commit()
        print(f"✅ Migrados {migrated_count} registros da tabela '{table_name}'")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao migrar tabela '{table_name}': {e}")
        return False

def main():
    """Função principal de migração"""
    print("🚀 Iniciando migração SQLite -> MySQL")
    print("=" * 50)
    
    # Verificar variáveis de ambiente
    required_vars = ['MYSQL_HOST', 'MYSQL_USER', 'MYSQL_PASSWORD', 'MYSQL_DATABASE']
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        print("❌ Variáveis de ambiente obrigatórias não definidas:")
        for var in missing_vars:
            print(f"  - {var}")
        print("\nDefina as variáveis no arquivo .env ou no sistema")
        return False
    
    # Conectar aos bancos
    sqlite_conn = get_sqlite_connection()
    if not sqlite_conn:
        return False
    
    mysql_conn = get_mysql_connection()
    if not mysql_conn:
        sqlite_conn.close()
        return False
    
    try:
        # Criar tabelas no MySQL
        print("\n📋 Criando estrutura de tabelas no MySQL...")
        if not create_mysql_tables(mysql_conn):
            return False
        
        # Lista de tabelas para migrar (em ordem de dependências)
        tables_to_migrate = [
            'users',
            'empresas', 
            'fornecedores',
            'lojas',
            'produtos',
            'entradas_produto',
            'vendas',
            'alertas',
            'configuracoes_alerta'
        ]
        
        print("\n📦 Migrando dados das tabelas...")
        success_count = 0
        
        for table in tables_to_migrate:
            print(f"\n🔄 Migrando tabela: {table}")
            if migrate_table_data(sqlite_conn, mysql_conn, table):
                success_count += 1
        
        print("\n" + "=" * 50)
        print(f"✅ Migração concluída!")
        print(f"📊 Tabelas migradas com sucesso: {success_count}/{len(tables_to_migrate)}")
        
        if success_count == len(tables_to_migrate):
            print("\n🎉 Todos os dados foram migrados com sucesso!")
            print("\n📝 Próximos passos:")
            print("1. Atualize o arquivo .env com USE_MYSQL=true")
            print("2. Reinicie a aplicação")
            print("3. Teste o funcionamento")
            return True
        else:
            print(f"\n⚠️  Algumas tabelas não foram migradas completamente")
            return False
            
    except Exception as e:
        print(f"❌ Erro durante a migração: {e}")
        return False
        
    finally:
        sqlite_conn.close()
        mysql_conn.close()
        print("\n🔌 Conexões fechadas")

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)