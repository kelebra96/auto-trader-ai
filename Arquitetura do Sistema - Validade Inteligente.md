# Arquitetura do Sistema - Validade Inteligente

## Visão Geral da Arquitetura

O Validade Inteligente foi projetado seguindo uma arquitetura de microsserviços moderna, com separação clara entre frontend e backend, garantindo escalabilidade, manutenibilidade e performance. A arquitetura adota princípios de Clean Architecture e Domain-Driven Design (DDD) para organizar o código de forma modular e testável.

### Princípios Arquiteturais

A arquitetura do sistema foi construída sobre os seguintes princípios fundamentais:

**Separação de Responsabilidades**: Cada componente do sistema tem uma responsabilidade bem definida, facilitando a manutenção e evolução do código. O frontend é responsável pela interface do usuário e experiência, enquanto o backend gerencia a lógica de negócio, persistência de dados e integrações externas.

**Escalabilidade Horizontal**: O sistema foi projetado para suportar crescimento através da adição de mais instâncias de serviços, utilizando containers Docker e orquestração com Kubernetes quando necessário. Cada componente pode ser escalado independentemente baseado na demanda.

**Tolerância a Falhas**: Implementação de circuit breakers, retry patterns e graceful degradation para garantir que falhas em componentes individuais não afetem todo o sistema. O sistema mantém funcionalidade básica mesmo quando serviços auxiliares estão indisponíveis.

**Segurança por Design**: Autenticação e autorização implementadas em todas as camadas, com tokens JWT, criptografia de dados sensíveis e validação rigorosa de entrada. Princípio de menor privilégio aplicado em todos os acessos.

## Arquitetura de Alto Nível

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   Load Balancer │
│   (React SPA)   │◄──►│   (Nginx)       │◄──►│   (Nginx/HAProxy)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Backend Services                         │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   Auth Service  │  Product Service│    Analytics Service        │
│   (Flask)       │   (Flask)       │    (Flask + ML)             │
└─────────────────┴─────────────────┴─────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Data Layer                                 │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   PostgreSQL    │     Redis       │      File Storage           │
│   (Primary DB)  │   (Cache/Queue) │      (AWS S3/Local)         │
└─────────────────┴─────────────────┴─────────────────────────────┘
```

### Componentes Principais

**Frontend (React SPA)**
- Interface de usuário responsiva construída com React 18
- Gerenciamento de estado com Context API e React Query
- Componentes reutilizáveis com Shadcn/UI
- Autenticação baseada em JWT com refresh tokens
- Progressive Web App (PWA) para funcionalidade offline

**API Gateway (Nginx)**
- Roteamento de requisições para serviços backend
- Rate limiting e throttling
- SSL termination
- Compressão de resposta
- Logs centralizados

**Backend Services (Flask)**
- Serviços RESTful construídos com Flask
- Autenticação JWT com refresh tokens
- Validação de dados com Marshmallow
- ORM com SQLAlchemy
- Processamento assíncrono com Celery

**Banco de Dados (PostgreSQL)**
- Banco principal para dados transacionais
- Índices otimizados para consultas frequentes
- Backup automático e replicação
- Particionamento de tabelas grandes

**Cache e Filas (Redis)**
- Cache de sessões e dados frequentemente acessados
- Filas para processamento assíncrono
- Pub/Sub para comunicação entre serviços
- Rate limiting distribuído

## Arquitetura do Backend

### Estrutura de Camadas

O backend segue uma arquitetura em camadas bem definida:

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Routes    │  │ Controllers │  │   Middleware        │  │
│  │ (Blueprints)│  │             │  │ (Auth, CORS, etc.)  │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Business Layer                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Services   │  │   Validators│  │    AI/ML Engine     │  │
│  │             │  │             │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Data Access Layer                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Models    │  │ Repositories│  │    Database         │  │
│  │ (SQLAlchemy)│  │             │  │   (PostgreSQL)      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Presentation Layer (Camada de Apresentação)**
Esta camada é responsável por receber e processar requisições HTTP, formatando as respostas adequadamente. Inclui:

- **Routes (Blueprints)**: Definição de endpoints da API organizados por domínio (auth, produtos, relatórios)
- **Controllers**: Lógica de controle que orquestra chamadas para serviços de negócio
- **Middleware**: Componentes transversais como autenticação, CORS, logging e rate limiting

**Business Layer (Camada de Negócio)**
Contém toda a lógica de negócio da aplicação, independente de frameworks ou tecnologias específicas:

- **Services**: Implementação das regras de negócio e casos de uso
- **Validators**: Validação de dados de entrada e regras de negócio
- **AI/ML Engine**: Algoritmos de inteligência artificial para sugestões e predições

**Data Access Layer (Camada de Acesso a Dados)**
Responsável pela persistência e recuperação de dados:

- **Models**: Definição das entidades de domínio usando SQLAlchemy
- **Repositories**: Padrão Repository para abstração do acesso a dados
- **Database**: Configuração e conexão com PostgreSQL

### Padrões de Design Implementados

**Repository Pattern**
Abstrai o acesso a dados, permitindo mudanças no banco sem afetar a lógica de negócio:

```python
class ProdutoRepository:
    def __init__(self, db_session):
        self.db = db_session
    
    def find_by_id(self, produto_id):
        return self.db.query(Produto).filter_by(id=produto_id).first()
    
    def find_expiring_soon(self, user_id, days=7):
        cutoff_date = date.today() + timedelta(days=days)
        return self.db.query(Produto).filter(
            Produto.user_id == user_id,
            Produto.data_validade <= cutoff_date
        ).all()
