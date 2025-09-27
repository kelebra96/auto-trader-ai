# 🚀 Instruções de Deployment - Auto Trader AI

## ⚠️ Problema de Conectividade Identificado

A conexão SSH com a VPS `212.85.17.99` está falhando por timeout. Isso pode ser devido a:

1. **Firewall bloqueando a porta 22**
2. **Serviço SSH não está rodando**
3. **IP incorreto ou servidor offline**
4. **Porta SSH diferente da padrão (22)**

## 🔧 Soluções Recomendadas

### Opção 1: Verificar Conectividade
```bash
# Teste de ping
ping 212.85.17.99

# Teste de porta SSH
telnet 212.85.17.99 22

# Ou usando nmap (se disponível)
nmap -p 22 212.85.17.99
```

### Opção 2: Tentar Portas Alternativas
```bash
# SSH pode estar em porta diferente
ssh -p 2222 root@212.85.17.99
ssh -p 2200 root@212.85.17.99
ssh -p 22000 root@212.85.17.99
```

### Opção 3: Usar Painel de Controle da VPS
Se você tem acesso ao painel de controle da VPS (como cPanel, Plesk, ou painel do provedor):
1. Acesse o terminal/console via web
2. Execute os comandos de deployment diretamente

## 📦 Arquivos Preparados para Upload

Todos os arquivos necessários estão na pasta `upload_package/`:

```
upload_package/
├── README.md              # Instruções detalhadas
├── deploy.sh              # Script de deployment automático
├── backend/               # Código do backend
└── frontend/              # Código do frontend
```

## 🚀 Processo de Deployment Manual

### 1. Upload dos Arquivos
Use qualquer ferramenta de transferência de arquivos:
- **FileZilla** (SFTP)
- **WinSCP** (Windows)
- **rsync** (Linux/Mac)
- **Painel de controle da VPS**

Faça upload de todos os arquivos da pasta `upload_package/` para `/tmp/` na VPS.

### 2. Conectar na VPS
```bash
# Tente diferentes métodos de conexão:
ssh root@212.85.17.99
# ou
ssh -p 2222 root@212.85.17.99
# ou use o painel web da VPS
```

### 3. Executar Deployment
```bash
cd /tmp
chmod +x deploy.sh
./deploy.sh
```

### 4. Copiar Arquivos da Aplicação
```bash
# Copiar backend
cp -r backend/* /var/www/auto-trader-ai/backend/

# Copiar frontend
cp -r frontend/* /var/www/auto-trader-ai/frontend/
```

### 5. Configurar Permissões
```bash
chown -R root:root /var/www/auto-trader-ai
chmod -R 755 /var/www/auto-trader-ai
```

### 6. Instalar Dependências

#### Backend:
```bash
cd /var/www/auto-trader-ai/backend
source venv/bin/activate
pip install -r requirements.txt
```

#### Frontend:
```bash
cd /var/www/auto-trader-ai/frontend
npm install
npm run build
```

### 7. Configurar Banco de Dados
```bash
cd /var/www/auto-trader-ai/backend
source venv/bin/activate
python -c "from src.main_simple import db; db.create_all()"
```

### 8. Configurar Variáveis de Ambiente
```bash
# Editar arquivo .env
nano /var/www/auto-trader-ai/backend/.env

# Adicionar:
FLASK_ENV=production
SECRET_KEY=sua-chave-secreta-aqui
JWT_SECRET_KEY=sua-chave-jwt-aqui
DATABASE_URL=sqlite:///auto_trader.db
CORS_ORIGINS=http://212.85.17.99
```

### 9. Iniciar Serviços
```bash
# Iniciar serviços
systemctl start auto-trader-backend
systemctl start auto-trader-frontend
systemctl start nginx

# Habilitar auto-start
systemctl enable auto-trader-backend
systemctl enable auto-trader-frontend
systemctl enable nginx
```

### 10. Verificar Status
```bash
# Verificar status dos serviços
systemctl status auto-trader-backend
systemctl status auto-trader-frontend
systemctl status nginx

# Verificar logs se houver problemas
journalctl -u auto-trader-backend -f
journalctl -u auto-trader-frontend -f
tail -f /var/log/nginx/error.log
```

## 🌐 Testar Aplicação

Após o deployment, acesse:
- **Frontend**: http://212.85.17.99
- **Backend API**: http://212.85.17.99/api

## 🔍 Troubleshooting

### Problema: Serviços não iniciam
```bash
# Verificar logs detalhados
journalctl -u auto-trader-backend --no-pager
journalctl -u auto-trader-frontend --no-pager
```

### Problema: Nginx não funciona
```bash
# Testar configuração
nginx -t

# Verificar se as portas estão em uso
netstat -tlnp | grep :80
netstat -tlnp | grep :5000
netstat -tlnp | grep :5173
```

### Problema: Banco de dados
```bash
# Verificar se o banco foi criado
ls -la /var/www/auto-trader-ai/backend/auto_trader.db

# Recriar banco se necessário
cd /var/www/auto-trader-ai/backend
source venv/bin/activate
python -c "from src.main_simple import db; db.drop_all(); db.create_all()"
```

## 📞 Próximos Passos

1. **Resolver conectividade SSH** - Verificar com o provedor da VPS
2. **Fazer upload manual** dos arquivos via painel web
3. **Executar deployment** seguindo as instruções acima
4. **Configurar SSL** (opcional, mas recomendado)
5. **Configurar backup** do banco de dados

## 🔐 Configuração SSL (Opcional)

Para configurar HTTPS com Let's Encrypt:
```bash
# Instalar certbot
apt install certbot python3-certbot-nginx

# Obter certificado
certbot --nginx -d 212.85.17.99

# Renovação automática
crontab -e
# Adicionar: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

**Nota**: Se você conseguir resolver o problema de conectividade SSH, posso ajudar a automatizar todo o processo de deployment remotamente.