# Validade Inteligente

Sistema inteligente de gestão de validade de produtos para estabelecimentos comerciais.

## 🚀 Funcionalidades

- **Gestão de Produtos**: Cadastro, edição e controle de estoque
- **Alertas Inteligentes**: Notificações automáticas de produtos próximos ao vencimento
- **Dashboard Analítico**: Visão geral do negócio com métricas importantes
- **Sistema de Notificações**: Alertas em tempo real via WebSocket
- **Multi-tenant**: Suporte a múltiplas empresas
- **API RESTful**: Backend robusto com autenticação JWT
- **Interface Moderna**: Frontend responsivo com React e Tailwind CSS

## 🏗️ Arquitetura


### Backend (Python/Flask)
```
backend/
├── src/
│   ├── config/          # Configurações do sistema
│   ├── middleware/      # Middleware de segurança
│   ├── models/          # Modelos de dados
│   ├── routes/          # Rotas da API
│   ├── services/        # Lógica de negócio
│   ├── utils/           # Utilitários e helpers
│   └── main.py          # Aplicação principal
├── tests/               # Testes unitários e integração
└── requirements.txt     # Dependências Python
```

### Frontend (React/Vite)
```
frontend/
├── src/
│   ├── components/      # Componentes reutilizáveis
│   ├── contexts/        # Contextos React
│   ├── lib/             # Utilitários
│   ├── pages/           # Páginas da aplicação
│   └── App.jsx          # Componente principal
├── public/              # Arquivos estáticos
└── package.json         # Dependências Node.js
```

## 🛠️ Tecnologias

### Backend
- **Flask**: Framework web Python
- **SQLAlchemy**: ORM para banco de dados
- **Flask-JWT-Extended**: Autenticação JWT
- **Flask-CORS**: Suporte a CORS
- **Flask-SocketIO**: WebSocket para notificações em tempo real
- **Marshmallow**: Serialização e validação
- **Redis**: Cache e sessões
- **PostgreSQL**: Banco de dados principal
- **Structlog**: Logging estruturado
- **Pytest**: Testes unitários

### Frontend
- **React 18**: Biblioteca de interface
- **Vite**: Build tool e dev server
- **React Router**: Roteamento
- **Tailwind CSS**: Framework CSS
- **Lucide React**: Ícones
- **Axios**: Cliente HTTP
- **Socket.IO**: WebSocket client
- **React Hook Form**: Formulários
- **React Query**: Gerenciamento de estado servidor

## 🚀 Instalação e Execução

### Pré-requisitos
- Python 3.11+
- Node.js 18+
- PostgreSQL 13+
- Redis 6+

### Backend

1. **Instalar dependências**:
```bash
cd backend
pip install -r requirements.txt
```

2. **Configurar variáveis de ambiente**:
```bash
cp .env.example .env
# Editar .env com suas configurações
```

3. **Executar migrações**:
```bash
flask db upgrade
```

4. **Iniciar servidor**:
```bash
python src/main.py
```

### Frontend

1. **Instalar dependências**:
```bash
cd frontend
npm install
```

2. **Iniciar servidor de desenvolvimento**:
```bash
npm run dev
```

### Docker (Recomendado)

1. **Construir e executar**:
```bash
docker-compose up --build
```

## 🧪 Testes

### Backend
```bash
cd backend
pytest tests/ -v --cov=src
```

### Frontend
```bash
cd frontend
npm test
npm run test:coverage
```

## 📊 Banco de Dados

O sistema utiliza um esquema multi-tenant com as seguintes entidades principais:

- **empresas**: Dados das empresas/tenants
- **usuarios**: Usuários do sistema
- **produtos**: Produtos cadastrados
- **sessoes**: Sessões de usuário
- **lojas**: Lojas/estabelecimentos
- **fornecedores**: Fornecedores de produtos

## 🔐 Segurança

- Autenticação JWT com refresh tokens
- Middleware de sanitização contra SQL Injection e XSS
- Rate limiting por IP e usuário
- Validação rigorosa de entrada
- Logging de segurança
- Headers de segurança configurados

## 📈 Monitoramento

- Logging estruturado com Structlog
- Métricas de performance
- Alertas automáticos
- Health checks
- Integração com Sentry (opcional)

## 🔧 Configuração

### Variáveis de Ambiente

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost/validade_inteligente

# JWT
JWT_SECRET_KEY=your-secret-key
JWT_ACCESS_TOKEN_EXPIRES=3600

# Redis
REDIS_URL=redis://localhost:6379

# Email (opcional)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-password