```

**Service Layer Pattern**
Encapsula a lógica de negócio em serviços especializados:

```python
class ProdutoService:
    def __init__(self, produto_repo, alerta_service):
        self.produto_repo = produto_repo
        self.alerta_service = alerta_service
    
    def criar_produto(self, user_id, produto_data):
        produto = Produto(**produto_data, user_id=user_id)
        produto.atualizar_status()
        
        self.produto_repo.save(produto)
        
        if produto.status == 'proximo_vencimento':
            self.alerta_service.criar_alerta_vencimento(produto)
        
        return produto
```

**Factory Pattern**
Para criação de objetos complexos como alertas e relatórios:

```python
class AlertaFactory:
    @staticmethod
    def criar_alerta_vencimento(produto):
        dias = produto.dias_para_vencer
        urgencia = 'alta' if dias <= 3 else 'media' if dias <= 7 else 'baixa'
        
        return Alerta(
            produto_id=produto.id,
            tipo='vencimento',
            urgencia=urgencia,
            titulo=f'Produto vence em {dias} dias',
            valor_estimado_perda=produto.quantidade * produto.preco_venda
        )
```

## Arquitetura do Frontend

### Estrutura de Componentes

O frontend React segue uma arquitetura baseada em componentes funcionais com hooks:

```
src/
├── components/           # Componentes reutilizáveis
│   ├── ui/              # Componentes de interface básicos
│   ├── forms/           # Componentes de formulário
│   ├── charts/          # Componentes de gráficos
│   └── layout/          # Componentes de layout
├── pages/               # Páginas da aplicação
├── hooks/               # Custom hooks
├── services/            # Serviços de API
├── utils/               # Utilitários
├── contexts/            # Context providers
└── types/               # Definições TypeScript
```

**Gerenciamento de Estado**
Utiliza uma combinação de estratégias para diferentes tipos de estado:

- **Estado Local**: React useState e useReducer para estado de componentes
- **Estado Global**: Context API para dados compartilhados (usuário autenticado, configurações)
- **Estado do Servidor**: React Query para cache e sincronização de dados da API
- **Estado de Formulários**: React Hook Form para validação e submissão

**Padrões de Componentes**

**Container/Presentational Pattern**
Separação entre componentes que gerenciam estado (containers) e componentes que apenas renderizam (presentational):

```jsx
// Container Component
function ProdutoListContainer() {
  const { data: produtos, loading, error } = useQuery('produtos', fetchProdutos);
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return <ProdutoList produtos={produtos} onEdit={handleEdit} onDelete={handleDelete} />;
}

