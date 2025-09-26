# Guia de Deployment: Validade Inteligente no WSL2

Este guia detalha o processo de como configurar e executar a aplicação Validade Inteligente em um ambiente WSL2 (Windows Subsystem for Linux 2). Ele cobrirá a instalação de pré-requisitos, clonagem do repositório, configuração de variáveis de ambiente e execução da aplicação usando Docker Compose.

## 🚀 Pré-requisitos

Certifique-se de que seu sistema atende aos seguintes requisitos antes de iniciar:

1.  **Windows 10 (versão 2004 ou superior) ou Windows 11:** O WSL2 requer estas versões do Windows.
2.  **WSL2 Instalado e Configurado:** Se você ainda não tem o WSL2 instalado, siga as instruções oficiais da Microsoft.
    *   Abra o PowerShell como Administrador e execute:
        ```powershell
        wsl --install
        ```
    *   Se o WSL já estiver instalado, certifique-se de que está usando a versão 2:
        ```powershell
        wsl --set-default-version 2
        ```
    *   Instale uma distribuição Linux (ex: Ubuntu) se ainda não tiver uma:
        ```powershell
        wsl --install -d Ubuntu
        ```
3.  **Docker Desktop para Windows:** O Docker Desktop integra-se perfeitamente com o WSL2, permitindo que você execute contêineres Linux diretamente do Windows.
    *   Baixe e instale o Docker Desktop em [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop).
    *   Durante a instalação, certifique-se de habilitar a opção "Use WSL 2 based engine".
    *   Após a instalação, abra o Docker Desktop e vá em `Settings > Resources > WSL Integration`. Certifique-se de que sua distribuição Linux (ex: Ubuntu) está habilitada.
4.  **Git:** Para clonar o repositório do projeto.
    *   Dentro do seu terminal WSL (Ubuntu), instale o Git:
        ```bash
        sudo apt update
        sudo apt install git -y
        ```
5.  **Node.js e pnpm (opcional, mas recomendado para o frontend):** Embora o Docker Compose gerencie as dependências, ter o Node.js e pnpm instalados no WSL pode ser útil para desenvolvimento frontend fora dos contêineres.
    *   Instale o Node.js (versão 16 ou superior é recomendada):
        ```bash
        curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
        sudo apt-get install -y nodejs
        ```
    *   Instale o pnpm:
        ```bash
        npm install -g pnpm
        ```

## 🛠️ Passo a Passo para Deployment

Siga estes passos para configurar e executar a aplicação Validade Inteligente no seu ambiente WSL2:

### 1. Abra o Terminal WSL

Abra o menu Iniciar do Windows e procure por sua distribuição Linux (ex: Ubuntu). Clique para abrir o terminal.

### 2. Clone o Repositório do Projeto

Navegue até o diretório onde deseja armazenar o projeto e clone o repositório do GitHub:

```bash
cd ~
# Ou para um diretório específico, por exemplo, dentro do seu disco C:
# cd /mnt/c/Users/SeuUsuario/Documents/Projetos

git clone https://github.com/kelebra96/validade-inteligente-complete.git
cd validade-inteligente-complete
```

### 3. Configure as Variáveis de Ambiente

A aplicação utiliza variáveis de ambiente para configurações sensíveis (chaves de API, credenciais de banco de dados, etc.). Um arquivo de exemplo (`.env.example`) é fornecido.

```bash
cp .env.example .env
```

Agora, edite o arquivo `.env` com suas próprias configurações. Você pode usar um editor de texto como `nano` ou `code` (se tiver o VS Code instalado e integrado com WSL):

```bash
nano .env
# ou
code .env
```

**Exemplo de configurações importantes no `.env`:**

