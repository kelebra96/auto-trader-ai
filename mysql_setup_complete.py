#!/usr/bin/env python3
"""
Script completo de configuração MySQL para VPS
Contém inicialização e migração em um único arquivo
Execute: python3 mysql_setup_complete.py [init|migrate]
"""

import os
import sys
import sqlite3
import json
from datetime import datetime
import subprocess

def install_dependencies():
    """Instala dependências necessárias"""
    try:
        import pymysql
        print("✅ PyMySQL já está instalado")
        return True
    except ImportError:
        print("📦 Instalando dependências MySQL...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "pymysql", "mysql-connector-python"])
            print("✅ Dependências instaladas com sucesso")
            return True
        except Exception as e:
            print(f"❌ Erro ao instalar dependências: {e}")
            print("Execute manualmente: pip3 install pymysql mysql-connector-python")
            return False

def get_mysql_connection():
    """Conecta ao banco MySQL usando variáveis de ambiente"""
    try:
        import pymysql
    except ImportError:
        print("❌ PyMySQL não está instalado. Execute: pip3 install pymysql")
        return None
    
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

def create_tables_manually(mysql_conn):
    """Cria as tabelas manualmente (sem SQLAlchemy)"""
    try:
        cursor = mysql_conn.cursor()
        
        # SQL para criar tabelas
        tables_sql = [
            """
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                nome_estabelecimento VARCHAR(255),
                cargo VARCHAR(100) DEFAULT 'usuario',
                permissoes TEXT,
                ativo BOOLEAN DEFAULT TRUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """,
            """
            CREATE TABLE IF NOT EXISTS empresas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nome VARCHAR(255) NOT NULL,
                cnpj VARCHAR(20),
                endereco TEXT,
                telefone VARCHAR(20),
                email VARCHAR(255),
                ativo BOOLEAN DEFAULT TRUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """,
            """
            CREATE TABLE IF NOT EXISTS fornecedores (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nome VARCHAR(255) NOT NULL,
                cnpj_cpf VARCHAR(20),
                endereco TEXT,
                telefone VARCHAR(20),
                email VARCHAR(255),
                ativo BOOLEAN DEFAULT TRUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """,
            """
            CREATE TABLE IF NOT EXISTS lojas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nome VARCHAR(255) NOT NULL,
                endereco TEXT,
                telefone VARCHAR(20),
                empresa_id INT,
                ativo BOOLEAN DEFAULT TRUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (empresa_id) REFERENCES empresas(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """,
            """
            CREATE TABLE IF NOT EXISTS produtos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nome VARCHAR(255) NOT NULL,
                codigo_barras VARCHAR(50),
                categoria VARCHAR(100),
                preco_compra DECIMAL(10,2),
                preco_venda DECIMAL(10,2),
                estoque_atual INT DEFAULT 0,
                estoque_minimo INT DEFAULT 0,
                data_validade DATE,
                fornecedor_id INT,
                loja_id INT,
                ativo BOOLEAN DEFAULT TRUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id),
                FOREIGN KEY (loja_id) REFERENCES lojas(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """,
            """
            CREATE TABLE IF NOT EXISTS entradas_produto (
                id INT AUTO_INCREMENT PRIMARY KEY,
                produto_id INT NOT NULL,
                quantidade INT NOT NULL,
                preco_unitario DECIMAL(10,2),
                data_entrada DATETIME DEFAULT CURRENT_TIMESTAMP,
                data_validade DATE,
                lote VARCHAR(50),
                fornecedor_id INT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (produto_id) REFERENCES produtos(id),
                FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """,
            """
            CREATE TABLE IF NOT EXISTS vendas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                produto_id INT NOT NULL,
                quantidade INT NOT NULL,
                preco_unitario DECIMAL(10,2),
                data_venda DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (produto_id) REFERENCES produtos(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """,
            """
            CREATE TABLE IF NOT EXISTS alertas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tipo VARCHAR(50) NOT NULL,
                titulo VARCHAR(255) NOT NULL,
                descricao TEXT,
                produto_id INT,
                prioridade VARCHAR(20) DEFAULT 'media',
                status VARCHAR(20) DEFAULT 'ativo',
                lido BOOLEAN DEFAULT FALSE,
                acao_tomada VARCHAR(100),
                detalhes_resolucao TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                resolved_at DATETIME,
                FOREIGN KEY (produto_id) REFERENCES produtos(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """,
            """
            CREATE TABLE IF NOT EXISTS configuracoes_alerta (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tipo VARCHAR(50) NOT NULL,
                ativo BOOLEAN DEFAULT TRUE,
                dias_antecedencia INT DEFAULT 7,
                estoque_minimo INT DEFAULT 5,
                categorias TEXT,
                notificar_email BOOLEAN DEFAULT TRUE,
                notificar_sistema BOOLEAN DEFAULT TRUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """
        ]
        
        for sql in tables_sql:
            cursor.execute(sql)
            mysql_conn.commit()
        
        print("✅ Tabelas criadas com sucesso")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao criar tabelas: {e}")
        return False

def create_admin_user(mysql_conn):
    """Cria o usuário administrador inicial"""
    try:
        from werkzeug.security import generate_password_hash
    except ImportError:
        print("❌ Werkzeug não está disponível. Usando hash simples...")
        import hashlib
        def generate_password_hash(password):
            return hashlib.sha256(password.encode()).hexdigest()
    
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

def get_sqlite_connection():
    """Conecta ao banco SQLite"""
    sqlite_path = os.path.join(os.path.dirname(__file__), 'app.db')
    if not os.path.exists(sqlite_path):
        print(f"❌ Banco SQLite não encontrado em: {sqlite_path}")
        return None
    
    try:
        conn = sqlite3.connect(sqlite_path)
        conn.row_factory = sqlite3.Row
        print(f"✅ Conectado ao SQLite: {sqlite_path}")
        return conn
    except Exception as e:
        print(f"❌ Erro ao conectar SQLite: {e}")
        return None

def migrate_table_data(sqlite_conn, mysql_conn, table_name):
    """Migra dados de uma tabela específica"""
    try:
        import pymysql
        
        # Verificar se a tabela existe no SQLite
        sqlite_cursor = sqlite_conn.cursor()
        sqlite_cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table_name,))
        if not sqlite_cursor.fetchone():
            print(f"⚠️  Tabela '{table_name}' não encontrada no SQLite")
            return True
        
        # Obter dados do SQLite
        sqlite_cursor.execute(f"SELECT * FROM {table_name}")
        rows = sqlite_cursor.fetchall()
        
        if not rows:
            print(f"⚠️  Tabela '{table_name}' está vazia")
            return True
        
        # Obter nomes das colunas
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
                                json.loads(value)
                                row_data.append(value)
                            except:
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

