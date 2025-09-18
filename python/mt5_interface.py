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
        
        # Modo de produção - conecta ao MetaTrader 5 real
        self.test_mode = False
        
    def connect_mt5(self) -> bool:
        """Conecta ao MetaTrader 5"""
        try:
            if self.test_mode:
                logger.info("[TEST] Modo de teste ativado - simulando conexao MT5")
                return True
            
            # Conexão real com MetaTrader 5
            try:
                import MetaTrader5 as mt5
                if not mt5.initialize():
                    logger.error("[ERROR] Falha ao inicializar MT5 - Verifique se o MetaTrader 5 esta aberto")
                    logger.info("[INFO] Alternativa: Executando em modo de simulacao")
                    self.test_mode = True
                    return True
                logger.info("[SUCCESS] Conectado ao MetaTrader 5 real")
                return True
            except ImportError:
                logger.warning("[WARNING] Biblioteca MetaTrader5 nao encontrada")
                logger.info("[INFO] Execute: pip install MetaTrader5")
                logger.info("[INFO] Alternativa: Executando em modo de simulacao")
                self.test_mode = True
                return True
            
        except Exception as e:
            logger.error(f"[ERROR] Erro ao conectar MT5: {e}")
            return False
    
    def get_market_data(self, symbol: str = "EURUSD") -> Optional[Dict]:
        """Coleta dados técnicos do mercado"""
        try:
            if self.test_mode:
                return self._generate_test_data(symbol)
            
            # Coleta real de dados do MT5
            try:
                import MetaTrader5 as mt5
                import numpy as np
                
                # Coletar dados de preços (últimas 100 velas de 15 minutos)
                rates = mt5.copy_rates_from_pos(symbol, mt5.TIMEFRAME_M15, 0, 100)
                if rates is None or len(rates) == 0:
                    logger.warning(f"[WARNING] Nao foi possivel obter dados para {symbol}, usando simulacao")
                    return self._generate_test_data(symbol)
                
                return self._calculate_real_indicators(rates, symbol)
                
            except ImportError:
                logger.warning("[WARNING] MetaTrader5 nao disponivel, usando dados simulados")
                return self._generate_test_data(symbol)
            
        except Exception as e:
            logger.error(f"[ERROR] Erro ao coletar dados: {e}")
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
        
        logger.info(f"[DATA] Dados gerados para {symbol}: RSI={data['rsi']}, MACD={data['macd']}, Tendencia={data['tendencia']}")
        return data
    
    def _calculate_real_indicators(self, rates, symbol: str) -> Dict:
        """Calcula indicadores técnicos reais a partir dos dados do MT5"""
        try:
            from indicators import calculate_all_indicators
            data = calculate_all_indicators(rates, symbol)
            logger.info(f"[REAL] Dados reais para {symbol}: RSI={data['rsi']}, MACD={data['macd']}, Tendencia={data['tendencia']}, Preco={data['price']}")
            return data
        except ImportError:
            logger.warning("[WARNING] Modulo indicators nao encontrado, usando dados simulados")
            return self._generate_test_data(symbol)
        except Exception as e:
            logger.error(f"[ERROR] Erro ao calcular indicadores reais: {e}")
            return self._generate_test_data(symbol)
    
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
                timeout=120
            )
            
            if response.status_code == 201:
                result = response.json()
                logger.info(f"[SUCCESS] Dados enviados com sucesso - Decisao: {result.get('decision', 'N/A')}")
                return True
            else:
                logger.error(f"[ERROR] Erro HTTP {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            logger.error(f"[ERROR] Erro de conexao com backend: {e}")
            return False
        except Exception as e:
            logger.error(f"[ERROR] Erro inesperado: {e}")
            return False
    
    def test_backend_connection(self) -> bool:
        """Testa conexão com o backend"""
        try:
            response = requests.get(f"{self.backend_url}/api/health", timeout=10)
            if response.status_code == 200:
                logger.info("[SUCCESS] Backend esta respondendo")
                return True
            else:
                logger.error(f"[ERROR] Backend retornou status {response.status_code}")
                return False
        except Exception as e:
            logger.error(f"[ERROR] Erro ao testar backend: {e}")
            return False
    
    def run_continuous(self, interval_minutes: int = 15, symbols: list = None):
        """Executa coleta contínua de dados"""
        if symbols is None:
            symbols = ["EURUSD", "GBPUSD", "USDJPY"]
        
        logger.info(f"[START] Iniciando coleta continua - Intervalo: {interval_minutes} minutos")
        logger.info(f"[INFO] Simbolos monitorados: {', '.join(symbols)}")
        
        if not self.connect_mt5():
            logger.error("[ERROR] Falha na conexao MT5 - Abortando")
            return
        
        if not self.test_backend_connection():
            logger.error("[ERROR] Backend nao esta acessivel - Abortando")
            return
        
        cycle_count = 0
        
        try:
            while True:
                cycle_count += 1
                logger.info(f"[CYCLE] Ciclo {cycle_count} - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
                
                for symbol in symbols:
                    try:
                        # Coleta dados
                        data = self.get_market_data(symbol)
                        if data:
                            # Envia para backend
                            success = self.send_to_backend(data)
                            if not success:
                                logger.warning(f"[WARNING] Falha ao enviar dados para {symbol}")
                        else:
                            logger.warning(f"[WARNING] Falha ao coletar dados para {symbol}")
                        
                        # Pequena pausa entre símbolos
                        time.sleep(2)
                        
                    except Exception as e:
                        logger.error(f"[ERROR] Erro processando {symbol}: {e}")
                
                # Aguarda próximo ciclo
                sleep_seconds = interval_minutes * 60
                logger.info(f"[WAIT] Aguardando {interval_minutes} minutos ate proximo ciclo...")
                time.sleep(sleep_seconds)
                
        except KeyboardInterrupt:
            logger.info("[STOP] Interrompido pelo usuario")
        except Exception as e:
            logger.error(f"[CRITICAL] Erro critico: {e}")
        finally:
            logger.info("[END] Finalizando interface MT5")

def main():
    """Função principal"""
    print("Auto-Trader MT5 Interface")
    print("=" * 40)
    
    # Configurações
    backend_url = "http://localhost:4000"
    interval_minutes = 1  # Para testes, usar 1 minuto
    symbols = ["EURUSD", "GBPUSD", "USDJPY", "USDCAD"]
    
    # Inicializa interface
    mt5_interface = MT5Interface(backend_url)
    
    # Executa teste único primeiro
    print("\n[TEST] Executando teste unico...")
    test_data = mt5_interface.get_market_data("EURUSD")
    if test_data:
        print(f"[DATA] Dados de teste: {json.dumps(test_data, indent=2)}")
        
        if mt5_interface.test_backend_connection():
            success = mt5_interface.send_to_backend(test_data)
            if success:
                print("[SUCCESS] Teste unico bem-sucedido!")
            else:
                print("[ERROR] Falha no teste unico")
                return
        else:
            print("[ERROR] Backend nao esta acessivel")
            return
    
    # Pergunta se deve continuar com execução contínua
    response = input("\n[INPUT] Executar coleta continua? (s/n): ").lower().strip()
    if response in ['s', 'sim', 'y', 'yes']:
        mt5_interface.run_continuous(interval_minutes, symbols)
    else:
        print("[END] Finalizando...")

if __name__ == "__main__":
    main()





from flask import Flask, request, jsonify
import threading

# --- Início da Seção Flask ---

app = Flask(__name__)
mt5_interface_instance = None

def create_flask_app(interface_instance):
    """Cria e configura a aplicação Flask."""
    global mt5_interface_instance
    mt5_interface_instance = interface_instance
    return app

@app.route('/execute_order', methods=['POST'])
def handle_execute_order():
    """Endpoint para receber e executar ordens de trade."""
    if not mt5_interface_instance:
        return jsonify({'status': 'error', 'message': 'Interface MT5 não inicializada'}), 500

    order_data = request.get_json()
    if not order_data:
        return jsonify({'status': 'error', 'message': 'Payload JSON inválido'}), 400

    logger.info(f"[Flask] Recebida solicitação de ordem: {order_data}")

    # Validação básica dos dados da ordem
    required_fields = ['asset', 'action', 'volume']
    if not all(field in order_data for field in required_fields):
        return jsonify({'status': 'error', 'message': f'Campos obrigatórios ausentes: {required_fields}'}), 400

    # Executar a ordem (simulada)
    result = mt5_interface_instance.execute_mt5_order(order_data)

    if result['status'] == 'success':
        return jsonify(result), 200
    else:
        return jsonify(result), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Verifica a saúde do serviço da interface MT5."""
    return jsonify({'status': 'ok', 'message': 'Serviço de interface MT5 está ativo'}), 200

# --- Fim da Seção Flask ---

class MT5Interface:
    def __init__(self, backend_url: str = "http://localhost:4000"):
        self.backend_url = backend_url
        self.api_endpoint = f"{backend_url}/api/trades"
        self.test_mode = True
        self.flask_thread = None

    def execute_mt5_order(self, order_details: Dict) -> Dict:
        """Simula a execução de uma ordem no MetaTrader 5."""
        try:
            asset = order_details['asset']
            action = order_details['action'].upper()  # BUY ou SELL
            volume = order_details['volume']
            stop_loss = order_details.get('stop_loss')
            take_profit = order_details.get('take_profit')

            logger.info(f"[MT5-SIM] Executando ordem: {action} {volume} de {asset}")

            if self.test_mode:
                # Simulação de execução
                order_id = int(time.time() * 1000)
                logger.info(f"[MT5-SIM] Ordem {order_id} executada com sucesso.")
                return {
                    'status': 'success',
                    'message': 'Ordem executada com sucesso (simulado)',
                    'orderId': order_id,
                    'details': order_details
                }

            # Lógica de execução real com MetaTrader5
            try:
                import MetaTrader5 as mt5
                
                # Verificar se o símbolo existe
                symbol_info = mt5.symbol_info(asset)
                if symbol_info is None:
                    logger.error(f"[MT5] Ativo {asset} nao encontrado")
                    return {'status': 'error', 'message': f'Ativo {asset} nao encontrado'}

                # Verificar se o símbolo está visível no Market Watch
                if not symbol_info.visible:
                    logger.info(f"[MT5] Adicionando {asset} ao Market Watch")
                    if not mt5.symbol_select(asset, True):
                        return {'status': 'error', 'message': f'Falha ao adicionar {asset} ao Market Watch'}

                # Mapear ação para tipo de ordem
                order_type_map = {'BUY': mt5.ORDER_TYPE_BUY, 'SELL': mt5.ORDER_TYPE_SELL}
                order_type = order_type_map.get(action)

                if order_type is None:
                    return {'status': 'error', 'message': f'Acao invalida: {action}'}

                # Obter preço atual
                tick = mt5.symbol_info_tick(asset)
                if tick is None:
                    return {'status': 'error', 'message': f'Nao foi possivel obter preco para {asset}'}
                
                price = tick.ask if action == 'BUY' else tick.bid

                # Preparar requisição de ordem
                request = {
                    "action": mt5.TRADE_ACTION_DEAL,
                    "symbol": asset,
                    "volume": float(volume),
                    "type": order_type,
                    "price": price,
                    "sl": float(stop_loss) if stop_loss else 0.0,
                    "tp": float(take_profit) if take_profit else 0.0,
                    "magic": 202401,
                    "comment": "Auto-Trader AI Order",
                    "type_time": mt5.ORDER_TIME_GTC,
                    "type_filling": mt5.ORDER_FILLING_IOC,
                }

                # Enviar ordem
                result = mt5.order_send(request)

                if result.retcode != mt5.TRADE_RETCODE_DONE:
                    logger.error(f"[MT5] Falha ao enviar ordem: {result.comment}")
                    return {
                        'status': 'error', 
                        'message': result.comment, 
                        'retcode': result.retcode,
                        'details': request
                    }

                logger.info(f"[MT5] Ordem {result.order} executada com sucesso - {action} {volume} {asset} a {price}")
                return {
                    'status': 'success', 
                    'message': 'Ordem executada com sucesso no MT5', 
                    'orderId': result.order,
                    'price': price,
                    'volume': volume,
                    'details': request
                }
                
            except ImportError:
                logger.warning("[WARNING] MetaTrader5 nao disponivel, simulando execucao")
                self.test_mode = True
                return self.execute_mt5_order(order_details)  # Recursão para simular

        except Exception as e:
            logger.error(f"[MT5-SIM] Erro ao executar ordem: {e}")
            return {'status': 'error', 'message': str(e)}

    def start_flask_server(self):
        """Inicia o servidor Flask em uma thread separada."""
        app = create_flask_app(self)
        self.flask_thread = threading.Thread(target=lambda: app.run(host='0.0.0.0', port=5000, debug=False))
        self.flask_thread.daemon = True
        self.flask_thread.start()
        logger.info("[FLASK] Servidor Flask para ordens iniciado na porta 5000")

    def run_continuous(self, interval_minutes: int = 15, symbols: list = None):
        """Executa coleta contínua de dados e inicia o servidor de ordens."""
        # Inicia o servidor Flask
        self.start_flask_server()

        if symbols is None:
            symbols = ["EURUSD", "GBPUSD", "USDJPY"]
        
        logger.info(f"[START] Iniciando coleta continua - Intervalo: {interval_minutes} minutos")
        logger.info(f"[INFO] Simbolos monitorados: {', '.join(symbols)}")
        
        if not self.connect_mt5():
            logger.error("[ERROR] Falha na conexao MT5 - Abortando")
            return
        
        if not self.test_backend_connection():
            logger.error("[ERROR] Backend nao esta acessivel - Abortando")
            return
        
        cycle_count = 0
        
        try:
            while True:
                cycle_count += 1
                logger.info(f"[CYCLE] Ciclo {cycle_count} - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
                
                for symbol in symbols:
                    try:
                        data = self.get_market_data(symbol)
                        if data:
                            success = self.send_to_backend(data)
                            if not success:
                                logger.warning(f"[WARNING] Falha ao enviar dados para {symbol}")
                        else:
                            logger.warning(f"[WARNING] Falha ao coletar dados para {symbol}")
                        
                        time.sleep(2)
                        
                    except Exception as e:
                        logger.error(f"[ERROR] Erro processando {symbol}: {e}")
                
                sleep_seconds = interval_minutes * 60
                logger.info(f"[WAIT] Aguardando {interval_minutes} minutos ate proximo ciclo...")
                time.sleep(sleep_seconds)
                
        except KeyboardInterrupt:
            logger.info("[STOP] Interrompido pelo usuario")
        finally:
            logger.info("[END] Finalizando interface MT5")

# A função main e a inicialização da classe MT5Interface permanecem as mesmas.
# A chamada a run_continuous agora também iniciará o servidor Flask.

