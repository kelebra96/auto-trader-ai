# Script para fazer deploy dos arquivos MySQL para o VPS
# Execute este script no Windows para transferir os arquivos necessários

param(
    [string]$VpsHost = "srv784863.hostgator.com.br",
    [string]$VpsUser = "root",
    [string]$KeyPath = ".\key_private\keyPrivate_openssh"
)

Write-Host "🚀 Iniciando deploy dos arquivos MySQL para o VPS..." -ForegroundColor Green
Write-Host "=" * 60

# Verificar se a chave SSH existe
if (-not (Test-Path $KeyPath)) {
    Write-Host "❌ Chave SSH não encontrada: $KeyPath" -ForegroundColor Red
    Write-Host "Certifique-se de que a chave SSH está no local correto." -ForegroundColor Yellow
    exit 1
}

# Verificar se os arquivos MySQL existem
$mysqlFiles = @(
    ".\backend\init_mysql.py",
    ".\backend\migrate_to_mysql.py",
    ".\backend\MYSQL_MIGRATION.md",
    ".\backend\.env.example"
)

foreach ($file in $mysqlFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "❌ Arquivo não encontrado: $file" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Todos os arquivos encontrados localmente" -ForegroundColor Green

# Função para executar comando SSH
function Invoke-SshCommand {
    param([string]$Command)
    
    $sshArgs = @(
        "-i", $KeyPath,
        "-o", "StrictHostKeyChecking=no",
        "-o", "UserKnownHostsFile=/dev/null",
        "$VpsUser@$VpsHost",
        $Command
    )
    
    & ssh @sshArgs
}

# Função para copiar arquivo via SCP
function Copy-ToVps {
    param(
        [string]$LocalPath,
        [string]$RemotePath
    )
    
    $scpArgs = @(
        "-i", $KeyPath,
        "-o", "StrictHostKeyChecking=no",
        "-o", "UserKnownHostsFile=/dev/null",
        $LocalPath,
        "$VpsUser@$VpsHost`:$RemotePath"
    )
    
    Write-Host "📤 Copiando: $LocalPath -> $RemotePath" -ForegroundColor Cyan
    & scp @scpArgs
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Arquivo copiado com sucesso" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro ao copiar arquivo" -ForegroundColor Red
        return $false
    }
    return $true
}

try {
    # Testar conexão SSH
    Write-Host "🔌 Testando conexão SSH..." -ForegroundColor Cyan
    $testResult = Invoke-SshCommand "echo 'Conexão SSH OK'"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Falha na conexão SSH" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Conexão SSH estabelecida" -ForegroundColor Green
    
    # Verificar se o diretório do backend existe
    Write-Host "📁 Verificando diretório do backend..." -ForegroundColor Cyan
    Invoke-SshCommand "ls -la /var/www/auto-trader-ai/backend/"
    
    # Copiar arquivos MySQL
    Write-Host "`n📦 Copiando arquivos MySQL..." -ForegroundColor Yellow
    
    $copySuccess = $true
    
    # Copiar scripts Python
    if (-not (Copy-ToVps ".\backend\init_mysql.py" "/var/www/auto-trader-ai/backend/init_mysql.py")) {
        $copySuccess = $false
    }
    
    if (-not (Copy-ToVps ".\backend\migrate_to_mysql.py" "/var/www/auto-trader-ai/backend/migrate_to_mysql.py")) {
        $copySuccess = $false
    }
    
    # Copiar documentação
    if (-not (Copy-ToVps ".\backend\MYSQL_MIGRATION.md" "/var/www/auto-trader-ai/backend/MYSQL_MIGRATION.md")) {
        $copySuccess = $false
    }
    
    # Copiar exemplo de .env (se não existir)
    Write-Host "📝 Verificando arquivo .env..." -ForegroundColor Cyan
    $envExists = Invoke-SshCommand "test -f /var/www/auto-trader-ai/backend/.env && echo 'exists' || echo 'not_exists'"
    
    if ($envExists -match "not_exists") {
        Write-Host "📄 Criando arquivo .env baseado no .env.example..." -ForegroundColor Cyan
        if (-not (Copy-ToVps ".\backend\.env.example" "/var/www/auto-trader-ai/backend/.env")) {
            $copySuccess = $false
        }
    } else {
        Write-Host "✅ Arquivo .env já existe no VPS" -ForegroundColor Green
    }
    
    if (-not $copySuccess) {
        Write-Host "❌ Alguns arquivos não foram copiados com sucesso" -ForegroundColor Red
        exit 1
    }
    
    # Dar permissões de execução aos scripts
    Write-Host "🔧 Configurando permissões..." -ForegroundColor Cyan
    Invoke-SshCommand "chmod +x /var/www/auto-trader-ai/backend/init_mysql.py"
    Invoke-SshCommand "chmod +x /var/www/auto-trader-ai/backend/migrate_to_mysql.py"
    
    # Verificar se os arquivos foram copiados
    Write-Host "`n📋 Verificando arquivos no VPS..." -ForegroundColor Cyan
    Invoke-SshCommand "ls -la /var/www/auto-trader-ai/backend/ | grep -E '(init_mysql|migrate_to_mysql|MYSQL_MIGRATION)'"
    
    # Verificar dependências Python
    Write-Host "`n🐍 Verificando dependências Python..." -ForegroundColor Cyan
    Invoke-SshCommand "cd /var/www/auto-trader-ai/backend && python3 -c 'import pymysql; print(\"PyMySQL OK\")' 2>/dev/null || echo 'PyMySQL não instalado'"
    
    Write-Host "`n" + "=" * 60
    Write-Host "🎉 Deploy concluído com sucesso!" -ForegroundColor Green
    Write-Host "`n📝 Próximos passos no VPS:" -ForegroundColor Yellow
    Write-Host "1. Instalar MySQL se necessário:" -ForegroundColor White
    Write-Host "   apt update && apt install mysql-server -y" -ForegroundColor Gray
    Write-Host "`n2. Instalar dependências Python:" -ForegroundColor White
    Write-Host "   cd /var/www/auto-trader-ai/backend" -ForegroundColor Gray
    Write-Host "   pip3 install pymysql mysql-connector-python" -ForegroundColor Gray
    Write-Host "`n3. Configurar MySQL no arquivo .env:" -ForegroundColor White
    Write-Host "   nano .env" -ForegroundColor Gray
    Write-Host "`n4. Executar inicialização:" -ForegroundColor White
    Write-Host "   python3 init_mysql.py" -ForegroundColor Gray
    Write-Host "`n5. Ou migrar dados existentes:" -ForegroundColor White
    Write-Host "   python3 migrate_to_mysql.py" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ Erro durante o deploy: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Script concluído!" -ForegroundColor Green