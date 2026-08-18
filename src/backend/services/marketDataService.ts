import { CandleData, DigitStat, MarketAsset, TickData } from '../types';

export const INITIAL_DERIV_MARKETS: MarketAsset[] = [
  {
    id: 'vol_75',
    name: 'Volatility 75 Index',
    symbol: 'R_75',
    category: 'volatility',
    platform: 'deriv',
    currentPrice: 4522.17,
    change24h: 1.45,
    trend: 'strong_bullish',
    volatility: 'high',
    signalStrength: 94,
    pipSize: 0.01,
    digits: 2,
  },
  {
    id: 'vol_100',
    name: 'Volatility 100 Index',
    symbol: 'R_100',
    category: 'volatility',
    platform: 'deriv',
    currentPrice: 2184.65,
    change24h: -0.82,
    trend: 'bearish',
    volatility: 'high',
    signalStrength: 88,
    pipSize: 0.01,
    digits: 2,
  },
  {
    id: 'vol_50',
    name: 'Volatility 50 Index',
    symbol: 'R_50',
    category: 'volatility',
    platform: 'deriv',
    currentPrice: 341.28,
    change24h: 0.64,
    trend: 'bullish',
    volatility: 'medium',
    signalStrength: 82,
    pipSize: 0.0001,
    digits: 4,
  },
  {
    id: 'vol_25',
    name: 'Volatility 25 Index',
    symbol: 'R_25',
    category: 'volatility',
    platform: 'deriv',
    currentPrice: 1890.42,
    change24h: -0.15,
    trend: 'neutral',
    volatility: 'medium',
    signalStrength: 75,
    pipSize: 0.01,
    digits: 2,
  },
  {
    id: 'vol_10',
    name: 'Volatility 10 Index',
    symbol: 'R_10',
    category: 'volatility',
    platform: 'deriv',
    currentPrice: 9540.30,
    change24h: 0.28,
    trend: 'bullish',
    volatility: 'low',
    signalStrength: 79,
    pipSize: 0.01,
    digits: 2,
  },
  {
    id: 'vol_75_1s',
    name: 'Volatility 75 (1s) Index',
    symbol: '1HZ75V',
    category: 'volatility_1s',
    platform: 'deriv',
    currentPrice: 10452.88,
    change24h: 2.10,
    trend: 'strong_bullish',
    volatility: 'extreme',
    signalStrength: 92,
    pipSize: 0.01,
    digits: 2,
  },
  {
    id: 'vol_100_1s',
    name: 'Volatility 100 (1s) Index',
    symbol: '1HZ100V',
    category: 'volatility_1s',
    platform: 'deriv',
    currentPrice: 1892.15,
    change24h: -1.25,
    trend: 'strong_bearish',
    volatility: 'extreme',
    signalStrength: 91,
    pipSize: 0.01,
    digits: 2,
  },
  {
    id: 'boom_1000',
    name: 'Boom 1000 Index',
    symbol: 'BOOM1000',
    category: 'boom',
    platform: 'deriv',
    currentPrice: 12450.50,
    change24h: 3.12,
    trend: 'bullish',
    volatility: 'extreme',
    signalStrength: 91,
    pipSize: 0.01,
    digits: 2,
  },
  {
    id: 'boom_500',
    name: 'Boom 500 Index',
    symbol: 'BOOM500',
    category: 'boom',
    platform: 'deriv',
    currentPrice: 8740.10,
    change24h: 1.84,
    trend: 'bullish',
    volatility: 'high',
    signalStrength: 85,
    pipSize: 0.01,
    digits: 2,
  },
  {
    id: 'crash_1000',
    name: 'Crash 1000 Index',
    symbol: 'CRASH1000',
    category: 'crash',
    platform: 'deriv',
    currentPrice: 6320.80,
    change24h: -2.75,
    trend: 'bearish',
    volatility: 'extreme',
    signalStrength: 90,
    pipSize: 0.01,
    digits: 2,
  },
  {
    id: 'crash_500',
    name: 'Crash 500 Index',
    symbol: 'CRASH500',
    category: 'crash',
    platform: 'deriv',
    currentPrice: 4890.35,
    change24h: -1.90,
    trend: 'bearish',
    volatility: 'high',
    signalStrength: 87,
    pipSize: 0.01,
    digits: 2,
  },
  {
    id: 'step_100',
    name: 'Step Index',
    symbol: 'STEP',
    category: 'step',
    platform: 'deriv',
    currentPrice: 8320.10,
    change24h: 0.40,
    trend: 'neutral',
    volatility: 'medium',
    signalStrength: 77,
    pipSize: 0.1,
    digits: 1,
  },
];

