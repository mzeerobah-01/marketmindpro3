import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  AccountState,
  ActiveSignal,
  AppNotification,
  CandleData,
  DigitStat,
  MarketAsset,
  RiskManagementSettings,
  SignalHistoryItem,
  SmcOverlay,
  StrategyDefinition,
  StrategyScore,
  TickData,
} from './types';
import { initialStrategyCatalog } from './data/strategyCatalog';
import { evaluateAllStrategies, StrategyEvaluationContext } from './services/strategyEngine';
import { calculateDigitStats, generateInitialCandles, generateInitialTicks } from './services/marketDataService';
import { detectSMCOverlays } from './services/technicalAnalysis';

import { Header } from './components/Header';
import { Navbar, NavTab } from './components/Navbar';
import { NotificationBar } from './components/NotificationBar';
import { DashboardView } from './components/DashboardView';
import { DerivAnalysisView } from './components/DerivAnalysisView';
import { MT5AnalysisView } from './components/MT5AnalysisView';
import { RiskCalculatorView } from './components/RiskCalculatorView';
import { SignalHistoryView } from './components/SignalHistoryView';
import { StrategyPerformanceView } from './components/StrategyPerformanceView';
import { StrategyLibraryView } from './components/StrategyLibraryView';
import { SettingsModal } from './components/SettingsModal';
import { LoginForm } from './components/LoginForm';
import { Footer } from './components/Footer';
import { apiClient, UserSession } from './services/apiClient';
import { derivWebSocket } from './services/derivWebSocketService';
import { mt5Bridge } from './services/mt5BridgeService';

// Default Deriv Markets
const INITIAL_DERIV_MARKETS: MarketAsset[] = [
  {
    id: 'vol_75',
    symbol: 'R_75',
    name: 'Volatility 75 Index',
    category: 'volatility',
    platform: 'deriv',
    currentPrice: 4521.34,
    change24h: 2.34,
    trend: 'strong_bullish',
    volatility: 'high',
    digits: 2,
    pipSize: 0.01,
    signalStrength: 94,
  },
  {
    id: 'vol_100',
    symbol: 'R_100',
    name: 'Volatility 100 Index',
    category: 'volatility',
    platform: 'deriv',
    currentPrice: 12450.8,
    change24h: -1.15,
    trend: 'bearish',
    volatility: 'high',
    digits: 2,
    pipSize: 0.01,
    signalStrength: 82,
  },
  {
    id: 'vol_50',
    symbol: 'R_50',
    name: 'Volatility 50 Index',
    category: 'volatility',
    platform: 'deriv',
    currentPrice: 284.15,
    change24h: 0.85,
    trend: 'neutral',
    volatility: 'medium',
    digits: 4,
    pipSize: 0.0001,
    signalStrength: 73,
  },
  {
    id: 'vol_25',
    symbol: 'R_25',
    name: 'Volatility 25 Index',
    category: 'volatility',
    platform: 'deriv',
    currentPrice: 1892.4,
    change24h: 1.45,
    trend: 'bullish',
    volatility: 'medium',
    digits: 3,
    pipSize: 0.001,
    signalStrength: 86,
  },
  {
    id: 'vol_10',
    symbol: 'R_10',
    name: 'Volatility 10 Index',
    category: 'volatility',
    platform: 'deriv',
    currentPrice: 6543.21,
    change24h: -0.42,
    trend: 'neutral',
    volatility: 'low',
    digits: 3,
    pipSize: 0.001,
    signalStrength: 65,
  },
  {
    id: 'vol_75_1s',
    symbol: '1HZ75V',
    name: 'Volatility 75 (1s) Index',
    category: 'volatility_1s',
    platform: 'deriv',
    currentPrice: 98450.2,
    change24h: 3.12,
    trend: 'strong_bullish',
    volatility: 'extreme',
    digits: 2,
    pipSize: 0.01,
    signalStrength: 91,
  },
  {
    id: 'vol_100_1s',
    symbol: '1HZ100V',
    name: 'Volatility 100 (1s) Index',
    category: 'volatility_1s',
    platform: 'deriv',
    currentPrice: 1542.9,
    change24h: -2.05,
    trend: 'strong_bearish',
    volatility: 'extreme',
    digits: 2,
    pipSize: 0.01,
    signalStrength: 88,
  },
  {
    id: 'boom_1000',
    symbol: 'BOOM1000',
    name: 'Boom 1000 Index',
    category: 'boom',
    platform: 'deriv',
    currentPrice: 10452.8,
    change24h: 4.8,
    trend: 'strong_bullish',
    volatility: 'extreme',
    digits: 2,
    pipSize: 0.01,
    signalStrength: 95,
  },
  {
    id: 'crash_1000',
    symbol: 'CRASH1000',
    name: 'Crash 1000 Index',
    category: 'crash',
    platform: 'deriv',
    currentPrice: 7894.2,
    change24h: -3.6,
    trend: 'strong_bearish',
    volatility: 'extreme',
    digits: 2,
    pipSize: 0.01,
    signalStrength: 92,
  },
  {
    id: 'step_index',
    symbol: 'STEP',
    name: 'Step Index',
    category: 'step',
    platform: 'deriv',
    currentPrice: 8520.1,
    change24h: 0.35,
    trend: 'neutral',
    volatility: 'medium',
    digits: 1,
    pipSize: 0.1,
    signalStrength: 78,
  },
];

