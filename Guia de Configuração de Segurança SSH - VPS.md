# Guia de Configuração de Segurança SSH - VPS

**Servidor:** 212.85.17.99  
**Objetivo:** Criar usuário seguro e configurar acesso por chave SSH  
**Data:** Janeiro 2024  

## 🔐 Passo 1: Acesso Inicial e Preparação

### 1.1 Conectar ao Servidor como Root

```bash
# No seu computador local (Windows/Linux/Mac)
ssh root@212.85.17.99
# Digite a senha quando solicitado: Ro04041932..
```

### 1.2 Atualizar o Sistema

```bash
# Atualizar lista de pacotes e sistema
apt update && apt upgrade -y

# Instalar ferramentas essenciais
apt install -y curl wget git nano ufw fail2ban
```

## 🔑 Passo 2: Gerar Chaves SSH no Seu Computador Local

### 2.1 No Windows (usando PowerShell ou Git Bash)

```powershell
# Abrir PowerShell ou Git Bash
# Gerar nova chave SSH (substitua seu-email@exemplo.com pelo seu email)
ssh-keygen -t rsa -b 4096 -C "seu-email@exemplo.com"

# Quando perguntado onde salvar, pressione Enter para usar o local padrão
# Enter file in which to save the key (C:\Users\SeuUsuario\.ssh\id_rsa): [Enter]

# Quando perguntado sobre passphrase, você pode:
# - Deixar em branco (menos seguro, mais conveniente)
# - Ou criar uma passphrase (mais seguro)
```

### 2.2 No Linux/Mac (Terminal)

```bash
# Gerar nova chave SSH
ssh-keygen -t rsa -b 4096 -C "seu-email@exemplo.com"

# Pressione Enter para local padrão: ~/.ssh/id_rsa
# Defina uma passphrase (opcional mas recomendado)
```

### 2.3 Visualizar a Chave Pública Gerada

**No Windows (PowerShell):**
```powershell
# Mostrar conteúdo da chave pública
Get-Content $env:USERPROFILE\.ssh\id_rsa.pub
```

**No Linux/Mac:**
```bash
# Mostrar conteúdo da chave pública
cat ~/.ssh/id_rsa.pub
```

**A saída será algo como:**
```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDExample... seu-email@exemplo.com
```

**📋 COPIE ESTA CHAVE PÚBLICA COMPLETA - você precisará dela no próximo passo!**

## 👤 Passo 3: Criar Usuário Seguro no Servidor

### 3.1 Criar Novo Usuário (ainda conectado como root)

```bash
# Criar usuário (substitua 'validade' por um nome de sua escolha)
adduser validade

# O sistema pedirá:
# - Nova senha (crie uma senha forte)
# - Confirmação da senha
# - Informações opcionais (pode pular com Enter)
```

### 3.2 Adicionar Usuário ao Grupo Sudo

```bash
# Dar privilégios de administrador ao usuário
usermod -aG sudo validade

# Verificar se foi adicionado corretamente
groups validade
# Deve mostrar: validade : validade sudo
```

### 3.3 Configurar Diretório SSH para o Novo Usuário

```bash
# Criar diretório .ssh para o usuário
mkdir -p /home/validade/.ssh

# Definir permissões corretas
chmod 700 /home/validade/.ssh

# Criar arquivo authorized_keys
touch /home/validade/.ssh/authorized_keys
chmod 600 /home/validade/.ssh/authorized_keys

# Definir proprietário correto
chown -R validade:validade /home/validade/.ssh
```

## 🔑 Passo 4: Adicionar Sua Chave Pública

### 4.1 Adicionar Chave Pública ao Servidor

```bash
# Abrir o arquivo authorized_keys para edição
nano /home/validade/.ssh/authorized_keys

# Cole sua chave pública completa (a que você copiou no Passo 2.3)
# Exemplo:
# ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDExample... seu-email@exemplo.com

# Salvar e sair:
# Ctrl + X, depois Y, depois Enter
```

### 4.2 Verificar Configuração

```bash
# Verificar conteúdo do arquivo
cat /home/validade/.ssh/authorized_keys

# Verificar permissões
ls -la /home/validade/.ssh/
# Deve mostrar:
# drwx------ 2 validade validade 4096 ... .
# drwxr-xr-x 3 validade validade 4096 ... ..
# -rw------- 1 validade validade  xxx ... authorized_keys
```

