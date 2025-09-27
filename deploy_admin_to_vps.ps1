# Script para transferir e executar criação de usuário admin na VPS
# VPS: 212.85.17.99
# Credenciais: root / Ro04041932..

param(
    [string]$VpsIP = "212.85.17.99",
    [string]$Username = "root",
    [string]$ScriptPath = ".\create_admin_user_vps.py"
)

Write-Host "🚀 Iniciando deployment do usuário admin na VPS..." -ForegroundColor Green
Write-Host "🌐 VPS: $VpsIP" -ForegroundColor Cyan
Write-Host "👤 Usuário: $Username" -ForegroundColor Cyan
Write-Host "📄 Script: $ScriptPath" -ForegroundColor Cyan
Write-Host ""

# Verificar se o script existe
if (-not (Test-Path $ScriptPath)) {
    Write-Host "❌ Script não encontrado: $ScriptPath" -ForegroundColor Red
    exit 1
}

# Função para executar comando SSH
function Invoke-SSHCommand {
    param(
        [string]$Command,
        [string]$Description
    )
    
    Write-Host "🔄 $Description..." -ForegroundColor Yellow
    
    # Usar plink se disponível, senão usar ssh
    $sshCmd = "ssh"
    if (Get-Command plink -ErrorAction SilentlyContinue) {
        $sshCmd = "plink"
    }
    
    try {
        if ($sshCmd -eq "plink") {
            $result = & plink -ssh -batch -pw "Ro04041932.." "$Username@$VpsIP" $Command
        } else {
            # Para ssh, precisamos usar expect ou similar para automação de senha
            # Por enquanto, vamos mostrar o comando manual
            Write-Host "Execute manualmente:" -ForegroundColor Yellow
            Write-Host "ssh $Username@$VpsIP '$Command'" -ForegroundColor White
            return $false
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $Description concluído!" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ Falha em: $Description" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Erro ao executar: $Description" -ForegroundColor Red
        Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Função para transferir arquivo via SCP
function Copy-FileToVPS {
    param(
        [string]$LocalFile,
        [string]$RemotePath
    )
    
    Write-Host "📤 Transferindo $LocalFile para VPS..." -ForegroundColor Yellow
    
    try {
        # Usar pscp se disponível, senão usar scp
        if (Get-Command pscp -ErrorAction SilentlyContinue) {
            & pscp -pw "Ro04041932.." $LocalFile "$Username@$VpsIP`:$RemotePath"
        } else {
            Write-Host "Execute manualmente:" -ForegroundColor Yellow
            Write-Host "scp $LocalFile $Username@$VpsIP`:$RemotePath" -ForegroundColor White
            return $false
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Arquivo transferido com sucesso!" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ Falha na transferência do arquivo" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Erro na transferência: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Verificar conectividade
Write-Host "🔍 Verificando conectividade com a VPS..." -ForegroundColor Yellow
$connectivity = Test-NetConnection -ComputerName $VpsIP -Port 22 -WarningAction SilentlyContinue

if ($connectivity.TcpTestSucceeded) {
    Write-Host "✅ Conectividade SSH confirmada!" -ForegroundColor Green
} else {
    Write-Host "❌ Falha na conectividade SSH" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 INSTRUÇÕES MANUAIS:" -ForegroundColor Yellow
Write-Host "Como a automação SSH pode falhar, execute os seguintes comandos manualmente:" -ForegroundColor White
Write-Host ""

Write-Host "1. Transferir o script para a VPS:" -ForegroundColor Cyan
Write-Host "   scp create_admin_user_vps.py root@212.85.17.99:/tmp/" -ForegroundColor White
Write-Host ""

Write-Host "2. Conectar na VPS:" -ForegroundColor Cyan
Write-Host "   ssh root@212.85.17.99" -ForegroundColor White
Write-Host "   Senha: Ro04041932.." -ForegroundColor Gray
Write-Host ""

Write-Host "3. Navegar para o diretório da aplicação:" -ForegroundColor Cyan
Write-Host "   cd /var/www/auto-trader-ai/backend" -ForegroundColor White
Write-Host ""

Write-Host "4. Copiar e executar o script:" -ForegroundColor Cyan
Write-Host "   cp /tmp/create_admin_user_vps.py ." -ForegroundColor White
Write-Host "   python3 create_admin_user_vps.py" -ForegroundColor White
Write-Host ""

Write-Host "5. Verificar se o usuário foi criado:" -ForegroundColor Cyan
Write-Host "   sqlite3 auto_trader.db 'SELECT email, cargo, ativo FROM users WHERE email=\""kelebra96@gmail.com\"";'" -ForegroundColor White
Write-Host ""

Write-Host "6. Testar login na aplicação:" -ForegroundColor Cyan
Write-Host "   curl -X POST http://212.85.17.99/api/auth/login \\" -ForegroundColor White
Write-Host "        -H 'Content-Type: application/json' \\" -ForegroundColor White
Write-Host "        -d '{\"email\":\"kelebra96@gmail.com\",\"password\":\"admin123456\"}'" -ForegroundColor White
Write-Host ""

Write-Host "🎯 CREDENCIAIS DO ADMIN:" -ForegroundColor Green
Write-Host "   Email: kelebra96@gmail.com" -ForegroundColor White
Write-Host "   Senha: admin123456" -ForegroundColor White
Write-Host ""

# Tentar automação se as ferramentas estiverem disponíveis
if (Get-Command pscp -ErrorAction SilentlyContinue) {
    Write-Host "🤖 Tentando automação com PuTTY tools..." -ForegroundColor Yellow
    
    if (Copy-FileToVPS $ScriptPath "/tmp/create_admin_user_vps.py") {
        Write-Host "✅ Script transferido! Agora conecte manualmente e execute." -ForegroundColor Green
    }
} else {
    Write-Host "💡 Para automação completa, instale PuTTY tools (pscp, plink)" -ForegroundColor Blue
    Write-Host "   winget install PuTTY.PuTTY" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🎉 Script preparado! Execute as instruções manuais acima." -ForegroundColor Green