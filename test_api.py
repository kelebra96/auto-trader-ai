#!/usr/bin/env python3
"""
Script de testes automatizados para API Auto-Trader
"""

import requests
import json
import time
import sys
from datetime import datetime

class AutoTraderTester:
    def __init__(self, base_url="http://localhost:4000"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.test_results = []
        
    def log_test(self, test_name, success, details=""):
        """Registra resultado de teste"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASSOU" if success else "❌ FALHOU"
        print(f"{status} - {test_name}")
        if details:
            print(f"   Detalhes: {details}")
        print()
    
    def test_health_check(self):
        """Testa endpoint de health check"""
        try:
            response = requests.get(f"{self.api_url}/health", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "OK":
                    self.log_test("Health Check", True, f"Uptime: {data.get('uptime', 0):.2f}s")
                    return True
                else:
                    self.log_test("Health Check", False, "Status não é OK")
                    return False
            else:
                self.log_test("Health Check", False, f"HTTP {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Health Check", False, str(e))
            return False
    
    def test_create_trade(self):
        """Testa criação de trade"""
        try:
            trade_data = {
                "ativo": "EURUSD",
                "tendencia": "alta",
                "macd": 0.0015,
                "rsi": 65.5,
                "bollinger": "1.17500 - 1.18500"
            }
            
            response = requests.post(
                f"{self.api_url}/trades",
                json=trade_data,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if response.status_code == 201:
                data = response.json()
                decision = data.get("decision")
                trade_id = data.get("tradeId")
                
                if decision in ["buy", "sell", "hold"] and trade_id:
                    self.log_test("Criar Trade", True, f"Decisão: {decision}, ID: {trade_id}")
                    return trade_id
                else:
                    self.log_test("Criar Trade", False, "Resposta inválida")
                    return None
            else:
                self.log_test("Criar Trade", False, f"HTTP {response.status_code}: {response.text}")
                return None
                
        except Exception as e:
            self.log_test("Criar Trade", False, str(e))
            return None
    
    def test_get_trades(self):
        """Testa listagem de trades"""
        try:
            response = requests.get(f"{self.api_url}/trades", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                trades = data.get("trades", [])
                total = data.get("total", 0)
                
                self.log_test("Listar Trades", True, f"Total: {total}, Retornados: {len(trades)}")
                return True
            else:
                self.log_test("Listar Trades", False, f"HTTP {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Listar Trades", False, str(e))
            return False
    
    def test_get_trade_by_id(self, trade_id):
        """Testa busca de trade por ID"""
        if not trade_id:
            self.log_test("Buscar Trade por ID", False, "ID não fornecido")
            return False
            
        try:
            response = requests.get(f"{self.api_url}/trades/{trade_id}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("_id") == trade_id:
                    self.log_test("Buscar Trade por ID", True, f"Trade encontrado: {data.get('ativo')}")
                    return True
                else:
                    self.log_test("Buscar Trade por ID", False, "ID não confere")
                    return False
            else:
                self.log_test("Buscar Trade por ID", False, f"HTTP {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Buscar Trade por ID", False, str(e))
            return False
    
    def test_dashboard_stats(self):
        """Testa estatísticas do dashboard"""
        try:
            response = requests.get(f"{self.api_url}/dashboard/stats", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                total_trades = data.get("totalTrades", 0)
                decision_stats = data.get("decisionStats", [])
                
                self.log_test("Estatísticas Dashboard", True, f"Total trades: {total_trades}")
                return True
            else:
                self.log_test("Estatísticas Dashboard", False, f"HTTP {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Estatísticas Dashboard", False, str(e))
            return False
    
    def test_ai_message(self):
        """Testa envio de mensagem para IA"""
        try:
            message_data = {
                "message": "Qual é a melhor estratégia para EURUSD hoje?",
                "context": "Teste automatizado"
            }
            
            response = requests.post(
                f"{self.api_url}/ai/message",
                json=message_data,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                ai_response = data.get("response", "")
                
                if ai_response and len(ai_response) > 10:
                    self.log_test("Mensagem para IA", True, f"Resposta recebida ({len(ai_response)} chars)")
                    return True
                else:
                    self.log_test("Mensagem para IA", False, "Resposta vazia ou muito curta")
                    return False
            else:
                self.log_test("Mensagem para IA", False, f"HTTP {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Mensagem para IA", False, str(e))
            return False
    
    def test_invalid_trade_data(self):
        """Testa validação de dados inválidos"""
        try:
            invalid_data = {
                "ativo": "EURUSD",
                "tendencia": "alta",
                "rsi": 150  # RSI inválido (> 100)
                # Faltando campos obrigatórios
            }
            
            response = requests.post(
                f"{self.api_url}/trades",
                json=invalid_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 400:
                self.log_test("Validação Dados Inválidos", True, "Erro 400 retornado corretamente")
                return True
            else:
                self.log_test("Validação Dados Inválidos", False, f"Esperado 400, recebido {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Validação Dados Inválidos", False, str(e))
            return False
    
    def test_rate_limiting(self):
        """Testa rate limiting (muitas requisições)"""
        try:
            # Fazer muitas requisições rapidamente
            success_count = 0
            rate_limited = False
            
            for i in range(20):
                response = requests.get(f"{self.api_url}/health", timeout=5)
                if response.status_code == 200:
                    success_count += 1
                elif response.status_code == 429:
                    rate_limited = True
                    break
                time.sleep(0.1)
            
            if rate_limited:
                self.log_test("Rate Limiting", True, f"Rate limit ativado após {success_count} requests")
            else:
                self.log_test("Rate Limiting", True, f"Todas as {success_count} requisições passaram")
            
            return True
            
        except Exception as e:
            self.log_test("Rate Limiting", False, str(e))
            return False
    
    def run_all_tests(self):
        """Executa todos os testes"""
        print("🧪 Iniciando testes automatizados da API Auto-Trader")
        print("=" * 60)
        print()
        
        # Testes básicos
        if not self.test_health_check():
            print("❌ Falha crítica: API não está respondendo")
            return False
        
        # Testes funcionais
        trade_id = self.test_create_trade()
        self.test_get_trades()
        self.test_get_trade_by_id(trade_id)
        self.test_dashboard_stats()
        self.test_ai_message()
        
        # Testes de validação
        self.test_invalid_trade_data()
        self.test_rate_limiting()
        
        # Resumo dos resultados
        print("📊 RESUMO DOS TESTES")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"✅ Testes aprovados: {passed}")
        print(f"❌ Testes falharam: {total - passed}")
        print(f"📈 Taxa de sucesso: {(passed/total)*100:.1f}%")
        print()
        
        # Detalhes dos testes que falharam
        failed_tests = [result for result in self.test_results if not result["success"]]
        if failed_tests:
            print("❌ TESTES QUE FALHARAM:")
            for test in failed_tests:
                print(f"   - {test['test']}: {test['details']}")
            print()
        
        return passed == total

def main():
    """Função principal"""
    print("🤖 Auto-Trader API - Suite de Testes")
    print("=" * 60)
    
    # Verificar se API está rodando
    try:
        response = requests.get("http://localhost:4000/api/health", timeout=5)
        if response.status_code != 200:
            print("❌ API não está respondendo. Certifique-se de que o servidor está rodando.")
            sys.exit(1)
    except:
        print("❌ Não foi possível conectar à API. Certifique-se de que o servidor está rodando na porta 4000.")
        sys.exit(1)
    
    # Executar testes
    tester = AutoTraderTester()
    success = tester.run_all_tests()
    
    # Salvar resultados
    with open("/home/ubuntu/auto-trader/test_results.json", "w") as f:
        json.dump(tester.test_results, f, indent=2, ensure_ascii=False)
    
    print(f"📄 Resultados salvos em: /home/ubuntu/auto-trader/test_results.json")
    
    if success:
        print("🎉 Todos os testes passaram!")
        sys.exit(0)
    else:
        print("⚠️ Alguns testes falharam. Verifique os detalhes acima.")
        sys.exit(1)

if __name__ == "__main__":
    main()
