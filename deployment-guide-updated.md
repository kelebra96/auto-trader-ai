# Guia de Deployment - Validade Inteligente

**Versão:** 2.0  
**Data:** Janeiro 2024  
**Autor:** Manus AI  

## Visão Geral

Este guia fornece instruções detalhadas para deployment do sistema Validade Inteligente em diferentes ambientes, desde desenvolvimento local até produção em escala empresarial. O sistema utiliza arquitetura containerizada com Docker e suporte para orquestração com Kubernetes.

## Pré-requisitos

### Ambiente de Sistema

- **Sistema Operacional:** Ubuntu 20.04 LTS ou superior (recomendado)
- **Docker:** Versão 20.10 ou superior
- **Docker Compose:** Versão 2.0 ou superior
- **Node.js:** Versão 16 ou superior
- **Python:** Versão 3.9 ou superior
- **PostgreSQL:** Versão 13 ou superior

### Recursos de Hardware

**Desenvolvimento:**
- CPU: 2 cores
- RAM: 4GB
- Disco: 20GB SSD

**Produção (Pequena):**
- CPU: 4 cores
- RAM: 8GB
- Disco: 100GB SSD

**Produção (Média/Grande):**
- CPU: 8+ cores
- RAM: 16GB+
- Disco: 500GB+ SSD

### Chaves e Configurações Necessárias

- **OpenAI API Key:** Para funcionalidades de IA
- **Mercado Pago Access Token:** Para processamento de pagamentos
- **SMTP Credentials:** Para envio de emails
- **JWT Secret:** Para autenticação (gerado automaticamente se não fornecido)

## Deployment Local (Desenvolvimento)

### 1. Clonagem do Repositório

```bash
git clone https://github.com/seu-usuario/validade-inteligente.git
cd validade-inteligente
```

### 2. Configuração de Variáveis de Ambiente

Crie o arquivo `.env` na raiz do projeto:

```env
# Banco de Dados
DATABASE_URL=postgresql://postgres:password@localhost:5432/validade_inteligente
POSTGRES_DB=validade_inteligente
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password

# APIs Externas
OPENAI_API_KEY=sk-your-openai-key-here
MERCADOPAGO_ACCESS_TOKEN=your-mercadopago-token-here

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Segurança
JWT_SECRET=your-super-secret-jwt-key-here
FLASK_SECRET_KEY=your-flask-secret-key-here

# Ambiente
FLASK_ENV=development
NODE_ENV=development
```

### 3. Inicialização com Docker Compose

```bash
# Construir e iniciar todos os serviços
docker-compose up --build

# Executar em background
docker-compose up -d --build
```

### 4. Inicialização do Banco de Dados

```bash
# Executar migrações
docker-compose exec backend python -m flask db upgrade

# Criar usuário administrador inicial
docker-compose exec backend python scripts/create_admin.py
```

### 5. Verificação da Instalação

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Documentação API:** http://localhost:5000/docs
- **Admin Panel:** http://localhost:3000/admin

## Deployment em Produção

### 1. Preparação do Servidor

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.12.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Instalar Nginx
sudo apt install nginx -y
```

### 2. Configuração de SSL/TLS

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obter certificado SSL
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

### 3. Configuração do Nginx

Crie `/etc/nginx/sites-available/validade-inteligente`:

```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seu-dominio.com www.seu-dominio.com;

    ssl_certificate /etc/letsencrypt/live/seu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com/privkey.pem;

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

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
```

### 4. Configuração de Produção

Crie `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  db:
    image: postgres:13
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

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    networks:
      - app-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
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
      - FLASK_ENV=production
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    restart: unless-stopped
    networks:
      - app-network
    ports:
      - "5000:5000"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    ports:
      - "3000:80"
    restart: unless-stopped
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - /etc/letsencrypt:/etc/letsencrypt
    depends_on:
      - frontend
      - backend
    restart: unless-stopped
    networks:
      - app-network

volumes:
  postgres_data:

networks:
  app-network:
    driver: bridge
```

### 5. Scripts de Deployment

Crie `deploy.sh`:

```bash
#!/bin/bash

# Script de deployment para produção
set -e

echo "🚀 Iniciando deployment do Validade Inteligente..."

# Backup do banco de dados
echo "📦 Fazendo backup do banco de dados..."
docker-compose -f docker-compose.prod.yml exec -T db pg_dump -U $POSTGRES_USER $POSTGRES_DB > backup/backup_$(date +%Y%m%d_%H%M%S).sql

# Pull das últimas alterações
echo "📥 Baixando últimas alterações..."
git pull origin main

# Build das imagens
echo "🔨 Construindo imagens..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Parar serviços antigos
echo "⏹️ Parando serviços antigos..."
docker-compose -f docker-compose.prod.yml down

# Iniciar novos serviços
echo "▶️ Iniciando novos serviços..."
docker-compose -f docker-compose.prod.yml up -d

# Executar migrações
echo "🗄️ Executando migrações do banco..."
sleep 30  # Aguardar inicialização do banco
docker-compose -f docker-compose.prod.yml exec backend python -m flask db upgrade