def init_mysql():
    """Inicializa o banco MySQL"""
    print("🚀 Inicializando banco MySQL para Auto Trader AI")
    print("=" * 50)
    
    # Verificar variáveis de ambiente
    required_vars = ['MYSQL_HOST', 'MYSQL_USER', 'MYSQL_PASSWORD', 'MYSQL_DATABASE']
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        print("❌ Variáveis de ambiente obrigatórias não definidas:")
        for var in missing_vars:
            print(f"  - {var}")
        print("\nDefina as variáveis no arquivo .env")
        return False
    
    # Instalar dependências
    if not install_dependencies():
        return False
    
    # Conectar ao MySQL
    mysql_conn = get_mysql_connection()
    if not mysql_conn:
        return False
    
    try:
        # Criar tabelas
        print("\n📋 Criando estrutura de tabelas...")
        if not create_tables_manually(mysql_conn):
            return False
        
        # Criar usuário admin
        print("\n👤 Criando usuário administrador...")
        if not create_admin_user(mysql_conn):
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

def migrate_to_mysql():
    """Migra dados do SQLite para MySQL"""
    print("🚀 Iniciando migração SQLite -> MySQL")
    print("=" * 50)
    
    # Verificar variáveis de ambiente
    required_vars = ['MYSQL_HOST', 'MYSQL_USER', 'MYSQL_PASSWORD', 'MYSQL_DATABASE']
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        print("❌ Variáveis de ambiente obrigatórias não definidas:")
        for var in missing_vars:
            print(f"  - {var}")
        return False
    
    # Instalar dependências
    if not install_dependencies():
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
        if not create_tables_manually(mysql_conn):
            return False
        
        # Lista de tabelas para migrar
        tables_to_migrate = [
            'users', 'empresas', 'fornecedores', 'lojas', 'produtos',
            'entradas_produto', 'vendas', 'alertas', 'configuracoes_alerta'
        ]
        
        print("\n📦 Migrando dados das tabelas...")
        success_count = 0
        
        for table in tables_to_migrate:
            print(f"\n🔄 Migrando tabela: {table}")
            if migrate_table_data(sqlite_conn, mysql_conn, table):
                success_count += 1
        
        print("\n" + "=" * 50)
        print(f"✅ Migração concluída!")
        print(f"📊 Tabelas migradas: {success_count}/{len(tables_to_migrate)}")
        
        if success_count == len(tables_to_migrate):
            print("\n🎉 Todos os dados foram migrados com sucesso!")
            print("\n📝 Próximos passos:")
            print("1. Atualize o arquivo .env com USE_MYSQL=true")
            print("2. Reinicie a aplicação")
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

def main():
    """Função principal"""
    if len(sys.argv) < 2:
        print("Uso: python3 mysql_setup_complete.py [init|migrate]")
        print("  init    - Inicializar novo banco MySQL")
        print("  migrate - Migrar dados do SQLite para MySQL")
        sys.exit(1)
    
    command = sys.argv[1].lower()
    
    if command == "init":
        success = init_mysql()
    elif command == "migrate":
        success = migrate_to_mysql()
    else:
        print("❌ Comando inválido. Use 'init' ou 'migrate'")
        sys.exit(1)
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()