import { EMA, ADX, BollingerBands, RSI } from 'technicalindicators';

// ==========================================
// 1. DATA STRUCTURES & INTERFACES
// ==========================================

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TradeSignal {
  symbol: string;
  strategyName: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  signalStrength: number; // 0 to 100%
  timestamp: number;
}

// ==========================================
// 2. CROSS-MARKET STRATEGY EVALUATORS
// ==========================================

export class StrategyScanner {
  
  /**
   * Strategy 1: ADX + EMA 14 Strategy
   * Works on Forex & Deriv Synthetic CFDs
   */
  public static evaluateADXEMA(symbol: string, candles: Candle[]): TradeSignal | null {
    if (candles.length < 50) return null;

    const closes = candles.map(c => c.close);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);

    const ema14 = EMA.calculate({ period: 14, values: closes });
    const adxResult = ADX.calculate({ high: highs, low: lows, close: closes, period: 14 });

    const currentIdx = candles.length - 1;
    const currentPrice = closes[currentIdx];
    const currentEMA = ema14[ema14.length - 1];
    const currentADX = adxResult[adxResult.length - 1];

    if (!currentADX || currentADX.adx < 20) return null; // ADX strength threshold

    const atr = Math.abs(highs[currentIdx] - lows[currentIdx]) || currentPrice * 0.001; 

    // Buy Logic: +DI > -DI, Price above EMA 14, ADX > 20
    if (currentADX.pdi > currentADX.mdi && currentPrice > currentEMA) {
      const strength = Math.min(Math.round(currentADX.adx * 1.5), 100);
      return {
        symbol,
        strategyName: 'ADX-EMA Trend Pullback',
        type: 'BUY',
        entryPrice: currentPrice,
        stopLoss: Number((currentEMA - (atr * 1.5)).toFixed(5)), // Stop loss space beyond EMA
        takeProfit: Number((currentPrice + (atr * 3.0)).toFixed(5)), // 1:2 R:R Ratio
        signalStrength: strength,
        timestamp: Date.now()
      };
    }

    // Sell Logic: -DI > +DI, Price below EMA 14, ADX > 20
    if (currentADX.mdi > currentADX.pdi && currentPrice < currentEMA) {
      const strength = Math.min(Math.round(currentADX.adx * 1.5), 100);
      return {
        symbol,
        strategyName: 'ADX-EMA Trend Pullback',
        type: 'SELL',
        entryPrice: currentPrice,
        stopLoss: Number((currentEMA + (atr * 1.5)).toFixed(5)),
        takeProfit: Number((currentPrice - (atr * 3.0)).toFixed(5)),
        signalStrength: strength,
        timestamp: Date.now()
      };
    }

