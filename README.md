# 🤖 Auto-Trader com Inteligência Artificial

## ⚠️ MODO DE PRODUÇÃO ATIVADO

**🔴 ATENÇÃO: Este sistema agora executa ORDENS REAIS no MetaTrader 5!**

Para configuração segura em produção, consulte: **[PRODUCTION_SETUP.md](PRODUCTION_SETUP.md)**

## 📌 Visão Geral

Este projeto consiste em uma aplicação *full-stack* projetada para automatizar a execução de ordens no mercado Forex. A solução utiliza uma arquitetura moderna e desacoplada, integrando análise técnica de dados do MetaTrader 5, tomada de decisão por meio de Inteligência Artificial (OpenAI GPT), e um dashboard web para monitoramento e controle.

A aplicação é composta por três componentes principais:

1.  **Backend (Node.js/Express):** Uma API RESTful robusta que serve como o núcleo do sistema. É responsável por receber os dados de mercado, orquestrar a análise da IA, persistir todas as transações em um banco de dados MongoDB e expor endpoints para o frontend.
2.  **Coletor de Dados (Python):** Um script que se conecta ao MetaTrader 5 (ou simula a conexão para fins de teste) para coletar indicadores de análise técnica em tempo real (MACD, RSI, Bandas de Bollinger) e enviá-los ao backend para processamento.
3.  **Frontend (HTML/CSS/JS):** Um dashboard interativo que permite aos usuários monitorar as operações de trading em tempo real, visualizar estatísticas de desempenho, consultar o histórico de ordens e interagir diretamente com a IA para obter insights.

## ⚙️ Arquitetura e Tecnologias

| Camada | Tecnologia | Propósito |
| :--- | :--- | :--- |
| **Backend** | Node.js, Express.js | Criação da API RESTful e lógica de negócio. |
| | MongoDB (Mongoose) | Banco de dados NoSQL para persistência de ordens e análises. |
| | OpenAI API | Serviço de IA para análise de dados e tomada de decisão (compra/venda/manter). |
| | Helmet, Express Rate Limit | Segurança e proteção contra ataques de força bruta. |
| **Coletor de Dados** | Python, Requests | Coleta de indicadores técnicos e comunicação com o backend. |
| | MetaTrader 5 (lib) | Integração com a plataforma de trading para dados em tempo real. (Simulado) |
| **Frontend** | HTML5, CSS3, JavaScript | Interface de usuário para visualização de dados. |
| | Bootstrap 5 | Framework de UI para um design responsivo e profissional. |
| | Chart.js | Biblioteca para a criação de gráficos e visualizações de dados. |
| **Testes** | Jest, Supertest | Testes unitários e de integração para o backend. |
| | Python (Requests) | Script de testes automatizados para a API. |

## ✅ Testes Realizados e Resultados

Para garantir a qualidade, estabilidade e confiabilidade da aplicação, uma bateria completa de testes foi executada, cobrindo tanto o backend quanto a integração entre os componentes.

### Testes da API (Backend)

Foram implementados dois conjuntos de testes para a API:

1.  **Testes de Integração com Jest e Supertest:** Focados em validar o comportamento de cada endpoint da API, a lógica de negócio e a interação com o banco de dados de teste. Todos os 14 testes passaram com sucesso, cobrindo cenários de sucesso, falha e validação de dados.
2.  **Script de Testes Automatizados em Python:** Um script (`test_api.py`) foi criado para simular um cliente da API, testando o fluxo completo, desde a criação de uma ordem até a consulta de estatísticas e a comunicação com a IA. Todos os 8 testes passaram com sucesso.

### Testes do Coletor de Dados

O script `mt5_interface.py` foi executado em seu modo de simulação. O teste confirmou que o script é capaz de:

*   Gerar dados de mercado simulados de forma realista.
*   Conectar-se com sucesso ao endpoint de health check do backend.
*   Enviar os dados para a API e receber uma decisão da IA.

**Observação:** A biblioteca `MetaTrader5` é exclusiva para Windows e não pôde ser instalada no ambiente de teste (Linux). O modo de simulação foi projetado para contornar essa limitação e permitir a validação completa da lógica da aplicação.

## 🚀 Como Executar o Projeto

Siga os passos abaixo para configurar e executar a aplicação em um ambiente de desenvolvimento.

### Pré-requisitos

*   Node.js (v18 ou superior)
*   npm
*   Python 3 (v3.9 ou superior)
*   MongoDB

### 1. Configuração do Backend

```bash
# Navegue até o diretório do backend
cd /home/ubuntu/auto-trader/backend

# Instale as dependências
npm install

# Crie o arquivo .env e adicione suas chaves
# (O arquivo já foi criado neste ambiente com a chave fornecida)

# Inicie o servidor MongoDB
sudo systemctl start mongod

# Inicie o servidor backend
node server.js
```

O servidor estará rodando em `http://localhost:4000`.

### 2. Execução do Coletor de Dados

```bash
# Navegue até o diretório do script Python
cd /home/ubuntu/auto-trader/python

# Instale as dependências
pip3 install requests pandas numpy python-dotenv

# Execute o script
python3 mt5_interface.py
```

O script executará um teste único e, em seguida, perguntará se deve iniciar a coleta contínua.

### 3. Acessando o Frontend

Abra o arquivo `/home/ubuntu/auto-trader/frontend/index.html` em um navegador web. O dashboard se conectará automaticamente à API do backend.

## 📈 Melhorias e Próximos Passos

*   **Frontend com React:** Substituir o frontend estático por uma aplicação React completa, utilizando Vite, para maior interatividade e componentização, conforme planejado originalmente.
*   **Autenticação de Usuários:** Implementar um sistema de login (ex: JWT) para proteger o acesso ao dashboard e à API.
*   **WebSockets:** Utilizar WebSockets para uma comunicação em tempo real entre o backend e o frontend, atualizando o dashboard sem a necessidade de polling.
*   **Backtesting:** Desenvolver a funcionalidade de backtesting para testar estratégias de IA com dados históricos.
*   **Deploy em Produção:** Criar scripts de deploy e conteinerizar a aplicação com Docker para facilitar a implantação em serviços de nuvem.

