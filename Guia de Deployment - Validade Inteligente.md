# Guia de Deployment - Validade Inteligente

## Visão Geral

Este guia fornece instruções detalhadas para fazer o deployment do sistema Validade Inteligente em diferentes ambientes, desde desenvolvimento local até produção em cloud. O sistema foi projetado para ser facilmente deployável usando containers Docker e pode ser executado em qualquer ambiente que suporte containerização.

## Pré-requisitos

### Requisitos de Sistema

**Ambiente de Desenvolvimento:**
- Docker 20.10+ e Docker Compose 2.0+
- Node.js 18+ e npm/pnpm
- Python 3.11+
- Git

**Ambiente de Produção:**
- Servidor Linux (Ubuntu 20.04+ recomendado)
- Docker e Docker Compose
- Nginx (para proxy reverso)
- SSL/TLS certificados
- Mínimo 2GB RAM, 2 CPU cores, 20GB storage

### Configuração de Ambiente

Antes de iniciar o deployment, configure as variáveis de ambiente necessárias:

```bash
# Criar arquivo .env na raiz do projeto
cp .env.example .env
```

**Variáveis de Ambiente Essenciais:**

```env
# Configurações da aplicação
FLASK_ENV=production
SECRET_KEY=your-super-secret-key-change-in-production
JWT_SECRET_KEY=your-jwt-secret-key-change-in-production

# Banco de dados
DATABASE_URL=postgresql://user:password@localhost:5432/validade_inteligente
POSTGRES_DB=validade_inteligente
POSTGRES_USER=validade_user
POSTGRES_PASSWORD=secure_password_here

# Redis
REDIS_URL=redis://localhost:6379/0

# Email (para notificações)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# APIs externas
BARCODE_API_KEY=your-barcode-api-key
WHATSAPP_API_TOKEN=your-whatsapp-token

# Configurações de produção
DOMAIN=validadeinteligente.com
SSL_CERT_PATH=/etc/ssl/certs/cert.pem
SSL_KEY_PATH=/etc/ssl/private/key.pem
```

## Deployment Local (Desenvolvimento)

### Usando Docker Compose

O método mais rápido para executar o sistema localmente:

```bash
# 1. Clonar o repositório
git clone https://github.com/seu-usuario/validade-inteligente.git
cd validade-inteligente

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas configurações

# 3. Construir e iniciar os serviços
docker-compose up --build -d

# 4. Executar migrações do banco
docker-compose exec backend flask db upgrade

# 5. Criar usuário administrador (opcional)
docker-compose exec backend python scripts/create_admin.py

# 6. Acessar a aplicação
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# Documentação API: http://localhost:5000/docs
```

### Desenvolvimento Nativo

Para desenvolvimento com hot-reload:

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou venv\Scripts\activate  # Windows
pip install -r requirements.txt
flask db upgrade
python src/main.py

# Frontend (em outro terminal)
cd frontend
npm install
npm run dev
```

## Deployment em Produção

### Preparação do Servidor

**1. Configuração Inicial do Servidor:**

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Instalar Nginx
sudo apt install nginx -y

# Configurar firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

**2. Configuração de SSL/TLS:**

```bash
# Usando Let's Encrypt (Certbot)
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Ou usando certificados próprios
sudo mkdir -p /etc/ssl/private /etc/ssl/certs
sudo cp seu-certificado.crt /etc/ssl/certs/
sudo cp sua-chave-privada.key /etc/ssl/private/
sudo chmod 600 /etc/ssl/private/sua-chave-privada.key
```

### Configuração do Nginx

Criar arquivo de configuração do Nginx:

```nginx
# /etc/nginx/sites-available/validade-inteligente
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
    
    # Configurações SSL modernas
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Headers de segurança
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Configuração de proxy para API
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Rate limiting
        limit_req zone=api burst=20 nodelay;
    }

    # Servir frontend estático
    location / {
        root /var/www/validade-inteligente;
        try_files $uri $uri/ /index.html;
        
        # Cache para assets estáticos
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Logs
    access_log /var/log/nginx/validade-inteligente.access.log;
    error_log /var/log/nginx/validade-inteligente.error.log;
}

# Rate limiting
http {
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
}
```

Ativar a configuração:

```bash
sudo ln -s /etc/nginx/sites-available/validade-inteligente /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Docker Compose para Produção

