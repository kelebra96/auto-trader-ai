# Script para preparar arquivos para upload na VPS
# Auto Trader AI

Write-Host "=== Preparando arquivos para upload na VPS ===" -ForegroundColor Green

# Criar diretório temporário para upload
$uploadDir = "upload_package"
if (Test-Path $uploadDir) {
    Remove-Item $uploadDir -Recurse -Force
}
New-Item -ItemType Directory -Path $uploadDir

# Copiar arquivos essenciais
Write-Host "Copiando arquivos do backend..." -ForegroundColor Yellow
Copy-Item "backend/src" -Destination "$uploadDir/backend/" -Recurse
Copy-Item "backend/requirements.txt" -Destination "$uploadDir/backend/" -ErrorAction SilentlyContinue

# Copiar arquivos do frontend
Write-Host "Copiando arquivos do frontend..." -ForegroundColor Yellow
Copy-Item "frontend/src" -Destination "$uploadDir/frontend/" -Recurse
Copy-Item "frontend/package.json" -Destination "$uploadDir/frontend/" -ErrorAction SilentlyContinue
Copy-Item "frontend/package-lock.json" -Destination "$uploadDir/frontend/" -ErrorAction SilentlyContinue
Copy-Item "frontend/vite.config.js" -Destination "$uploadDir/frontend/" -ErrorAction SilentlyContinue
Copy-Item "frontend/tailwind.config.js" -Destination "$uploadDir/frontend/" -ErrorAction SilentlyContinue
Copy-Item "frontend/postcss.config.js" -Destination "$uploadDir/frontend/" -ErrorAction SilentlyContinue
Copy-Item "frontend/index.html" -Destination "$uploadDir/frontend/" -ErrorAction SilentlyContinue

# Copiar script de deployment
Copy-Item "deploy.sh" -Destination "$uploadDir/"

# Criar arquivo README com instruções
@"
# Auto Trader AI - Instruções de Deployment

## Passos para deployment na VPS:

1. **Upload dos arquivos:**
   - Faça upload de todos os arquivos desta pasta para /tmp/ na VPS
   - Use SCP, SFTP ou qualquer ferramenta de transferência de arquivos

2. **Conectar na VPS:**
   ```bash
   ssh root@212.85.17.99
   ```

3. **Executar script de deployment:**
   ```bash
   cd /tmp
   chmod +x deploy.sh
   ./deploy.sh
   ```

4. **Copiar arquivos da aplicação:**
   ```bash
   cp -r backend/* /var/www/auto-trader-ai/backend/
   cp -r frontend/* /var/www/auto-trader-ai/frontend/
   ```

5. **Configurar permissões:**
   ```bash
   chown -R root:root /var/www/auto-trader-ai
   chmod -R 755 /var/www/auto-trader-ai
   ```

6. **Inicializar banco de dados:**
   ```bash
   cd /var/www/auto-trader-ai/backend
   source venv/bin/activate
   python -c "from src.main_simple import db; db.create_all()"
   ```

7. **Iniciar serviços:**
   ```bash
   systemctl start auto-trader-backend
   systemctl start auto-trader-frontend
   systemctl start nginx
   ```

8. **Habilitar auto-start:**
   ```bash
   systemctl enable auto-trader-backend
   systemctl enable auto-trader-frontend
   systemctl enable nginx
   ```

9. **Verificar status:**
   ```bash
   systemctl status auto-trader-backend
   systemctl status auto-trader-frontend
   systemctl status nginx
   ```

10. **Testar aplicação:**
    - Acesse: http://212.85.17.99

## Troubleshooting:

- Logs do backend: `journalctl -u auto-trader-backend -f`
- Logs do frontend: `journalctl -u auto-trader-frontend -f`
- Logs do nginx: `tail -f /var/log/nginx/error.log`

## Configurações importantes:

- Backend roda na porta 5000
- Frontend roda na porta 5173
- Nginx faz proxy reverso na porta 80
- Banco de dados SQLite em /var/www/auto-trader-ai/backend/auto_trader.db
"@ | Out-File -FilePath "$uploadDir/README.md" -Encoding UTF8

Write-Host "=== Arquivos preparados em: $uploadDir ===" -ForegroundColor Green
Write-Host "Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Faça upload da pasta '$uploadDir' para /tmp/ na VPS" -ForegroundColor White
Write-Host "2. Conecte na VPS e execute o script deploy.sh" -ForegroundColor White
Write-Host "3. Siga as instruções no arquivo README.md" -ForegroundColor White