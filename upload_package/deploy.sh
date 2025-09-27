#!/bin/bash

# Script de Deployment - Auto Trader AI
# VPS: 212.85.17.99

echo "=== Iniciando Deployment do Auto Trader AI ==="

# Atualizar sistema
echo "Atualizando sistema..."
apt update && apt upgrade -y

# Instalar dependências básicas
echo "Instalando dependências básicas..."
apt install -y curl wget git nginx python3 python3-pip python3-venv nodejs npm sqlite3

# Verificar versões instaladas
echo "Verificando versões..."
python3 --version
node --version
npm --version

# Criar diretório da aplicação
echo "Criando diretório da aplicação..."
mkdir -p /var/www/auto-trader-ai
cd /var/www/auto-trader-ai

# Clonar ou criar estrutura da aplicação
echo "Preparando estrutura da aplicação..."

# Criar estrutura de diretórios
mkdir -p backend frontend

# Configurar backend
echo "Configurando backend..."
cd backend

# Criar arquivo requirements.txt
cat > requirements.txt << 'EOF'
Flask==2.3.3
Flask-CORS==4.0.0
Flask-JWT-Extended==4.5.3
Flask-SQLAlchemy==3.0.5
python-dotenv==1.0.0
bcrypt==4.0.1
Werkzeug==2.3.7
SQLAlchemy==2.0.23
PyJWT==2.8.0
requests==2.31.0
python-dateutil==2.8.2
EOF

# Criar ambiente virtual e instalar dependências
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configurar frontend
echo "Configurando frontend..."
cd ../frontend

# Criar package.json básico
cat > package.json << 'EOF'
{
  "name": "auto-trader-ai-frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.1",
    "axios": "^1.3.4",
    "lucide-react": "^0.263.1"
  },
  "devDependencies": {
    "@types/react": "^18.0.28",
    "@types/react-dom": "^18.0.11",
    "@vitejs/plugin-react": "^3.1.0",
    "autoprefixer": "^10.4.14",
    "postcss": "^8.4.21",
    "tailwindcss": "^3.2.7",
    "vite": "^4.1.0"
  }
}
EOF

# Instalar dependências do frontend
npm install

# Configurar Nginx
echo "Configurando Nginx..."
cat > /etc/nginx/sites-available/auto-trader-ai << 'EOF'
server {
    listen 80;
    server_name 212.85.17.99;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Ativar site
ln -sf /etc/nginx/sites-available/auto-trader-ai /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Testar configuração do Nginx
nginx -t

# Criar serviços systemd
echo "Criando serviços systemd..."

# Serviço do backend
cat > /etc/systemd/system/auto-trader-backend.service << 'EOF'
[Unit]
Description=Auto Trader AI Backend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/auto-trader-ai/backend
Environment=PATH=/var/www/auto-trader-ai/backend/venv/bin
ExecStart=/var/www/auto-trader-ai/backend/venv/bin/python src/main_simple.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Serviço do frontend
cat > /etc/systemd/system/auto-trader-frontend.service << 'EOF'
[Unit]
Description=Auto Trader AI Frontend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/auto-trader-ai/frontend
ExecStart=/usr/bin/npm run dev -- --host 0.0.0.0
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Recarregar systemd
systemctl daemon-reload

# Criar arquivo de ambiente
echo "Criando arquivo de ambiente..."
cat > /var/www/auto-trader-ai/backend/.env << 'EOF'
FLASK_ENV=production
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here
DATABASE_URL=sqlite:///auto_trader.db
CORS_ORIGINS=http://212.85.17.99,http://localhost:5173
EOF

echo "=== Deployment básico concluído ==="
echo "Próximos passos:"
echo "1. Copiar arquivos da aplicação para /var/www/auto-trader-ai/"
echo "2. Iniciar serviços: systemctl start auto-trader-backend auto-trader-frontend nginx"
echo "3. Habilitar auto-start: systemctl enable auto-trader-backend auto-trader-frontend nginx"
echo "4. Verificar status: systemctl status auto-trader-backend auto-trader-frontend nginx"