export const INITIAL_MT5_MARKETS: MarketAsset[] = [
  {
    id: 'eur_usd',
    name: 'EUR/USD (Euro / US Dollar)',
    symbol: 'EURUSD',
    category: 'forex',
    platform: 'mt5',
    currentPrice: 1.17420,
    change24h: 0.35,
    trend: 'bullish',
    volatility: 'medium',
    signalStrength: 89,
    pipSize: 0.0001,
    digits: 5,
  },
  {
    id: 'gbp_usd',
    name: 'GBP/USD (British Pound / US Dollar)',
    symbol: 'GBPUSD',
    category: 'forex',
    platform: 'mt5',
    currentPrice: 1.30450,
    change24h: -0.42,
    trend: 'bearish',
    volatility: 'high',
    signalStrength: 84,
    pipSize: 0.0001,
    digits: 5,
  },
  {
    id: 'usd_jpy',
    name: 'USD/JPY (US Dollar / Japanese Yen)',
    symbol: 'USDJPY',
    category: 'forex',
    platform: 'mt5',
    currentPrice: 154.620,
    change24h: 0.58,
    trend: 'strong_bullish',
    volatility: 'high',
    signalStrength: 86,
    pipSize: 0.01,
    digits: 3,
  },
  {
    id: 'xau_usd',
    name: 'Gold (XAU/USD)',
    symbol: 'XAUUSD',
    category: 'commodities',
    platform: 'mt5',
    currentPrice: 2894.40,
    change24h: 1.12,
    trend: 'strong_bullish',
    volatility: 'high',
    signalStrength: 92,
    pipSize: 0.01,
    digits: 2,
  },
  {
    id: 'us_30',
    name: 'Wall Street 30 (US30)',
    symbol: 'US30',
    category: 'indices',
    platform: 'mt5',
    currentPrice: 44120.0,
    change24h: 0.75,
    trend: 'bullish',
    volatility: 'high',
    signalStrength: 88,
    pipSize: 1.0,
    digits: 1,
  },
  {
    id: 'us_500',
    name: 'US 500 (S&P 500)',
    symbol: 'US500',
    category: 'indices',
    platform: 'mt5',
    currentPrice: 6025.40,
    change24h: 0.62,
    trend: 'bullish',
    volatility: 'medium',
    signalStrength: 81,
    pipSize: 0.1,
    digits: 2,
  },
  {
    id: 'btc_usd',
    name: 'Bitcoin (BTC/USD)',
    symbol: 'BTCUSD',
    category: 'crypto',
    platform: 'mt5',
    currentPrice: 96840.0,
    change24h: 2.80,
    trend: 'strong_bullish',
    volatility: 'extreme',
    signalStrength: 93,
    pipSize: 1.0,
    digits: 2,
  },
];

// Helper to extract the last digit of a number given decimal precision
export function extractLastDigit(price: number, digits: number): number {
  const formatted = price.toFixed(digits);
  const lastChar = formatted.charAt(formatted.length - 1);
  const digit = parseInt(lastChar, 10);
  return isNaN(digit) ? 0 : digit;
}

// Generate realistic initial candles for a market
export function generateInitialCandles(basePrice: number, count = 40, digits = 2): CandleData[] {
  const candles: CandleData[] = [];
  const now = Date.now();
  let currentClose = basePrice;
  const timeStep = 60 * 1000; // 1 min

  for (let i = count - 1; i >= 0; i--) {
    const time = now - i * timeStep;
    const volatilityPct = 0.0015;
    const delta = (Math.random() - 0.49) * currentClose * volatilityPct;
    const open = currentClose;
    const close = Number((open + delta).toFixed(digits));
    const high = Number((Math.max(open, close) + Math.random() * Math.abs(delta) * 0.8).toFixed(digits));
    const low = Number((Math.min(open, close) - Math.random() * Math.abs(delta) * 0.8).toFixed(digits));
    const volume = Math.floor(100 + Math.random() * 500);

    candles.push({ time, open, high, low, close, volume });
    currentClose = close;
  }
  return candles;
}

// Generate initial ticks
export function generateInitialTicks(basePrice: number, count = 50, digits = 2): TickData[] {
  const ticks: TickData[] = [];
  let price = basePrice;
  const now = Date.now();

  for (let i = count - 1; i >= 0; i--) {
    const change = (Math.random() - 0.495) * (basePrice * 0.0004);
    price = Number((price + change).toFixed(digits));
    const lastDigit = extractLastDigit(price, digits);
    ticks.push({
      id: count - i,
      timestamp: now - i * 1000,
      price,
      lastDigit,
      direction: change >= 0 ? 'up' : 'down',
    });
  }
  return ticks;
}

// Calculate Digit Statistics and assign exact color ranking
export function calculateDigitStats(ticks: TickData[], sampleSize = 100): DigitStat[] {
  const sample = ticks.slice(-sampleSize);
  const total = sample.length || 1;
  const counts: number[] = Array(10).fill(0);

  sample.forEach(t => {
    if (t.lastDigit >= 0 && t.lastDigit <= 9) {
      counts[t.lastDigit]++;
    }
  });

  const stats: DigitStat[] = counts.map((count, digit) => ({
    digit,
    count,
    percentage: (count / total) * 100,
    rank: 'neutral',
    colorTag: 'neutral',
  }));

  // Sort indices by percentage descending to find highest, 2nd highest, 2nd lowest, lowest
  const sorted = [...stats].sort((a, b) => b.percentage - a.percentage);

  if (sorted.length >= 10) {
    const highestDigit = sorted[0].digit;
    const secondHighestDigit = sorted[1].digit;
    const secondLowestDigit = sorted[sorted.length - 2].digit;
    const lowestDigit = sorted[sorted.length - 1].digit;

    stats.forEach(s => {
      if (s.digit === highestDigit) {
        s.rank = 'highest';
        s.colorTag = 'green'; // Green: Highest percentage
      } else if (s.digit === secondHighestDigit) {
        s.rank = 'second_highest';
        s.colorTag = 'blue'; // Blue: Second-highest percentage
      } else if (s.digit === lowestDigit) {
        s.rank = 'lowest';
        s.colorTag = 'red'; // Red: Lowest percentage
      } else if (s.digit === secondLowestDigit) {
        s.rank = 'second_lowest';
        s.colorTag = 'yellow'; // Yellow: Second-lowest percentage
      } else {
        s.rank = 'neutral';
        s.colorTag = 'neutral';
      }
    });
  }

  return stats;
}
