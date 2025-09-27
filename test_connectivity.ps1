# Script de Diagnóstico de Conectividade VPS
# Auto Trader AI - VPS: 212.85.17.99

param(
    [string]$VpsIP = "212.85.17.99",
    [string]$Username = "root"
)

Write-Host "=== Diagnóstico de Conectividade VPS ===" -ForegroundColor Green
Write-Host "VPS: $VpsIP" -ForegroundColor Yellow
Write-Host "Usuário: $Username" -ForegroundColor Yellow
Write-Host ""

# Teste 1: Ping
Write-Host "1. Testando conectividade básica (ping)..." -ForegroundColor Cyan
try {
    $pingResult = Test-Connection -ComputerName $VpsIP -Count 4 -ErrorAction Stop
    Write-Host "✅ Ping bem-sucedido!" -ForegroundColor Green
    Write-Host "   Tempo médio: $($pingResult | Measure-Object ResponseTime -Average | Select-Object -ExpandProperty Average)ms" -ForegroundColor White
} catch {
    Write-Host "❌ Ping falhou: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Teste 2: Porta SSH (22)
Write-Host "2. Testando porta SSH (22)..." -ForegroundColor Cyan
try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $tcpClient.ConnectAsync($VpsIP, 22).Wait(5000)
    if ($tcpClient.Connected) {
        Write-Host "✅ Porta 22 está aberta!" -ForegroundColor Green
        $tcpClient.Close()
    } else {
        Write-Host "❌ Porta 22 não está acessível" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erro ao testar porta 22: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Teste 3: Portas SSH alternativas
Write-Host "3. Testando portas SSH alternativas..." -ForegroundColor Cyan
$alternativePorts = @(2222, 2200, 22000, 2022, 22022)

foreach ($port in $alternativePorts) {
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $tcpClient.ConnectAsync($VpsIP, $port).Wait(3000)
        if ($tcpClient.Connected) {
            Write-Host "✅ Porta $port está aberta!" -ForegroundColor Green
            $tcpClient.Close()
        } else {
            Write-Host "❌ Porta $port não está acessível" -ForegroundColor Gray
        }
    } catch {
        Write-Host "❌ Porta $port não está acessível" -ForegroundColor Gray
    }
}

Write-Host ""

# Teste 4: Resolução DNS
Write-Host "4. Testando resolução DNS..." -ForegroundColor Cyan
try {
    $dnsResult = Resolve-DnsName -Name $VpsIP -ErrorAction Stop
    Write-Host "✅ DNS resolvido com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro na resolução DNS: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Teste 5: Traceroute
Write-Host "5. Executando traceroute..." -ForegroundColor Cyan
try {
    $tracertResult = tracert $VpsIP
    Write-Host "Traceroute completo:" -ForegroundColor White
    $tracertResult | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
} catch {
    Write-Host "❌ Erro no traceroute: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Resumo e Recomendações ===" -ForegroundColor Green

Write-Host ""
Write-Host "📋 Comandos para testar manualmente:" -ForegroundColor Yellow
Write-Host "   ssh $Username@$VpsIP" -ForegroundColor White
Write-Host "   ssh -p 2222 $Username@$VpsIP" -ForegroundColor White
Write-Host "   ssh -p 2200 $Username@$VpsIP" -ForegroundColor White
Write-Host "   telnet $VpsIP 22" -ForegroundColor White

Write-Host ""
Write-Host "🔧 Possíveis soluções:" -ForegroundColor Yellow
Write-Host "   1. Verificar se o serviço SSH está rodando na VPS" -ForegroundColor White
Write-Host "   2. Verificar configurações de firewall" -ForegroundColor White
Write-Host "   3. Confirmar o IP correto da VPS" -ForegroundColor White
Write-Host "   4. Verificar se SSH está em porta não-padrão" -ForegroundColor White
Write-Host "   5. Usar painel de controle da VPS para acesso direto" -ForegroundColor White

Write-Host ""
Write-Host "📁 Arquivos preparados para upload:" -ForegroundColor Yellow
Write-Host "   - upload_package/ (todos os arquivos da aplicação)" -ForegroundColor White
Write-Host "   - deploy.sh (script de deployment automático)" -ForegroundColor White
Write-Host "   - DEPLOYMENT_INSTRUCTIONS.md (instruções detalhadas)" -ForegroundColor White