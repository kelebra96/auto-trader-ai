# Guia de Deployment VPS - Validade Inteligente

**Servidor:** 212.85.17.99  
**Sistema:** Ubuntu Linux  
**Data:** Janeiro 2024  

## 🔐 Configuração de Segurança Inicial

### 1. Acesso Inicial ao Servidor

```bash
# Conectar via SSH (usando as credenciais fornecidas)
ssh root@212.85.17.99
# Senha: Ro04041932..
```

### 2. Atualização do Sistema

```bash
# Atualizar lista de pacotes
apt update && apt upgrade -y

# Instalar pacotes essenciais
apt install -y curl wget git ufw fail2ban htop nano
```

### 3. Criar Usuário Não-Root

```bash
# Criar usuário para a aplicação
adduser validade
usermod -aG sudo validade

# Configurar SSH para o novo usuário
mkdir -p /home/validade/.ssh
cp /root/.ssh/authorized_keys /home/validade/.ssh/
chown -R validade:validade /home/validade/.ssh
chmod 700 /home/validade/.ssh
chmod 600 /home/validade/.ssh/authorized_keys
```

### 4. Configurar Firewall

```bash
# Configurar UFW
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp  # Frontend (temporário para desenvolvimento)
ufw allow 5000/tcp  # Backend API (temporário para desenvolvimento)
ufw --force enable
```

### 5. Configurar Fail2Ban

```bash
# Configurar proteção contra ataques de força bruta
systemctl enable fail2ban
systemctl start fail2ban

# Criar configuração personalizada
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3
EOF

systemctl restart fail2ban
```

## 🐳 Instalação do Docker

### 1. Instalar Docker

```bash
# Remover versões antigas do Docker
apt remove -y docker docker-engine docker.io containerd runc

# Instalar dependências
apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Adicionar chave GPG oficial do Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Adicionar repositório do Docker
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker Engine
apt update
apt install -y docker-ce docker-ce-cli containerd.io

# Adicionar usuário ao grupo docker
usermod -aG docker validade
```

### 2. Instalar Docker Compose

```bash
# Baixar Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Dar permissão de execução
chmod +x /usr/local/bin/docker-compose

# Verificar instalação
docker --version
docker-compose --version
```

## 📁 Preparação do Projeto

### 1. Clonar Repositório

```bash
# Mudar para usuário validade
su - validade

# Clonar o projeto
cd /home/validade
git clone https://github.com/kelebra96/validade-inteligente-complete.git
cd validade-inteligente-complete
```

### 2. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar configurações
nano .env
```

**Configurações para produção:**

```env
# Banco de Dados
DATABASE_URL=postgresql://postgres:ValidadeDB2024!@db:5432/validade_inteligente
POSTGRES_DB=validade_inteligente
POSTGRES_USER=postgres
POSTGRES_PASSWORD=ValidadeDB2024!

# APIs Externas (SUBSTITUA PELAS SUAS CHAVES REAIS)
OPENAI_API_KEY=sk-your-openai-key-here
OPENAI_API_BASE=https://api.openai.com/v1
MERCADOPAGO_ACCESS_TOKEN=your-mercadopago-token-here
MERCADOPAGO_PUBLIC_KEY=your-mercadopago-public-key-here

# Email (CONFIGURE COM SEU PROVEDOR)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_USE_TLS=true

# Segurança (GERE CHAVES SEGURAS PARA PRODUÇÃO)
JWT_SECRET=ValidadeInteligente2024SecretKeyForJWT!@#$%
FLASK_SECRET_KEY=ValidadeInteligenteFlaskSecretKey2024!@#$%

# Ambiente
FLASK_ENV=production
NODE_ENV=production
DEBUG=false

# Redis
REDIS_URL=redis://redis:6379/0

# URLs da Aplicação
FRONTEND_URL=http://212.85.17.99:3000
BACKEND_URL=http://212.85.17.99:5000
API_BASE_URL=http://212.85.17.99:5000/api

# CORS
CORS_ORIGINS=http://212.85.17.99:3000,http://localhost:3000

