# 🚀 Configuração para Produção - Auto-Trader com IA

## ⚠️ IMPORTANTE - LEIA ANTES DE USAR EM PRODUÇÃO

Este sistema agora está configurado para **ORDENS REAIS** no MetaTrader 5. Use com extrema cautela!

## 📋 Pré-requisitos

### 1. MetaTrader 5
- Baixar e instalar o [MetaTrader 5](https://www.metatrader5.com/pt/download)
- Abrir uma conta demo ou real
- Manter o MT5 aberto durante a execução

### 2. Dependências Python
```bash
cd python
pip install -r requirements.txt
```

### 3. Configuração do Backend
```bash
cd backend
npm install
```

Configurar arquivo `.env`:
```env
OPENAI_API_KEY=sua_chave_openai_aqui
MONGO_URI=mongodb://localhost:27017/autotrader
PORT=4000
```

## 🔧 Configurações de Segurança

### Volume de Ordens
Por padrão, o sistema usa **0.01 lotes** (micro lotes) para minimizar riscos.

Para alterar, edite no arquivo `backend/controllers/simpleTradeController.js`:
```javascript
volume: 0.01, // Altere aqui (0.01 = 1000 unidades)
```

### Stop Loss e Take Profit
A IA define automaticamente níveis de SL/TP baseados na análise.

### Magic Number
Todas as ordens usam Magic Number `202401` para identificação.

## 🚀 Execução

### 1. Iniciar MongoDB
```bash
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl start mongod
```

### 2. Iniciar Backend
```bash
cd backend
node server.js
```

### 3. Iniciar Interface MT5
```bash
cd python
python mt5_interface.py
```

## 📊 Modos de Operação

### Modo Automático (Padrão)
- Tenta conectar ao MT5 real
- Se falhar, volta para simulação
- Logs indicam o modo atual

### Forçar Modo de Teste
Para testar sem risco, edite `mt5_interface.py`:
```python
self.test_mode = True  # Força simulação
```

## 🔍 Monitoramento

### Logs do Sistema
- `[REAL]` - Dados reais do MT5
- `[MT5]` - Ordens reais executadas
- `[MT5-SIM]` - Ordens simuladas
- `[ERROR]` - Erros que requerem atenção

### Dashboard Web
Acesse: `http://localhost:4000`
- Histórico de trades
- Estatísticas de performance
- Decisões da IA

## ⚠️ Avisos de Segurança

### 🔴 RISCOS
- **PERDA FINANCEIRA**: Ordens reais podem resultar em perdas
- **EXECUÇÃO AUTOMÁTICA**: Sistema opera sem intervenção manual
- **MERCADO 24/7**: Forex opera continuamente

### 🛡️ PROTEÇÕES
- Volume mínimo (0.01 lotes)
- Stop Loss automático
- Logs detalhados
- Fallback para simulação

### 📝 RECOMENDAÇÕES
1. **SEMPRE teste em conta demo primeiro**
2. **Monitore constantemente** durante operação
3. **Defina limites** de perda diária/semanal
4. **Mantenha backup** das configurações
5. **Revise logs** regularmente

## 🆘 Emergência

### Parar Sistema Imediatamente
1. Pressione `Ctrl+C` no terminal Python
2. Feche o MetaTrader 5
3. Pare o servidor backend

### Fechar Posições Manualmente
1. Abra o MetaTrader 5
2. Vá para "Trade" → "History"
3. Feche posições com Magic Number `202401`

## 📞 Suporte

Em caso de problemas:
1. Verifique os logs de erro
2. Consulte a documentação do MT5
3. Teste em modo simulação primeiro

---

**⚠️ DISCLAIMER: Use por sua conta e risco. O sistema é fornecido "como está" sem garantias.**
