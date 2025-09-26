# Esquema Expandido do Banco de Dados - Validade Inteligente

## Visão Geral da Arquitetura de Dados

O banco de dados foi redesenhado para suportar um micro-SaaS completo com múltiplos tenants, gestão financeira, sistema de suporte, auditoria completa e vetorização para IA. A arquitetura segue princípios de normalização, segurança por design e escalabilidade horizontal.

## Modelo de Dados Completo

### 1. Gestão de Empresas e Usuários

```sql
-- Tabela de empresas/tenants
CREATE TABLE empresas (
    id SERIAL PRIMARY KEY,
    razao_social VARCHAR(200) NOT NULL,
    nome_fantasia VARCHAR(200),
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    email_corporativo VARCHAR(120) NOT NULL,
    telefone VARCHAR(20),
    endereco JSONB,
    plano_id INTEGER REFERENCES planos(id),
    status VARCHAR(20) DEFAULT 'ativo', -- ativo, suspenso, cancelado
    data_contratacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_vencimento TIMESTAMP,
    configuracoes JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de usuários expandida
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
    nome VARCHAR(200) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    perfil VARCHAR(50) NOT NULL, -- admin, gerente, operador, visualizador
    funcao VARCHAR(100),
    status VARCHAR(20) DEFAULT 'ativo',
    ultimo_login TIMESTAMP,
    tentativas_login INTEGER DEFAULT 0,
    bloqueado_ate TIMESTAMP,
    token_reset VARCHAR(255),
    token_reset_expira TIMESTAMP,
    configuracoes_usuario JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de sessões para controle de acesso
CREATE TABLE sessoes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    token_access VARCHAR(500) NOT NULL,
    token_refresh VARCHAR(500),
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Gestão de Lojas e Fornecedores

```sql
-- Tabela de lojas
CREATE TABLE lojas (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
    numero_loja VARCHAR(10) NOT NULL,
    razao_social VARCHAR(200),
    nome_loja VARCHAR(200) NOT NULL,
    codigo_gerente VARCHAR(20),
    codigo_fiscal_prevencao VARCHAR(50),
    endereco JSONB,
    telefone VARCHAR(20),
    email VARCHAR(120),
    status VARCHAR(20) DEFAULT 'ativa',
    configuracoes JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(empresa_id, numero_loja)
);

