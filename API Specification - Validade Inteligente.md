# API Specification - Validade Inteligente

## Visão Geral

A API do Validade Inteligente é uma RESTful API construída com Flask que fornece endpoints para gerenciamento de produtos, alertas, relatórios e funcionalidades de IA. Todas as respostas são em formato JSON e seguem padrões REST.

## Base URL

```
Desenvolvimento: http://localhost:5000/api/v1
Produção: https://api.validadeinteligente.com/v1
```

## Autenticação

A API utiliza JWT (JSON Web Tokens) para autenticação. Inclua o token no header Authorization:

```
Authorization: Bearer <seu_jwt_token>
```

## Endpoints

### Autenticação

#### POST /auth/register
Registra um novo usuário/estabelecimento.

**Request Body:**
```json
{
  "email": "usuario@exemplo.com",
  "password": "senha123",
  "nome_estabelecimento": "Mercado do João",
  "cnpj": "12.345.678/0001-90",
  "telefone": "(11) 99999-9999",
  "endereco": {
    "rua": "Rua das Flores, 123",
    "cidade": "São Paulo",
    "estado": "SP",
    "cep": "01234-567"
  }
}
```

**Response (201 Created):**
```json
{
  "message": "Usuário criado com sucesso",
  "user_id": 1,
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

#### POST /auth/login
Autentica um usuário existente.

**Request Body:**
```json
{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

**Response (200 OK):**
```json
{
  "message": "Login realizado com sucesso",
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "email": "usuario@exemplo.com",
    "nome_estabelecimento": "Mercado do João",
    "plano": "pro"
  }
}
```

### Produtos

#### GET /produtos
Lista todos os produtos do usuário.

**Query Parameters:**
- `page` (int): Número da página (default: 1)
- `per_page` (int): Itens por página (default: 20)
- `categoria` (string): Filtrar por categoria
- `status` (string): vencido, proximo_vencimento, normal
- `search` (string): Buscar por nome do produto

**Response (200 OK):**
```json
{
  "produtos": [
    {
      "id": 1,
      "nome": "Leite Integral 1L",
      "codigo_barras": "7891000100103",
      "categoria": "Laticínios",
      "data_validade": "2025-02-15",
      "lote": "L20250101",
      "quantidade": 24,
      "preco_custo": 3.50,
      "preco_venda": 5.99,
      "fornecedor": "Laticínios ABC",
      "status": "normal",
      "dias_para_vencer": 45,
      "created_at": "2025-01-01T10:00:00Z",
      "updated_at": "2025-01-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 150,
    "pages": 8
  }
}
```

#### POST /produtos
Cria um novo produto.

**Request Body:**
```json
{
  "nome": "Leite Integral 1L",
  "codigo_barras": "7891000100103",
  "categoria": "Laticínios",
  "data_validade": "2025-02-15",
  "lote": "L20250101",
  "quantidade": 24,
  "preco_custo": 3.50,
  "preco_venda": 5.99,
  "fornecedor": "Laticínios ABC"
}
```

**Response (201 Created):**
```json
{
  "message": "Produto criado com sucesso",
  "produto": {
    "id": 1,
    "nome": "Leite Integral 1L",
    "codigo_barras": "7891000100103",
    "categoria": "Laticínios",
    "data_validade": "2025-02-15",
    "lote": "L20250101",
    "quantidade": 24,
    "preco_custo": 3.50,
    "preco_venda": 5.99,
    "fornecedor": "Laticínios ABC",
    "status": "normal",
    "dias_para_vencer": 45,
    "created_at": "2025-01-01T10:00:00Z"
  }
}
```

#### GET /produtos/{id}
Obtém detalhes de um produto específico.

**Response (200 OK):**
```json
{
  "produto": {
    "id": 1,
    "nome": "Leite Integral 1L",
    "codigo_barras": "7891000100103",
    "categoria": "Laticínios",
    "data_validade": "2025-02-15",
    "lote": "L20250101",
    "quantidade": 24,
    "preco_custo": 3.50,
    "preco_venda": 5.99,
    "fornecedor": "Laticínios ABC",
    "status": "normal",
    "dias_para_vencer": 45,
    "historico_vendas": [
      {
        "data": "2025-01-01",
        "quantidade_vendida": 5,
        "preco_medio": 5.99
      }
    ],
    "sugestoes_ia": {
      "acao_recomendada": "promocao",
      "desconto_sugerido": 15,
      "justificativa": "Produto com boa rotatividade, desconto moderado pode acelerar vendas"
    }
  }
}
```

#### PUT /produtos/{id}
Atualiza um produto existente.

**Request Body:**
```json
{
  "quantidade": 20,
  "preco_venda": 5.49
}
```

**Response (200 OK):**
```json
{
  "message": "Produto atualizado com sucesso",
  "produto": {
    "id": 1,
    "nome": "Leite Integral 1L",
    "quantidade": 20,
    "preco_venda": 5.49,
    "updated_at": "2025-01-02T14:30:00Z"
  }
}
```

#### DELETE /produtos/{id}
Remove um produto.

**Response (200 OK):**
```json
{
  "message": "Produto removido com sucesso"
}
```

### Alertas

#### GET /alertas
Lista alertas de validade.

**Query Parameters:**
- `tipo` (string): vencimento, promocao, doacao
- `status` (string): ativo, resolvido, ignorado
- `urgencia` (string): alta, media, baixa

**Response (200 OK):**
```json
{
  "alertas": [
    {
      "id": 1,
      "produto_id": 1,
      "produto_nome": "Leite Integral 1L",
      "tipo": "vencimento",
      "urgencia": "alta",
      "titulo": "Produto vence em 3 dias",
      "descricao": "24 unidades do produto Leite Integral 1L vencem em 3 dias",
      "data_vencimento": "2025-01-05",
      "quantidade_afetada": 24,
      "valor_estimado_perda": 143.76,
      "sugestoes": [
        {
          "tipo": "promocao",
          "desconto": 20,
          "preco_promocional": 4.79
        },
        {
          "tipo": "doacao",
          "instituicao": "Banco de Alimentos SP"
        }
      ],
      "status": "ativo",
      "created_at": "2025-01-02T08:00:00Z"
    }
  ]
}
```

#### POST /alertas/{id}/resolver
Marca um alerta como resolvido.

**Request Body:**
```json
{
  "acao_tomada": "promocao",
  "detalhes": {
    "desconto_aplicado": 20,
    "quantidade_vendida": 18,
    "receita_gerada": 86.22
  }
}
```

**Response (200 OK):**
```json
{
  "message": "Alerta resolvido com sucesso",
  "economia_gerada": 86.22
}
```

### IA e Sugestões

#### GET /ia/sugestoes
Obtém sugestões da IA para produtos próximos ao vencimento.

**Response (200 OK):**
```json
{
  "sugestoes": [
    {
      "produto_id": 1,
      "produto_nome": "Leite Integral 1L",
      "acao_recomendada": "promocao",
      "confianca": 0.85,
      "detalhes": {
        "desconto_sugerido": 15,
        "preco_promocional": 5.09,
        "probabilidade_venda": 0.78,
        "receita_estimada": 101.80,
        "economia_vs_perda": 58.04
      },
      "justificativa": "Baseado no histórico de vendas, um desconto de 15% tem alta probabilidade de escoar o estoque antes do vencimento"
    }
  ]
}
```

#### POST /ia/treinar
Retreina o modelo de IA com novos dados.

**Response (202 Accepted):**
```json
{
  "message": "Treinamento iniciado",
  "job_id": "train_123456",
  "tempo_estimado": "15 minutos"
}
```

### Relatórios

#### GET /relatorios/dashboard
Dados para o dashboard principal.

**Query Parameters:**
- `periodo` (string): 7d, 30d, 90d, 1y

**Response (200 OK):**
```json
{
  "resumo": {
    "total_produtos": 150,
    "produtos_vencendo": 12,
    "valor_risco": 567.89,
    "economia_mes": 2340.50,
    "reducao_desperdicio": 0.68
  },
  "graficos": {
    "vendas_por_dia": [
      {"data": "2025-01-01", "vendas": 1250.00},
      {"data": "2025-01-02", "vendas": 980.50}
    ],
    "produtos_por_categoria": [
      {"categoria": "Laticínios", "quantidade": 45},
      {"categoria": "Carnes", "quantidade": 23}
    ],
    "alertas_por_urgencia": {
      "alta": 5,
      "media": 8,
      "baixa": 12
    }
  }
}
```

#### GET /relatorios/perdas
Relatório detalhado de perdas.

**Query Parameters:**
- `data_inicio` (date): Data inicial
- `data_fim` (date): Data final
- `categoria` (string): Filtrar por categoria

**Response (200 OK):**
```json
{
  "periodo": {
    "inicio": "2025-01-01",
    "fim": "2025-01-31"
  },
  "resumo": {
    "total_perdas": 1250.75,
    "produtos_descartados": 89,
    "principal_categoria": "Laticínios",
    "economia_gerada": 3450.20
  },
  "detalhes": [
    {
      "produto": "Leite Integral 1L",
      "categoria": "Laticínios",
      "quantidade_descartada": 12,
      "valor_perda": 71.88,
      "data_descarte": "2025-01-15",
      "motivo": "vencimento"
    }
  ]
}
```

### Gamificação

#### GET /gamificacao/perfil
Perfil de gamificação do usuário.

**Response (200 OK):**
```json
{
  "usuario": {
    "nivel": 5,
    "pontos_totais": 2450,
    "pontos_mes": 340,
    "ranking_posicao": 12,
    "ranking_total": 156
  },
  "medalhas": [
    {
      "id": 1,
      "nome": "Eco Warrior",
      "descricao": "Reduziu desperdício em 50%",
      "icone": "🌱",
      "data_conquista": "2025-01-15"
    }
  ],
  "metas": [
    {
      "id": 1,
      "titulo": "Reduzir perdas em 20%",
      "progresso": 0.75,
      "prazo": "2025-01-31",
      "recompensa_pontos": 500
    }
  ]
}
```

## Códigos de Status HTTP

- `200 OK` - Sucesso
- `201 Created` - Recurso criado
- `400 Bad Request` - Dados inválidos
- `401 Unauthorized` - Token inválido ou ausente
- `403 Forbidden` - Acesso negado
- `404 Not Found` - Recurso não encontrado
- `422 Unprocessable Entity` - Erro de validação
- `500 Internal Server Error` - Erro interno

## Rate Limiting

- **Plano Básico**: 100 requests/hora
- **Plano Pro**: 1000 requests/hora
- **Plano Enterprise**: 10000 requests/hora

## Webhooks

A API suporta webhooks para notificar eventos importantes:

### Eventos Disponíveis
- `produto.vencimento` - Produto próximo ao vencimento
- `alerta.criado` - Novo alerta gerado
- `meta.atingida` - Meta de gamificação atingida

### Configuração
```json
{
  "url": "https://seu-site.com/webhook",
  "eventos": ["produto.vencimento", "alerta.criado"],
  "secret": "sua_chave_secreta"
}
```

## SDKs e Bibliotecas

### JavaScript/TypeScript
```bash
npm install validade-inteligente-sdk
```

### Python
```bash
pip install validade-inteligente
```

### PHP
```bash
composer require validade-inteligente/sdk
```

## Exemplos de Uso

### Criar produto com JavaScript
```javascript
import { ValidadeInteligente } from 'validade-inteligente-sdk';

const api = new ValidadeInteligente('seu_token_aqui');

const produto = await api.produtos.criar({
  nome: 'Leite Integral 1L',
  codigo_barras: '7891000100103',
  categoria: 'Laticínios',
  data_validade: '2025-02-15',
  quantidade: 24,
  preco_venda: 5.99
});

console.log('Produto criado:', produto);
```

### Obter alertas com Python
```python
from validade_inteligente import ValidadeInteligente

api = ValidadeInteligente(token='seu_token_aqui')

alertas = api.alertas.listar(urgencia='alta')
for alerta in alertas:
    print(f"Alerta: {alerta.titulo}")
```

## Versionamento

A API utiliza versionamento semântico. Versões principais são mantidas por pelo menos 12 meses após o lançamento de uma nova versão.

- **v1.0** - Versão atual (estável)
- **v1.1** - Próxima versão (beta)

## Suporte

Para suporte técnico da API:
- **Email**: api-support@validadeinteligente.com
- **Documentação**: https://docs.validadeinteligente.com
- **Status**: https://status.validadeinteligente.com

