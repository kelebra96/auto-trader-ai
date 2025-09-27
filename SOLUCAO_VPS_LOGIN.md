# 🚀 SOLUÇÃO COMPLETA - Problema de Login na VPS

## 🔍 **Problema Identificado:**
- ✅ Aplicação rodando na porta 5000
- ✅ API funcionando corretamente  
- ❌ Usuário admin não existe ou senha incorreta
- ❌ Nginx não configurado para proxy reverso

## 🛠️ **SOLUÇÃO RÁPIDA (Recomendada)**

### **Opção 1: Script Python Simples**
```bash
# 1. Acesse sua VPS via painel web ou SSH
# 2. Navegue até o diretório da aplicação
cd /root/auto-trader-ai/backend  # ou onde estiver sua aplicação

# 3. Copie e cole este código Python:
python3 << 'EOF'
import sqlite3
import bcrypt
import os

# Encontrar banco
db_paths = ['instance/database.db', 'database.db', '../database.db']
db_path = None
for path in db_paths:
    if os.path.exists(path):
        db_path = path
        break

if not db_path:
    print("❌ Banco não encontrado!")
    exit(1)

print(f"✅ Banco: {db_path}")

# Conectar e criar admin
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

email = "kelebra96@gmail.com"
password = "admin123456"
password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

# Verificar se existe
cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
if cursor.fetchone():
    cursor.execute("UPDATE users SET password_hash = ?, role = ?, permissions = ?, is_active = 1 WHERE email = ?", 
                  (password_hash, "admin", "all", email))
    print("✅ Admin atualizado!")
else:
    cursor.execute("INSERT INTO users (email, password_hash, role, permissions, is_active, created_at) VALUES (?, ?, ?, ?, 1, datetime('now'))", 
                  (email, password_hash, "admin", "all"))
    print("✅ Admin criado!")

conn.commit()
conn.close()
print(f"🎯 Login: {email} / {password}")
EOF
```

### **Opção 2: Configurar Nginx (Solução Completa)**
```bash
# 1. Backup da configuração atual
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup

# 2. Criar nova configuração
sudo tee /etc/nginx/sites-available/default > /dev/null << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    root /var/www/html;
    index index.html;
    server_name _;
    
    # Proxy para API
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization";
        
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin *;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Content-Type, Authorization";
            return 204;
        }
    }
    
    # Frontend
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

# 3. Testar e recarregar
sudo nginx -t && sudo systemctl reload nginx
```

## 🧪 **TESTE RÁPIDO**

Após executar qualquer opção acima, teste:

```bash
# Teste via curl
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"kelebra96@gmail.com","password":"admin123456"}'

# Se não funcionar, teste porta 5000
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"kelebra96@gmail.com","password":"admin123456"}'
```

## 🎯 **CREDENCIAIS ADMIN**
- **📧 Email:** kelebra96@gmail.com  
- **🔑 Senha:** admin123456

## 🔧 **Comandos de Diagnóstico**

Se ainda não funcionar:
```bash
# Verificar se aplicação está rodando
ps aux | grep python

# Verificar Nginx
sudo systemctl status nginx

# Verificar logs
sudo tail -f /var/log/nginx/error.log

# Reiniciar serviços
sudo systemctl restart nginx
```

## 📱 **Acesso Final**
Após executar a solução:
- **URL:** http://212.85.17.99
- **Login:** kelebra96@gmail.com
- **Senha:** admin123456

---
**💡 Dica:** Execute primeiro a **Opção 1** (mais simples), depois a **Opção 2** se quiser que funcione na porta 80.