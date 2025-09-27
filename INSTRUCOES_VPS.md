# Instruções para Configurar MySQL no VPS

## 1. Copiar o arquivo para o VPS

Copie o arquivo `mysql_setup_complete.py` para o diretório `/var/www/auto-trader-ai/backend/` no seu VPS.

Você pode fazer isso de várias formas:
- SCP: `scp mysql_setup_complete.py root@srv784863.hostgator.com.br:/var/www/auto-trader-ai/backend/`
- Ou copiar o conteúdo manualmente via editor de texto

## 2. Instalar MySQL no VPS (se não estiver instalado)

```bash
# Atualizar sistema
apt update

# Instalar MySQL
apt install mysql-server -y

# Iniciar MySQL
systemctl start mysql
systemctl enable mysql

# Configurar MySQL (definir senha root)
mysql_secure_installation
```

## 3. Instalar dependências Python

```bash
cd /var/www/auto-trader-ai/backend
pip3 install pymysql mysql-connector-python
```

## 4. Configurar variáveis de ambiente

Edite o arquivo `.env` no diretório `/var/www/auto-trader-ai/backend/`:

```bash
nano .env
```

Adicione ou atualize estas linhas:

```env
# MySQL Configuration
USE_MYSQL=true
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=sua_senha_mysql_aqui
MYSQL_DATABASE=auto_trader_ai

# Outras configurações existentes...
SECRET_KEY=sua_chave_secreta
JWT_SECRET_KEY=sua_jwt_chave
```

## 5. Executar a configuração MySQL

### Para nova instalação (banco vazio):
```bash
cd /var/www/auto-trader-ai/backend
python3 mysql_setup_complete.py init
```

### Para migrar dados existentes do SQLite:
```bash
cd /var/www/auto-trader-ai/backend
python3 mysql_setup_complete.py migrate
```

## 6. Verificar se funcionou

```bash
# Verificar se as tabelas foram criadas
mysql -u root -p auto_trader_ai -e "SHOW TABLES;"

# Verificar se o usuário admin foi criado
mysql -u root -p auto_trader_ai -e "SELECT email, cargo FROM users WHERE cargo='admin';"
```

## 7. Reiniciar a aplicação

```bash
# Se estiver usando systemd
systemctl restart auto-trader-ai

# Ou se estiver rodando manualmente
pkill -f "python.*main_simple.py"
cd /var/www/auto-trader-ai/backend
python3 src/main_simple.py
```

## 8. Testar o login

Acesse a aplicação e faça login com:
- **Email:** kelebra96@gmail.com
- **Senha:** admin123456

## Troubleshooting

### Erro de conexão MySQL:
```bash
# Verificar se MySQL está rodando
systemctl status mysql

# Verificar logs do MySQL
tail -f /var/log/mysql/error.log
```

### Erro de permissões:
```bash
# Dar permissões ao arquivo
chmod +x mysql_setup_complete.py

# Verificar se o usuário MySQL tem permissões
mysql -u root -p -e "GRANT ALL PRIVILEGES ON auto_trader_ai.* TO 'root'@'localhost';"
```

### Erro de dependências Python:
```bash
# Instalar dependências globalmente
pip3 install --upgrade pymysql mysql-connector-python werkzeug

# Ou no ambiente virtual se estiver usando
source venv/bin/activate
pip install pymysql mysql-connector-python
```

### Verificar logs da aplicação:
```bash
# Ver logs em tempo real
tail -f /var/log/auto-trader-ai.log

# Ou executar em modo debug
cd /var/www/auto-trader-ai/backend
python3 src/main_simple.py
```

## Backup antes da migração

Se você tem dados importantes, faça backup antes:

```bash
# Backup do SQLite
cp /var/www/auto-trader-ai/backend/app.db /var/www/auto-trader-ai/backend/app.db.backup

# Backup do MySQL (após migração)
mysqldump -u root -p auto_trader_ai > backup_mysql.sql
```