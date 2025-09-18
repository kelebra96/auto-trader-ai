"""
Módulo para cálculo de indicadores técnicos reais
"""
import numpy as np
import pandas as pd
from typing import Dict, Tuple

def calculate_rsi(prices: np.ndarray, period: int = 14) -> float:
    """Calcula o RSI (Relative Strength Index)"""
    if len(prices) < period + 1:
        return 50.0  # Valor neutro se não há dados suficientes
    
    deltas = np.diff(prices)
    gains = np.where(deltas > 0, deltas, 0)
    losses = np.where(deltas < 0, -deltas, 0)
    
    avg_gain = np.mean(gains[-period:])
    avg_loss = np.mean(losses[-period:])
    
    if avg_loss == 0:
        return 100.0
    
    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    return round(rsi, 2)

def calculate_macd(prices: np.ndarray, fast: int = 12, slow: int = 26, signal: int = 9) -> Tuple[float, float]:
    """Calcula MACD e linha de sinal"""
    if len(prices) < slow:
        return 0.0, 0.0
    
    # Calcular EMAs
    ema_fast = calculate_ema(prices, fast)
    ema_slow = calculate_ema(prices, slow)
    
    # MACD = EMA rápida - EMA lenta
    macd_line = ema_fast - ema_slow
    
    # Linha de sinal (EMA do MACD)
    if len(prices) >= slow + signal:
        # Calcular histórico do MACD para a linha de sinal
        macd_history = []
        for i in range(slow, len(prices)):
            ema_f = calculate_ema(prices[:i+1], fast)
            ema_s = calculate_ema(prices[:i+1], slow)
            macd_history.append(ema_f - ema_s)
        
        signal_line = calculate_ema(np.array(macd_history), signal)
    else:
        signal_line = macd_line
    
    return round(macd_line, 6), round(signal_line, 6)

def calculate_ema(prices: np.ndarray, period: int) -> float:
    """Calcula EMA (Exponential Moving Average)"""
    if len(prices) < period:
        return np.mean(prices)
    
    alpha = 2 / (period + 1)
    ema = prices[0]
    
    for price in prices[1:]:
        ema = alpha * price + (1 - alpha) * ema
    
    return ema

def calculate_bollinger_bands(prices: np.ndarray, period: int = 20, std_dev: float = 2) -> Tuple[float, float, float]:
    """Calcula as Bandas de Bollinger"""
    if len(prices) < period:
        # Se não há dados suficientes, usar valores baseados no preço atual
        current_price = prices[-1]
        width = current_price * 0.02  # 2% de largura
        return current_price - width, current_price, current_price + width
    
    # Média móvel simples
    sma = np.mean(prices[-period:])
    
    # Desvio padrão
    std = np.std(prices[-period:])
    
    # Bandas
    upper_band = sma + (std_dev * std)
    lower_band = sma - (std_dev * std)
    
    return round(lower_band, 5), round(sma, 5), round(upper_band, 5)

def determine_trend(prices: np.ndarray, short_period: int = 10, long_period: int = 30) -> str:
    """Determina a tendência baseada em médias móveis"""
    if len(prices) < long_period:
        return "lateral"
    
    short_ma = np.mean(prices[-short_period:])
    long_ma = np.mean(prices[-long_period:])
    
    if short_ma > long_ma * 1.001:  # 0.1% de diferença mínima
        return "alta"
    elif short_ma < long_ma * 0.999:
        return "baixa"
    else:
        return "lateral"

def calculate_all_indicators(rates: np.ndarray, symbol: str) -> Dict:
    """Calcula todos os indicadores técnicos"""
    # Extrair preços de fechamento
    close_prices = rates['close']
    
    # Calcular indicadores
    rsi = calculate_rsi(close_prices)
    macd, macd_signal = calculate_macd(close_prices)
    bb_lower, bb_middle, bb_upper = calculate_bollinger_bands(close_prices)
    trend = determine_trend(close_prices)
    
    return {
        "ativo": symbol,
        "tendencia": trend,
        "macd": macd,
        "rsi": rsi,
        "bollinger": f"{bb_lower:.5f} - {bb_upper:.5f}",
        "timestamp": pd.Timestamp.now().isoformat(),
        "source": "MT5_Real",
        "price": round(close_prices[-1], 5),
        "bb_middle": bb_middle,
        "macd_signal": macd_signal
    }
