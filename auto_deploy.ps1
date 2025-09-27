# Script de Deployment Simplificado
# Auto Trader AI - VPS: 212.85.17.99:22

$VpsIP = "212.85.17.99"
$VpsPort = "22"
$Username = "root"
$Password = "Ro04041932.."

Write-Host "=== Auto Trader AI - Deployment Automatizado ===" -ForegroundColor Green
Write-Host "VPS: $VpsIP porta $VpsPort" -ForegroundColor Yellow
Write-Host "Usuario: $Username" -ForegroundColor Yellow
Write-Host ""

# Verificar se o plink está disponível
$plinkPath = Get-Command plink -ErrorAction SilentlyContinue
if (-not $plinkPath) {
    Write-Host "Instalando PuTTY para conexao SSH..." -ForegroundColor Yellow
    try {
        winget install PuTTY.PuTTY --silent
        Write-Host "PuTTY instalado com sucesso!" -ForegroundColor Green
        # Adicionar ao PATH
        $env:PATH += ";C:\Program Files\PuTTY"
    } catch {
        Write-Host "Erro ao instalar PuTTY automaticamente." -ForegroundColor Red
        Write-Host "Por favor, instale manualmente: https://www.putty.org/" -ForegroundColor Yellow
        Write-Host "Ou use as instrucoes em DEPLOYMENT_INSTRUCTIONS.md" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "1. Testando conectividade..." -ForegroundColor Cyan

# Teste de conectividade simples
$testCommand = "echo y | plink -ssh -P $VpsPort -pw $Password $Username@$VpsIP `"echo 'Conexao estabelecida'`""

try {
    $result = Invoke-Expression $testCommand
    Write-Host "Conectividade OK!" -ForegroundColor Green
} catch {
    Write-Host "Erro de conectividade. Verifique as credenciais." -ForegroundColor Red
    Write-Host "Tentando conexao manual..." -ForegroundColor Yellow
    
    # Tentar conexão manual
    $manualCommand = "plink -ssh -P $VpsPort $Username@$VpsIP"
    Write-Host "Execute manualmente: $manualCommand" -ForegroundColor White
    Write-Host "Senha: $Password" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "2. Preparando ambiente na VPS..." -ForegroundColor Cyan

# Comandos de preparação
$commands = @(
    "mkdir -p /var/www/auto-trader-ai",
    "apt update",
    "apt install -y curl wget git nginx python3 python3-pip python3-venv nodejs npm sqlite3"
)

foreach ($cmd in $commands) {
    Write-Host "Executando: $cmd" -ForegroundColor Gray
    $execCommand = "echo y | plink -ssh -P $VpsPort -pw $Password $Username@$VpsIP `"$cmd`""
    try {
        Invoke-Expression $execCommand | Out-Null
        Write-Host "OK" -ForegroundColor Green
    } catch {
        Write-Host "Erro: $cmd" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "3. Transferindo arquivos..." -ForegroundColor Cyan

# Verificar se pscp está disponível
$pscpPath = Get-Command pscp -ErrorAction SilentlyContinue
if (-not $pscpPath) {
    Write-Host "pscp nao encontrado. Usando metodo alternativo..." -ForegroundColor Yellow
    
    # Criar script de upload
    $uploadScript = @"
#!/bin/bash
# Script de upload para VPS
echo "Fazendo upload dos arquivos..."
"@
    
    $uploadScript | Out-File -FilePath "upload_script.sh" -Encoding UTF8
    
    Write-Host "Arquivos preparados em upload_package/" -ForegroundColor Green
    Write-Host "Execute manualmente:" -ForegroundColor Yellow
    Write-Host "scp -P 22 -r upload_package/* root@212.85.17.99:/var/www/auto-trader-ai/" -ForegroundColor White
} else {
    # Transferir arquivos usando pscp
    $transfers = @(
        @{Local="upload_package\backend"; Remote="/var/www/auto-trader-ai/backend"},
        @{Local="upload_package\frontend"; Remote="/var/www/auto-trader-ai/frontend"},
        @{Local="upload_package\deploy.sh"; Remote="/var/www/auto-trader-ai/deploy.sh"}
    )
    
    foreach ($transfer in $transfers) {
        Write-Host "Transferindo: $($transfer.Local)" -ForegroundColor Gray
        $transferCommand = "pscp -P $VpsPort -pw $Password -r `"$($transfer.Local)`" $Username@$VpsIP`:`"$($transfer.Remote)`""
        try {
            Invoke-Expression $transferCommand | Out-Null
            Write-Host "OK" -ForegroundColor Green
        } catch {
            Write-Host "Erro na transferencia: $($transfer.Local)" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "4. Executando deployment..." -ForegroundColor Cyan

$deployCommands = @(
    "chmod +x /var/www/auto-trader-ai/deploy.sh",
    "cd /var/www/auto-trader-ai && ./deploy.sh"
)

foreach ($cmd in $deployCommands) {
    Write-Host "Executando: $cmd" -ForegroundColor Gray
    $execCommand = "echo y | plink -ssh -P $VpsPort -pw $Password $Username@$VpsIP `"$cmd`""
    try {
        Invoke-Expression $execCommand
        Write-Host "OK" -ForegroundColor Green
    } catch {
        Write-Host "Erro: $cmd" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Deployment Concluido! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Acesse sua aplicacao em:" -ForegroundColor Yellow
Write-Host "http://$VpsIP" -ForegroundColor White
Write-Host ""
Write-Host "Para monitorar:" -ForegroundColor Yellow
Write-Host "ssh -p $VpsPort $Username@$VpsIP" -ForegroundColor White
Write-Host "systemctl status auto-trader-backend" -ForegroundColor White
Write-Host "systemctl status auto-trader-frontend" -ForegroundColor White