# Guia de Deployment: Validade Inteligente no Windows (Sem Docker)

Este guia detalha o processo de como configurar e executar a aplicação Validade Inteligente diretamente em um ambiente Windows, sem a necessidade de Docker. Ele cobrirá a instalação de pré-requisitos, clonagem do repositório, configuração de variáveis de ambiente e execução separada do backend (Python/Flask) e frontend (Node.js/React).

## 🚀 Pré-requisitos

Certifique-se de que seu sistema Windows atende aos seguintes requisitos e que os softwares listados estão instalados antes de prosseguir:

### 1. Git

O Git é necessário para clonar o repositório do projeto.

-   **Download:** Baixe o instalador mais recente em [git-scm.com/download/win](https://git-scm.com/download/win).
-   **Instalação:** Siga as instruções do instalador. Recomenda-se usar as opções padrão, mas certifique-se de que o Git Bash esteja incluído, pois ele oferece um ambiente de linha de comando Linux-like no Windows.
-   **Verificação:** Abra o Git Bash ou o Prompt de Comando/PowerShell e execute:
    ```bash
    git --version
    ```
    Você deve ver a versão do Git instalada.

### 2. Python

O backend da aplicação é desenvolvido em Python (versão 3.9 ou superior).

-   **Download:** Baixe o instalador do Python 3.9+ em [python.org/downloads/windows/](https://www.python.org/downloads/windows/). Recomenda-se a versão estável mais recente (ex: 3.11.x).
-   **Instalação:**
    -   **IMPORTANTE:** Durante a instalação, marque a opção **"Add Python to PATH"** (Adicionar Python ao PATH). Isso facilitará a execução dos comandos Python de qualquer diretório.
    -   Siga as instruções para concluir a instalação.
-   **Verificação:** Abra o Prompt de Comando/PowerShell e execute:
    ```bash
    python --version
    pip --version
    ```
    Você deve ver as versões do Python e do pip instaladas.

### 3. Node.js e pnpm

O frontend da aplicação é desenvolvido em React e requer Node.js (versão 16 ou superior) e pnpm (gerenciador de pacotes).

-   **Download Node.js:** Baixe o instalador LTS (Long Term Support) em [nodejs.org/en/download/](https://nodejs.org/en/download/).
-   **Instalação Node.js:** Siga as instruções do instalador. Recomenda-se usar as opções padrão. O npm (Node Package Manager) será instalado junto com o Node.js.
-   **Verificação Node.js:** Abra o Prompt de Comando/PowerShell e execute:
    ```bash
    node --version
    npm --version
    ```
    Você deve ver as versões do Node.js e do npm instaladas.
-   **Instalação pnpm:** Após instalar o Node.js e npm, instale o pnpm globalmente:
    ```bash
    npm install -g pnpm
    ```
-   **Verificação pnpm:**
    ```bash
    pnpm --version
    ```
    Você deve ver a versão do pnpm instalada.

### 4. PostgreSQL

O banco de dados da aplicação é PostgreSQL (versão 13 ou superior).

-   **Download:** Baixe o instalador para Windows em [postgresql.org/download/windows/](https://www.postgresql.org/download/windows/). Recomenda-se a versão estável mais recente (ex: 15.x).
-   **Instalação:**
    -   Siga as instruções do instalador. Durante a instalação, você será solicitado a definir uma senha para o usuário `postgres`. **Anote esta senha**, pois ela será necessária para configurar a aplicação.
    -   Certifique-se de que o **pgAdmin** (ferramenta gráfica para gerenciar o PostgreSQL) e o **Command Line Tools** (ferramentas de linha de comando como `psql`) estejam selecionados para instalação.
-   **Verificação:** Abra o Prompt de Comando/PowerShell e execute:
    ```bash
    psql --version
    ```
    Você deve ver a versão do psql instalada.

### 5. Variáveis de Ambiente (Opcional, mas recomendado)

Para facilitar o acesso a algumas ferramentas, é útil ter certeza de que os caminhos estão configurados corretamente no PATH do sistema. Geralmente, os instaladores fazem isso automaticamente, mas você pode verificar:

-   Vá em `Configurações > Sistema > Sobre > Configurações avançadas do sistema > Variáveis de Ambiente`.
-   Na seção `Variáveis do sistema`, encontre a variável `Path` e verifique se os caminhos para Python, Node.js e PostgreSQL (bin) estão presentes.

Com todos esses pré-requisitos instalados, seu ambiente Windows estará pronto para configurar e executar a aplicação Validade Inteligente.



## 🐍 Passo a Passo para o Backend (Python/Flask)

Esta seção detalha como configurar e executar o backend da aplicação Validade Inteligente no seu ambiente Windows.

### 1. Clonar o Repositório

Abra o Git Bash (ou Prompt de Comando/PowerShell) e navegue até o diretório onde deseja armazenar o projeto. Em seguida, clone o repositório do GitHub:

```bash
cd C:/Users/SeuUsuario/Documents/Projetos # Exemplo de diretório
git clone https://github.com/kelebra96/validade-inteligente-complete.git
cd validade-inteligente-complete/validade-inteligente-backend
```

### 2. Criar e Ativar Ambiente Virtual Python

É uma boa prática isolar as dependências do projeto em um ambiente virtual.

```bash
# Criar ambiente virtual
python -m venv venv

# Ativar ambiente virtual
# No Windows CMD:
# .\venv\Scripts\activate
# No PowerShell:
# .\venv\Scripts\Activate.ps1
# No Git Bash:
# source venv/Scripts/activate
```

### 3. Instalar Dependências Python

Com o ambiente virtual ativado, instale todas as dependências listadas no arquivo `requirements.txt`.

```bash
pip install -r requirements.txt
```

### 4. Configurar o Banco de Dados PostgreSQL

Antes de iniciar o backend, você precisa ter uma instância do PostgreSQL rodando e um banco de dados criado.

#### 4.1 Criar Banco de Dados

Abra o `pgAdmin` (instalado com o PostgreSQL) ou use o `psql` via linha de comando para criar um novo banco de dados para a aplicação. Use as credenciais do usuário `postgres` que você definiu durante a instalação.

```sql
-- Conecte-se ao servidor PostgreSQL (ex: via psql)
-- psql -U postgres

CREATE DATABASE validade_inteligente;

-- Opcional: Criar um usuário específico para a aplicação (mais seguro)
-- CREATE USER validade_user WITH PASSWORD 'sua_senha_segura';
-- GRANT ALL PRIVILEGES ON DATABASE validade_inteligente TO validade_user;
```

#### 4.2 Instalar Extensão `pgvector`

Para a funcionalidade de vetorização da IA, você precisará instalar a extensão `pgvector` no seu banco de dados. Conecte-se ao banco de dados `validade_inteligente` e execute:

```sql
-- Conecte-se ao banco de dados validade_inteligente
-- psql -U postgres -d validade_inteligente

CREATE EXTENSION IF NOT EXISTS vector;
```

### 5. Configurar Variáveis de Ambiente para o Backend

O backend utiliza variáveis de ambiente para configurações. Crie um arquivo `.env` na raiz do diretório `validade-inteligente-backend` (onde está o `main.py`).

```bash
# Certifique-se de estar no diretório: validade-inteligente-complete/validade-inteligente-backend
copy .env.example .env
```

Edite o arquivo `.env` com suas próprias configurações. Use um editor de texto como Notepad, VS Code ou qualquer outro de sua preferência.

```env
# Exemplo de .env para Windows (ajuste conforme sua instalação do PostgreSQL)

# Banco de Dados (Substitua 'sua_senha_postgres' pela senha que você definiu)
DATABASE_URL=postgresql://postgres:sua_senha_postgres@localhost:5432/validade_inteligente
POSTGRES_DB=validade_inteligente
POSTGRES_USER=postgres
POSTGRES_PASSWORD=sua_senha_postgres

# APIs Externas (Substitua pelos seus valores reais)
OPENAI_API_KEY=sk-your-openai-key-here
OPENAI_API_BASE=https://api.openai.com/v1
MERCADOPAGO_ACCESS_TOKEN=your-mercadopago-token-here
MERCADOPAGO_PUBLIC_KEY=your-mercadopago-public-key-here

# Email (Configure com seu provedor SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_USE_TLS=true

# Segurança (Gere chaves seguras para produção!)
JWT_SECRET=your-super-secret-jwt-key-here-change-in-production
FLASK_SECRET_KEY=your-flask-secret-key-here-change-in-production

# Ambiente
FLASK_ENV=development
NODE_ENV=development
DEBUG=true

# Redis (Se você não for usar Redis, pode remover ou comentar estas linhas)
# REDIS_URL=redis://localhost:6379/0

# URLs da Aplicação (Ajuste se necessário)
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000
API_BASE_URL=http://localhost:5000/api

# Configurações de CORS (Adicione o domínio do seu frontend)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Outras configurações
TIMEZONE=America/Sao_Paulo
DEFAULT_LANGUAGE=pt-BR
```

### 6. Executar Migrações do Banco de Dados

Com o ambiente virtual ativado e as variáveis de ambiente configuradas, execute as migrações para criar as tabelas no seu banco de dados.

```bash
# Certifique-se de que o ambiente virtual está ativado
# No diretório validade-inteligente-backend
flask db upgrade
```

### 7. Iniciar o Backend

Finalmente, você pode iniciar o servidor Flask do backend.

```bash
# Certifique-se de que o ambiente virtual está ativado
# No diretório validade-inteligente-backend
python src/main.py
```

O backend estará rodando em `http://localhost:5000`. Você deve ver mensagens no terminal indicando que o servidor Flask foi iniciado. Deixe este terminal aberto e em execução.



## 🌐 Passo a Passo para o Frontend (Node.js/React)

Esta seção detalha como configurar e executar o frontend da aplicação Validade Inteligente no seu ambiente Windows.

### 1. Clonar o Repositório

Se você ainda não clonou o repositório, abra o Git Bash (ou Prompt de Comando/PowerShell) e navegue até o diretório onde deseja armazenar o projeto. Em seguida, clone o repositório do GitHub:

```bash
cd C:/Users/SeuUsuario/Documents/Projetos # Exemplo de diretório
git clone https://github.com/kelebra96/validade-inteligente-complete.git
cd validade-inteligente-complete/frontend
```

### 2. Instalar Dependências Node.js

Navegue até o diretório `frontend` e instale as dependências usando `pnpm`.

```bash
# Certifique-se de estar no diretório: validade-inteligente-complete/frontend
pnpm install
```

### 3. Configurar Variáveis de Ambiente para o Frontend

O frontend também pode utilizar variáveis de ambiente, especialmente para apontar para a API do backend. Crie um arquivo `.env` na raiz do diretório `frontend`.

```bash
# Certifique-se de estar no diretório: validade-inteligente-complete/frontend
copy .env.example .env
```

Edite o arquivo `.env` com suas próprias configurações. Use um editor de texto como Notepad, VS Code ou qualquer outro de sua preferência.

```env
# Exemplo de .env para o Frontend no Windows

# Ambiente
NODE_ENV=development

# URL da API do Backend
# Certifique-se de que esta URL corresponde ao endereço onde seu backend está rodando
REACT_APP_API_URL=http://localhost:5000/api
```

### 4. Iniciar o Frontend

Com as dependências instaladas e as variáveis de ambiente configuradas, você pode iniciar o servidor de desenvolvimento do React.

```bash
# Certifique-se de estar no diretório: validade-inteligente-complete/frontend
pnpm run dev
```

O frontend estará rodando em `http://localhost:3000` (ou outra porta se a 3000 estiver ocupada). Você deve ver o navegador abrir automaticamente a aplicação. Deixe este terminal aberto e em execução.



## ▶️ Passo a Passo para Executar a Aplicação Completa

Para que a aplicação Validade Inteligente funcione corretamente, tanto o backend quanto o frontend precisam estar em execução simultaneamente.

### 1. Iniciar o Backend

Abra um **primeiro terminal** (Git Bash, Prompt de Comando ou PowerShell), navegue até o diretório `validade-inteligente-complete/validade-inteligente-backend`, ative o ambiente virtual e inicie o backend:

```bash
cd C:/Users/SeuUsuario/Documents/Projetos/validade-inteligente-complete/validade-inteligente-backend

# Ativar ambiente virtual (escolha o comando correto para seu terminal)
# No Windows CMD:
# .\venv\Scripts\activate
# No PowerShell:
# .\venv\Scripts\Activate.ps1
# No Git Bash:
# source venv/Scripts/activate

# Iniciar o backend
python src/main.py
```

Deixe este terminal aberto e em execução. O backend estará disponível em `http://localhost:5000`.

### 2. Iniciar o Frontend

Abra um **segundo terminal** (Git Bash, Prompt de Comando ou PowerShell), navegue até o diretório `validade-inteligente-complete/frontend` e inicie o frontend:

```bash
cd C:/Users/SeuUsuario/Documents/Projetos/validade-inteligente-complete/frontend

pnpm run dev
```

Deixe este terminal aberto e em execução. O frontend estará disponível em `http://localhost:3000`.

### 3. Acessar a Aplicação

Com ambos os servidores (backend e frontend) em execução, abra seu navegador web e acesse:

*   **Frontend:** [http://localhost:3000](http://localhost:3000)
*   **Painel Administrativo:** [http://localhost:3000/admin](http://localhost:3000/admin)
*   **Interface Mobile:** [http://localhost:3000/mobile](http://localhost:3000/mobile)
*   **Sistema de Suporte:** [http://localhost:3000/support/tickets](http://localhost:3000/support/tickets)

## 🛑 Parando a Aplicação

Para parar a aplicação, basta fechar os dois terminais onde o backend e o frontend estão sendo executados. Alternativamente, você pode pressionar `Ctrl + C` em cada terminal para encerrar os processos.

## 🆘 Troubleshooting Comum

### 1. Backend não inicia ou dá erro de dependência

-   **Verifique o ambiente virtual:** Certifique-se de que o ambiente virtual está ativado antes de instalar as dependências e iniciar o backend.
-   **Dependências:** Verifique se todas as dependências foram instaladas corretamente (`pip install -r requirements.txt`).
-   **Variáveis de Ambiente:** Confirme se o arquivo `.env` está na raiz do diretório `validade-inteligente-backend` e se todas as variáveis (especialmente `DATABASE_URL`) estão configuradas corretamente.
-   **PostgreSQL:** Certifique-se de que o serviço PostgreSQL está em execução no seu Windows e que as credenciais no `.env` estão corretas.
-   **Migrações:** Verifique se as migrações do banco de dados foram executadas (`flask db upgrade`).

### 2. Frontend não inicia ou não encontra a API

-   **Dependências:** Verifique se todas as dependências foram instaladas corretamente (`pnpm install`).
-   **Variáveis de Ambiente:** Confirme se o arquivo `.env` está na raiz do diretório `frontend` e se `REACT_APP_API_URL` aponta para `http://localhost:5000/api`.
-   **Backend em execução:** O frontend precisa que o backend esteja rodando para se comunicar com a API. Certifique-se de que o backend foi iniciado com sucesso em `http://localhost:5000`.
-   **Porta ocupada:** Se a porta 3000 já estiver em uso, o `pnpm run dev` pode iniciar em outra porta (ex: 3001). Verifique a saída do terminal para a URL correta.

### 3. Erro de Conexão com o Banco de Dados

-   **Serviço PostgreSQL:** Verifique se o serviço PostgreSQL está ativo no seu Windows. Você pode verificar no Gerenciador de Tarefas ou nos Serviços do Windows.
-   **Credenciais:** Confirme o usuário e senha do PostgreSQL no seu arquivo `.env`.
-   **Extensão pgvector:** Certifique-se de que a extensão `pgvector` foi criada no seu banco de dados `validade_inteligente`.

### 4. Problemas de Permissão

-   Se você encontrar erros de permissão ao tentar criar arquivos ou diretórios, tente executar o terminal como administrador.

Este guia deve fornecer todas as informações necessárias para você rodar a aplicação Validade Inteligente no seu ambiente Windows sem Docker. Se você encontrar problemas específicos, consulte a documentação do projeto ou procure por soluções online para a mensagem de erro exata.