# Sentry (opcional)
SENTRY_DSN=your-sentry-dsn
```

## 📝 API Documentation

A documentação completa da API está disponível em `/docs` quando o servidor está rodando.

### Principais Endpoints

- `POST /auth/register` - Registro de usuário
- `POST /auth/login` - Login
- `GET /produtos` - Listar produtos
- `POST /produtos` - Criar produto
- `GET /notifications` - Listar notificações
- `POST /notifications/check-expiring` - Verificar produtos vencendo

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Equipe

- **Desenvolvimento**: Equipe Validade Inteligente
- **Design**: UI/UX Team
- **DevOps**: Infrastructure Team

## 📞 Suporte

Para suporte técnico, entre em contato:
- Email: suporte@validadeinteligente.com
- Documentação: [docs.validadeinteligente.com](https://docs.validadeinteligente.com)
- Issues: [GitHub Issues](https://github.com/seu-usuario/validade-inteligente/issues)

---

**Validade Inteligente** - Gestão inteligente de produtos e validades 🛒✨

## Estrutura do Projeto

```
validade-inteligente/
├── docs/                          # Documentação completa
│   ├── api-specification.md       # Especificação da API
│   ├── architecture.md            # Arquitetura do sistema
│   ├── database-schema.md         # Esquema do banco de dados
│   ├── deployment-guide.md        # Guia de deployment
│   └── user-manual.md             # Manual do usuário
├── backend/                       # API Backend (Python/Flask)
│   ├── app/
│   │   ├── __init__.py
│   │   ├── models/                # Modelos de dados
│   │   ├── routes/                # Rotas da API
│   │   ├── services/              # Lógica de negócio
│   │   └── utils/                 # Utilitários
│   ├── migrations/                # Migrações do banco
│   ├── tests/                     # Testes unitários
│   ├── requirements.txt           # Dependências Python
│   ├── config.py                  # Configurações
│   └── run.py                     # Ponto de entrada
├── frontend/                      # Interface React
│   ├── src/
│   │   ├── components/            # Componentes React
│   │   ├── pages/                 # Páginas da aplicação
│   │   ├── services/              # Serviços de API
│   │   ├── hooks/                 # Custom hooks
│   │   └── utils/                 # Utilitários
│   ├── public/                    # Arquivos públicos
│   └── package.json               # Dependências Node.js
└── docker-compose.yml             # Orquestração de containers
```

## Tecnologias Utilizadas

### Backend
- **Python 3.11+** - Linguagem principal
- **Flask** - Framework web
- **SQLAlchemy** - ORM para banco de dados
- **PostgreSQL** - Banco de dados relacional
- **Redis** - Cache e sessões
- **Celery** - Processamento assíncrono
- **JWT** - Autenticação
- **Scikit-learn** - Machine Learning para IA preditiva

### Frontend
- **React 18** - Biblioteca de interface
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Framework de CSS
- **Shadcn/UI** - Componentes de interface
- **React Query** - Gerenciamento de estado servidor
- **React Hook Form** - Formulários
- **Recharts** - Gráficos e visualizações

### Infraestrutura
- **Docker** - Containerização
- **Nginx** - Proxy reverso
- **AWS/GCP** - Cloud hosting
- **GitHub Actions** - CI/CD

## Funcionalidades Principais

### 1. Gestão de Produtos
- Cadastro manual e por código de barras
- Controle de lotes e datas de validade
- Categorização automática
- Importação em massa via CSV/Excel

### 2. Alertas Inteligentes
- Notificações personalizáveis por e-mail e push
- Diferentes níveis de urgência (30, 15, 7, 3 dias)
- Integração com WhatsApp Business API
- Dashboard em tempo real

### 3. Inteligência Artificial
- Predição de vendas baseada em histórico
- Sugestões automáticas de promoções
- Otimização de preços dinâmica
- Análise de padrões de consumo

### 4. Gamificação
- Sistema de pontuação por redução de desperdício
- Medalhas e conquistas
- Ranking entre estabelecimentos
- Metas personalizadas

### 5. Relatórios e Analytics
- Dashboard executivo
- Relatórios de perdas e economia
- Análise de ROI
- Exportação para PDF/Excel

## Modelo de Negócio

### Plano Básico (Gratuito)
- Até 100 produtos
- Alertas básicos
- Relatórios simples
- Suporte por email

### Plano Pro (R$ 97/mês)
- Produtos ilimitados
- IA preditiva completa
- Gamificação
- Relatórios avançados
- Integração com PDV
- Suporte prioritário

### Plano Enterprise (Sob consulta)
- Multi-lojas
- API personalizada
- Consultoria especializada
- SLA garantido

## Quick Start

### Pré-requisitos
- Docker e Docker Compose
- Node.js 18+
- Python 3.11+
- PostgreSQL 14+

### Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/validade-inteligente.git
cd validade-inteligente
```

2. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

3. **Inicie os serviços**
```bash
docker-compose up -d
```

4. **Execute as migrações**
```bash
docker-compose exec backend flask db upgrade
```

5. **Acesse a aplicação**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Documentação API: http://localhost:5000/docs

## Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

## Contato

- **Website**: https://ansugkah.manus.space
- **Email**: contato@validadeinteligente.com
- **LinkedIn**: [Validade Inteligente](https://linkedin.com/company/validade-inteligente)

## Roadmap

### Q1 2025
- [ ] MVP com funcionalidades básicas
- [ ] Integração com principais PDVs
- [ ] App mobile (iOS/Android)

### Q2 2025
- [ ] IA preditiva avançada
- [ ] Integração com fornecedores
- [ ] Sistema de doações automatizado

### Q3 2025
- [ ] Expansão para outros segmentos
- [ ] API pública
- [ ] Marketplace de integrações

### Q4 2025
- [ ] Internacionalização
- [ ] Blockchain para rastreabilidade
- [ ] IoT para monitoramento automático