// Presentational Component
function ProdutoList({ produtos, onEdit, onDelete }) {
  return (
    <div className="grid gap-4">
      {produtos.map(produto => (
        <ProdutoCard 
          key={produto.id} 
          produto={produto} 
          onEdit={onEdit} 
          onDelete={onDelete} 
        />
      ))}
    </div>
  );
}
```

**Custom Hooks Pattern**
Encapsulamento de lógica reutilizável:

```jsx
function useProdutos() {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const fetchProdutos = useCallback(async (filters) => {
    setLoading(true);
    try {
      const data = await apiService.getProdutos(filters);
      setProdutos(data.produtos);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  return { produtos, loading, fetchProdutos };
}
```

## Modelo de Dados

### Esquema do Banco de Dados

O banco de dados foi modelado seguindo princípios de normalização e otimização para consultas frequentes:

```sql
-- Tabela de usuários
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nome_estabelecimento VARCHAR(200) NOT NULL,
    cnpj VARCHAR(20) UNIQUE,
    telefone VARCHAR(20),
    endereco JSONB,
    plano VARCHAR(20) DEFAULT 'basico',
    status VARCHAR(20) DEFAULT 'ativo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Tabela de produtos
CREATE TABLE produtos (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    nome VARCHAR(200) NOT NULL,
    codigo_barras VARCHAR(50) UNIQUE,
    categoria VARCHAR(100) NOT NULL,
    data_validade DATE NOT NULL,
    lote VARCHAR(100),
    quantidade INTEGER NOT NULL DEFAULT 0,
    preco_custo DECIMAL(10,2),
    preco_venda DECIMAL(10,2) NOT NULL,
    fornecedor VARCHAR(200),
    status VARCHAR(50) DEFAULT 'normal',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para otimização
CREATE INDEX idx_produtos_user_id ON produtos(user_id);
CREATE INDEX idx_produtos_data_validade ON produtos(data_validade);
CREATE INDEX idx_produtos_status ON produtos(status);
CREATE INDEX idx_produtos_categoria ON produtos(categoria);
```

### Relacionamentos

O modelo de dados implementa relacionamentos bem definidos:

**User 1:N Produtos**
- Um usuário pode ter muitos produtos
- Produtos são sempre associados a um usuário
- Deleção em cascata para manter integridade

**Produto 1:N Alertas**
- Um produto pode gerar múltiplos alertas
- Alertas são automaticamente criados baseado em regras de negócio
- Histórico de alertas mantido para análise

**Produto 1:N HistoricoVendas**
- Registro de todas as vendas de um produto
- Usado para análises de IA e relatórios
- Dados agregados para performance

### Estratégias de Performance

**Indexação Inteligente**
Índices criados baseado em padrões de consulta identificados:

```sql
-- Consultas por data de validade (muito frequente)
CREATE INDEX idx_produtos_validade_user ON produtos(user_id, data_validade);

-- Consultas por status e usuário
CREATE INDEX idx_produtos_status_user ON produtos(user_id, status);

-- Busca por código de barras
CREATE INDEX idx_produtos_codigo_barras ON produtos(codigo_barras) WHERE codigo_barras IS NOT NULL;
```

**Particionamento de Tabelas**
Para tabelas com grande volume de dados:

```sql
-- Particionamento da tabela de histórico de vendas por data
CREATE TABLE historico_vendas (
    id SERIAL,
    produto_id INTEGER,
    data_venda DATE,
    quantidade_vendida INTEGER,
    preco_unitario DECIMAL(10,2),
    receita_total DECIMAL(10,2)
) PARTITION BY RANGE (data_venda);

-- Partições mensais
CREATE TABLE historico_vendas_2025_01 PARTITION OF historico_vendas
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

**Cache Estratégico**
Implementação de cache em múltiplas camadas:

- **Application Cache**: Cache de consultas frequentes no Redis
- **Query Cache**: Cache de resultados de consultas complexas
- **CDN Cache**: Cache de assets estáticos e respostas de API

## Segurança

### Autenticação e Autorização

**JWT (JSON Web Tokens)**
Sistema de autenticação stateless com tokens JWT:

```python
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

# Geração de token
access_token = create_access_token(
    identity=user.id,
    expires_delta=timedelta(days=30),
    additional_claims={'plano': user.plano}
)

# Verificação de token
@jwt_required()
def protected_route():
    user_id = get_jwt_identity()
    # Lógica da rota protegida
```

**Refresh Tokens**
Implementação de refresh tokens para renovação segura:

```python
@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    current_user = get_jwt_identity()
    new_token = create_access_token(identity=current_user)
    return jsonify({'access_token': new_token})
```

### Proteção de Dados

**Criptografia de Senhas**
Uso do Werkzeug para hash seguro de senhas:

```python
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model):
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
```

**Validação de Entrada**
Validação rigorosa de todos os dados de entrada:

```python
from marshmallow import Schema, fields, validate

class ProdutoSchema(Schema):
    nome = fields.Str(required=True, validate=validate.Length(min=1, max=200))
    categoria = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    data_validade = fields.Date(required=True)
    quantidade = fields.Int(required=True, validate=validate.Range(min=0))
    preco_venda = fields.Decimal(required=True, validate=validate.Range(min=0))
```

**Proteção CSRF**
Implementação de proteção contra Cross-Site Request Forgery:

```python
from flask_wtf.csrf import CSRFProtect

csrf = CSRFProtect(app)

# Token CSRF em formulários
@app.route('/form')
def form():
    return render_template('form.html', csrf_token=generate_csrf())
```

### Rate Limiting

Implementação de rate limiting para prevenir abuso:

```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app,
    key_func=get_remote_address,
    default_limits=["1000 per hour"]
)

@auth_bp.route('/login', methods=['POST'])
@limiter.limit("5 per minute")
def login():
    # Lógica de login
```

## Integração e APIs

### Design da API REST

A API segue princípios RESTful com endpoints bem definidos:

```
GET    /api/produtos              # Lista produtos
POST   /api/produtos              # Cria produto
GET    /api/produtos/{id}         # Obtém produto específico
PUT    /api/produtos/{id}         # Atualiza produto
DELETE /api/produtos/{id}         # Remove produto

GET    /api/produtos/vencendo     # Produtos próximos ao vencimento
POST   /api/produtos/{id}/venda   # Registra venda
```

**Versionamento de API**
Implementação de versionamento para evolução da API:

```python
# v1 da API
app.register_blueprint(produtos_v1_bp, url_prefix='/api/v1')

# v2 da API (futura)
app.register_blueprint(produtos_v2_bp, url_prefix='/api/v2')
```

**Documentação Automática**
Geração automática de documentação com Flask-RESTX:

```python
from flask_restx import Api, Resource, fields

api = Api(app, doc='/docs/')

produto_model = api.model('Produto', {
    'nome': fields.String(required=True, description='Nome do produto'),
    'categoria': fields.String(required=True, description='Categoria'),
    'data_validade': fields.Date(required=True, description='Data de validade')
})

@api.route('/produtos')
class ProdutoList(Resource):
    @api.marshal_list_with(produto_model)
    def get(self):
        """Lista todos os produtos"""
        return produtos
```

### Integrações Externas

**APIs de Código de Barras**
Integração com serviços de consulta de produtos por código de barras:

```python
import requests

class CodigoBarrasService:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "https://api.cosmos.bluesoft.com.br"
    
    def buscar_produto(self, codigo_barras):
        headers = {'X-Cosmos-Token': self.api_key}
        response = requests.get(
            f"{self.base_url}/gtins/{codigo_barras}",
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            return {
                'nome': data.get('description'),
                'categoria': data.get('category'),
                'marca': data.get('brand')
            }
        return None
```

**Webhooks**
Sistema de webhooks para notificações em tempo real:

```python
@app.route('/webhook/produto-vencimento', methods=['POST'])
def webhook_produto_vencimento():
    data = request.get_json()
    
    # Processar evento de vencimento
    produto_id = data.get('produto_id')
    dias_vencimento = data.get('dias_vencimento')
    
    # Enviar notificação
    notification_service.send_expiry_notification(produto_id, dias_vencimento)
    
    return jsonify({'status': 'processed'}), 200
```

## Monitoramento e Observabilidade

### Logging Estruturado

Implementação de logging estruturado para facilitar análise:

```python
import logging
import json
from datetime import datetime

class StructuredLogger:
    def __init__(self, name):
        self.logger = logging.getLogger(name)
        handler = logging.StreamHandler()
        handler.setFormatter(self.JsonFormatter())
        self.logger.addHandler(handler)
        self.logger.setLevel(logging.INFO)
    
    class JsonFormatter(logging.Formatter):
        def format(self, record):
            log_entry = {
                'timestamp': datetime.utcnow().isoformat(),
                'level': record.levelname,
                'message': record.getMessage(),
                'module': record.module,
                'function': record.funcName,
                'line': record.lineno
            }
            return json.dumps(log_entry)
    
    def info(self, message, **kwargs):
        self.logger.info(message, extra=kwargs)
```

### Métricas de Performance

Coleta de métricas importantes para monitoramento:

```python
from prometheus_client import Counter, Histogram, generate_latest

# Contadores
api_requests_total = Counter('api_requests_total', 'Total API requests', ['method', 'endpoint'])
products_created_total = Counter('products_created_total', 'Total products created')

# Histogramas para latência
request_duration = Histogram('request_duration_seconds', 'Request duration')

@app.before_request
def before_request():
    request.start_time = time.time()

@app.after_request
def after_request(response):
    request_duration.observe(time.time() - request.start_time)
    api_requests_total.labels(method=request.method, endpoint=request.endpoint).inc()
    return response

@app.route('/metrics')
def metrics():
    return generate_latest()
```

### Health Checks

Implementação de health checks para monitoramento de saúde:

```python
@app.route('/health')
def health_check():
    checks = {
        'database': check_database_connection(),
        'redis': check_redis_connection(),
        'external_apis': check_external_apis()
    }
    
    status = 'healthy' if all(checks.values()) else 'unhealthy'
    status_code = 200 if status == 'healthy' else 503
    
    return jsonify({
        'status': status,
        'timestamp': datetime.utcnow().isoformat(),
        'checks': checks
    }), status_code

def check_database_connection():
    try:
        db.session.execute('SELECT 1')
        return True
    except Exception:
        return False
```

## Deployment e DevOps

### Containerização

Dockerfile otimizado para produção:

```dockerfile
# Backend Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copiar e instalar dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código da aplicação
COPY src/ ./src/

# Criar usuário não-root
RUN useradd --create-home --shell /bin/bash app
USER app

# Expor porta
EXPOSE 5000

# Comando de inicialização
CMD ["python", "src/main.py"]
```

### Docker Compose

Configuração para desenvolvimento local:

```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/validade_inteligente
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis
    volumes:
      - ./src:/app/src

  db:
    image: postgres:14
    environment:
      POSTGRES_DB: validade_inteligente
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend

volumes:
  postgres_data:
```

### CI/CD Pipeline

Pipeline automatizado com GitHub Actions:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        pip install -r requirements.txt
        pip install pytest pytest-cov
    
    - name: Run tests
      run: |
        pytest --cov=src tests/
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Build Docker image
      run: |
        docker build -t validade-inteligente:${{ github.sha }} .
    
    - name: Push to registry
      if: github.ref == 'refs/heads/main'
      run: |
        echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
        docker push validade-inteligente:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Deploy to production
      run: |
        # Script de deploy para produção
        echo "Deploying to production..."
```

Esta arquitetura garante um sistema robusto, escalável e maintível, seguindo as melhores práticas da indústria para desenvolvimento de aplicações web modernas. A separação clara de responsabilidades, implementação de padrões de design reconhecidos e foco em segurança e performance criam uma base sólida para o crescimento e evolução do Validade Inteligente.