## 🧪 Passo 5: Testar Acesso com Chave SSH

### 5.1 Testar Conexão (SEM FECHAR a sessão root atual)

**Abra um NOVO terminal/PowerShell e teste:**

```bash
# Testar conexão com o novo usuário
ssh validade@212.85.17.99

# Se configurado corretamente, você deve conseguir entrar sem digitar senha
# (ou apenas a passphrase da chave, se você definiu uma)
```

### 5.2 Testar Privilégios Sudo

```bash
# Dentro da nova conexão SSH, testar sudo
sudo whoami
# Deve retornar: root

# Testar comando administrativo
sudo apt update
```

**⚠️ IMPORTANTE: Só continue para o próximo passo se o teste acima funcionou!**

## 🔒 Passo 6: Configurar Segurança SSH

### 6.1 Backup da Configuração SSH

```bash
# Voltar para a sessão root original
# Fazer backup da configuração atual
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup
```

### 6.2 Editar Configuração SSH

```bash
# Editar configuração SSH
nano /etc/ssh/sshd_config

# Encontre e modifique as seguintes linhas:
```

**Configurações a alterar:**

```bash
# Desabilitar login root via SSH
PermitRootLogin no

# Desabilitar autenticação por senha (apenas chaves)
PasswordAuthentication no

# Desabilitar autenticação por desafio-resposta
ChallengeResponseAuthentication no

# Habilitar autenticação por chave pública
PubkeyAuthentication yes

# Especificar usuários permitidos (opcional)
AllowUsers validade

# Alterar porta SSH (opcional, mas recomendado)
Port 2222

# Outras configurações de segurança
Protocol 2
PermitEmptyPasswords no
X11Forwarding no
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
```

### 6.3 Validar Configuração

```bash
# Testar configuração SSH
sshd -t

# Se não houver erros, continue
# Se houver erros, corrija antes de prosseguir
```

### 6.4 Reiniciar Serviço SSH

```bash
# Reiniciar SSH
systemctl restart sshd

# Verificar status
systemctl status sshd
```

## 🛡️ Passo 7: Configurar Firewall

### 7.1 Configurar UFW

```bash
# Configurar firewall
ufw default deny incoming
ufw default allow outgoing

# Permitir nova porta SSH (se você mudou)
ufw allow 2222/tcp

# Ou se manteve a porta padrão:
# ufw allow ssh

# Permitir portas da aplicação
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 3000/tcp  # Frontend (temporário)
ufw allow 5000/tcp  # Backend (temporário)

# Ativar firewall
ufw --force enable

# Verificar status
ufw status
```

## 🔐 Passo 8: Configurar Fail2Ban

### 8.1 Configurar Proteção contra Ataques

```bash
# Criar configuração personalizada
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = 2222
logpath = /var/log/auth.log
maxretry = 3
bantime = 7200
EOF

# Se você manteve a porta SSH padrão (22), use:
# port = ssh

# Reiniciar fail2ban
systemctl restart fail2ban
systemctl enable fail2ban

# Verificar status
fail2ban-client status
```

## ✅ Passo 9: Teste Final de Segurança

### 9.1 Testar Nova Configuração

**Em um NOVO terminal:**

```bash
# Se você mudou a porta SSH para 2222:
ssh -p 2222 validade@212.85.17.99

# Se manteve a porta padrão:
ssh validade@212.85.17.99

# Deve funcionar sem pedir senha (apenas chave SSH)
```

### 9.2 Verificar que Root Está Bloqueado

```bash
# Tentar conectar como root (deve falhar)
ssh -p 2222 root@212.85.17.99
# Deve retornar: Permission denied
```

### 9.3 Testar Sudo

```bash
# Dentro da conexão SSH como validade
sudo su -
# Deve funcionar e te dar acesso root
```

## 📋 Passo 10: Documentar Configurações

### 10.1 Criar Arquivo de Configurações