    return null;
  }

  /**
   * Strategy 2: Bollinger Band Squeeze Strategy
   */
  public static evaluateBBSqueeze(symbol: string, candles: Candle[]): TradeSignal | null {
    if (candles.length < 30) return null;

    const closes = candles.map(c => c.close);
    const bb = BollingerBands.calculate({ period: 20, stdDev: 2, values: closes });

    if (bb.length < 2) return null;

    const currBB = bb[bb.length - 1];
    const prevBB = bb[bb.length - 2];
    const currentCandle = candles[candles.length - 1];

    const prevBandwidth = (prevBB.upper - prevBB.lower) / prevBB.middle;
    const currBandwidth = (currBB.upper - currBB.lower) / currBB.middle;

    // Squeeze Expansion Check: Bandwidth was compressed and is now widening
    const isExpanding = currBandwidth > prevBandwidth * 1.15;
    if (!isExpanding) return null;

    // Bullish Breakout
    if (currentCandle.close > currBB.upper) {
      return {
        symbol,
        strategyName: 'Bollinger Band Squeeze Breakout',
        type: 'BUY',
        entryPrice: currentCandle.close,
        stopLoss: Number(currBB.middle.toFixed(5)), // Opposite side/Middle band
        takeProfit: Number((currentCandle.close + (currBB.upper - currBB.middle) * 2).toFixed(5)),
        signalStrength: 85,
        timestamp: Date.now()
      };
    }

    // Bearish Breakout
    if (currentCandle.close < currBB.lower) {
      return {
        symbol,
        strategyName: 'Bollinger Band Squeeze Breakout',
        type: 'SELL',
        entryPrice: currentCandle.close,
        stopLoss: Number(currBB.middle.toFixed(5)),
        takeProfit: Number((currentCandle.close - (currBB.middle - currBB.lower) * 2).toFixed(5)),
        signalStrength: 85,
        timestamp: Date.now()
      };
    }

    return null;
  }

  /**
   * Strategy 3: RSI Divergence Strategy
   */
  public static evaluateRSIDivergence(symbol: string, candles: Candle[]): TradeSignal | null {
    if (candles.length < 50) return null;

    const closes = candles.map(c => c.close);
    const rsiValues = RSI.calculate({ period: 14, values: closes });

    const cLen = candles.length - 1;
    const rLen = rsiValues.length - 1;

    if (cLen < 10 || rLen < 10) return null;

    const priceCurrent = closes[cLen];
    const pricePrior = closes[cLen - 10];
    const rsiCurrent = rsiValues[rLen];
    const rsiPrior = rsiValues[rLen - 10];

    // Bullish Divergence: Price lower low, RSI higher low
    if (priceCurrent < pricePrior && rsiCurrent > rsiPrior && rsiCurrent < 35) {
      return {
        symbol,
        strategyName: 'RSI Divergence Reversal',
        type: 'BUY',
        entryPrice: priceCurrent,
        stopLoss: Number((priceCurrent * 0.995).toFixed(5)),
        takeProfit: Number((priceCurrent * 1.01).toFixed(5)),
        signalStrength: 78,
        timestamp: Date.now()
      };
    }

    // Bearish Divergence: Price higher high, RSI lower high
    if (priceCurrent > pricePrior && rsiCurrent < rsiPrior && rsiCurrent > 65) {
      return {
        symbol,
        strategyName: 'RSI Divergence Reversal',
        type: 'SELL',
        entryPrice: priceCurrent,
        stopLoss: Number((priceCurrent * 1.005).toFixed(5)),
        takeProfit: Number((priceCurrent * 0.99).toFixed(5)),
        signalStrength: 78,
        timestamp: Date.now()
      };
    }

    return null;
  }
}

// ==========================================
// 3. MULTI-MARKET REAL-TIME SCANNER ENGINE
// ==========================================

export class MarketScannerEngine {
  private markets: string[];

  constructor(markets: string[]) {
    this.markets = markets;
  }

  /**
   * Scans all configured markets sequentially and returns actionable signals.
   * Interfacable directly with TradingView chart handlers or execution APIs.
   */
  public async scanAllMarkets(fetchMarketCandles: (symbol: string) => Promise<Candle[]>): Promise<TradeSignal[]> {
    const activeSignals: TradeSignal[] = [];

    for (const symbol of this.markets) {
      try {
        const candles = await fetchMarketCandles(symbol);
        if (!candles || candles.length === 0) continue;
        
        // Evaluate configured cross-market strategies
        const adxSignal = StrategyScanner.evaluateADXEMA(symbol, candles);
        if (adxSignal) activeSignals.push(adxSignal);

        const bbSignal = StrategyScanner.evaluateBBSqueeze(symbol, candles);
        if (bbSignal) activeSignals.push(bbSignal);

        const rsiSignal = StrategyScanner.evaluateRSIDivergence(symbol, candles);
        if (rsiSignal) activeSignals.push(rsiSignal);

      } catch (error) {
        console.error(`Failed to scan market: ${symbol}`, error);
      }
    }

    // Sort by signal strength descending to prioritize the strongest trade setup
    return activeSignals.sort((a, b) => b.signalStrength - a.signalStrength);
  }
}

// ==========================================
// 4. TRADINGVIEW & DERIV CONNECTOR UTILITY
// ==========================================

// Forex & Deriv Synthetic Pairs List
export const TARGET_MARKETS = [
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', // Standard Forex
  'HZ10V', 'HZ25V', 'HZ50V', 'HZ75V', 'HZ100V' // Deriv Volatility Indices (CFDs/Multipliers)
];

/**
 * Live Scanner Execution Wrapper
 */
export async function runRealTimeScanner(
  candleDataFetcher: (symbol: string) => Promise<Candle[]>
): Promise<TradeSignal | null> {
  const engine = new MarketScannerEngine(TARGET_MARKETS);
  
  const signals = await engine.scanAllMarkets(candleDataFetcher);

  if (signals.length > 0) {
    const topSignal = signals[0]; // Highest confidence setup
    return topSignal;
  } else {
    return null;
  }
}