```env
# Banco de Dados
DATABASE_URL=postgresql://postgres:password@db:5432/validade_inteligente
POSTGRES_DB=validade_inteligente
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password

# APIs Externas (Substitua pelos seus valores reais)
OPENAI_API_KEY=sk-your-openai-key-here
OPENAI_API_BASE=https://api.openai.com/v1
MERCADOPAGO_ACCESS_TOKEN=your-mercadopago-token-here
MERCADOPAGO_PUBLIC_KEY=your-mercadopago-public-key-here

# Email (Substitua pelos seus valores reais)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_USE_TLS=true

# Segurança (Mude estas chaves em produção!)
JWT_SECRET=your-super-secret-jwt-key-here-change-in-production
FLASK_SECRET_KEY=your-flask-secret-key-here-change-in-production

# Ambiente
FLASK_ENV=development
NODE_ENV=development
DEBUG=true

# Redis (Cache)
REDIS_URL=redis://redis:6379/0

# URLs da Aplicação (Ajuste se necessário)
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000
API_BASE_URL=http://localhost:5000/api

# Configurações de CORS (Adicione o domínio do seu frontend em produção)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 4. Inicie a Aplicação com Docker Compose

Certifique-se de que o Docker Desktop está em execução no Windows. Em seguida, no seu terminal WSL, execute o Docker Compose para construir as imagens e iniciar todos os serviços:

```bash
docker-compose up --build
```

Este comando irá:

*   Construir as imagens Docker para o backend (Flask) e frontend (React).
*   Criar e iniciar os contêineres para o banco de dados PostgreSQL, Redis, backend e frontend.
*   Mapear as portas necessárias para que você possa acessar a aplicação do seu navegador Windows.

Se você quiser executar os serviços em segundo plano (detached mode), use:

```bash
docker-compose up -d --build
```

### 5. Execute as Migrações do Banco de Dados

Após os contêineres estarem em execução, você precisará aplicar as migrações do banco de dados para criar as tabelas necessárias. Aguarde alguns segundos para que o contêiner do banco de dados inicialize completamente antes de executar este comando:

```bash
docker-compose exec validade-inteligente-backend python -m flask db upgrade
```

### 6. Crie um Usuário Administrador Inicial (Opcional)

Se você precisar de um usuário administrador para acessar o painel, pode ser necessário executar um script de criação de usuário. Verifique a documentação do projeto (`README.md` ou `docs/deployment-guide-updated.md`) para instruções específicas sobre como criar o primeiro usuário administrador.

Um exemplo genérico seria:

```bash
docker-compose exec validade-inteligente-backend python scripts/create_admin.py
```

### 7. Acesse a Aplicação

Com todos os serviços em execução, você pode acessar a aplicação a partir do seu navegador Windows:

*   **Frontend:** [http://localhost:3000](http://localhost:3000)
*   **Backend API:** [http://localhost:5000](http://localhost:5000)
*   **Painel Administrativo:** [http://localhost:3000/admin](http://localhost:3000/admin)
*   **Interface Mobile:** [http://localhost:3000/mobile](http://localhost:3000/mobile)
*   **Sistema de Suporte:** [http://localhost:3000/support/tickets](http://localhost:3000/support/tickets)

## 🛑 Parando a Aplicação

Para parar todos os serviços e remover os contêineres (mas manter os volumes de dados), execute:

```bash
docker-compose down
```

Para parar e remover os contêineres e também os volumes de dados (cuidado, isso apagará os dados do banco de dados!):

```bash
docker-compose down --volumes
```

## Troubleshooting Comum

*   **"Address already in use"**: Certifique-se de que nenhuma outra aplicação está usando as portas 3000 ou 5000 no seu sistema.
*   **Contêineres não iniciam**: Verifique os logs dos contêineres para identificar o problema:
    ```bash
    docker-compose logs <nome_do_servico>
    # Ex: docker-compose logs backend
    ```
*   **Problemas de conexão com o Docker no WSL**: Reinicie o Docker Desktop e verifique as configurações de integração WSL.

Este guia deve ajudá-lo a colocar a aplicação Validade Inteligente em funcionamento no seu ambiente WSL2. Se encontrar problemas, consulte a documentação completa do projeto (`README.md` e `docs/deployment-guide-updated.md`) ou procure ajuda na comunidade.

