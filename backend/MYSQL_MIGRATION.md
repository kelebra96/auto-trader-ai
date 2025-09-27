# Migração para MySQL - Auto Trader AI

Este documento descreve como migrar a aplicação Auto Trader AI do SQLite para MySQL.

## 📋 Pré-requisitos

1. **MySQL Server instalado e rodando**
   - MySQL 5.7+ ou MySQL 8.0+
   - MariaDB 10.3+ também é compatível

2. **Dependências Python instaladas**
   ```bash
   pip install -r requirements.txt
   ```

3. **Variáveis de ambiente configuradas**
   - Copie `.env.example` para `.env`
   - Configure as variáveis MySQL

## 🚀 Processo de Migração

### Opção 1: Nova Instalação (Recomendado)

Para uma nova instalação com MySQL:

1. **Configure as variáveis de ambiente no arquivo `.env`:**
   ```env
   USE_MYSQL=true
   MYSQL_HOST=localhost
   MYSQL_PORT=3306
   MYSQL_USER=root
   MYSQL_PASSWORD=sua_senha
   MYSQL_DATABASE=auto_trader_ai
   ```

2. **Execute o script de inicialização:**
   ```bash
   python init_mysql.py
   ```

3. **Reinicie a aplicação:**
   ```bash
   python src/main_simple.py
   ```

### Opção 2: Migração de Dados Existentes

Para migrar dados do SQLite existente:

1. **Configure as variáveis de ambiente** (mesmo processo acima)

2. **Execute o script de migração:**
   ```bash
   python migrate_to_mysql.py
   ```

3. **Atualize o .env para usar MySQL:**
   ```env
   USE_MYSQL=true
   ```

4. **Reinicie a aplicação:**
   ```bash
   python src/main_simple.py
   ```

## 🔧 Configuração Detalhada

### Variáveis de Ambiente

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `USE_MYSQL` | Ativa o uso do MySQL | `true` |
| `MYSQL_HOST` | Endereço do servidor MySQL | `localhost` |
| `MYSQL_PORT` | Porta do MySQL | `3306` |
| `MYSQL_USER` | Usuário do MySQL | `root` |
| `MYSQL_PASSWORD` | Senha do MySQL | `minhasenha123` |
| `MYSQL_DATABASE` | Nome do banco de dados | `auto_trader_ai` |

### Configuração do MySQL

1. **Criar usuário dedicado (recomendado):**
   ```sql
   CREATE USER 'autotrader'@'localhost' IDENTIFIED BY 'senha_segura';
   CREATE DATABASE auto_trader_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   GRANT ALL PRIVILEGES ON auto_trader_ai.* TO 'autotrader'@'localhost';
   FLUSH PRIVILEGES;
   ```

2. **Configurar charset UTF8MB4:**
   ```sql
   ALTER DATABASE auto_trader_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

## 📊 Estrutura de Tabelas

O sistema criará automaticamente as seguintes tabelas:

- `users` - Usuários do sistema
- `empresas` - Empresas cadastradas
- `fornecedores` - Fornecedores
- `lojas` - Lojas/estabelecimentos
- `produtos` - Produtos
- `entradas_produto` - Entradas de estoque
- `vendas` - Vendas realizadas
- `alertas` - Alertas do sistema
- `configuracoes_alerta` - Configurações de alertas

## 🔍 Verificação e Testes

### Verificar Conexão
```bash
python -c "
import os
import pymysql
conn = pymysql.connect(
    host=os.getenv('MYSQL_HOST', 'localhost'),
    user=os.getenv('MYSQL_USER', 'root'),
    password=os.getenv('MYSQL_PASSWORD', ''),
    database=os.getenv('MYSQL_DATABASE', 'auto_trader_ai')
)
print('✅ Conexão MySQL OK')
conn.close()
"
```

### Verificar Tabelas
```bash
python -c "
import os, pymysql
conn = pymysql.connect(
    host=os.getenv('MYSQL_HOST', 'localhost'),
    user=os.getenv('MYSQL_USER', 'root'),
    password=os.getenv('MYSQL_PASSWORD', ''),
    database=os.getenv('MYSQL_DATABASE', 'auto_trader_ai')
)
cursor = conn.cursor()
cursor.execute('SHOW TABLES')
tables = cursor.fetchall()
print(f'📊 Tabelas encontradas: {len(tables)}')
for table in tables:
    print(f'  - {table[0]}')
conn.close()
"
```

### Testar Login Admin
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "kelebra96@gmail.com", "password": "admin123456"}'
```

## 🐛 Solução de Problemas

### Erro de Conexão
- Verifique se o MySQL está rodando
- Confirme usuário e senha
- Teste conectividade: `mysql -h localhost -u root -p`

### Erro de Charset
```sql
ALTER DATABASE auto_trader_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Erro de Permissões
```sql
GRANT ALL PRIVILEGES ON auto_trader_ai.* TO 'seu_usuario'@'localhost';
FLUSH PRIVILEGES;
```

### Reverter para SQLite
1. Altere no `.env`:
   ```env
   USE_MYSQL=false
   # ou remova a linha USE_MYSQL
   ```
2. Reinicie a aplicação

## 📈 Performance

### Otimizações Recomendadas

1. **Índices automáticos:** SQLAlchemy cria índices para chaves primárias e estrangeiras

2. **Configuração MySQL:**
   ```ini
   [mysqld]
   innodb_buffer_pool_size = 256M
   max_connections = 100
   query_cache_size = 32M
   ```

3. **Monitoramento:**
   ```sql
   SHOW PROCESSLIST;
   SHOW ENGINE INNODB STATUS;
   ```

## 🔄 Backup e Restore

### Backup
```bash
mysqldump -u root -p auto_trader_ai > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore
```bash
mysql -u root -p auto_trader_ai < backup_20240101_120000.sql
```

## 📞 Suporte

Em caso de problemas:

1. Verifique os logs da aplicação
2. Confirme as variáveis de ambiente
3. Teste a conexão MySQL manualmente
4. Consulte a documentação do MySQL

---

**Nota:** Mantenha sempre backups dos seus dados antes de realizar migrações!