Criar `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  backend:
    build: 
      context: .
      dockerfile: Dockerfile.prod
    restart: unless-stopped
    environment:
      - FLASK_ENV=production
      - DATABASE_URL=postgresql://validade_user:${POSTGRES_PASSWORD}@db:5432/validade_inteligente
      - REDIS_URL=redis://redis:6379/0
      - SECRET_KEY=${SECRET_KEY}
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
    depends_on:
      - db
      - redis
    networks:
      - app-network
    volumes:
      - ./logs:/app/logs
      - ./uploads:/app/uploads

  db:
    image: postgres:14-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: validade_inteligente
      POSTGRES_USER: validade_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    networks:
      - app-network
    ports:
      - "127.0.0.1:5432:5432"

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - app-network

  celery:
    build: 
      context: .
      dockerfile: Dockerfile.prod
    restart: unless-stopped
    command: celery -A src.celery_app worker --loglevel=info
    environment:
      - FLASK_ENV=production
      - DATABASE_URL=postgresql://validade_user:${POSTGRES_PASSWORD}@db:5432/validade_inteligente
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis
    networks:
      - app-network
    volumes:
      - ./logs:/app/logs

  celery-beat:
    build: 
      context: .
      dockerfile: Dockerfile.prod
    restart: unless-stopped
    command: celery -A src.celery_app beat --loglevel=info
    environment:
      - FLASK_ENV=production
      - DATABASE_URL=postgresql://validade_user:${POSTGRES_PASSWORD}@db:5432/validade_inteligente
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis
    networks:
      - app-network
    volumes:
      - ./logs:/app/logs

  nginx-internal:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "127.0.0.1:5000:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./static:/usr/share/nginx/html/static:ro
    depends_on:
      - backend
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
```

### Dockerfile para Produção

Criar `Dockerfile.prod`:

```dockerfile
FROM python:3.11-slim as builder

WORKDIR /app

# Instalar dependências de build
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependências Python
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Estágio de produção
FROM python:3.11-slim

WORKDIR /app

# Instalar dependências de runtime
RUN apt-get update && apt-get install -y \
    libpq5 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copiar dependências instaladas
COPY --from=builder /root/.local /root/.local

# Copiar código da aplicação
COPY src/ ./src/
COPY migrations/ ./migrations/
COPY scripts/ ./scripts/

# Criar usuário não-root
RUN useradd --create-home --shell /bin/bash app && \
    chown -R app:app /app
USER app

# Configurar PATH
ENV PATH=/root/.local/bin:$PATH

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

EXPOSE 5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "--timeout", "120", "src.wsgi:app"]
```

### Deploy em Produção

```bash
# 1. Preparar o ambiente
mkdir -p /opt/validade-inteligente
cd /opt/validade-inteligente

# 2. Clonar repositório
git clone https://github.com/seu-usuario/validade-inteligente.git .

# 3. Configurar variáveis de ambiente
cp .env.example .env
nano .env  # Editar com configurações de produção

# 4. Build e deploy
docker-compose -f docker-compose.prod.yml up --build -d

# 5. Executar migrações
docker-compose -f docker-compose.prod.yml exec backend flask db upgrade

# 6. Criar usuário admin
docker-compose -f docker-compose.prod.yml exec backend python scripts/create_admin.py

# 7. Verificar status
docker-compose -f docker-compose.prod.yml ps
```

## Deployment em Cloud

### AWS (Amazon Web Services)

**Usando ECS (Elastic Container Service):**

1. **Preparar imagens Docker:**

```bash
# Build e push para ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com

docker build -t validade-inteligente-backend .
docker tag validade-inteligente-backend:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/validade-inteligente-backend:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/validade-inteligente-backend:latest
```

2. **Task Definition (task-definition.json):**

```json
{
  "family": "validade-inteligente",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/validade-inteligente-backend:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "FLASK_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:validade-inteligente/database-url"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/validade-inteligente",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

3. **Deploy com ECS CLI:**

```bash
# Criar cluster
ecs-cli up --cluster-config validade-inteligente --ecs-profile default

# Deploy da aplicação
ecs-cli compose --file docker-compose.aws.yml --project-name validade-inteligente service up --cluster-config validade-inteligente --ecs-profile default
```

### Google Cloud Platform (GCP)

**Usando Cloud Run:**

```bash
# 1. Build e push para Container Registry
gcloud builds submit --tag gcr.io/seu-projeto/validade-inteligente-backend

# 2. Deploy no Cloud Run
gcloud run deploy validade-inteligente-backend \
  --image gcr.io/seu-projeto/validade-inteligente-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars FLASK_ENV=production \
  --set-env-vars DATABASE_URL=postgresql://user:pass@/db?host=/cloudsql/projeto:region:instance
```

### Azure Container Instances

```bash
# 1. Criar grupo de recursos
az group create --name validade-inteligente-rg --location eastus

# 2. Deploy do container
az container create \
  --resource-group validade-inteligente-rg \
  --name validade-inteligente-backend \
  --image seu-registry/validade-inteligente-backend:latest \
  --dns-name-label validade-inteligente \
  --ports 5000 \
  --environment-variables FLASK_ENV=production \
  --secure-environment-variables DATABASE_URL=postgresql://...