# Verificar saúde dos serviços
echo "🏥 Verificando saúde dos serviços..."
sleep 10
docker-compose -f docker-compose.prod.yml ps

# Limpeza de imagens antigas
echo "🧹 Limpando imagens antigas..."
docker image prune -f

echo "✅ Deployment concluído com sucesso!"
echo "🌐 Site disponível em: https://seu-dominio.com"
```

## Monitoramento e Logs

### 1. Configuração de Logs

Crie `docker-compose.logging.yml`:

```yaml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.15.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    networks:
      - logging

  logstash:
    image: docker.elastic.co/logstash/logstash:7.15.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    depends_on:
      - elasticsearch
    networks:
      - logging

  kibana:
    image: docker.elastic.co/kibana/kibana:7.15.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch
    networks:
      - logging

volumes:
  elasticsearch_data:

networks:
  logging:
    driver: bridge
```

### 2. Configuração do Prometheus

Crie `prometheus.yml`:

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'validade-inteligente-backend'
    static_configs:
      - targets: ['backend:5000']
    metrics_path: /metrics

  - job_name: 'validade-inteligente-frontend'
    static_configs:
      - targets: ['frontend:80']

  - job_name: 'postgres'
    static_configs:
      - targets: ['db:5432']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
```

### 3. Dashboards do Grafana

Importe dashboards pré-configurados:

- **Sistema:** CPU, RAM, Disco, Rede
- **Aplicação:** Requests/s, Response time, Error rate
- **Banco de Dados:** Connections, Query performance, Lock waits
- **Negócio:** Usuários ativos, Produtos processados, Alertas gerados

## Backup e Recuperação

### 1. Script de Backup Automático

Crie `backup.sh`:

```bash
#!/bin/bash

# Configurações
BACKUP_DIR="/backup"
DB_NAME="validade_inteligente"
RETENTION_DAYS=30

# Criar diretório de backup
mkdir -p $BACKUP_DIR

# Backup do banco de dados
echo "Fazendo backup do banco de dados..."
docker-compose exec -T db pg_dump -U postgres $DB_NAME | gzip > $BACKUP_DIR/db_backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Backup de arquivos de configuração
echo "Fazendo backup de configurações..."
tar -czf $BACKUP_DIR/config_backup_$(date +%Y%m%d_%H%M%S).tar.gz .env docker-compose.prod.yml nginx.conf

# Limpeza de backups antigos
echo "Limpando backups antigos..."
find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup concluído!"
```

### 2. Configuração do Cron

```bash
# Editar crontab
crontab -e

# Adicionar linha para backup diário às 2h
0 2 * * * /path/to/backup.sh >> /var/log/backup.log 2>&1
```

### 3. Procedimento de Recuperação

```bash
#!/bin/bash

# Script de recuperação
BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Uso: ./restore.sh backup_file.sql.gz"
    exit 1
fi

echo "Parando serviços..."
docker-compose -f docker-compose.prod.yml stop backend

echo "Restaurando banco de dados..."
gunzip -c $BACKUP_FILE | docker-compose -f docker-compose.prod.yml exec -T db psql -U postgres -d validade_inteligente

echo "Reiniciando serviços..."
docker-compose -f docker-compose.prod.yml start

echo "Recuperação concluída!"
```

## Troubleshooting

### Problemas Comuns

**1. Erro de conexão com banco de dados:**
```bash
# Verificar status do container
docker-compose ps db

# Verificar logs
docker-compose logs db

# Testar conexão
docker-compose exec db psql -U postgres -d validade_inteligente -c "SELECT 1;"
```

**2. Frontend não carrega:**
```bash
# Verificar build
docker-compose logs frontend

# Reconstruir frontend
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

**3. API não responde:**
```bash
# Verificar logs do backend
docker-compose logs backend

# Verificar saúde da API
curl -f http://localhost:5000/health || echo "API não está respondendo"
```

**4. Problemas de SSL:**
```bash
# Renovar certificado
sudo certbot renew

# Testar configuração do Nginx
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

### Comandos Úteis

```bash
# Ver logs em tempo real
docker-compose logs -f

# Executar comando no container
docker-compose exec backend bash

# Reiniciar serviço específico
docker-compose restart backend

# Ver uso de recursos
docker stats

# Limpar sistema
docker system prune -a
```

## Segurança

### 1. Configurações de Firewall

```bash
# Configurar UFW
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### 2. Configurações de Segurança do Docker

```bash
# Criar usuário não-root para containers
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs
```

### 3. Variáveis de Ambiente Seguras

```bash
# Usar Docker Secrets para dados sensíveis
echo "sua-senha-super-secreta" | docker secret create db_password -
```

## Conclusão

Este guia fornece uma base sólida para deployment do Validade Inteligente em diferentes ambientes. Para ambientes de produção críticos, considere implementar:

- Load balancing com múltiplas instâncias
- Replicação de banco de dados
- CDN para assets estáticos
- Monitoramento avançado com alertas
- Backup em múltiplas localizações

Para suporte adicional, consulte a documentação técnica completa ou entre em contato com a equipe de desenvolvimento.

