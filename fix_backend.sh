#!/bin/bash

echo "Corrigindo problema do backend..."

# Parar o serviço do backend
systemctl stop auto-trader-backend

# Navegar para o diretório do backend
cd /var/www/auto-trader-ai/backend

# Remover ambiente virtual existente
rm -rf .venv

# Criar novo ambiente virtual com Python 3.11 (ou versão disponível)
if command -v python3.11 &> /dev/null; then
    python3.11 -m venv .venv
elif command -v python3.10 &> /dev/null; then
    python3.10 -m venv .venv
else
    python3 -m venv .venv
fi

# Ativar ambiente virtual
source .venv/bin/activate

# Atualizar pip
pip install --upgrade pip

# Instalar dependências com versões específicas compatíveis
pip install Flask==2.3.3
pip install SQLAlchemy==2.0.25
pip install Flask-SQLAlchemy==3.0.5
pip install python-dotenv==1.0.0
pip install requests==2.31.0
pip install flask-cors==4.0.0

# Instalar outras dependências do requirements.txt se existir
if [ -f requirements.txt ]; then
    pip install -r requirements.txt
fi

# Criar banco de dados
python -c "
from app import app, db
with app.app_context():
    db.create_all()
    print('Database created successfully')
"

# Reiniciar e habilitar o serviço
systemctl start auto-trader-backend
systemctl enable auto-trader-backend

echo "Backend corrigido com sucesso!"

# Verificar status
systemctl status auto-trader-backend --no-pager