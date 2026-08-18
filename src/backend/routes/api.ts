import { Router, Request, Response } from 'express';
import { authRouter } from './auth';
import { mt5Router } from './mt5Bridge';
import { STRATEGY_CATALOG } from '../data/strategyCatalog';
import {
  INITIAL_DERIV_MARKETS,
  INITIAL_MT5_MARKETS,
  calculateDigitStats,
  generateInitialCandles,
  generateInitialTicks,
} from '../services/marketDataService';
import { evaluateAllStrategies, StrategyEvaluationContext } from '../services/strategyEngine';
import { detectSMCOverlays, detectCandlePatterns } from '../services/technicalAnalysis';
import { CandleData, TickData, MarketAsset } from '../types';

export const apiRouter = Router();

// Authentication Router
apiRouter.use('/auth', authRouter);

// MetaTrader 5 Bridge Router
apiRouter.use('/mt5', mt5Router);

// Health Check
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    system: 'MarketMindPro Core Engine',
    uptime: process.uptime(),
    timestamp: Date.now(),
    version: '2.4.0',
    capabilities: ['Deriv Synthetic Indices', 'MT5 SMC & Price Action', 'Real-time Digit Analysis'],
  });
});

// Markets Endpoint
apiRouter.get('/markets', (_req: Request, res: Response) => {
  res.json({
    deriv: INITIAL_DERIV_MARKETS,
    mt5: INITIAL_MT5_MARKETS,
  });
});

// Strategy Catalog Endpoint
apiRouter.get('/strategies', (_req: Request, res: Response) => {
  res.json({
    total: STRATEGY_CATALOG.length,
    strategies: STRATEGY_CATALOG,
  });
});

// Market Initial Seed Data (Candles & Ticks)
apiRouter.get('/markets/:marketId/seed', (req: Request, res: Response) => {
  const { marketId } = req.params;
  const allMarkets = [...INITIAL_DERIV_MARKETS, ...INITIAL_MT5_MARKETS];
  const market = allMarkets.find((m) => m.id === marketId) || INITIAL_DERIV_MARKETS[0];

  const candles = generateInitialCandles(market.currentPrice, 50, market.digits);
  const ticks = generateInitialTicks(market.currentPrice, 100, market.digits);
  const digitStats = calculateDigitStats(ticks, 100);
  const smcOverlays = detectSMCOverlays(candles);

  res.json({
    market,
    candles,
    ticks,
    digitStats,
    smcOverlays,
  });
});

// Real-time Strategy Evaluation Endpoint
apiRouter.post('/analyze', (req: Request, res: Response) => {
  try {
    const { asset, candles, ticks, digitStats, lastTickDigit, last20Digits, enabledStrategyIds } = req.body;

    const fallbackAsset: MarketAsset = asset || INITIAL_DERIV_MARKETS[0];
    const ticksArray: TickData[] = Array.isArray(ticks) ? ticks : [];
    const candlesArray: CandleData[] = Array.isArray(candles) ? candles : [];
    const safeDigitStats = digitStats || calculateDigitStats(ticksArray, 100);
    const safeLastTickDigit = typeof lastTickDigit === 'number' ? lastTickDigit : (ticksArray[ticksArray.length - 1]?.lastDigit ?? 0);
    const safeLast20Digits = Array.isArray(last20Digits) ? last20Digits : ticksArray.slice(-20).map((t) => t.lastDigit);

    const evaluationContext: StrategyEvaluationContext = {
      asset: fallbackAsset,
      candles: candlesArray,
      ticks: ticksArray,
      digitStats: safeDigitStats,
      lastTickDigit: safeLastTickDigit,
      last20Digits: safeLast20Digits,
      enabledStrategyIds,
    };

    const evaluationResult = evaluateAllStrategies(evaluationContext);

    res.json({
      success: true,
      timestamp: Date.now(),
      evaluatedCount: evaluationResult.scores.length,
      scores: evaluationResult.scores,
      winningStrategy: evaluationResult.winningStrategy,
      marketCondition: evaluationResult.marketCondition,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Strategy evaluation failed',
    });
  }
});

// Digit Analytics Calculation Endpoint
apiRouter.post('/calculate-digits', (req: Request, res: Response) => {
  try {
    const { ticks, sampleSize } = req.body;
    const ticksArray: TickData[] = Array.isArray(ticks) ? ticks : [];
    const size = typeof sampleSize === 'number' ? sampleSize : 100;
    const stats = calculateDigitStats(ticksArray, size);

    res.json({
      success: true,
      sampleSize: size,
      stats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Digit calculation failed',
    });
  }
});

// Smart Money Concepts & Technical Analysis Endpoint
apiRouter.post('/smc-analysis', (req: Request, res: Response) => {
  try {
    const { candles } = req.body;
    const candleArray: CandleData[] = Array.isArray(candles) ? candles : [];
    const smcOverlays = detectSMCOverlays(candleArray);
    const enrichedCandles = detectCandlePatterns(candleArray);

    res.json({
      success: true,
      overlays: smcOverlays,
      patterns: enrichedCandles.slice(-10).map((c) => ({
        time: c.time,
        isDoji: c.isDoji,
        isMarubozu: c.isMarubozu,
        isEngulfing: c.isEngulfing,
        isInsideBar: c.isInsideBar,
      })),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'SMC analysis failed',
    });
  }
});
