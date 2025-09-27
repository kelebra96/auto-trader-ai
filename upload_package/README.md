# Auto Trader AI - Instruções de Deployment

## Passos para deployment na VPS:

1. **Upload dos arquivos:**
   - Faça upload de todos os arquivos desta pasta para /tmp/ na VPS
   - Use SCP, SFTP ou qualquer ferramenta de transferência de arquivos

2. **Conectar na VPS:**
   `ash
   ssh root@212.85.17.99
   `

3. **Executar script de deployment:**
   `ash
   cd /tmp
   chmod +x deploy.sh
   ./deploy.sh
   `

4. **Copiar arquivos da aplicação:**
   `ash
   cp -r backend/* /var/www/auto-trader-ai/backend/
   cp -r frontend/* /var/www/auto-trader-ai/frontend/
   `

5. **Configurar permissões:**
   `ash
   chown -R root:root /var/www/auto-trader-ai
   chmod -R 755 /var/www/auto-trader-ai
   `

6. **Inicializar banco de dados:**
   `ash
   cd /var/www/auto-trader-ai/backend
   source venv/bin/activate
   python -c "from src.main_simple import db; db.create_all()"
   `

7. **Iniciar serviços:**
   `ash
   systemctl start auto-trader-backend
   systemctl start auto-trader-frontend
   systemctl start nginx
   `

8. **Habilitar auto-start:**
   `ash
   systemctl enable auto-trader-backend
   systemctl enable auto-trader-frontend
   systemctl enable nginx
   `

9. **Verificar status:**
   `ash
   systemctl status auto-trader-backend
   systemctl status auto-trader-frontend
   systemctl status nginx
   `

10. **Testar aplicação:**
    - Acesse: http://212.85.17.99

## Troubleshooting:

- Logs do backend: journalctl -u auto-trader-backend -f
- Logs do frontend: journalctl -u auto-trader-frontend -f
- Logs do nginx: 	ail -f /var/log/nginx/error.log

## Configurações importantes:

- Backend roda na porta 5000
- Frontend roda na porta 5173
- Nginx faz proxy reverso na porta 80
- Banco de dados SQLite em /var/www/auto-trader-ai/backend/auto_trader.db