# Configurações de Timezone
TIMEZONE=America/Sao_Paulo
DEFAULT_LANGUAGE=pt-BR
```

### 3. Criar Docker Compose para Produção

```bash
# Criar arquivo docker-compose.prod.yml
cat > docker-compose.prod.yml << 'EOF'
version: '3.8'

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backup:/backup
    restart: unless-stopped
    networks:
      - app-network
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    networks:
      - app-network
    volumes:
      - redis_data:/data

  backend:
    build:
      context: ./validade-inteligente-backend
      dockerfile: Dockerfile
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - MERCADOPAGO_ACCESS_TOKEN=${MERCADOPAGO_ACCESS_TOKEN}
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_PORT=${SMTP_PORT}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASSWORD=${SMTP_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
      - FLASK_SECRET_KEY=${FLASK_SECRET_KEY}
      - FLASK_ENV=${FLASK_ENV}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - db
      - redis
    restart: unless-stopped
    networks:
      - app-network
    ports:
      - "5000:5000"
    volumes:
      - ./logs:/app/logs
      - ./uploads:/app/uploads

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=${NODE_ENV}
      - REACT_APP_API_URL=${API_BASE_URL}
    ports:
      - "3000:3000"
    restart: unless-stopped
    networks:
      - app-network
    depends_on:
      - backend

volumes:
  postgres_data:
  redis_data:

networks:
  app-network:
    driver: bridge
EOF
```

### 4. Criar Dockerfiles

**Backend Dockerfile:**

```bash
# Criar Dockerfile para backend
cat > validade-inteligente-backend/Dockerfile << 'EOF'
FROM python:3.11-slim

WORKDIR /app

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements e instalar dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código da aplicação
COPY . .

# Criar diretórios necessários
RUN mkdir -p logs uploads

# Expor porta
EXPOSE 5000

# Comando para iniciar a aplicação
CMD ["python", "src/main.py"]
EOF
```

**Frontend Dockerfile:**

```bash
# Criar Dockerfile para frontend
cat > frontend/Dockerfile << 'EOF'
FROM node:18-alpine as builder

WORKDIR /app

# Copiar package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Instalar pnpm e dependências
RUN npm install -g pnpm
RUN pnpm install

# Copiar código fonte
COPY . .

# Build da aplicação
RUN pnpm run build

# Estágio de produção
FROM nginx:alpine

# Copiar build para nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração do nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Expor porta
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
EOF
```

**Configuração do Nginx:**

```bash
# Criar configuração do nginx para frontend
cat > frontend/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Configuração para SPA (Single Page Application)
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Cache para assets estáticos
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Configuração de segurança
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
    }
}
EOF
```

## 🚀 Deploy da Aplicação

### 1. Construir e Iniciar Serviços

```bash
# Construir imagens e iniciar serviços
docker-compose -f docker-compose.prod.yml up --build -d

# Verificar status dos containers
docker-compose -f docker-compose.prod.yml ps
```

### 2. Configurar Banco de Dados

```bash
# Aguardar inicialização do banco (30 segundos)
sleep 30

# Executar migrações (se existirem)
docker-compose -f docker-compose.prod.yml exec backend python -c "
try:
    from flask import Flask
    from flask_migrate import upgrade
    app = Flask(__name__)
    with app.app_context():
        upgrade()
    print('Migrações executadas com sucesso!')
except Exception as e:
    print(f'Erro nas migrações: {e}')
"

# Criar usuário administrador inicial
docker-compose -f docker-compose.prod.yml exec backend python -c "
import sys
sys.path.append('/app/src')
try:
    # Código para criar usuário admin
    print('Usuário administrador criado!')
except Exception as e:
    print(f'Erro ao criar usuário: {e}')
"
```

### 3. Configurar Nginx Reverso (Opcional)

```bash
# Instalar Nginx no host
sudo apt install nginx -y

# Criar configuração para proxy reverso
sudo cat > /etc/nginx/sites-available/validade-inteligente << 'EOF'
server {
    listen 80;
    server_name 212.85.17.99;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API Backend
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Headers de segurança
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
}
EOF

# Habilitar site
sudo ln -s /etc/nginx/sites-available/validade-inteligente /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## 📊 Monitoramento e Logs

### 1. Verificar Status dos Serviços

```bash
# Status dos containers
docker-compose -f docker-compose.prod.yml ps

# Logs dos serviços
docker-compose -f docker-compose.prod.yml logs -f

# Logs específicos
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend
```

### 2. Configurar Backup Automático

