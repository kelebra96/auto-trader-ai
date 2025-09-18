#!/usr/bin/env python3
"""
Interface MetaTrader 5 para Auto-Trader
Coleta dados técnicos e envia para o backend
"""

import time
import requests
import json
import logging
from datetime import datetime
from typing import Dict, Optional

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('mt5_interface.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class MT5Interface:
    def __init__(self, backend_url: str = "http://localhost:4000"):
        self.backend_url = backend_url
        self.api_endpoint = f"{backend_url}/api/trades"
        
        # Simulação de dados para teste (substitua pela integração real do MT5)
        self.test_mode = True
        
    def connect_mt5(self) -> bool:
        """Conecta ao MetaTrader 5"""
        try:
            if self.test_mode:
                logger.info("🔄 Modo de teste ativado - simulando conexão MT5")
                return True
            
            # Aqui seria a conexão real com MT5
            # import MetaTrader5 as mt5
            # if not mt5.initialize():
            #     logger.error("Falha ao inicializar MT5")
            #     return False
            # logger.info("✅ Conectado ao MetaTrader 5")
            return True
            
        except Exception as e:
            logger.error(f"❌ Erro ao conectar MT5: {e}")
            return False
    
    def get_market_data(self, symbol: str = "EURUSD") -> Optional[Dict]:
        """Coleta dados técnicos do mercado"""
        try:
            if self.test_mode:
                return self._generate_test_data(symbol)
            
            # Aqui seria a coleta real de dados do MT5
            # rates = mt5.copy_rates_from_pos(symbol, mt5.TIMEFRAME_M15, 0, 100)
            # return self._calculate_indicators(rates)
            
        except Exception as e:
            logger.error(f"❌ Erro ao coletar dados: {e}")
            return None
    
    def _generate_test_data(self, symbol: str) -> Dict:
        """Gera dados de teste simulando indicadores técnicos"""
        import random
        
        # Simula variação realística dos indicadores
        base_rsi = 50 + random.uniform(-30, 30)
        base_macd = random.uniform(-0.005, 0.005)
        
        # Determina tendência baseada nos indicadores
        if base_rsi > 60 and base_macd > 0:
            tendencia = "alta"
        elif base_rsi < 40 and base_macd < 0:
            tendencia = "baixa"
        else:
            tendencia = "lateral"
        
        # Simula Bandas de Bollinger
        price_base = 1.18000
        bb_width = random.uniform(0.005, 0.015)
        bb_lower = price_base - bb_width
        bb_upper = price_base + bb_width
        
        data = {
            "ativo": symbol,
            "tendencia": tendencia,
            "macd": round(base_macd, 6),
            "rsi": round(max(0, min(100, base_rsi)), 2),
            "bollinger": f"{bb_lower:.5f} - {bb_upper:.5f}",
            "timestamp": datetime.now().isoformat(),
            "source": "MT5_Simulator"
        }
        
        logger.info(f"📊 Dados gerados para {symbol}: RSI={data['rsi']}, MACD={data['macd']}, Tendência={data['tendencia']}")
        return data
    
    def send_to_backend(self, data: Dict) -> bool:
        """Envia dados para o backend"""
        try:
            headers = {
                'Content-Type': 'application/json',
                'User-Agent': 'MT5-Interface/1.0'
            }
            
            response = requests.post(
                self.api_endpoint,
                json=data,
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 201:
                result = response.json()
                logger.info(f"✅ Dados enviados com sucesso - Decisão: {result.get('decision', 'N/A')}")
                return True
            else:
                logger.error(f"❌ Erro HTTP {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Erro de conexão com backend: {e}")
            return False
        except Exception as e:
            logger.error(f"❌ Erro inesperado: {e}")
            return False
    
    def test_backend_connection(self) -> bool:
        """Testa conexão com o backend"""
        try:
            response = requests.get(f"{self.backend_url}/api/health", timeout=10)
            if response.status_code == 200:
                logger.info("✅ Backend está respondendo")
                return True
            else:
                logger.error(f"❌ Backend retornou status {response.status_code}")
                return False
        except Exception as e:
            logger.error(f"❌ Erro ao testar backend: {e}")
            return False
    
    def run_continuous(self, interval_minutes: int = 15, symbols: list = None):
        """Executa coleta contínua de dados"""
        if symbols is None:
            symbols = ["EURUSD", "GBPUSD", "USDJPY"]
        
        logger.info(f"🚀 Iniciando coleta contínua - Intervalo: {interval_minutes} minutos")
        logger.info(f"📈 Símbolos monitorados: {', '.join(symbols)}")
        
        if not self.connect_mt5():
            logger.error("❌ Falha na conexão MT5 - Abortando")
            return
        
        if not self.test_backend_connection():
            logger.error("❌ Backend não está acessível - Abortando")
            return
        
        cycle_count = 0
        
        try:
            while True:
                cycle_count += 1
                logger.info(f"🔄 Ciclo {cycle_count} - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
                
                for symbol in symbols:
                    try:
                        # Coleta dados
                        data = self.get_market_data(symbol)
                        if data:
                            # Envia para backend
                            success = self.send_to_backend(data)
                            if not success:
                                logger.warning(f"⚠️ Falha ao enviar dados para {symbol}")
                        else:
                            logger.warning(f"⚠️ Falha ao coletar dados para {symbol}")
                        
                        # Pequena pausa entre símbolos
                        time.sleep(2)
                        
                    except Exception as e:
                        logger.error(f"❌ Erro processando {symbol}: {e}")
                
                # Aguarda próximo ciclo
                sleep_seconds = interval_minutes * 60
                logger.info(f"😴 Aguardando {interval_minutes} minutos até próximo ciclo...")
                time.sleep(sleep_seconds)
                
        except KeyboardInterrupt:
            logger.info("🛑 Interrompido pelo usuário")
        except Exception as e:
            logger.error(f"❌ Erro crítico: {e}")
        finally:
            logger.info("🏁 Finalizando interface MT5")

def main():
    """Função principal"""
    print("🤖 Auto-Trader MT5 Interface")
    print("=" * 40)
    
    # Configurações
    backend_url = "http://localhost:4000"
    interval_minutes = 1  # Para testes, usar 1 minuto
    symbols = ["EURUSD", "GBPUSD", "USDJPY", "USDCAD"]
    
    # Inicializa interface
    mt5_interface = MT5Interface(backend_url)
    
    # Executa teste único primeiro
    print("\n🧪 Executando teste único...")
    test_data = mt5_interface.get_market_data("EURUSD")
    if test_data:
        print(f"📊 Dados de teste: {json.dumps(test_data, indent=2)}")
        
        if mt5_interface.test_backend_connection():
            success = mt5_interface.send_to_backend(test_data)
            if success:
                print("✅ Teste único bem-sucedido!")
            else:
                print("❌ Falha no teste único")
                return
        else:
            print("❌ Backend não está acessível")
            return
    
    # Pergunta se deve continuar com execução contínua
    response = input("\n🔄 Executar coleta contínua? (s/n): ").lower().strip()
    if response in ['s', 'sim', 'y', 'yes']:
        mt5_interface.run_continuous(interval_minutes, symbols)
    else:
        print("👋 Finalizando...")

if __name__ == "__main__":
    main()
