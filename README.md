# Auto Trader AI - Sistema de Gestão Inteligente de Estoque

## Descrição

O **Gestão de validade** é um sistema completo de gestão de estoque com funcionalidades de inteligência artificial para previsão de demanda, controle de validade de produtos e automação de processos comerciais. O sistema oferece uma interface web moderna e responsiva, além de funcionalidades móveis para gestão em tempo real.

## Funcionalidades Principais

- **Gestão de Produtos**: Cadastro, edição e controle completo de produtos
- **Controle de Fornecedores**: Gerenciamento de fornecedores e relacionamentos comerciais
- **Gestão de Empresas**: Controle multi-empresa com isolamento de dados
- **Alertas Inteligentes**: Sistema de notificações automáticas para produtos próximos ao vencimento
- **Relatórios Avançados**: Dashboards e relatórios detalhados com visualizações gráficas
- **Sistema de Permissões**: Controle granular de acesso baseado em roles e permissões
- **Interface Mobile**: Aplicação responsiva com funcionalidades específicas para dispositivos móveis
- **Scanner de Códigos**: Integração com câmera para leitura de códigos de barras

## Arquitetura

### Backend (Node.js)
- **Framework**: Express.js
- **Banco de Dados**: PostgreSQL (recomendado) / MySQL / SQLite
- **ORM**: Sequelize
- **Autenticação**: JWT (JSON Web Tokens)
- **Segurança**: Helmet, CORS, Rate Limiting
- **Logs**: Winston
- **Cache**: Redis (opcional)

### Frontend (React)
- **Framework**: React 18 com Vite
- **Roteamento**: React Router DOM
- **Estilização**: Tailwind CSS
- **Gráficos**: Recharts
- **Formulários**: React Hook Form
- **Estado**: Context API
- **Testes**: Vitest

## Pré-requisitos

- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0
- **PostgreSQL**: >= 13.0 (recomendado)
- **Redis**: >= 6.0 (opcional, para cache)

## Instalação e Configuração

### 1. Clone o repositório
```bash
git clone https://github.com/kelebra96/auto-trader-ai.git
cd auto-trader-ai
```

### 2. Configuração do Backend

```bash
cd backend-nodejs
npm install
```

#### Configuração do Banco de Dados
1. Copie o arquivo de configuração:
```bash
cp .env.example .env
```

2. Configure as variáveis de ambiente no arquivo `.env`:
```env
# Configurações do Servidor
NODE_ENV=development
PORT=3001

# Configurações do Banco de Dados PostgreSQL
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=auto_trader_ai

# Configurações JWT
JWT_SECRET=seu_jwt_secret_super_seguro_aqui
JWT_EXPIRES_IN=7d

# Configurações OpenAI (para funcionalidades de IA)
OPENAI_API_KEY=sua_chave_openai_aqui
```

#### Configuração do PostgreSQL
1. Instale o PostgreSQL:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

2. Configure o usuário e banco:
```bash
sudo -u postgres psql
CREATE DATABASE auto_trader_ai;
CREATE USER seu_usuario WITH PASSWORD 'sua_senha';
GRANT ALL PRIVILEGES ON DATABASE auto_trader_ai TO seu_usuario;
\q
```

3. Execute as migrações:
```bash
npm run migrate
```

### 3. Configuração do Frontend

```bash
cd ../frontend
npm install
```

### 4. Inicialização dos Serviços

#### Backend
```bash
cd backend-nodejs
npm run dev
```

#### Frontend
```bash
cd frontend
npm run dev
```

O sistema estará disponível em:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## Estrutura do Projeto

```
auto-trader-ai/
├── backend-nodejs/          # API Backend em Node.js
│   ├── src/
│   │   ├── config/         # Configurações do banco e aplicação
│   │   ├── middleware/     # Middlewares de autenticação, logs, etc.
│   │   ├── models/         # Modelos do Sequelize
│   │   ├── routes/         # Rotas da API
│   │   ├── migrations/     # Migrações do banco de dados
│   │   └── app.js          # Configuração principal da aplicação
│   ├── server.js           # Ponto de entrada do servidor
│   └── package.json
├── frontend/               # Interface React
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── pages/          # Páginas da aplicação
│   │   ├── contexts/       # Contextos React
│   │   ├── hooks/          # Hooks customizados
│   │   └── App.jsx         # Componente principal
│   └── package.json
└── README.md
```

## API Endpoints

### Autenticação
- `POST /api/auth/login` - Login de usuário
- `POST /api/auth/register` - Registro de usuário
- `POST /api/auth/refresh` - Renovar token
- `POST /api/auth/logout` - Logout

### Produtos
- `GET /api/produtos` - Listar produtos
- `POST /api/produtos` - Criar produto
- `PUT /api/produtos/:id` - Atualizar produto
- `DELETE /api/produtos/:id` - Deletar produto

### Fornecedores
- `GET /api/fornecedores` - Listar fornecedores
- `POST /api/fornecedores` - Criar fornecedor
- `PUT /api/fornecedores/:id` - Atualizar fornecedor
- `DELETE /api/fornecedores/:id` - Deletar fornecedor

### Empresas
- `GET /api/empresas` - Listar empresas
- `POST /api/empresas` - Criar empresa
- `PUT /api/empresas/:id` - Atualizar empresa
- `DELETE /api/empresas/:id` - Deletar empresa

### Alertas
- `GET /api/alertas` - Listar alertas
- `POST /api/alertas` - Criar alerta
- `PUT /api/alertas/:id` - Atualizar alerta
- `DELETE /api/alertas/:id` - Deletar alerta

## Funcionalidades de IA

O sistema integra com a API da OpenAI para fornecer:

- **Previsão de Demanda**: Análise preditiva baseada em histórico de vendas
- **Otimização de Estoque**: Sugestões inteligentes para reposição
- **Análise de Tendências**: Identificação de padrões de consumo
- **Alertas Preditivos**: Notificações antecipadas sobre necessidades de reposição

## Segurança

- **Autenticação JWT**: Tokens seguros com expiração configurável
- **Controle de Permissões**: Sistema granular baseado em roles
- **Rate Limiting**: Proteção contra ataques de força bruta
- **Validação de Dados**: Validação rigorosa com Joi
- **Sanitização**: Proteção contra XSS e injeção SQL
- **HTTPS**: Comunicação criptografada (produção)

## Testes

### Backend
```bash
cd backend-nodejs
npm test
```

### Frontend
```bash
cd frontend
npm test
```

## Deploy

1. Configure as variáveis de ambiente para produção
2. Build do frontend:
```bash
cd frontend
npm run build
```

3. Inicie o backend em modo produção:
```bash
cd backend-nodejs
NODE_ENV=production npm start
```

## Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## Suporte

Para suporte técnico ou dúvidas sobre o sistema, entre em contato através dos issues do GitHub ou envie um email para: suporte@autotraderai.com

## Changelog

### v1.0.0
- Lançamento inicial do sistema
- Funcionalidades básicas de gestão de estoque
- Interface web responsiva
- Sistema de autenticação e permissões
- Integração com APIs de IA
