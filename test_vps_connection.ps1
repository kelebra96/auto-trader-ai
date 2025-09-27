# Script de Teste de Conectividade VPS
# Auto Trader AI - Diagnóstico Completo

param(
    [string]$VpsIP = "212.85.17.99",
    [string]$VpsPort = "22",
    [string]$Username = "root"
)

Write-Host "=== Teste de Conectividade VPS - Auto Trader AI ===" -ForegroundColor Green
Write-Host "VPS: $VpsIP porta $VpsPort" -ForegroundColor Yellow
Write-Host "Usuario: $Username" -ForegroundColor Yellow
Write-Host ""

# Função para testar conectividade básica
function Test-BasicConnectivity {
    Write-Host "1. Testando conectividade básica..." -ForegroundColor Cyan
    
    try {
        $pingResult = Test-Connection -ComputerName $VpsIP -Count 3 -ErrorAction Stop
        $avgTime = ($pingResult | Measure-Object ResponseTime -Average).Average
        Write-Host "✅ Ping OK - Tempo médio: ${avgTime}ms" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ Ping falhou: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Função para testar porta SSH
function Test-SSHPort {
    Write-Host "2. Testando porta SSH ($VpsPort)..." -ForegroundColor Cyan
    
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $connectTask = $tcpClient.ConnectAsync($VpsIP, $VpsPort)
        $connectTask.Wait(5000)
        
        if ($tcpClient.Connected) {
            Write-Host "✅ Porta $VpsPort está aberta e acessível" -ForegroundColor Green
            $tcpClient.Close()
            return $true
        } else {
            Write-Host "❌ Porta $VpsPort não está acessível" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Erro ao testar porta $VpsPort : $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Função para testar SSH interativo
function Test-SSHInteractive {
    Write-Host "3. Testando conexão SSH interativa..." -ForegroundColor Cyan
    
    # Verificar se ssh está disponível
    $sshPath = Get-Command ssh -ErrorAction SilentlyContinue
    if (-not $sshPath) {
        Write-Host "❌ Comando SSH não encontrado" -ForegroundColor Red
        Write-Host "   Instale OpenSSH ou use PuTTY" -ForegroundColor Yellow
        return $false
    }
    
    Write-Host "Tentando conexão SSH..." -ForegroundColor Gray
    Write-Host "Comando: ssh -p $VpsPort $Username@$VpsIP" -ForegroundColor White
    Write-Host ""
    Write-Host "⚠️  ATENÇÃO: Você precisará inserir a senha manualmente" -ForegroundColor Yellow
    Write-Host "Senha: Ro04041932.." -ForegroundColor White
    Write-Host ""
    
    $response = Read-Host "Deseja tentar a conexão SSH agora? (s/n)"
    
    if ($response -eq 's' -or $response -eq 'S') {
        try {
            # Tentar conexão SSH
            & ssh -p $VpsPort "$Username@$VpsIP" "echo 'Conexão SSH bem-sucedida!'; exit"
            Write-Host "✅ Conexão SSH funcionou!" -ForegroundColor Green
            return $true
        } catch {
            Write-Host "❌ Erro na conexão SSH: $($_.Exception.Message)" -ForegroundColor Red
            return $false
        }
    } else {
        Write-Host "⏭️  Teste SSH pulado pelo usuário" -ForegroundColor Yellow
        return $null
    }
}

# Função para verificar ferramentas de deployment
function Test-DeploymentTools {
    Write-Host "4. Verificando ferramentas de deployment..." -ForegroundColor Cyan
    
    $tools = @{
        "ssh" = "OpenSSH Client"
        "scp" = "Secure Copy"
        "plink" = "PuTTY Link"
        "pscp" = "PuTTY SCP"
        "winget" = "Windows Package Manager"
    }
    
    $availableTools = @()
    
    foreach ($tool in $tools.Keys) {
        $toolPath = Get-Command $tool -ErrorAction SilentlyContinue
        if ($toolPath) {
            Write-Host "✅ $($tools[$tool]) disponível" -ForegroundColor Green
            $availableTools += $tool
        } else {
            Write-Host "❌ $($tools[$tool]) não encontrado" -ForegroundColor Red
        }
    }
    
    return $availableTools
}

# Função para gerar relatório
function Generate-Report {
    param(
        [bool]$PingOK,
        [bool]$PortOK,
        [bool]$SSHOK,
        [array]$Tools
    )
    
    Write-Host ""
    Write-Host "=== RELATÓRIO DE CONECTIVIDADE ===" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "📊 Resultados dos Testes:" -ForegroundColor Yellow
    Write-Host "   Ping: $(if($PingOK){'✅ OK'}else{'❌ FALHOU'})" -ForegroundColor White
    Write-Host "   Porta SSH: $(if($PortOK){'✅ OK'}else{'❌ FALHOU'})" -ForegroundColor White
    Write-Host "   Conexão SSH: $(if($SSHOK -eq $true){'✅ OK'}elseif($SSHOK -eq $false){'❌ FALHOU'}else{'⏭️ NÃO TESTADO'})" -ForegroundColor White
    
    Write-Host ""
    Write-Host "🛠️  Ferramentas Disponíveis:" -ForegroundColor Yellow
    if ($Tools.Count -gt 0) {
        foreach ($tool in $Tools) {
            Write-Host "   ✅ $tool" -ForegroundColor Green
        }
    } else {
        Write-Host "   ❌ Nenhuma ferramenta de deployment encontrada" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "📋 Recomendações:" -ForegroundColor Yellow
    
    if (-not $PingOK) {
        Write-Host "   🔧 Verificar conectividade de rede" -ForegroundColor White
        Write-Host "   🔧 Verificar se o IP está correto" -ForegroundColor White
    }
    
    if (-not $PortOK) {
        Write-Host "   🔧 Verificar se SSH está rodando na VPS" -ForegroundColor White
        Write-Host "   🔧 Verificar configurações de firewall" -ForegroundColor White
    }
    
    if ($SSHOK -eq $false) {
        Write-Host "   🔧 Verificar credenciais de login" -ForegroundColor White
        Write-Host "   🔧 Verificar configurações SSH da VPS" -ForegroundColor White
    }
    
    if ($Tools -notcontains "ssh" -and $Tools -notcontains "plink") {
        Write-Host "   🔧 Instalar OpenSSH ou PuTTY" -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "📁 Próximos Passos:" -ForegroundColor Yellow
    
    if ($PingOK -and $PortOK) {
        Write-Host "   1. Use o guia manual: MANUAL_DEPLOYMENT_GUIDE.md" -ForegroundColor White
        Write-Host "   2. Ou tente o deployment automatizado novamente" -ForegroundColor White
        Write-Host "   3. Arquivos prontos em: upload_package/" -ForegroundColor White
    } else {
        Write-Host "   1. Resolver problemas de conectividade primeiro" -ForegroundColor White
        Write-Host "   2. Contatar provedor da VPS se necessário" -ForegroundColor White
        Write-Host "   3. Verificar configurações de rede" -ForegroundColor White
    }
}

# Executar testes
$pingResult = Test-BasicConnectivity
Write-Host ""

$portResult = Test-SSHPort
Write-Host ""

$sshResult = Test-SSHInteractive
Write-Host ""

$toolsResult = Test-DeploymentTools
Write-Host ""

# Gerar relatório final
Generate-Report -PingOK $pingResult -PortOK $portResult -SSHOK $sshResult -Tools $toolsResult

Write-Host ""
Write-Host "=== Teste Concluído ===" -ForegroundColor Green