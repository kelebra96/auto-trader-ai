#!/bin/bash
# Script para configurar MySQL no VPS Auto Trader AI
# Execute este script diretamente no VPS

set -e  # Parar em caso de erro

echo "🚀 Configurando MySQL no VPS Auto Trader AI"
echo "=============================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then
    log_error "Este script deve ser executado como root"
    exit 1
fi

# Verificar se estamos no diretório correto
if [ ! -d "/var/www/auto-trader-ai/backend" ]; then
    log_error "Diretório /var/www/auto-trader-ai/backend não encontrado"
    exit 1
fi

cd /var/www/auto-trader-ai/backend

# 1. Verificar/Instalar MySQL
log_info "Verificando instalação do MySQL..."
if ! command -v mysql &> /dev/null; then
    log_warning "MySQL não encontrado. Instalando..."
    apt update
    apt install mysql-server -y
    log_success "MySQL instalado"
else
    log_success "MySQL já está instalado"
fi

# 2. Verificar/Instalar dependências Python
log_info "Verificando dependências Python..."
if ! python3 -c "import pymysql" &> /dev/null; then
    log_warning "PyMySQL não encontrado. Instalando..."
    pip3 install pymysql mysql-connector-python
    log_success "Dependências Python instaladas"
else
    log_success "Dependências Python já estão instaladas"
fi

# 3. Verificar se os scripts MySQL existem
log_info "Verificando scripts MySQL..."
if [ ! -f "init_mysql.py" ] || [ ! -f "migrate_to_mysql.py" ]; then
    log_warning "Scripts MySQL não encontrados. Criando..."
    
    # Criar init_mysql.py
    cat > init_mysql.py << 'EOF'
#!/usr/bin/env python3
"""
Script de inicialização do banco MySQL - Versão VPS
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
        print("\nDefina as variáveis no arquivo .env")
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
        
        print("\n" + "=" * 50)
        print("🎉 Inicialização do MySQL concluída com sucesso!")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro durante a inicialização: {e}")
        return False
        
    finally:
        mysql_conn.close()

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
EOF

    chmod +x init_mysql.py
    log_success "Script init_mysql.py criado"
fi

# 4. Verificar arquivo .env
log_info "Verificando configuração .env..."
if [ ! -f ".env" ]; then
    log_warning "Arquivo .env não encontrado. Criando exemplo..."
    cat > .env << 'EOF'
# Configurações básicas
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here

# Banco de dados - SQLite (padrão)
DATABASE_URL=sqlite:///app.db

# Configurações de Banco de Dados
# Para usar MySQL, configure as variáveis abaixo e defina USE_MYSQL=true
USE_MYSQL=false

# Configurações MySQL (obrigatórias se USE_MYSQL=true)
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=sua_senha_mysql
MYSQL_DATABASE=auto_trader_ai

# Redis
REDIS_URL=redis://localhost:6379/0

# APIs Externas
OPENAI_API_KEY=your-openai-api-key
MERCADOPAGO_ACCESS_TOKEN=your-mercadopago-token

# Email
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-email-password

# Upload de arquivos
MAX_CONTENT_LENGTH=16777216
UPLOAD_FOLDER=uploads

# Flask
FLASK_ENV=production
FLASK_DEBUG=false
EOF
    log_success "Arquivo .env criado. Configure as variáveis MySQL!"
else
    log_success "Arquivo .env já existe"
fi

# 5. Verificar se MySQL está rodando
log_info "Verificando status do MySQL..."
if systemctl is-active --quiet mysql; then
    log_success "MySQL está rodando"
else
    log_warning "MySQL não está rodando. Iniciando..."
    systemctl start mysql
    systemctl enable mysql
    log_success "MySQL iniciado"
fi

# 6. Configurar MySQL (se necessário)
log_info "Verificando configuração do MySQL..."
if [ ! -f "/var/lib/mysql/mysql_configured" ]; then
    log_warning "Configurando MySQL pela primeira vez..."
    
    # Configuração básica de segurança
    mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'root123';" 2>/dev/null || true
    mysql -u root -proot123 -e "FLUSH PRIVILEGES;" 2>/dev/null || true
    
    touch /var/lib/mysql/mysql_configured
    log_success "MySQL configurado"
fi

echo ""
echo "=============================================="
log_success "Configuração do MySQL concluída!"
echo ""
log_info "Próximos passos:"
echo "1. Edite o arquivo .env e configure as variáveis MySQL:"
echo "   nano .env"
echo ""
echo "2. Configure as variáveis MySQL no .env:"
echo "   USE_MYSQL=true"
echo "   MYSQL_HOST=localhost"
echo "   MYSQL_PORT=3306"
echo "   MYSQL_USER=root"
echo "   MYSQL_PASSWORD=root123"
echo "   MYSQL_DATABASE=auto_trader_ai"
echo ""
echo "3. Execute a inicialização:"
echo "   python3 init_mysql.py"
echo ""
echo "4. Reinicie a aplicação:"
echo "   systemctl restart auto-trader-ai"
echo ""
log_success "Script concluído!"