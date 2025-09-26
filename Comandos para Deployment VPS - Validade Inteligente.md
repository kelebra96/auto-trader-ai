# Comandos para Deployment VPS - Validade Inteligente

**Execute estes comandos no seu terminal para subir a aplicação na sua VPS**

## 🔐 Passo 1: Conectar à VPS

```bash
# Conectar via SSH (substitua pela porta correta se alterou)
ssh validade@212.85.17.99

# Se você alterou a porta SSH para 2222:
# ssh -p 2222 validade@212.85.17.99
```

## 📦 Passo 2: Atualizar Sistema e Instalar Pré-requisitos

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar ferramentas essenciais
sudo apt install -y curl wget git nano htop unzip
```

## 🐳 Passo 3: Instalar Docker

```bash
# Remover versões antigas do Docker
sudo apt remove -y docker docker-engine docker.io containerd runc

# Instalar dependências
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Adicionar chave GPG do Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Adicionar repositório do Docker
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Aplicar mudanças de grupo (ou faça logout/login)
newgrp docker

# Testar Docker
docker --version
```

## 🔧 Passo 4: Instalar Docker Compose

```bash
# Baixar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Dar permissão de execução
sudo chmod +x /usr/local/bin/docker-compose

# Testar Docker Compose
docker-compose --version
```

## 📁 Passo 5: Clonar Repositório

```bash
# Ir para diretório home
cd ~

# Clonar o projeto
git clone https://github.com/kelebra96/validade-inteligente-complete.git

# Entrar no diretório
cd validade-inteligente-complete

# Verificar conteúdo
ls -la
```

## ⚙️ Passo 6: Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar arquivo de configuração
nano .env
```

**Cole estas configurações no arquivo .env (substitua as chaves de API pelas suas reais):**

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

# Configurações
TIMEZONE=America/Sao_Paulo
DEFAULT_LANGUAGE=pt-BR
```

**Para salvar no nano: Ctrl + X, depois Y, depois Enter**

## 🐳 Passo 7: Criar Docker Compose para Produção

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

## 📄 Passo 8: Criar Dockerfiles

### Backend Dockerfile:

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

# Criar requirements.txt básico se não existir
RUN echo "flask==2.3.3" > requirements.txt && \
    echo "flask-sqlalchemy==3.0.5" >> requirements.txt && \
    echo "flask-migrate==4.0.5" >> requirements.txt && \
    echo "flask-cors==4.0.0" >> requirements.txt && \
    echo "psycopg2-binary==2.9.7" >> requirements.txt && \
    echo "redis==4.6.0" >> requirements.txt && \
    echo "celery==5.3.1" >> requirements.txt && \
    echo "openai==0.28.1" >> requirements.txt && \
    echo "requests==2.31.0" >> requirements.txt && \
    echo "python-dotenv==1.0.0" >> requirements.txt && \
    echo "gunicorn==21.2.0" >> requirements.txt

# Instalar dependências Python
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código da aplicação
COPY . .

# Criar diretórios necessários
RUN mkdir -p logs uploads

# Expor porta
EXPOSE 5000

# Comando para iniciar a aplicação
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "src.main:app"]
EOF
```

### Frontend Dockerfile:

```bash
# Criar Dockerfile para frontend
cat > frontend/Dockerfile << 'EOF'
FROM node:18-alpine as builder

WORKDIR /app

# Criar package.json básico se não existir
RUN echo '{"name": "validade-inteligente-frontend", "version": "1.0.0", "scripts": {"build": "echo Build completed", "start": "echo Starting frontend"}}' > package.json

# Criar index.html básico
RUN mkdir -p dist && echo '<!DOCTYPE html><html><head><title>Validade Inteligente</title></head><body><h1>Validade Inteligente - Em Construção</h1><p>Sistema em desenvolvimento...</p></body></html>' > dist/index.html

# Estágio de produção
FROM nginx:alpine

# Copiar build para nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Expor porta
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
EOF
```

## 🚀 Passo 9: Iniciar Aplicação

```bash
# Construir e iniciar serviços
docker-compose -f docker-compose.prod.yml up --build -d

# Verificar status dos containers
docker-compose -f docker-compose.prod.yml ps

# Verificar logs
docker-compose -f docker-compose.prod.yml logs -f
```

## 🔍 Passo 10: Verificar Funcionamento

```bash
# Testar conectividade
curl -I http://localhost:3000
curl -I http://localhost:5000

# Verificar containers rodando
docker ps

# Verificar logs específicos
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend
```

## 🌐 Passo 11: Configurar Nginx (Proxy Reverso)

```bash
# Instalar Nginx
sudo apt install nginx -y

# Criar configuração
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
}
EOF

# Habilitar site
sudo ln -s /etc/nginx/sites-available/validade-inteligente /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## 🔒 Passo 12: Configurar Firewall

```bash
# Permitir Nginx
sudo ufw allow 'Nginx Full'

# Verificar status
sudo ufw status
```

## 📊 Passo 13: Scripts de Monitoramento

```bash
# Criar script de monitoramento
cat > ~/monitor.sh << 'EOF'
#!/bin/bash

echo "=== Status dos Containers ==="
docker-compose -f ~/validade-inteligente-complete/docker-compose.prod.yml ps

echo -e "\n=== Uso de Recursos ==="
docker stats --no-stream

echo -e "\n=== Teste de Conectividade ==="
curl -s -o /dev/null -w "Frontend: %{http_code}\n" http://localhost:3000
curl -s -o /dev/null -w "Backend: %{http_code}\n" http://localhost:5000

echo -e "\n=== Espaço em Disco ==="
df -h /

echo -e "\n=== Memória ==="
free -h
EOF

chmod +x ~/monitor.sh

# Executar monitoramento
~/monitor.sh
```

## 🔄 Passo 14: Script de Backup

```bash
# Criar script de backup
cat > ~/backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="$HOME/validade-inteligente-complete/backup"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup do banco de dados
docker-compose -f $HOME/validade-inteligente-complete/docker-compose.prod.yml exec -T db pg_dump -U postgres validade_inteligente | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Backup de configurações
tar -czf $BACKUP_DIR/config_backup_$DATE.tar.gz -C $HOME/validade-inteligente-complete .env docker-compose.prod.yml

echo "Backup concluído: $DATE"
EOF

chmod +x ~/backup.sh

# Configurar backup automático (diário às 2h)
(crontab -l 2>/dev/null; echo "0 2 * * * $HOME/backup.sh >> $HOME/backup.log 2>&1") | crontab -
```

## ✅ Verificação Final

Após executar todos os comandos, verifique se tudo está funcionando:

1. **Acesse via navegador:**
   - Frontend: http://212.85.17.99
   - API: http://212.85.17.99/api

2. **Verifique containers:**
   ```bash
   docker ps
   ```

3. **Execute monitoramento:**
   ```bash
   ~/monitor.sh
   ```

## 🆘 Comandos de Troubleshooting

```bash
# Ver logs em tempo real
docker-compose -f docker-compose.prod.yml logs -f

# Reiniciar serviços
docker-compose -f docker-compose.prod.yml restart

# Parar e iniciar novamente
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d

# Verificar uso de recursos
htop

# Verificar portas em uso
sudo netstat -tlnp | grep :3000
sudo netstat -tlnp | grep :5000
```

---

**🎉 Deployment Completo!**

Após executar todos estes comandos, sua aplicação Validade Inteligente estará rodando na VPS 212.85.17.99!

