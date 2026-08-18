export type MarketCategory = 'volatility' | 'volatility_1s' | 'boom' | 'crash' | 'step' | 'forex' | 'commodities' | 'indices' | 'crypto';

export interface StrategyDefinition {
  id: string;
  name: string;
  category: string;
  source?: string;
  description: string;
  indicatorsUsed?: string[];
  requiredIndicators?: string[];
  entryCriteria: string;
  exitCriteria?: string;
  recommendedTimeframe?: string;
  recommendedMarkets?: string[];
  applicablePlatforms?: string[];
  historicalWinRate?: number;
  winRateHistorical?: number;
  totalSignals?: number;
  totalTradesHistorical?: number;
  profitFactor?: number;
  defaultContractType?: string;
  defaultExpiryTicks?: number;
  wins?: number;
  losses?: number;
  score?: number;
  enabled: boolean;
}

export type StrategyMetadata = StrategyDefinition;

export interface MarketAsset {
  id: string;
  name: string;
  symbol: string;
  category: MarketCategory;
  platform: 'deriv' | 'mt5';
  currentPrice: number;
  change24h: number;
  trend: 'strong_bullish' | 'bullish' | 'neutral' | 'bearish' | 'strong_bearish';
  volatility: 'low' | 'medium' | 'high' | 'extreme';
  signalStrength: number;
  pipSize: number;
  digits: number;
}

export interface TickData {
  id: number;
  timestamp: number;
  price: number;
  lastDigit: number;
  direction: 'up' | 'down' | 'equal';
}

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isDoji?: boolean;
  isMarubozu?: boolean;
  isEngulfing?: 'bullish' | 'bearish';
  isInsideBar?: boolean;
}

export interface DigitStat {
  digit: number;
  count: number;
  percentage: number;
  rank: 'highest' | 'second_highest' | 'second_lowest' | 'lowest' | 'neutral';
  colorTag: 'green' | 'blue' | 'yellow' | 'red' | 'neutral';
}

export interface SmcOverlay {
  type: 'order_block' | 'fvg' | 'liquidity_sweep' | 'bos' | 'choch' | 'support' | 'resistance';
  price: number;
  priceUpper?: number;
  priceLower?: number;
  timeStart: number;
  timeEnd?: number;
  direction: 'bullish' | 'bearish';
  label: string;
  strength: number;
}

export type SignalType = 
  | 'RISE' 
  | 'FALL' 
  | 'RISE EQUAL'
  | 'FALL EQUAL'
  | 'HIGHER' 
  | 'LOWER' 
  | 'MATCHES' 
  | 'DIFFERS' 
  | 'EVEN' 
  | 'ODD' 
  | 'OVER 4' 
  | 'OVER 1'
  | 'OVER 2'
  | 'OVER 8'
  | 'UNDER 6' 
  | 'UNDER 7'
  | 'UNDER 8'
  | 'TOUCH' 
  | 'NO TOUCH' 
  | 'BUY' 
  | 'SELL' 
  | 'WAIT';

export interface StrategyScore {
  id: string;
  name: string;
  category: 'Digit / Synthetic' | 'Chart & SMC' | 'Timing & Scalping' | 'Breakout & Trap' | 'Contract-Specific';
  confidence: number;
  signalType: SignalType;
  direction: 'BUY' | 'SELL' | 'CALL' | 'PUT' | 'DIGIT' | 'NEUTRAL';
  entryCriteria: string;
  reason: string;
  winRateHistorical: number;
  eligible: boolean;
  contractType?: string;
  targetDigit?: number;
  barrierPrice?: number;
}

export interface ActiveSignal {
  id: string;
  platform: 'deriv' | 'mt5';
  marketId?: string;
  marketSymbol?: string;
  marketName: string;
  strategyId: string;
  strategyName: string;
  signalType: SignalType;
  direction: 'RISE' | 'FALL' | 'BUY' | 'SELL' | 'MATCHES' | 'DIFFERS' | 'EVEN' | 'ODD' | 'OVER' | 'UNDER' | string;
  strength: number; // 0 - 100
  confidenceLabel?: 'VERY STRONG' | 'STRONG' | 'MODERATE' | 'WEAK' | 'NO TRADE' | string;
  entryPrice: number;
  currentPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  riskReward?: string;
  recommendedContract?: string;
  timeframe?: string;
  marketCondition?: string;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  generatedAt: number;
  expiresInSeconds: number;
  initialExpirySeconds?: number;
  targetDigit?: number;
  status?: 'ACTIVE' | 'WON' | 'LOST' | 'EXPIRED' | string;
}

export interface SignalHistoryItem {
  id: string;
  platform: 'deriv' | 'mt5';
  marketId?: string;
  marketSymbol?: string;
  marketName: string;
  strategyId?: string;
  strategyName: string;
  signalType: SignalType;
  direction?: string;
  strength: number;
  confidenceLabel?: 'VERY STRONG' | 'STRONG' | 'MODERATE' | 'WEAK' | 'NO TRADE' | string;
  entryPrice: number;
  currentPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  riskReward?: string;
  recommendedContract?: string;
  timeframe?: string;
  marketCondition?: string;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  generatedAt: number;
  expiresInSeconds?: number;
  initialExpirySeconds?: number;
  targetDigit?: number;
  status?: 'ACTIVE' | 'WON' | 'LOST' | 'EXPIRED' | string;
  settledAt?: number;
  result?: 'WIN' | 'LOSS' | 'EXPIRED';
  profitAmount?: number;
}

export interface AccountState {
  deriv: {
    demoBalance: number;
    realBalance: number;
    currency: string;
    connected: boolean;
    activeAccount: 'demo' | 'real';
    lastSync: string;
    token?: string;
    appId?: string;
  };
  mt5: {
    demoBalance: number;
    realBalance: number;
    currency: string;
    connected: boolean;
    activeAccount: 'demo' | 'real';
    lastSync: string;
    server?: string;
    accountNumber?: string;
  };
  systemStatus: 'operational' | 'degraded' | 'maintenance';
  marketDataLive: boolean;
  analysisEngineRunning: boolean;
}

export interface RiskManagementSettings {
  accountType: 'deriv' | 'mt5';
  riskPercentage: number;
  maxDailyLoss: number;
  dailyProfitTarget: number;
  plannedTradesCount: number;
  stakeMethod: 'fixed' | 'percentage' | 'anti_martingale' | 'dalembert' | 'dynamic' | 'ai_adaptive';
  circuitBreakerEnabled: boolean;
  consecutiveLossLimit: number;
  maxDrawdownLimit: number;
  currentDrawdown: number;
  dailyLossTotal: number;
  dailyProfitTotal: number;
  consecutiveLosses: number;
  isLocked: boolean;
  lockReason?: string;
}

export interface AppNotification {
  id: string;
  type: 'signal' | 'system' | 'risk' | 'warning';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  dismissed: boolean;
}
