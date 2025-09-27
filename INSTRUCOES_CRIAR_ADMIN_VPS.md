# 🚀 Instruções para Criar Usuário Admin na VPS

**VPS:** 212.85.17.99  
**Credenciais Admin:** kelebra96@gmail.com / admin123456

## 🔍 Situação Atual

- ✅ VPS está online e respondendo (ping OK)
- ✅ Porta SSH 22 está aberta
- ❌ Conexão SSH está sendo rejeitada (possível problema de autenticação)
- ✅ Scripts preparados para execução manual

## 🛠️ Opções Disponíveis

### Opção 1: Script Python Completo (Recomendado)

Se você conseguir acessar a VPS via SSH ou painel de controle:

1. **Copie o arquivo `create_admin_user_vps.py` para a VPS**
2. **Execute na VPS:**
   ```bash
   cd /var/www/auto-trader-ai/backend
   python3 create_admin_user_vps.py
   ```

### Opção 2: Script Bash (Mais Simples)

Copie e cole o conteúdo do arquivo `create_admin_bash.sh` no terminal da VPS:

```bash
#!/bin/bash
# [Conteúdo completo do script bash]
```

### Opção 3: Comandos SQL Diretos

Se você tem acesso ao banco SQLite:

```bash
cd /var/www/auto-trader-ai/backend
sqlite3 auto_trader.db
```

Depois execute o SQL do arquivo `create_admin_user.sql`

### Opção 4: Comandos Manuais Passo a Passo

Execute estes comandos na VPS:

```bash
# 1. Navegar para o diretório
cd /var/www/auto-trader-ai/backend

# 2. Verificar se o banco existe
ls -la *.db

# 3. Gerar hash da senha
python3 -c "
import bcrypt
password = 'admin123456'
hash_bytes = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
print(hash_bytes.decode('utf-8'))
"

# 4. Inserir usuário no banco (substitua HASH_AQUI pelo hash gerado)
sqlite3 auto_trader.db "
INSERT OR REPLACE INTO users (
    email, nome_estabelecimento, nome_completo, cargo, 
    permissoes, ativo, empresa, bio, password_hash, 
    created_at, updated_at
) VALUES (
    'kelebra96@gmail.com',
    'Administração do Sistema',
    'Administrador Principal',
    'admin',
    '[\"all\"]',
    1,
    'Auto Trader AI',
    'Usuário administrador principal do sistema',
    'HASH_AQUI',
    datetime('now'),
    datetime('now')
);
"

# 5. Verificar criação
sqlite3 auto_trader.db "SELECT email, cargo, ativo FROM users WHERE email='kelebra96@gmail.com';"
```

## 🔧 Soluções para Problemas de SSH

### Problema: "Connection closed by 212.85.17.99 port 22"

**Possíveis causas:**
1. Senha incorreta
2. Usuário root desabilitado
3. Configuração SSH restritiva
4. Firewall bloqueando

**Soluções:**

1. **Verificar credenciais:**
   - Usuário: root
   - Senha: Ro04041932..

2. **Tentar usuário alternativo:**
   ```bash
   ssh validade@212.85.17.99
   ssh admin@212.85.17.99
   ssh ubuntu@212.85.17.99
   ```

3. **Usar painel de controle da VPS:**
   - Acesse o painel web do seu provedor VPS
   - Use o console/terminal integrado
   - Execute os scripts diretamente

4. **Verificar porta SSH alternativa:**
   ```bash
   ssh -p 2222 root@212.85.17.99
   ssh -p 2200 root@212.85.17.99
   ```

## 🧪 Teste de Verificação

Após criar o usuário, teste o login:

```bash
# Teste via API local (na VPS)
curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"kelebra96@gmail.com","password":"admin123456"}'

# Teste via API externa
curl -X POST http://212.85.17.99/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"kelebra96@gmail.com","password":"admin123456"}'
```

**Resposta esperada:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "email": "kelebra96@gmail.com",
    "nome_completo": "Administrador Principal",
    "cargo": "admin"
  }
}
```

## 📱 Teste no Frontend

Após criar o usuário, acesse:
- **URL:** http://212.85.17.99
- **Email:** kelebra96@gmail.com
- **Senha:** admin123456

## 🆘 Suporte

Se nenhuma opção funcionar:

1. **Verifique logs da aplicação:**
   ```bash
   journalctl -u auto-trader-backend -f
   tail -f /var/log/nginx/error.log
   ```

2. **Verifique se a aplicação está rodando:**
   ```bash
   ps aux | grep python
   systemctl status auto-trader-backend
   ```

3. **Reinicie os serviços:**
   ```bash
   systemctl restart auto-trader-backend
   systemctl restart nginx
   ```

## 🎯 Resumo das Credenciais

- **VPS:** 212.85.17.99
- **SSH:** root / Ro04041932..
- **Admin App:** kelebra96@gmail.com / admin123456
- **Banco:** /var/www/auto-trader-ai/backend/auto_trader.db

---

**💡 Dica:** Se você tem acesso ao painel de controle da VPS, use a Opção 2 (Script Bash) copiando e colando no terminal web.