```

## Monitoramento e Logs

### Configuração de Logs

**Usando ELK Stack (Elasticsearch, Logstash, Kibana):**

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.5.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"

  logstash:
    image: docker.elastic.co/logstash/logstash:8.5.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.5.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch

volumes:
  elasticsearch_data:
```

### Configuração de Métricas

**Usando Prometheus e Grafana:**

```yaml
# docker-compose.metrics.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources

volumes:
  prometheus_data:
  grafana_data:
```

## Backup e Recuperação

### Backup Automatizado

Script para backup automático:

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_CONTAINER="validade-inteligente_db_1"

# Criar diretório de backup
mkdir -p $BACKUP_DIR

# Backup do banco de dados
docker exec $DB_CONTAINER pg_dump -U validade_user validade_inteligente > $BACKUP_DIR/db_backup_$DATE.sql

# Backup de arquivos de upload
tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz ./uploads

# Limpar backups antigos (manter apenas 7 dias)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup concluído: $DATE"
```

Configurar cron job:

```bash
# Adicionar ao crontab
crontab -e

# Backup diário às 2:00 AM
0 2 * * * /opt/validade-inteligente/backup.sh >> /var/log/backup.log 2>&1
```

### Recuperação de Backup

```bash
#!/bin/bash
# restore.sh

BACKUP_FILE=$1
DB_CONTAINER="validade-inteligente_db_1"

if [ -z "$BACKUP_FILE" ]; then
    echo "Uso: $0 <arquivo_de_backup.sql>"
    exit 1
fi

# Parar aplicação
docker-compose -f docker-compose.prod.yml stop backend

# Restaurar banco de dados
docker exec -i $DB_CONTAINER psql -U validade_user -d validade_inteligente < $BACKUP_FILE

# Reiniciar aplicação
docker-compose -f docker-compose.prod.yml start backend

echo "Restauração concluída"
```

## Troubleshooting

### Problemas Comuns

**1. Erro de Conexão com Banco de Dados:**

```bash
# Verificar status do container
docker-compose ps

# Verificar logs do banco
docker-compose logs db

# Testar conexão
docker-compose exec backend python -c "from src.models.user import db; print(db.engine.execute('SELECT 1').scalar())"
```

**2. Problemas de Performance:**

```bash
# Monitorar recursos
docker stats

# Verificar logs de aplicação
docker-compose logs backend

# Analisar queries lentas no PostgreSQL
docker-compose exec db psql -U validade_user -d validade_inteligente -c "SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

**3. Problemas de SSL/TLS:**

```bash
# Verificar certificados
sudo certbot certificates

# Renovar certificados
sudo certbot renew

# Testar configuração SSL
openssl s_client -connect seu-dominio.com:443 -servername seu-dominio.com
```

### Comandos Úteis

```bash
# Ver logs em tempo real
docker-compose logs -f backend

# Executar comando no container
docker-compose exec backend bash

# Backup rápido do banco
docker-compose exec db pg_dump -U validade_user validade_inteligente > backup.sql

# Restaurar backup
docker-compose exec -T db psql -U validade_user validade_inteligente < backup.sql

# Verificar saúde dos containers
docker-compose exec backend curl http://localhost:5000/health

# Reiniciar serviço específico
docker-compose restart backend

# Ver uso de recursos
docker system df
docker system prune  # Limpar recursos não utilizados
```

## Segurança em Produção

### Checklist de Segurança

- [ ] Alterar todas as senhas padrão
- [ ] Configurar SSL/TLS com certificados válidos
- [ ] Implementar rate limiting
- [ ] Configurar firewall (UFW/iptables)
- [ ] Desabilitar root login SSH
- [ ] Configurar fail2ban
- [ ] Implementar backup automático
- [ ] Configurar monitoramento de logs
- [ ] Atualizar sistema operacional regularmente
- [ ] Usar secrets management para credenciais
- [ ] Implementar network segmentation
- [ ] Configurar HTTPS redirect
- [ ] Adicionar security headers
- [ ] Implementar CSRF protection
- [ ] Configurar CORS adequadamente

### Hardening do Sistema

```bash
# Configurar fail2ban
sudo apt install fail2ban -y
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Configurar SSH
sudo nano /etc/ssh/sshd_config
# PermitRootLogin no
# PasswordAuthentication no
# Port 2222  # Mudar porta padrão

# Configurar firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 2222/tcp  # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Configurar atualizações automáticas
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

Este guia fornece uma base sólida para deployment do Validade Inteligente em diferentes ambientes. Adapte as configurações conforme suas necessidades específicas e sempre teste em ambiente de staging antes de fazer deploy em produção.

