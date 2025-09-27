# 🔍 LOCALIZAÇÃO E CORREÇÃO VPS - GUIA COMPLETO

## 🎯 PROBLEMA IDENTIFICADO
O script de diagnóstico falhou porque foi executado no diretório `/root`, mas a aplicação está em outro local.

## 📍 PASSO 1: LOCALIZAR A APLICAÇÃO NA VPS

Execute este comando para encontrar onde a aplicação está rodando:

```bash
# Verificar processos Python rodando
ps aux | grep python

# Encontrar diretórios da aplicação
find / -name "main.py" -o -name "main_simple.py" 2>/dev/null

# Procurar por arquivos da aplicação
find / -name "*.db" -path "*/instance/*" 2>/dev/null
find / -name "database.db" 2>/dev/null
```

## 📍 PASSO 2: SCRIPT COMPLETO DE LOCALIZAÇÃO E CORREÇÃO

Execute este comando diretamente no terminal da VPS:

```bash
python3 << 'EOF'
import sqlite3
import bcrypt
import os
import subprocess

print("🔍 LOCALIZAÇÃO E DIAGNÓSTICO COMPLETO VPS")
print("=" * 60)

# 1. Verificar processos Python rodando
print("\n🔍 Verificando processos Python...")
try:
    result = subprocess.run(['ps', 'aux'], capture_output=True, text=True)
    python_processes = [line for line in result.stdout.split('\n') if 'python' in line.lower() and ('main' in line or 'app' in line)]
    for proc in python_processes:
        print(f"📋 Processo: {proc}")
        # Extrair diretório do processo
        if 'main.py' in proc or 'main_simple.py' in proc:
            parts = proc.split()
            for i, part in enumerate(parts):
                if 'main' in part and '.py' in part:
                    app_dir = os.path.dirname(os.path.abspath(part))
                    print(f"📁 Diretório da aplicação encontrado: {app_dir}")
except Exception as e:
    print(f"❌ Erro ao verificar processos: {e}")

# 2. Busca global por arquivos da aplicação
print("\n🔍 Busca global por arquivos...")
possible_dirs = []

# Procurar por main.py e main_simple.py
try:
    result = subprocess.run(['find', '/', '-name', 'main.py', '-o', '-name', 'main_simple.py'], 
                          capture_output=True, text=True, stderr=subprocess.DEVNULL)
    for line in result.stdout.strip().split('\n'):
        if line and 'main' in line:
            app_dir = os.path.dirname(line)
            possible_dirs.append(app_dir)
            print(f"📁 Aplicação encontrada: {app_dir}")
except:
    pass

# Procurar por database.db
try:
    result = subprocess.run(['find', '/', '-name', 'database.db'], 
                          capture_output=True, text=True, stderr=subprocess.DEVNULL)
    for line in result.stdout.strip().split('\n'):
        if line and 'database.db' in line:
            db_dir = os.path.dirname(line)
            possible_dirs.append(db_dir)
            print(f"💾 Banco encontrado: {line}")
except:
    pass

# 3. Testar diretórios comuns
common_dirs = [
    '/var/www/html',
    '/opt/app',
    '/home/app',
    '/root/app',
    '/app',
    '/usr/local/app'
]

print("\n🔍 Verificando diretórios comuns...")
for dir_path in common_dirs:
    if os.path.exists(dir_path):
        print(f"📁 Diretório existe: {dir_path}")
        # Verificar se tem arquivos da aplicação
        for root, dirs, files in os.walk(dir_path):
            if any(f in files for f in ['main.py', 'main_simple.py', 'app.py']):
                possible_dirs.append(root)
                print(f"✅ Aplicação encontrada em: {root}")
                break

# 4. Executar diagnóstico em cada diretório encontrado
print("\n🔧 EXECUTANDO DIAGNÓSTICO...")
for app_dir in set(possible_dirs):
    if not app_dir:
        continue
        
    print(f"\n📁 Testando diretório: {app_dir}")
    os.chdir(app_dir)
    
    # Procurar banco de dados neste diretório
    db_paths = [
        'instance/database.db',
        'database.db',
        '../database.db',
        'src/instance/database.db',
        './backend/instance/database.db'
    ]
    
    db_path = None
    for path in db_paths:
        full_path = os.path.join(app_dir, path)
        if os.path.exists(full_path):
            db_path = full_path
            print(f"✅ Banco encontrado: {full_path}")
            break
    
    # Busca recursiva neste diretório
    if not db_path:
        for root, dirs, files in os.walk(app_dir):
            for file in files:
                if file.endswith('.db') and 'database' in file:
                    db_path = os.path.join(root, file)
                    print(f"✅ Banco encontrado (busca recursiva): {db_path}")
                    break
            if db_path:
                break
    
    if db_path:
        print(f"\n💾 CORRIGINDO BANCO: {db_path}")
        try:
            # Conectar ao banco
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Verificar estrutura
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = cursor.fetchall()
            print(f"📋 Tabelas encontradas: {[t[0] for t in tables]}")
            
            if ('users',) in tables:
                # Verificar usuários existentes
                cursor.execute("SELECT email, role FROM users")
                users = cursor.fetchall()
                print(f"👥 Usuários existentes: {users}")
                
                # Criar/atualizar admin
                email = 'kelebra96@gmail.com'
                password = 'admin123456'
                hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                
                # Verificar se admin existe
                cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
                admin_exists = cursor.fetchone()
                
                if admin_exists:
                    cursor.execute("""
                        UPDATE users 
                        SET password_hash = ?, role = 'admin', permissions = 'all', is_active = 1
                        WHERE email = ?
                    """, (hashed, email))
                    print(f"✅ Admin atualizado: {email}")
                else:
                    cursor.execute("""
                        INSERT INTO users (email, password_hash, role, permissions, is_active)
                        VALUES (?, ?, 'admin', 'all', 1)
                    """, (email, hashed))
                    print(f"✅ Admin criado: {email}")
                
                conn.commit()
                
                # Verificar criação
                cursor.execute("SELECT email, role, is_active FROM users WHERE email = ?", (email,))
                admin_check = cursor.fetchone()
                print(f"🔍 Verificação final: {admin_check}")
                
            conn.close()
            
            # Testar login
            print(f"\n🧪 TESTANDO LOGIN...")
            test_cmd = f"""
curl -X POST http://localhost:5000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{{"email": "{email}", "password": "{password}"}}'
"""
            print(f"📋 Comando de teste:\n{test_cmd}")
            
        except Exception as e:
            print(f"❌ Erro no banco {db_path}: {e}")
            import traceback
            traceback.print_exc()

print("\n" + "=" * 60)
print("🎯 DIAGNÓSTICO COMPLETO!")
print("📋 Execute o comando curl mostrado acima para testar o login")
print("🌐 Acesse: http://212.85.17.99:5000 (aplicação direta)")
print("🌐 Ou configure Nginx para: http://212.85.17.99")
EOF
```

## 📍 PASSO 3: TESTE RÁPIDO APÓS EXECUÇÃO

Após executar o script acima, teste o login:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "kelebra96@gmail.com", "password": "admin123456"}'
```

## 🔧 COMANDOS ADICIONAIS DE DIAGNÓSTICO

Se ainda houver problemas:

```bash
# Verificar se a aplicação está rodando
netstat -tlnp | grep :5000

# Verificar logs da aplicação
journalctl -u your-app-name -f

# Verificar processos
ps aux | grep python

# Verificar diretório atual da aplicação
lsof -p $(pgrep -f "main.py\|main_simple.py") | grep cwd
```

## 🎯 CREDENCIAIS ADMIN
- **Email:** kelebra96@gmail.com
- **Senha:** admin123456

## 🌐 ACESSO FINAL
- **Aplicação direta:** http://212.85.17.99:5000
- **Após configurar Nginx:** http://212.85.17.99