// Default MT5 Markets
const INITIAL_MT5_MARKETS: MarketAsset[] = [
  {
    id: 'eurusd',
    symbol: 'EUR/USD',
    name: 'Euro vs US Dollar',
    category: 'forex',
    platform: 'mt5',
    currentPrice: 1.17420,
    change24h: 0.45,
    trend: 'bullish',
    volatility: 'medium',
    digits: 5,
    pipSize: 0.0001,
    signalStrength: 89,
  },
  {
    id: 'gbpusd',
    symbol: 'GBP/USD',
    name: 'British Pound vs US Dollar',
    category: 'forex',
    platform: 'mt5',
    currentPrice: 1.34820,
    change24h: -0.32,
    trend: 'bearish',
    volatility: 'medium',
    digits: 5,
    pipSize: 0.0001,
    signalStrength: 84,
  },
  {
    id: 'usdjpy',
    symbol: 'USD/JPY',
    name: 'US Dollar vs Japanese Yen',
    category: 'forex',
    platform: 'mt5',
    currentPrice: 154.650,
    change24h: 0.78,
    trend: 'strong_bullish',
    volatility: 'high',
    digits: 3,
    pipSize: 0.01,
    signalStrength: 87,
  },
  {
    id: 'xauusd',
    symbol: 'XAU/USD',
    name: 'Gold vs US Dollar',
    category: 'commodities',
    platform: 'mt5',
    currentPrice: 2685.40,
    change24h: 1.65,
    trend: 'strong_bullish',
    volatility: 'extreme',
    digits: 2,
    pipSize: 0.1,
    signalStrength: 96,
  },
  {
    id: 'us30',
    symbol: 'US30 (Dow)',
    name: 'Wall Street 30 Index',
    category: 'indices',
    platform: 'mt5',
    currentPrice: 43250.0,
    change24h: 0.92,
    trend: 'bullish',
    volatility: 'high',
    digits: 1,
    pipSize: 1.0,
    signalStrength: 91,
  },
  {
    id: 'btcusd',
    symbol: 'BTC/USD',
    name: 'Bitcoin vs US Dollar',
    category: 'crypto',
    platform: 'mt5',
    currentPrice: 94250.0,
    change24h: 4.25,
    trend: 'strong_bullish',
    volatility: 'extreme',
    digits: 2,
    pipSize: 1.0,
    signalStrength: 93,
  },
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    return apiClient.getStoredUser();
  });
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const handleLogout = useCallback(async () => {
    await apiClient.logout();
    setCurrentUser(null);
  }, []);

  // Accounts state
  const [accounts, setAccounts] = useState<AccountState>({
    deriv: {
      demoBalance: 10000.0,
      realBalance: 1250.0,
      currency: 'USD',
      connected: true,
      activeAccount: 'demo',
      lastSync: 'Just now',
    },
    mt5: {
      demoBalance: 25000.0,
      realBalance: 2500.0,
      currency: 'USD',
      connected: true,
      activeAccount: 'demo',
      lastSync: 'Just now',
    },
    systemStatus: 'operational',
    marketDataLive: true,
    analysisEngineRunning: true,
  });

  // Risk Management state
  const [riskSettings, setRiskSettings] = useState<RiskManagementSettings>({
    accountType: 'deriv',
    riskPercentage: 2.0,
    maxDailyLoss: 100.0,
    dailyProfitTarget: 250.0,
    plannedTradesCount: 10,
    stakeMethod: 'percentage',
    circuitBreakerEnabled: true,
    consecutiveLossLimit: 3,
    maxDrawdownLimit: 6.0,
    currentDrawdown: 1.8,
    dailyLossTotal: 0.0,
    dailyProfitTotal: 65.0,
    consecutiveLosses: 0,
    isLocked: false,
  });

  // Strategies Catalog
  const [strategies, setStrategies] = useState<StrategyDefinition[]>(initialStrategyCatalog);

  // Market selection
  const [derivMarkets] = useState<MarketAsset[]>(INITIAL_DERIV_MARKETS);
  const [mt5Markets] = useState<MarketAsset[]>(INITIAL_MT5_MARKETS);

  const [selectedDerivMarket, setSelectedDerivMarket] = useState<MarketAsset>(INITIAL_DERIV_MARKETS[0]);
  const [selectedMt5Market, setSelectedMt5Market] = useState<MarketAsset>(INITIAL_MT5_MARKETS[0]);

  // Current active asset based on active workspace
  const currentActiveAsset = currentTab === 'mt5' ? selectedMt5Market : selectedDerivMarket;

  // Market Data (Candles & Ticks)
  const [candles, setCandles] = useState<CandleData[]>(() =>
    generateInitialCandles(INITIAL_DERIV_MARKETS[0].currentPrice, 70)
  );
  const [ticks, setTicks] = useState<TickData[]>(() =>
    generateInitialTicks(INITIAL_DERIV_MARKETS[0].currentPrice, 100)
  );

  // Digit Sample Size (25, 50, 100, 500, 1000)
  const [digitSampleSize, setDigitSampleSize] = useState<number>(100);

  // Notifications & Signal History
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: 'notif-1',
      title: 'High Confidence Signal',
      message: 'SMC Order Block detected RISE on Volatility 75 with 94% confidence.',
      type: 'signal',
      timestamp: Date.now() - 30000,
      read: false,
      dismissed: false,
    },
    {
      id: 'notif-2',
      title: 'Risk Guardian Active',
      message: 'Circuit breaker initialized. Max drawdown safety barrier set at 6.0%.',
      type: 'info' as any,
      timestamp: Date.now() - 120000,
      read: true,
      dismissed: false,
    },
  ]);

  const [signalHistory, setSignalHistory] = useState<SignalHistoryItem[]>([
    {
      id: 'hist-1',
      platform: 'deriv',
      marketName: 'Volatility 75 Index',
      strategyName: 'SMC Order Block (Bullish Demand)',
      signalType: 'RISE',
      strength: 94,
      entryPrice: 4518.20,
      generatedAt: Date.now() - 300000,
      result: 'WIN',
      profitAmount: 18.5,
    },
    {
      id: 'hist-2',
      platform: 'deriv',
      marketName: 'Volatility 100 Index',
      strategyName: 'Over/Matches Marubozu Breakout',
      signalType: 'MATCHES',
      strength: 88,
      entryPrice: 12440.5,
      generatedAt: Date.now() - 600000,
      result: 'WIN',
      profitAmount: 22.0,
    },
    {
      id: 'hist-3',
      platform: 'mt5',
      marketName: 'EUR/USD',
      strategyName: 'EMA Trend Pullback (20/200)',
      signalType: 'BUY',
      strength: 89,
      entryPrice: 1.17380,
      generatedAt: Date.now() - 900000,
      result: 'WIN',
      profitAmount: 45.0,
    },
    {
      id: 'hist-4',
      platform: 'deriv',
      marketName: 'Boom 1000 Index',
      strategyName: 'Deriv False Breakout Reversal',
      signalType: 'FALL',
      strength: 78,
      entryPrice: 10480.0,
      generatedAt: Date.now() - 1200000,
      result: 'LOSS',
      profitAmount: -12.0,
    },
  ]);

  // Connect to Live Deriv WebSocket & MT5 Bridge on mount / symbol change
  useEffect(() => {
    // 1. If active asset is Deriv, subscribe to official Deriv WebSocket
    if (currentActiveAsset.platform === 'deriv') {
      derivWebSocket.connect();
      derivWebSocket.subscribeToSymbol(currentActiveAsset.symbol);

      const unsubTick = derivWebSocket.onTick((liveTick, symbol) => {
        if (symbol === currentActiveAsset.symbol) {
          setTicks(prev => {
            const last = prev[prev.length - 1];
            const direction = last ? (liveTick.price > last.price ? 'up' : liveTick.price < last.price ? 'down' : 'equal') : 'up';
            return [...prev.slice(-499), { ...liveTick, direction }];
          });

          // Update current candle close
          setCandles(prev => {
            if (prev.length === 0) return prev;
            const lastCandle = { ...prev[prev.length - 1] };
            lastCandle.close = liveTick.price;
            lastCandle.high = Math.max(lastCandle.high, liveTick.price);
            lastCandle.low = Math.min(lastCandle.low, liveTick.price);
            return [...prev.slice(0, -1), lastCandle];
          });
        }
      });

      const unsubCandles = derivWebSocket.onCandles((liveCandles, symbol) => {
        if (symbol === currentActiveAsset.symbol && liveCandles.length > 1) {
          setCandles(liveCandles);
        }
      });

      const unsubAccount = derivWebSocket.onAccount(acc => {
        setAccounts(prev => ({
          ...prev,
          deriv: {
            ...prev.deriv,
            demoBalance: acc.isVirtual ? acc.balance : prev.deriv.demoBalance,
            realBalance: !acc.isVirtual ? acc.balance : prev.deriv.realBalance,
            currency: acc.currency,
            connected: true,
            activeAccount: acc.isVirtual ? 'demo' : 'real',
            lastSync: 'Live WebSocket',
          },
        }));
      });

      return () => {
        unsubTick();
        unsubCandles();
        unsubAccount();
      };
    } else {
      // 2. MT5 Asset - Subscribe to MT5 Bridge
      mt5Bridge.setSymbol(currentActiveAsset.symbol);
      const unsubMt5Tick = mt5Bridge.onTick((liveTick, symbol) => {
        const cleanCurrent = currentActiveAsset.symbol.toUpperCase().replace(/[\/\-_]/g, '');
        if (symbol === cleanCurrent) {
          setTicks(prev => {
            const last = prev[prev.length - 1];
            const direction = last ? (liveTick.price > last.price ? 'up' : liveTick.price < last.price ? 'down' : 'equal') : 'up';
            return [...prev.slice(-499), { ...liveTick, direction }];
          });
        }
      });

      return () => {
        unsubMt5Tick();
      };
    }
  }, [currentActiveAsset]);

  // Real-time market tick heartbeat engine (active when waiting or in fallback)
  useEffect(() => {
    const interval = setInterval(() => {
      // If Deriv is connected and authorized/streaming, the WebSocket handles ticks.
      // Otherwise, keep the high-frequency calculation ticker active
      const isDerivActive = currentActiveAsset.platform === 'deriv' && derivWebSocket.getStatus() === 'connected';
      if (isDerivActive) return;

      setTicks(prevTicks => {
        const lastTick = prevTicks[prevTicks.length - 1] || {
          id: Date.now(),
          timestamp: Date.now(),
          price: currentActiveAsset.currentPrice,
          lastDigit: 5,
          direction: 'up' as const,
        };

        const randomWalk = (Math.random() - 0.49) * (currentActiveAsset.currentPrice * 0.0006);
        const newPrice = Number((lastTick.price + randomWalk).toFixed(currentActiveAsset.digits));
        const priceStr = newPrice.toFixed(currentActiveAsset.digits);
        const lastDigit = parseInt(priceStr.slice(-1), 10);
        const direction = newPrice > lastTick.price ? 'up' : newPrice < lastTick.price ? 'down' : 'equal';

        const newTick: TickData = {
          id: Date.now(),
          timestamp: Date.now(),
          price: newPrice,
          lastDigit: isNaN(lastDigit) ? 0 : lastDigit,
          direction,
        };

        return [...prevTicks.slice(-499), newTick];
      });

      setCandles(prevCandles => {
        if (prevCandles.length === 0) return prevCandles;
        const lastCandle = { ...prevCandles[prevCandles.length - 1] };
        const randomWalk = (Math.random() - 0.49) * (currentActiveAsset.currentPrice * 0.0004);
        const newClose = Number((lastCandle.close + randomWalk).toFixed(currentActiveAsset.digits));

        lastCandle.close = newClose;
        lastCandle.high = Math.max(lastCandle.high, newClose);
        lastCandle.low = Math.min(lastCandle.low, newClose);

        return [...prevCandles.slice(0, -1), lastCandle];
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentActiveAsset]);

  // Calculate Digit Statistics for Deriv
  const digitStats: DigitStat[] = useMemo(() => {
    return calculateDigitStats(ticks, digitSampleSize);
  }, [ticks, digitSampleSize]);

  const lastTickDigit = ticks.length > 0 ? ticks[ticks.length - 1].lastDigit : 5;
  const currentPrice = ticks.length > 0 ? ticks[ticks.length - 1].price : currentActiveAsset.currentPrice;

  // Detect SMC Overlays (Order Blocks, FVG, BOS)
  const smcOverlays: SmcOverlay[] = useMemo(() => {
    return detectSMCOverlays(candles);
  }, [candles]);

  // Evaluate All Strategies with the mandatory Single-Strategy Rule
  const { strategyScores, winningStrategy, marketCondition } = useMemo(() => {
    const last20Digits = ticks.slice(-20).map(t => t.lastDigit);
    const context: StrategyEvaluationContext = {
      asset: currentActiveAsset,
      candles,
      ticks,
      digitStats,
      lastTickDigit,
      last20Digits,
      enabledStrategyIds: strategies.filter(s => s.enabled).map(s => s.id),
    };
    const result = evaluateAllStrategies(context);
    return {
      strategyScores: result.scores,
      winningStrategy: result.winningStrategy,
      marketCondition: result.marketCondition,
    };
  }, [currentActiveAsset, candles, ticks, digitStats, lastTickDigit, strategies]);

  // Determine Active Signal (The WINNING strategy with highest confidence score)
  const activeSignal: ActiveSignal | null = useMemo(() => {
    if (!winningStrategy || winningStrategy.confidence < 60) return null;

    return {
      id: `sig-${winningStrategy.id}-${Date.now()}`,
      platform: currentActiveAsset.platform,
      marketSymbol: currentActiveAsset.symbol,
      marketName: currentActiveAsset.name,
      strategyId: winningStrategy.id,
      strategyName: winningStrategy.name,
      signalType: winningStrategy.signalType,
      direction: winningStrategy.signalType.includes('BUY') || winningStrategy.signalType.includes('RISE') ? 'BUY' : 'SELL',
      strength: winningStrategy.confidence,
      entryPrice: currentPrice,
      recommendedContract: winningStrategy.signalType.includes('RISE') ? 'Rise Contract (1-5 Ticks)' : 'Fall Contract (1-5 Ticks)',
      timeframe: '1M',
      marketCondition,
      riskLevel: winningStrategy.confidence >= 85 ? 'LOW' : winningStrategy.confidence >= 75 ? 'MEDIUM' : 'HIGH',
      generatedAt: Date.now(),
      expiresInSeconds: 15,
      initialExpirySeconds: 15,
      targetDigit: winningStrategy.targetDigit,
    };
  }, [winningStrategy, currentActiveAsset, currentPrice, marketCondition]);

  // Separate Deriv and MT5 signals for Global Dashboard
  const derivSignal = useMemo(() => {
    if (currentActiveAsset.platform === 'deriv') return activeSignal;
    return {
      id: 'deriv-dash-sig',
      platform: 'deriv' as const,
      marketSymbol: 'R_75',
      marketName: 'Volatility 75 Index',
      strategyId: 'smc_order_block',
      strategyName: 'SMC Order Block (Bullish Demand)',
      signalType: 'RISE' as const,
      direction: 'RISE' as const,
      strength: 94,
      entryPrice: 4521.34,
      recommendedContract: 'Rise Contract (5 Ticks)',
      timeframe: '1M',
      marketCondition: 'Strong Bullish Expansion',
      riskLevel: 'LOW' as const,
      generatedAt: Date.now(),
      expiresInSeconds: 15,
      initialExpirySeconds: 15,
    };
  }, [currentActiveAsset, activeSignal]);

  const mt5Signal = useMemo(() => {
    if (currentActiveAsset.platform === 'mt5') return activeSignal;
    return {
      id: 'mt5-dash-sig',
      platform: 'mt5' as const,
      marketSymbol: 'EUR/USD',
      marketName: 'EUR/USD',
      strategyId: 'ema_trend_pullback',
      strategyName: 'EMA Trend Pullback (20/200 Confluence)',
      signalType: 'BUY' as const,
      direction: 'BUY' as const,
      strength: 89,
      entryPrice: 1.17420,
      stopLoss: 1.17280,
      takeProfit: 1.17700,
      riskReward: '1:2.0',
      timeframe: '15M',
      marketCondition: 'Bullish Trend Continuation',
      riskLevel: 'LOW' as const,
      generatedAt: Date.now(),
      expiresInSeconds: 45,
      initialExpirySeconds: 45,
    };
  }, [currentActiveAsset, activeSignal]);

  // Trade Execution Simulator
  const handleExecuteTrade = useCallback((signal: ActiveSignal) => {
    if (riskSettings.isLocked) {
      alert('⚠️ Trade Rejected: Circuit Breaker is active and trading is locked for account protection.');
      return;
    }

    const isWin = Math.random() > 0.25; // 75% win rate simulation
    const profit = isWin ? 18.5 : -10.0;

    // Add to history
    const historyItem: SignalHistoryItem = {
      id: `exec-${Date.now()}`,
      platform: signal.platform,
      marketName: signal.marketName,
      strategyName: signal.strategyName,
      signalType: signal.signalType,
      strength: signal.strength,
      entryPrice: signal.entryPrice,
      generatedAt: Date.now(),
      result: isWin ? 'WIN' : 'LOSS',
      profitAmount: profit,
    };

    setSignalHistory(prev => [historyItem, ...prev]);

    // Update notification
    setNotifications(prev => [
      {
        id: `notif-exec-${Date.now()}`,
        title: isWin ? 'Trade Profit Achieved' : 'Trade Closed',
        message: `${signal.strategyName} on ${signal.marketName} yielded ${isWin ? '+' : ''}$${profit.toFixed(2)}`,
        type: isWin ? 'signal' : 'warning',
        timestamp: Date.now(),
        read: false,
        dismissed: false,
      },
      ...prev,
    ]);

    // Update risk totals
    if (isWin) {
      setRiskSettings(prev => ({
        ...prev,
        dailyProfitTotal: prev.dailyProfitTotal + profit,
        consecutiveLosses: 0,
      }));
    } else {
      setRiskSettings(prev => {
        const nextLosses = prev.consecutiveLosses + 1;
        const nextLossTotal = prev.dailyLossTotal + Math.abs(profit);
        const shouldLock = nextLosses >= prev.consecutiveLossLimit || nextLossTotal >= prev.maxDailyLoss;

        return {
          ...prev,
          dailyLossTotal: nextLossTotal,
          consecutiveLosses: nextLosses,
          isLocked: shouldLock,
        };
      });
    }
  }, [riskSettings]);

  // Toggle account mode
  const handleToggleAccountMode = (platform: 'deriv' | 'mt5') => {
    setAccounts(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        activeAccount: prev[platform].activeAccount === 'demo' ? 'real' : 'demo',
      },
    }));
  };

  // Toggle strategy enabled
  const handleToggleStrategy = (id: string) => {
    setStrategies(prev =>
      prev.map(s => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  // If not authenticated, display the secure Operator Login Form
  if (!currentUser) {
    return (
      <LoginForm
        onLoginSuccess={user => setCurrentUser(user)}
        isDarkMode={isDarkMode}
      />
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        isDarkMode ? 'bg-[#0B0E11] text-[#EAECEF]' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* 1. Header */}
      <Header
        accounts={accounts}
        onToggleAccountMode={handleToggleAccountMode}
        notifications={notifications}
        onDismissNotification={id =>
          setNotifications(prev => prev.map(n => (n.id === id ? { ...n, dismissed: true } : n)))
        }
        onClearAllNotifications={() => setNotifications([])}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* 2. Navigation Bar */}
      <Navbar currentTab={currentTab} onSelectTab={setCurrentTab} isDarkMode={isDarkMode} />

      {/* 3. Notification & Warning Bar */}
      <NotificationBar
        notifications={notifications}
        onDismiss={id =>
          setNotifications(prev => prev.map(n => (n.id === id ? { ...n, dismissed: true } : n)))
        }
        isDarkMode={isDarkMode}
      />

      {/* 4. Main Body Views */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {currentTab === 'dashboard' && (
          <DashboardView
            accounts={accounts}
            derivSignal={derivSignal}
            mt5Signal={mt5Signal}
            derivMarkets={derivMarkets}
            mt5Markets={mt5Markets}
            strategyScores={strategyScores}
            onSelectMarket={m => {
              if (m.platform === 'deriv') setSelectedDerivMarket(m);
              else setSelectedMt5Market(m);
            }}
            onNavigateTab={tab => setCurrentTab(tab)}
            isDarkMode={isDarkMode}
          />
        )}

        {currentTab === 'deriv' && (
          <DerivAnalysisView
            markets={derivMarkets}
            selectedMarket={selectedDerivMarket}
            onSelectMarket={setSelectedDerivMarket}
            candles={candles}
            ticks={ticks}
            digitStats={digitStats}
            lastTickDigit={lastTickDigit}
            sampleSize={digitSampleSize}
            onSampleSizeChange={setDigitSampleSize}
            activeSignal={activeSignal}
            strategyScores={strategyScores}
            marketCondition={marketCondition}
            smcOverlays={smcOverlays}
            onExecuteTrade={handleExecuteTrade}
            isDarkMode={isDarkMode}
          />
        )}

        {currentTab === 'mt5' && (
          <MT5AnalysisView
            markets={mt5Markets}
            selectedMarket={selectedMt5Market}
            onSelectMarket={setSelectedMt5Market}
            candles={candles}
            ticks={ticks}
            activeSignal={activeSignal}
            strategyScores={strategyScores}
            marketCondition={marketCondition}
            smcOverlays={smcOverlays}
            onExecuteTrade={handleExecuteTrade}
            isDarkMode={isDarkMode}
          />
        )}

        {currentTab === 'risk' && (
          <RiskCalculatorView
            accounts={accounts}
            riskSettings={riskSettings}
            onUpdateRiskSettings={s => setRiskSettings(prev => ({ ...prev, ...s }))}
            onToggleEmergencyLock={() =>
              setRiskSettings(prev => ({ ...prev, isLocked: !prev.isLocked }))
            }
            onResetRiskLimits={() =>
              setRiskSettings(prev => ({
                ...prev,
                dailyLossTotal: 0,
                dailyProfitTotal: 0,
                consecutiveLosses: 0,
                isLocked: false,
              }))
            }
            derivMarkets={derivMarkets}
            mt5Markets={mt5Markets}
            isDarkMode={isDarkMode}
          />
        )}

        {currentTab === 'history' && (
          <SignalHistoryView
            history={signalHistory}
            onClearHistory={() => setSignalHistory([])}
            isDarkMode={isDarkMode}
          />
        )}

        {currentTab === 'performance' && (
          <StrategyPerformanceView
            strategies={strategies}
            onToggleStrategy={handleToggleStrategy}
            isDarkMode={isDarkMode}
          />
        )}

        {currentTab === 'library' && (
          <StrategyLibraryView strategies={strategies} isDarkMode={isDarkMode} />
        )}

        {currentTab === 'settings' && (
          <div className="p-8 text-center space-y-4 rounded-2xl bg-slate-900 border border-slate-800">
            <h2 className="text-xl font-bold text-white">System Settings & Connections</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Configure Deriv API tokens, MT5 sockets, audio alerts, and automated trading bot webhook bridges.
            </p>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30"
            >
              Open Settings & Bridge Configuration
            </button>
          </div>
        )}
      </main>

      {/* 5. Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isDarkMode={isDarkMode}
        currentUser={currentUser}
      />

      {/* 6. Footer */}
      <Footer isDarkMode={isDarkMode} />
    </div>
  );
}