-- Tabela de fornecedores
CREATE TABLE fornecedores (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    nome VARCHAR(200) NOT NULL,
    razao_social VARCHAR(200),
    codigo_fornecedor VARCHAR(50),
    email VARCHAR(120),
    telefone VARCHAR(20),
    endereco JSONB,
    contato_principal VARCHAR(200),
    condicoes_pagamento JSONB,
    status VARCHAR(20) DEFAULT 'ativo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Gestão de Produtos Expandida

```sql
-- Tabela de setores/departamentos
CREATE TABLE setores (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    codigo VARCHAR(20),
    status VARCHAR(20) DEFAULT 'ativo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de categorias
CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
    setor_id INTEGER REFERENCES setores(id),
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    codigo VARCHAR(20),
    margem_padrao DECIMAL(5,2),
    status VARCHAR(20) DEFAULT 'ativo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de produtos expandida
CREATE TABLE produtos (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
    loja_id INTEGER REFERENCES lojas(id),
    fornecedor_id INTEGER REFERENCES fornecedores(id),
    setor_id INTEGER REFERENCES setores(id),
    categoria_id INTEGER REFERENCES categorias(id),
    codigo_ean VARCHAR(50),
    nome VARCHAR(200) NOT NULL,
    descricao TEXT,
    unidade_medida VARCHAR(20) DEFAULT 'UN',
    preco_custo DECIMAL(10,2),
    preco_venda DECIMAL(10,2) NOT NULL,
    margem_lucro DECIMAL(5,2),
    estoque_atual INTEGER DEFAULT 0,
    estoque_minimo INTEGER DEFAULT 0,
    estoque_maximo INTEGER DEFAULT 0,
    data_validade DATE,
    lote VARCHAR(100),
    localizacao VARCHAR(50),
    peso DECIMAL(8,3),
    dimensoes JSONB,
    codigo_ncm VARCHAR(10),
    aliquota_icms DECIMAL(5,2),
    origem INTEGER,
    status VARCHAR(20) DEFAULT 'ativo',
    imagem_url VARCHAR(500),
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(empresa_id, codigo_ean)
);
```

### 4. Sistema de Planos e Pagamentos

```sql
-- Tabela de planos
CREATE TABLE planos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    preco_mensal DECIMAL(10,2) NOT NULL,
    preco_anual DECIMAL(10,2),
    limite_produtos INTEGER,
    limite_usuarios INTEGER,
    limite_lojas INTEGER,
    funcionalidades JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'ativo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de assinaturas
CREATE TABLE assinaturas (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
    plano_id INTEGER REFERENCES planos(id),
    status VARCHAR(20) NOT NULL,
    data_inicio TIMESTAMP NOT NULL,
    data_fim TIMESTAMP NOT NULL,
    data_cancelamento TIMESTAMP,
    motivo_cancelamento TEXT,
    valor_mensal DECIMAL(10,2) NOT NULL,
    desconto_percentual DECIMAL(5,2) DEFAULT 0,
    valor_final DECIMAL(10,2) NOT NULL,
    renovacao_automatica BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de pagamentos
CREATE TABLE pagamentos (
    id SERIAL PRIMARY KEY,
    assinatura_id INTEGER REFERENCES assinaturas(id),
    empresa_id INTEGER REFERENCES empresas(id),
    valor DECIMAL(10,2) NOT NULL,
    metodo_pagamento VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    gateway_pagamento VARCHAR(50) DEFAULT 'mercadopago',
    transaction_id VARCHAR(100),
    gateway_response JSONB,
    data_vencimento TIMESTAMP,
    data_pagamento TIMESTAMP,
    tentativas INTEGER DEFAULT 0,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5. Sistema de Suporte

```sql
-- Tabela de chamados
CREATE TABLE chamados (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES usuarios(id),
    numero_chamado VARCHAR(20) UNIQUE NOT NULL,
    assunto VARCHAR(200) NOT NULL,
    descricao TEXT NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    prioridade VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'aberto',
    atendente_id INTEGER REFERENCES usuarios(id),
    data_abertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_primeira_resposta TIMESTAMP,
    data_resolucao TIMESTAMP,
    data_fechamento TIMESTAMP,
    tempo_primeira_resposta INTERVAL,
    tempo_resolucao INTERVAL,
    avaliacao INTEGER CHECK (avaliacao >= 1 AND avaliacao <= 5),
    comentario_avaliacao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de mensagens dos chamados
CREATE TABLE mensagens_chamados (
    id SERIAL PRIMARY KEY,
    chamado_id INTEGER REFERENCES chamados(id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES usuarios(id),
    tipo VARCHAR(20) NOT NULL,
    conteudo TEXT,
    anexos JSONB,
    visivel_cliente BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 6. Sistema de Logs

```sql
-- Tabela de logs de auditoria
CREATE TABLE logs_auditoria (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER REFERENCES empresas(id),
    usuario_id INTEGER REFERENCES usuarios(id),
    acao VARCHAR(100) NOT NULL,
    tabela_afetada VARCHAR(50),
    registro_id INTEGER,
    dados_anteriores JSONB,
    dados_novos JSONB,
    ip_address INET,
    user_agent TEXT,
    endpoint VARCHAR(200),
    metodo_http VARCHAR(10),
    status_code INTEGER,
    tempo_execucao INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 7. Sistema de IA e Vetorização

```sql
-- Extensão para vetores
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabela de embeddings
CREATE TABLE embeddings_produtos (
    id SERIAL PRIMARY KEY,
    produto_id INTEGER REFERENCES produtos(id) ON DELETE CASCADE,
    embedding vector(1536),
    metadados JSONB,
    versao_modelo VARCHAR(50) DEFAULT 'text-embedding-ada-002',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de predições da IA
CREATE TABLE predicoes_ia (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER REFERENCES empresas(id),
    produto_id INTEGER REFERENCES produtos(id),
    tipo_predicao VARCHAR(50) NOT NULL,
    entrada JSONB NOT NULL,
    resultado JSONB NOT NULL,
    confianca DECIMAL(5,4),
    modelo_utilizado VARCHAR(100),
    versao_modelo VARCHAR(50),
    tempo_processamento INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Índices para Performance

```sql
-- Índices principais
CREATE INDEX idx_usuarios_empresa_email ON usuarios(empresa_id, email);
CREATE INDEX idx_produtos_empresa_ean ON produtos(empresa_id, codigo_ean);
CREATE INDEX idx_produtos_validade ON produtos(data_validade) WHERE data_validade IS NOT NULL;
CREATE INDEX idx_alertas_empresa_status ON alertas(empresa_id, status);
CREATE INDEX idx_logs_auditoria_empresa_data ON logs_auditoria(empresa_id, created_at);
CREATE INDEX idx_chamados_empresa_status ON chamados(empresa_id, status);
CREATE INDEX idx_sessoes_usuario_ativo ON sessoes(usuario_id, ativo);
CREATE INDEX idx_pagamentos_empresa_status ON pagamentos(empresa_id, status);

-- Índices para vetorização
CREATE INDEX idx_embeddings_produtos_vector ON embeddings_produtos USING ivfflat (embedding vector_cosine_ops);
```

