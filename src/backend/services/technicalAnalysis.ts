import { CandleData, SmcOverlay } from '../types';

export function calculateEMA(prices: number[], period: number): number[] {
  if (prices.length < period) return Array(prices.length).fill(0);
  const k = 2 / (period + 1);
  const emaArray: number[] = [];
  
  // First EMA is simple SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += prices[i];
  }
  let prevEma = sum / period;
  for (let i = 0; i < period - 1; i++) {
    emaArray.push(prices[i]);
  }
  emaArray.push(prevEma);

  for (let i = period; i < prices.length; i++) {
    const currentEma = prices[i] * k + prevEma * (1 - k);
    emaArray.push(currentEma);
    prevEma = currentEma;
  }
  return emaArray;
}

export function calculateSmoothedMA(prices: number[], period: number): number[] {
  if (prices.length < period) return Array(prices.length).fill(0);
  const smma: number[] = [];
  let sum = 0;
  for (let i = 0; i < period; i++) sum += prices[i];
  let prev = sum / period;
  for (let i = 0; i < period - 1; i++) smma.push(prices[i]);
  smma.push(prev);

  for (let i = period; i < prices.length; i++) {
    const current = (prev * (period - 1) + prices[i]) / period;
    smma.push(current);
    prev = current;
  }
  return smma;
}

export function calculateBollingerBands(prices: number[], period = 20, multiplier = 2) {
  const upper: number[] = [];
  const middle: number[] = [];
  const lower: number[] = [];

  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      upper.push(prices[i]);
      middle.push(prices[i]);
      lower.push(prices[i]);
      continue;
    }
    const slice = prices.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    middle.push(mean);
    upper.push(mean + multiplier * stdDev);
    lower.push(mean - multiplier * stdDev);
  }

  return { upper, middle, lower };
}

export function calculateRSI(prices: number[], period = 14): number[] {
  if (prices.length < period + 1) return Array(prices.length).fill(50);
  const rsi: number[] = [];
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = 0; i < period; i++) {
    rsi.push(50);
  }

  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  rsi.push(100 - 100 / (1 + rs));

  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const currentRs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi.push(100 - 100 / (1 + currentRs));
  }

  return rsi;
}

export function calculateStochasticRSI(prices: number[], rsiPeriod = 14, stochPeriod = 14, kSmooth = 3, dSmooth = 3) {
  const rsi = calculateRSI(prices, rsiPeriod);
  const stochK: number[] = [];

  for (let i = 0; i < rsi.length; i++) {
    if (i < stochPeriod - 1) {
      stochK.push(50);
      continue;
    }
    const slice = rsi.slice(i - stochPeriod + 1, i + 1);
    const minRsi = Math.min(...slice);
    const maxRsi = Math.max(...slice);
    const denominator = maxRsi - minRsi;
    const kVal = denominator === 0 ? 50 : ((rsi[i] - minRsi) / denominator) * 100;
    stochK.push(kVal);
  }

  const kLine = calculateEMA(stochK, kSmooth);
  const dLine = calculateEMA(kLine, dSmooth);

  return { kLine, dLine, rsi };
}

export function calculateCCI(candles: CandleData[], period = 20): number[] {
  const cci: number[] = [];
  const tpList = candles.map(c => (c.high + c.low + c.close) / 3);

  for (let i = 0; i < tpList.length; i++) {
    if (i < period - 1) {
      cci.push(0);
      continue;
    }
    const slice = tpList.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const meanDev = slice.reduce((a, b) => a + Math.abs(b - mean), 0) / period;
    const val = meanDev === 0 ? 0 : (tpList[i] - mean) / (0.015 * meanDev);
    cci.push(val);
  }
  return cci;
}

export function calculateMACD(prices: number[], fast = 12, slow = 26, signal = 9) {
  const fastEMA = calculateEMA(prices, fast);
  const slowEMA = calculateEMA(prices, slow);
  const macdLine = fastEMA.map((f, i) => f - slowEMA[i]);
  const signalLine = calculateEMA(macdLine, signal);
  const histogram = macdLine.map((m, i) => m - signalLine[i]);

  return { macdLine, signalLine, histogram };
}

export function calculateADX(candles: CandleData[], period = 14) {
  const plusDM: number[] = [];
  const minusDM: number[] = [];
  const tr: number[] = [];

  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      plusDM.push(0);
      minusDM.push(0);
      tr.push(candles[i].high - candles[i].low);
      continue;
    }
    const current = candles[i];
    const prev = candles[i - 1];

    const upMove = current.high - prev.high;
    const downMove = prev.low - current.low;

    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);

    const trueRange = Math.max(
      current.high - current.low,
      Math.abs(current.high - prev.close),
      Math.abs(current.low - prev.close)
    );
    tr.push(trueRange);
  }

  const smoothedTR = calculateSmoothedMA(tr, period);
  const smoothedPlusDM = calculateSmoothedMA(plusDM, period);
  const smoothedMinusDM = calculateSmoothedMA(minusDM, period);

  const plusDI = smoothedPlusDM.map((p, i) => (smoothedTR[i] === 0 ? 0 : (p / smoothedTR[i]) * 100));
  const minusDI = smoothedMinusDM.map((m, i) => (smoothedTR[i] === 0 ? 0 : (m / smoothedTR[i]) * 100));

  const dx = plusDI.map((p, i) => {
    const m = minusDI[i];
    const sum = p + m;
    return sum === 0 ? 0 : (Math.abs(p - m) / sum) * 100;
  });

  const adx = calculateSmoothedMA(dx, period);
  return { adx, plusDI, minusDI };
}