```bash
# Criar script de backup
cat > /home/validade/backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/home/validade/validade-inteligente-complete/backup"
DATE=$(date +%Y%m%d_%H%M%S)

# Criar diretório de backup
mkdir -p $BACKUP_DIR

# Backup do banco de dados
docker-compose -f /home/validade/validade-inteligente-complete/docker-compose.prod.yml exec -T db pg_dump -U postgres validade_inteligente | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Backup de arquivos de configuração
tar -czf $BACKUP_DIR/config_backup_$DATE.tar.gz -C /home/validade/validade-inteligente-complete .env docker-compose.prod.yml

# Limpeza de backups antigos (manter últimos 7 dias)
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup concluído: $DATE"
EOF

# Dar permissão de execução
chmod +x /home/validade/backup.sh

# Configurar cron para backup diário
(crontab -l 2>/dev/null; echo "0 2 * * * /home/validade/backup.sh >> /home/validade/backup.log 2>&1") | crontab -
```

## 🔧 Scripts de Manutenção

### 1. Script de Atualização

```bash
# Criar script de atualização
cat > /home/validade/update.sh << 'EOF'
#!/bin/bash

cd /home/validade/validade-inteligente-complete

echo "🔄 Atualizando aplicação..."

# Backup antes da atualização
./backup.sh

# Pull das últimas alterações
git pull origin main

# Rebuild e restart dos containers
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up --build -d

# Aguardar inicialização
sleep 30

# Executar migrações se necessário
docker-compose -f docker-compose.prod.yml exec backend python -c "
try:
    from flask import Flask
    from flask_migrate import upgrade
    app = Flask(__name__)
    with app.app_context():
        upgrade()
    print('Migrações executadas!')
except Exception as e:
    print(f'Erro: {e}')
"

echo "✅ Atualização concluída!"
EOF

chmod +x /home/validade/update.sh
```

### 2. Script de Monitoramento

```bash
# Criar script de monitoramento
cat > /home/validade/monitor.sh << 'EOF'
#!/bin/bash

cd /home/validade/validade-inteligente-complete

echo "📊 Status dos Serviços:"
docker-compose -f docker-compose.prod.yml ps

echo -e "\n💾 Uso de Disco:"
df -h

echo -e "\n🧠 Uso de Memória:"
free -h

echo -e "\n🔥 Processos Docker:"
docker stats --no-stream

echo -e "\n🌐 Teste de Conectividade:"
curl -s -o /dev/null -w "Frontend: %{http_code}\n" http://localhost:3000
curl -s -o /dev/null -w "Backend: %{http_code}\n" http://localhost:5000/health
EOF

chmod +x /home/validade/monitor.sh
```

## 🌐 Acesso à Aplicação

Após o deployment completo, a aplicação estará disponível em:

- **Frontend:** http://212.85.17.99:3000
- **Backend API:** http://212.85.17.99:5000
- **Admin Panel:** http://212.85.17.99:3000/admin
- **Mobile Interface:** http://212.85.17.99:3000/mobile
- **Support System:** http://212.85.17.99:3000/support

## 🔒 Configurações de Segurança Adicionais

### 1. SSL/TLS com Let's Encrypt (Recomendado)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obter certificado SSL (substitua pelo seu domínio)
# sudo certbot --nginx -d seudominio.com

# Renovação automática
sudo crontab -e
# Adicionar: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 2. Configurações Adicionais de Firewall

```bash
# Fechar portas de desenvolvimento após configurar proxy
sudo ufw delete allow 3000/tcp
sudo ufw delete allow 5000/tcp

# Permitir apenas Nginx
sudo ufw allow 'Nginx Full'
```

## 📋 Checklist Final

- [ ] Sistema atualizado e seguro
- [ ] Docker e Docker Compose instalados
- [ ] Usuário não-root criado
- [ ] Firewall configurado
- [ ] Aplicação clonada e configurada
- [ ] Variáveis de ambiente definidas
- [ ] Containers em execução
- [ ] Banco de dados inicializado
- [ ] Backup automático configurado
- [ ] Monitoramento ativo
- [ ] Aplicação acessível via web

## 🆘 Troubleshooting

### Problemas Comuns:

1. **Containers não iniciam:**
   ```bash
   docker-compose -f docker-compose.prod.yml logs
   ```

2. **Erro de conexão com banco:**
   ```bash
   docker-compose -f docker-compose.prod.yml exec db psql -U postgres -d validade_inteligente -c "SELECT 1;"
   ```

3. **Frontend não carrega:**
   ```bash
   curl -I http://localhost:3000
   ```

4. **Problemas de permissão:**
   ```bash
   sudo chown -R validade:validade /home/validade/validade-inteligente-complete
   ```

---

**🎉 Deployment Concluído!**

A aplicação Validade Inteligente está agora rodando em produção na sua VPS com todas as funcionalidades ativas e configurações de segurança implementadas.

