#!/bin/bash
# Script para criar usuário admin na VPS
# Copie e cole este script no terminal da VPS

echo "🚀 Criando usuário admin na VPS..."
echo "📧 Email: kelebra96@gmail.com"
echo "🔑 Senha: admin123456"
echo "----------------------------------------"

# Navegar para o diretório da aplicação
cd /var/www/auto-trader-ai/backend || {
    echo "❌ Diretório da aplicação não encontrado!"
    echo "Tentando outros locais..."
    
    if [ -d "/var/www/auto-trader-ai" ]; then
        cd /var/www/auto-trader-ai
        echo "✅ Encontrado em /var/www/auto-trader-ai"
    elif [ -d "/opt/auto-trader-ai" ]; then
        cd /opt/auto-trader-ai
        echo "✅ Encontrado em /opt/auto-trader-ai"
    elif [ -d "/home/auto-trader-ai" ]; then
        cd /home/auto-trader-ai
        echo "✅ Encontrado em /home/auto-trader-ai"
    else
        echo "❌ Aplicação não encontrada! Verifique o local de instalação."
        exit 1
    fi
}

echo "📁 Diretório atual: $(pwd)"

# Verificar se o banco de dados existe
DB_PATHS=(
    "auto_trader.db"
    "backend/auto_trader.db"
    "src/auto_trader.db"
    "database/auto_trader.db"
)

DB_FILE=""
for path in "${DB_PATHS[@]}"; do
    if [ -f "$path" ]; then
        DB_FILE="$path"
        echo "✅ Banco de dados encontrado: $DB_FILE"
        break
    fi
done

if [ -z "$DB_FILE" ]; then
    echo "❌ Banco de dados não encontrado!"
    echo "Caminhos verificados:"
    for path in "${DB_PATHS[@]}"; do
        echo "   - $path"
    done
    exit 1
fi

# Gerar hash da senha usando Python
echo "🔐 Gerando hash da senha..."
PASSWORD_HASH=$(python3 -c "
import hashlib
import secrets
import sys

try:
    import bcrypt
    password = 'admin123456'
    hash_bytes = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    print(hash_bytes.decode('utf-8'))
except ImportError:
    # Fallback para hash simples
    password = 'admin123456'
    salt = secrets.token_hex(16)
    hash_hex = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000).hex()
    print(f'{hash_hex}:{salt}')
")

if [ -z "$PASSWORD_HASH" ]; then
    echo "❌ Falha ao gerar hash da senha!"
    exit 1
fi

echo "✅ Hash da senha gerado"

# Criar usuário no banco de dados
echo "👤 Criando usuário admin..."

sqlite3 "$DB_FILE" << EOF
-- Verificar usuário existente
.mode column
.headers on
SELECT 'Verificando usuário existente...' as status;
SELECT id, email, nome_completo, cargo, ativo FROM users WHERE email = 'kelebra96@gmail.com';

-- Inserir ou atualizar usuário admin
INSERT OR REPLACE INTO users (
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
) VALUES (
    'kelebra96@gmail.com',
    'Administração do Sistema',
    'Administrador Principal',
    'admin',
    '["all"]',
    1,
    'Auto Trader AI',
    'Usuário administrador principal do sistema',
    '$PASSWORD_HASH',
    datetime('now'),
    datetime('now')
);

-- Verificar criação
SELECT 'Usuário admin criado/atualizado!' as status;
SELECT id, email, nome_completo, cargo, ativo, created_at FROM users WHERE email = 'kelebra96@gmail.com';
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Usuário admin criado com sucesso!"
    echo "📧 Email: kelebra96@gmail.com"
    echo "🔑 Senha: admin123456"
    echo "👤 Cargo: admin"
    echo "🔐 Permissões: all"
    echo ""
    echo "🧪 Testando login..."
    
    # Testar login via API (se a aplicação estiver rodando)
    if command -v curl &> /dev/null; then
        echo "🔄 Fazendo teste de login..."
        curl -X POST http://localhost:5000/api/auth/login \
             -H "Content-Type: application/json" \
             -d '{"email":"kelebra96@gmail.com","password":"admin123456"}' \
             2>/dev/null | python3 -m json.tool 2>/dev/null || echo "API não está respondendo ou JSON inválido"
    fi
    
    echo ""
    echo "🎉 Processo concluído!"
    echo "Agora você pode fazer login na aplicação com as credenciais acima."
    
else
    echo "❌ Erro ao criar usuário admin!"
    exit 1
fi