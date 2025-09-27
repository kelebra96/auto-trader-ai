# 🚀 COMANDO SIMPLES PARA VPS

## ⚡ **EXECUTE ESTE COMANDO NA VPS:**

Copie e cole este comando completo no terminal da sua VPS:

```bash
python3 << 'EOF'
import sqlite3
import bcrypt
import os

print("🔍 DIAGNÓSTICO E CORREÇÃO VPS")
print("=" * 50)

# Encontrar banco de dados
db_paths = [
    'instance/database.db',
    'database.db', 
    '../database.db',
    '/tmp/database.db',
    'src/instance/database.db',
    './backend/instance/database.db',
    '/root/auto-trader-ai/backend/instance/database.db',
    '/root/auto-trader-ai/backend/database.db'
]

print("🔍 Procurando banco de dados...")
db_path = None
for path in db_paths:
    if os.path.exists(path):
        db_path = path
        print(f"✅ Banco encontrado: {path}")
        break

# Busca recursiva se não encontrou
if not db_path:
    print("🔍 Busca recursiva...")
    for root, dirs, files in os.walk('.'):
        for file in files:
            if file.endswith('.db') and 'database' in file:
                db_path = os.path.join(root, file)
                print(f"✅ Banco encontrado: {db_path}")
                break
        if db_path:
            break

if not db_path:
    print("❌ ERRO: Banco de dados não encontrado!")
    print("📁 Diretório atual:", os.getcwd())
    print("📋 Arquivos no diretório:")
    for item in os.listdir('.'):
        print(f"  - {item}")
    exit(1)

print(f"💾 Usando banco: {db_path}")

try:
    # Conectar ao banco
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Verificar se tabela users existe
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users';")
    if not cursor.fetchone():
        print("❌ ERRO: Tabela 'users' não existe!")
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        print("📋 Tabelas disponíveis:")
        for table in tables:
            print(f"  - {table[0]}")
        exit(1)
    
    print("✅ Tabela 'users' encontrada!")
    
    # Verificar usuários existentes
    cursor.execute("SELECT email, role FROM users;")
    existing_users = cursor.fetchall()
    print(f"👥 Usuários existentes ({len(existing_users)}):")
    for user in existing_users:
        print(f"  - {user[0]} ({user[1]})")
    
    # Dados do admin
    email = "kelebra96@gmail.com"
    password = "admin123456"
    
    # Gerar hash da senha
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Verificar se admin já existe
    cursor.execute("SELECT id, role FROM users WHERE email = ?", (email,))
    existing_admin = cursor.fetchone()
    
    if existing_admin:
        # Atualizar admin existente
        cursor.execute("""
            UPDATE users 
            SET password_hash = ?, role = ?, permissions = ?, is_active = 1
            WHERE email = ?
        """, (password_hash, "admin", "all", email))
        print(f"✅ Admin atualizado! (ID: {existing_admin[0]})")
    else:
        # Criar novo admin
        cursor.execute("""
            INSERT INTO users (email, password_hash, role, permissions, is_active, created_at)
            VALUES (?, ?, ?, ?, 1, datetime('now'))
        """, (email, password_hash, "admin", "all"))
        print("✅ Admin criado!")
    
    conn.commit()
    
    # Verificar criação final
    cursor.execute("SELECT id, email, role, permissions, is_active FROM users WHERE email = ?", (email,))
    admin = cursor.fetchone()
    
    if admin:
        print("\n🎯 VERIFICAÇÃO FINAL:")
        print(f"   ID: {admin[0]}")
        print(f"   📧 Email: {admin[1]}")
        print(f"   👤 Role: {admin[2]}")
        print(f"   🔑 Permissions: {admin[3]}")
        print(f"   ✅ Ativo: {'Sim' if admin[4] else 'Não'}")
        
        print("\n🚀 CREDENCIAIS PARA LOGIN:")
        print(f"   📧 Email: {email}")
        print(f"   🔑 Senha: {password}")
        print("\n🌐 URLs para testar:")
        print("   - http://212.85.17.99:5000 (API direta)")
        print("   - http://212.85.17.99 (frontend)")
        
        print("\n✅ SUCESSO! Usuário admin configurado!")
    else:
        print("❌ ERRO: Falha na verificação final!")
    
    conn.close()
    
except Exception as e:
    print(f"❌ ERRO: {e}")
    import traceback
    traceback.print_exc()

EOF
```

## 🧪 **TESTE APÓS EXECUTAR:**

```bash
# Teste o login via API
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"kelebra96@gmail.com","password":"admin123456"}'
```

## 📍 **SE AINDA NÃO FUNCIONAR:**

Execute estes comandos para mais informações:

```bash
# Verificar se aplicação está rodando
ps aux | grep python

# Verificar diretório atual
pwd
ls -la

# Navegar para diretório correto (tente um destes):
cd /root/auto-trader-ai/backend
# ou
cd /home/*/auto-trader-ai/backend
# ou
cd /opt/auto-trader-ai/backend

# Depois execute o script Python novamente
```

---
**🎯 OBJETIVO:** Criar usuário admin com email `kelebra96@gmail.com` e senha `admin123456`