export function calculateDonchianChannels(candles: CandleData[], period = 20) {
  const upper: number[] = [];
  const middle: number[] = [];
  const lower: number[] = [];

  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      upper.push(candles[i].high);
      lower.push(candles[i].low);
      middle.push((candles[i].high + candles[i].low) / 2);
      continue;
    }
    const slice = candles.slice(i - period + 1, i + 1);
    const maxHigh = Math.max(...slice.map(c => c.high));
    const minLow = Math.min(...slice.map(c => c.low));
    const mid = (maxHigh + minLow) / 2;

    upper.push(maxHigh);
    lower.push(minLow);
    middle.push(mid);
  }

  return { upper, middle, lower };
}

export function detectCandlePatterns(candles: CandleData[]) {
  return candles.map((candle, i) => {
    const body = Math.abs(candle.close - candle.open);
    const range = candle.high - candle.low;
    const isDoji = range > 0 && body / range < 0.1;
    const upperWick = candle.high - Math.max(candle.open, candle.close);
    const lowerWick = Math.min(candle.open, candle.close) - candle.low;
    const isMarubozu = range > 0 && (upperWick / range < 0.05) && (lowerWick / range < 0.05);

    let isEngulfing: 'bullish' | 'bearish' | undefined = undefined;
    let isInsideBar = false;

    if (i > 0) {
      const prev = candles[i - 1];
      const prevBody = Math.abs(prev.close - prev.open);
      
      // Bullish Engulfing
      if (prev.close < prev.open && candle.close > candle.open && candle.close >= prev.open && candle.open <= prev.close && body > prevBody) {
        isEngulfing = 'bullish';
      }
      // Bearish Engulfing
      else if (prev.close > prev.open && candle.close < candle.open && candle.close <= prev.open && candle.open >= prev.close && body > prevBody) {
        isEngulfing = 'bearish';
      }

      // Inside Bar
      if (candle.high <= prev.high && candle.low >= prev.low) {
        isInsideBar = true;
      }
    }

    return {
      ...candle,
      isDoji,
      isMarubozu,
      isEngulfing,
      isInsideBar,
    };
  });
}

export function detectSMCOverlays(candles: CandleData[]): SmcOverlay[] {
  const overlays: SmcOverlay[] = [];
  if (candles.length < 5) return overlays;

  // 1. Fair Value Gaps (FVG) - 3 candle sequence
  for (let i = 2; i < candles.length; i++) {
    const c1 = candles[i - 2];
    const c2 = candles[i - 1];
    const c3 = candles[i];

    // Bullish FVG: Low of candle 3 is higher than High of candle 1
    if (c3.low > c1.high && c2.close > c2.open) {
      overlays.push({
        type: 'fvg',
        price: (c3.low + c1.high) / 2,
        priceUpper: c3.low,
        priceLower: c1.high,
        timeStart: c1.time,
        timeEnd: c3.time,
        direction: 'bullish',
        label: 'Bullish FVG',
        strength: 85,
      });
    }

    // Bearish FVG: High of candle 3 is lower than Low of candle 1
    if (c3.high < c1.low && c2.close < c2.open) {
      overlays.push({
        type: 'fvg',
        price: (c3.high + c1.low) / 2,
        priceUpper: c1.low,
        priceLower: c3.high,
        timeStart: c1.time,
        timeEnd: c3.time,
        direction: 'bearish',
        label: 'Bearish FVG',
        strength: 85,
      });
    }
  }

  // 2. Order Blocks (OB) - last opposing candle before displacement
  for (let i = 1; i < candles.length - 2; i++) {
    const c0 = candles[i];
    const c1 = candles[i + 1];
    const c2 = candles[i + 2];

    // Bullish OB: Bearish candle followed by strong 2-candle upward displacement
    if (c0.close < c0.open && c1.close > c1.open && c2.close > c2.open && (c2.close - c0.open) > (c0.open - c0.close) * 2) {
      overlays.push({
        type: 'order_block',
        price: c0.open,
        priceUpper: c0.high,
        priceLower: c0.low,
        timeStart: c0.time,
        direction: 'bullish',
        label: 'Bullish OB',
        strength: 92,
      });
    }

    // Bearish OB: Bullish candle followed by strong downward displacement
    if (c0.close > c0.open && c1.close < c1.open && c2.close < c2.open && (c0.open - c2.close) > (c0.close - c0.open) * 2) {
      overlays.push({
        type: 'order_block',
        price: c0.open,
        priceUpper: c0.high,
        priceLower: c0.low,
        timeStart: c0.time,
        direction: 'bearish',
        label: 'Bearish OB',
        strength: 92,
      });
    }
  }

  // 3. Break of Structure (BOS) & Change of Character (CHoCH)
  let lastSwingHigh = candles[0].high;
  let lastSwingLow = candles[0].low;

  for (let i = 3; i < candles.length; i++) {
    const c = candles[i];
    if (c.high > lastSwingHigh) {
      overlays.push({
        type: 'bos',
        price: lastSwingHigh,
        timeStart: c.time,
        direction: 'bullish',
        label: 'BOS (Break of Structure)',
        strength: 88,
      });
      lastSwingHigh = c.high;
    }
    if (c.low < lastSwingLow) {
      overlays.push({
        type: 'choch',
        price: lastSwingLow,
        timeStart: c.time,
        direction: 'bearish',
        label: 'CHoCH (Change of Character)',
        strength: 89,
      });
      lastSwingLow = c.low;
    }
  }

  return overlays.slice(-10); // Keep most recent 10 SMC events
}
