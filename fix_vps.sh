#!/bin/bash

echo "=== Corrigindo problema do SQLAlchemy na VPS ==="

# Parar serviços
systemctl stop auto-trader-backend auto-trader-frontend

# Ir para o diretório do backend
cd /var/www/auto-trader-ai/backend

# Remover ambiente virtual atual
rm -rf venv

# Verificar se Python 3.11 está disponível
if command -v python3.11 &> /dev/null; then
    echo "Usando Python 3.11..."
    python3.11 -m venv venv
elif command -v python3.10 &> /dev/null; then
    echo "Usando Python 3.10..."
    python3.10 -m venv venv
else
    echo "Usando Python 3 padrão..."
    python3 -m venv venv
fi

# Ativar ambiente virtual
source venv/bin/activate

# Atualizar pip
pip install --upgrade pip

# Instalar dependências com versões compatíveis
pip install Flask==3.0.0
pip install Flask-CORS==4.0.0
pip install Flask-JWT-Extended==4.6.0
pip install SQLAlchemy==2.0.25
pip install requests==2.31.0
pip install python-dateutil==2.8.2
pip install Werkzeug==3.0.1

# Criar banco de dados
cd /var/www/auto-trader-ai/backend
python src/main_simple.py &
sleep 5
pkill -f main_simple.py

# Reiniciar serviços
systemctl start auto-trader-backend auto-trader-frontend nginx
systemctl enable auto-trader-backend auto-trader-frontend nginx

echo "=== Correção concluída ==="
echo "Verificando status dos serviços..."
systemctl status auto-trader-backend --no-pager