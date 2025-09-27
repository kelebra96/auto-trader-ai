#!/usr/bin/env python3
"""
Script de inicialização do banco MySQL
Cria as tabelas e usuário administrador inicial
"""

import os
import sys
import json
from datetime import datetime
import pymysql
from werkzeug.security import generate_password_hash

# Adicionar o diretório src ao path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

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
            print(f"✅ Database '{mysql_config['database']}' criado/verificado")
        
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

def create_tables_with_sqlalchemy():
    """Cria as tabelas usando SQLAlchemy"""
    try:
        # Configurar SQLAlchemy para MySQL
        mysql_url = f"mysql+pymysql://{os.getenv('MYSQL_USER', 'root')}:{os.getenv('MYSQL_PASSWORD', '')}@{os.getenv('MYSQL_HOST', 'localhost')}:{os.getenv('MYSQL_PORT', 3306)}/{os.getenv('MYSQL_DATABASE', 'auto_trader_ai')}"
        
        # Importar modelos
        from main_simple import db, app
        
        # Configurar app para usar MySQL
        app.config['SQLALCHEMY_DATABASE_URI'] = mysql_url
        app.config['USE_MYSQL'] = True
        
        with app.app_context():
            # Criar todas as tabelas
            db.create_all()
            print("✅ Tabelas criadas com SQLAlchemy")
            return True
            
    except Exception as e:
        print(f"❌ Erro ao criar tabelas com SQLAlchemy: {e}")
        return False

def create_admin_user(mysql_conn):
    """Cria o usuário administrador inicial"""
    try:
        cursor = mysql_conn.cursor()
        
        # Verificar se já existe um admin
        cursor.execute("SELECT id FROM users WHERE email = %s", ('kelebra96@gmail.com',))
        if cursor.fetchone():
            print("⚠️  Usuário admin já existe")
            return True
        
        # Criar usuário admin
        admin_data = {
            'email': 'kelebra96@gmail.com',
            'password_hash': generate_password_hash('admin123456'),
            'nome_estabelecimento': 'Administrador',
            'cargo': 'admin',
            'permissoes': json.dumps(['all']),
            'ativo': True,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        insert_query = """
        INSERT INTO users (email, password_hash, nome_estabelecimento, cargo, permissoes, ativo, created_at, updated_at)
        VALUES (%(email)s, %(password_hash)s, %(nome_estabelecimento)s, %(cargo)s, %(permissoes)s, %(ativo)s, %(created_at)s, %(updated_at)s)
        """
        
        cursor.execute(insert_query, admin_data)
        mysql_conn.commit()
        
        print("✅ Usuário administrador criado:")
        print(f"   Email: {admin_data['email']}")
        print(f"   Senha: admin123456")
        print(f"   Cargo: {admin_data['cargo']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro ao criar usuário admin: {e}")
        return False

def verify_installation(mysql_conn):
    """Verifica se a instalação foi bem-sucedida"""
    try:
        cursor = mysql_conn.cursor()
        
        # Verificar tabelas criadas
        cursor.execute("SHOW TABLES")
        tables = [table[0] for table in cursor.fetchall()]
        
        expected_tables = ['users', 'empresas', 'fornecedores', 'lojas', 'produtos', 
                          'entradas_produto', 'vendas', 'alertas', 'configuracoes_alerta']
        
        missing_tables = [table for table in expected_tables if table not in tables]
        
        print(f"\n📊 Verificação da instalação:")
        print(f"   Tabelas encontradas: {len(tables)}")
        print(f"   Tabelas esperadas: {len(expected_tables)}")
        
        if missing_tables:
            print(f"   ⚠️  Tabelas faltando: {missing_tables}")
            return False
        
        # Verificar usuário admin
        cursor.execute("SELECT COUNT(*) FROM users WHERE cargo = 'admin'")
        admin_count = cursor.fetchone()[0]
        
        print(f"   Usuários admin: {admin_count}")
        
        if admin_count == 0:
            print("   ⚠️  Nenhum usuário admin encontrado")
            return False
        
        print("   ✅ Instalação verificada com sucesso!")
        return True
        
    except Exception as e:
        print(f"❌ Erro na verificação: {e}")
        return False

def main():
    """Função principal de inicialização"""
    print("🚀 Inicializando banco MySQL para Auto Trader AI")
    print("=" * 50)
    
    # Verificar variáveis de ambiente
    required_vars = ['MYSQL_HOST', 'MYSQL_USER', 'MYSQL_PASSWORD', 'MYSQL_DATABASE']
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        print("❌ Variáveis de ambiente obrigatórias não definidas:")
        for var in missing_vars:
            print(f"  - {var}")
        print("\nDefina as variáveis no arquivo .env ou no sistema")
        print("\nExemplo de configuração .env:")
        print("USE_MYSQL=true")
        print("MYSQL_HOST=localhost")
        print("MYSQL_PORT=3306")
        print("MYSQL_USER=root")
        print("MYSQL_PASSWORD=sua_senha")
        print("MYSQL_DATABASE=auto_trader_ai")
        return False
    
    # Conectar ao MySQL
    mysql_conn = get_mysql_connection()
    if not mysql_conn:
        return False
    
    try:
        # Criar tabelas
        print("\n📋 Criando estrutura de tabelas...")
        if not create_tables_with_sqlalchemy():
            return False
        
        # Criar usuário admin
        print("\n👤 Criando usuário administrador...")
        if not create_admin_user(mysql_conn):
            return False
        
        # Verificar instalação
        if not verify_installation(mysql_conn):
            return False
        
        print("\n" + "=" * 50)
        print("🎉 Inicialização do MySQL concluída com sucesso!")
        print("\n📝 Próximos passos:")
        print("1. Certifique-se de que USE_MYSQL=true no arquivo .env")
        print("2. Reinicie a aplicação")
        print("3. Acesse com:")
        print("   Email: kelebra96@gmail.com")
        print("   Senha: admin123456")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro durante a inicialização: {e}")
        return False
        
    finally:
        mysql_conn.close()
        print("\n🔌 Conexão fechada")

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)