```bash
# Como usuário validade, criar arquivo de documentação
cat > /home/validade/ssh-config.txt << EOF
=== Configurações SSH ===
Servidor: 212.85.17.99
Usuário: validade
Porta SSH: 2222 (ou 22 se não alterou)
Autenticação: Chave SSH apenas
Root login: Desabilitado
Firewall: Ativo (UFW)
Fail2Ban: Ativo

=== Como Conectar ===
ssh -p 2222 validade@212.85.17.99

=== Localização da Chave Privada ===
Windows: C:\Users\SeuUsuario\.ssh\id_rsa
Linux/Mac: ~/.ssh/id_rsa

=== Comandos Úteis ===
- Verificar status SSH: sudo systemctl status sshd
- Verificar firewall: sudo ufw status
- Verificar fail2ban: sudo fail2ban-client status
- Logs SSH: sudo tail -f /var/log/auth.log
EOF
```

## 🔄 Passo 11: Configurações Adicionais de Segurança

### 11.1 Configurar Atualizações Automáticas

```bash
# Instalar atualizações automáticas
sudo apt install unattended-upgrades -y

# Configurar
sudo dpkg-reconfigure -plow unattended-upgrades
# Selecione "Yes" quando perguntado
```

### 11.2 Configurar Monitoramento de Logs

```bash
# Instalar logwatch
sudo apt install logwatch -y

# Configurar para envio diário de relatórios
sudo nano /etc/cron.daily/00logwatch

# Adicionar:
#!/bin/bash
/usr/sbin/logwatch --output mail --mailto seu-email@exemplo.com --detail high
```

## 📱 Passo 12: Configurar Acesso Mobile (Opcional)

### 12.1 Para Dispositivos Android/iOS

**Apps recomendados:**
- **Android:** Termux, JuiceSSH
- **iOS:** Termius, Prompt 3

**Configuração:**
1. Instale o app SSH
2. Adicione nova conexão:
   - Host: 212.85.17.99
   - Porta: 2222 (ou 22)
   - Usuário: validade
   - Autenticação: Chave privada
3. Importe sua chave privada para o app

## 🆘 Troubleshooting

### Problemas Comuns:

**1. "Permission denied (publickey)"**
```bash
# Verificar permissões
sudo ls -la /home/validade/.ssh/
sudo cat /home/validade/.ssh/authorized_keys

# Corrigir permissões se necessário
sudo chmod 700 /home/validade/.ssh
sudo chmod 600 /home/validade/.ssh/authorized_keys
sudo chown -R validade:validade /home/validade/.ssh
```

**2. "Connection refused"**
```bash
# Verificar se SSH está rodando
sudo systemctl status sshd

# Verificar porta
sudo netstat -tlnp | grep :2222

# Verificar firewall
sudo ufw status
```

**3. Esqueci a porta SSH**
```bash
# Verificar configuração atual
sudo grep "^Port" /etc/ssh/sshd_config
```

**4. Preciso recuperar acesso root**
```bash
# Se você tem acesso físico ao servidor ou console web
# Edite /etc/ssh/sshd_config e temporariamente mude:
# PermitRootLogin yes
# Depois reinicie: systemctl restart sshd
```

## 📋 Checklist Final

- [ ] Chave SSH gerada no computador local
- [ ] Usuário não-root criado (validade)
- [ ] Usuário adicionado ao grupo sudo
- [ ] Chave pública adicionada ao servidor
- [ ] Teste de conexão SSH funcionando
- [ ] Configuração SSH endurecida
- [ ] Login root desabilitado
- [ ] Autenticação por senha desabilitada
- [ ] Firewall configurado e ativo
- [ ] Fail2Ban configurado
- [ ] Teste final de segurança aprovado
- [ ] Configurações documentadas

## 🎉 Conclusão

Parabéns! Você configurou com sucesso:

✅ **Usuário seguro** com privilégios administrativos  
✅ **Autenticação por chave SSH** (sem senhas)  
✅ **Firewall ativo** com regras restritivas  
✅ **Proteção contra ataques** de força bruta  
✅ **Login root desabilitado** via SSH  
✅ **Configurações de segurança** endurecidas  

**Próximos passos:** Agora você pode prosseguir com o deployment da aplicação Validade Inteligente usando o usuário `validade` que criamos.

**Para conectar ao servidor:**
```bash
ssh -p 2222 validade@212.85.17.99
```

**⚠️ IMPORTANTE:** Guarde bem sua chave privada SSH e as configurações. Sem ela, você não conseguirá acessar o servidor!

