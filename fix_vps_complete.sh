#!/bin/bash

echo "=== SCRIPT COMPLETO PARA CORRIGIR VPS ==="
echo "Este script vai:"
echo "1. Criar o usuário admin no banco"
echo "2. Configurar Nginx para proxy reverso"
echo "3. Testar o login"
echo ""

# Navegar para o diretório da aplicação
cd /root/auto-trader-ai/backend || cd /home/*/auto-trader-ai/backend || cd /opt/auto-trader-ai/backend

echo "=== 1. CRIANDO USUÁRIO ADMIN ==="

# Criar usuário admin usando Python
python3 << 'EOF'
import sqlite3
import bcrypt
import os

# Encontrar o banco de dados
db_paths = [
    'instance/database.db',
    'database.db',
    '../database.db',
    '/tmp/database.db'
]

db_path = None
for path in db_paths:
    if os.path.exists(path):
        db_path = path
        break

if not db_path:
    print("❌ Banco de dados não encontrado!")
    exit(1)

print(f"✅ Banco encontrado: {db_path}")

# Conectar ao banco
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Verificar se a tabela users existe
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users';")
if not cursor.fetchone():
    print("❌ Tabela 'users' não existe!")
    conn.close()
    exit(1)

# Gerar hash da senha
password = "admin123456"
password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

# Verificar se usuário já existe
cursor.execute("SELECT id FROM users WHERE email = ?", ("kelebra96@gmail.com",))
existing_user = cursor.fetchone()

if existing_user:
    # Atualizar usuário existente
    cursor.execute("""
        UPDATE users 
        SET password_hash = ?, role = ?, permissions = ?, is_active = 1
        WHERE email = ?
    """, (password_hash, "admin", "all", "kelebra96@gmail.com"))
    print("✅ Usuário admin atualizado!")
else:
    # Criar novo usuário
    cursor.execute("""
        INSERT INTO users (email, password_hash, role, permissions, is_active, created_at)
        VALUES (?, ?, ?, ?, 1, datetime('now'))
    """, ("kelebra96@gmail.com", password_hash, "admin", "all"))
    print("✅ Usuário admin criado!")

conn.commit()

# Verificar criação
cursor.execute("SELECT email, role, permissions FROM users WHERE email = ?", ("kelebra96@gmail.com",))
user = cursor.fetchone()
if user:
    print(f"✅ Verificação: {user[0]} - Role: {user[1]} - Permissions: {user[2]}")
else:
    print("❌ Erro na verificação!")

conn.close()
EOF

echo ""
echo "=== 2. CONFIGURANDO NGINX ==="

# Backup da configuração atual
cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup

# Criar nova configuração Nginx
cat > /etc/nginx/sites-available/default << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    root /var/www/html;
    index index.html index.htm index.nginx-debian.html;

    server_name _;

    # Proxy para API (backend)
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization";
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin *;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Content-Type, Authorization";
            return 204;
        }
    }

    # Servir arquivos estáticos do frontend
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

# Testar configuração Nginx
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configuração Nginx válida!"
    systemctl reload nginx
    echo "✅ Nginx recarregado!"
else
    echo "❌ Erro na configuração Nginx!"
    cp /etc/nginx/sites-available/default.backup /etc/nginx/sites-available/default
fi

echo ""
echo "=== 3. TESTANDO LOGIN ==="

# Testar login via API
echo "Testando login..."
response=$(curl -s -X POST http://localhost/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"kelebra96@gmail.com","password":"admin123456"}')

echo "Resposta da API: $response"

if echo "$response" | grep -q "token"; then
    echo "✅ LOGIN FUNCIONANDO!"
else
    echo "❌ Problema no login. Testando porta 5000..."
    response2=$(curl -s -X POST http://localhost:5000/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"kelebra96@gmail.com","password":"admin123456"}')
    echo "Resposta porta 5000: $response2"
fi

echo ""
echo "=== RESUMO ==="
echo "✅ Script executado!"
echo "📧 Email: kelebra96@gmail.com"
echo "🔑 Senha: admin123456"
echo "🌐 URL: http://212.85.17.99"
echo ""
echo "Se ainda não funcionar, execute:"
echo "systemctl status nginx"
echo "systemctl restart nginx"
echo "ps aux | grep python"