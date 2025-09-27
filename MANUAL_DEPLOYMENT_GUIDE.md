# Guia de Deployment Manual - Auto Trader AI

## Informações da VPS
- **IP:** 212.85.17.99
- **Porta SSH:** 22
- **Usuário:** root
- **Senha:** Ro04041932..

## Pré-requisitos
1. Cliente SSH (PuTTY, OpenSSH, ou similar)
2. Cliente SCP/SFTP para transferência de arquivos
3. Arquivos preparados na pasta `upload_package/`

## Passo 1: Conectar na VPS

### Usando PuTTY (Windows)
1. Abra o PuTTY
2. Configure:
   - Host Name: `212.85.17.99`
   - Port: `22`
   - Connection type: SSH
3. Clique em "Open"
4. Aceite o certificado SSH quando solicitado
5. Login: `root`
6. Senha: `Ro04041932..`

### Usando OpenSSH (Windows/Linux/Mac)
```bash
ssh root@212.85.17.99
```

## Passo 2: Preparar o Ambiente na VPS

Execute os seguintes comandos na VPS:

```bash
# Atualizar sistema
apt update && apt upgrade -y

# Instalar dependências
apt install -y curl wget git nginx python3 python3-pip python3-venv nodejs npm sqlite3

# Verificar versões instaladas
python3 --version
node --version
npm --version

# Criar diretório da aplicação
mkdir -p /var/www/auto-trader-ai
cd /var/www/auto-trader-ai
```

## Passo 3: Transferir Arquivos

### Opção A: Usando SCP
```bash
# No seu computador local (PowerShell/CMD)
scp -r upload_package/* root@212.85.17.99:/var/www/auto-trader-ai/
```

### Opção B: Usando WinSCP (Windows)
1. Abra o WinSCP
2. Configure:
   - Protocol: SFTP
   - Host name: `212.85.17.99`
   - Port number: `22`
   - User name: `root`
   - Password: `Ro04041932..`
3. Conecte e transfira os arquivos da pasta `upload_package/` para `/var/www/auto-trader-ai/`

### Opção C: Upload Manual via Terminal
Se as opções acima não funcionarem, você pode usar o método de cópia e cola:

1. Na VPS, crie os arquivos manualmente:
```bash
cd /var/www/auto-trader-ai
nano deploy.sh
# Cole o conteúdo do arquivo deploy.sh
# Ctrl+X, Y, Enter para salvar
```

## Passo 4: Executar o Deployment

Na VPS, execute:

```bash
cd /var/www/auto-trader-ai
chmod +x deploy.sh
./deploy.sh
```

## Passo 5: Configuração Manual (se o script falhar)

### Backend
```bash
cd /var/www/auto-trader-ai/backend

# Criar ambiente virtual
python3 -m venv venv
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Criar banco de dados
python3 -c "
from src.models import db
from src.main_simple import app
with app.app_context():
    db.create_all()
    print('Banco de dados criado com sucesso!')
"

# Testar backend
python3 src/main_simple.py &
```

### Frontend
```bash
cd /var/www/auto-trader-ai/frontend

# Instalar dependências
npm install

# Build para produção
npm run build

# Testar frontend
npm run preview &
```

## Passo 6: Configurar Nginx

```bash
# Criar configuração do Nginx
cat > /etc/nginx/sites-available/auto-trader-ai << 'EOF'
server {
    listen 80;
    server_name 212.85.17.99;

    # Frontend (React)
    location / {
        proxy_pass http://localhost:4173;
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
ln -s /etc/nginx/sites-available/auto-trader-ai /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Testar configuração
nginx -t

# Reiniciar Nginx
systemctl restart nginx
systemctl enable nginx
```

## Passo 7: Criar Serviços Systemd

### Backend Service
```bash
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
```

### Frontend Service
```bash
cat > /etc/systemd/system/auto-trader-frontend.service << 'EOF'
[Unit]
Description=Auto Trader AI Frontend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/auto-trader-ai/frontend
ExecStart=/usr/bin/npm run preview
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
```

### Ativar Serviços
```bash
systemctl daemon-reload
systemctl enable auto-trader-backend
systemctl enable auto-trader-frontend
systemctl start auto-trader-backend
systemctl start auto-trader-frontend
```

## Passo 8: Verificar Status

```bash
# Verificar serviços
systemctl status auto-trader-backend
systemctl status auto-trader-frontend
systemctl status nginx

# Verificar logs
journalctl -u auto-trader-backend -f
journalctl -u auto-trader-frontend -f

# Verificar portas
netstat -tlnp | grep :5000
netstat -tlnp | grep :4173
netstat -tlnp | grep :80
```

## Passo 9: Testar Aplicação

1. Abra o navegador e acesse: `http://212.85.17.99`
2. Teste o login e funcionalidades
3. Verifique se a API está respondendo: `http://212.85.17.99/api/dashboard`

## Troubleshooting

### Se o backend não iniciar:
```bash
cd /var/www/auto-trader-ai/backend
source venv/bin/activate
python3 src/main_simple.py
# Verificar erros no terminal
```

### Se o frontend não iniciar:
```bash
cd /var/www/auto-trader-ai/frontend
npm run preview
# Verificar erros no terminal
```

### Se o Nginx não funcionar:
```bash
nginx -t
systemctl status nginx
tail -f /var/log/nginx/error.log
```

### Comandos úteis:
```bash
# Reiniciar todos os serviços
systemctl restart auto-trader-backend auto-trader-frontend nginx

# Ver logs em tempo real
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Verificar processos
ps aux | grep python
ps aux | grep node
```

## Configurações de Segurança (Opcional)

### Firewall
```bash
ufw allow 22/tcp
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### SSL com Let's Encrypt (Opcional)
```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d seu-dominio.com
```

## Backup

```bash
# Backup do banco de dados
cp /var/www/auto-trader-ai/backend/database.db /backup/
```

---

**Nota:** Este guia assume que você tem acesso root à VPS. Se encontrar problemas, verifique:
1. Conectividade de rede
2. Permissões de usuário
3. Logs do sistema
4. Configurações de firewall