import React, { useEffect, useState } from 'react';
import { ActiveSignal, MarketAsset, StrategyScore } from '../types';
import {
  ShieldAlert,
  Flame,
  Clock,
  CheckCircle,
  AlertTriangle,
  Award,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Play,
  Send,
  HelpCircle,
  Target,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Copy,
  Check,
  Radio,
  CheckCircle2,
} from 'lucide-react';
import { mt5Bridge } from '../services/mt5BridgeService';

interface SignalAnalysisPanelProps {
  asset: MarketAsset;
  activeSignal: ActiveSignal | null;
  strategyScores: StrategyScore[];
  marketCondition: string;
  onExecuteTrade?: (signal: ActiveSignal) => void;
  isDarkMode?: boolean;
}

export const SignalAnalysisPanel: React.FC<SignalAnalysisPanelProps> = ({
  asset,
  activeSignal,
  strategyScores,
  marketCondition,
  onExecuteTrade,
  isDarkMode = true,
}) => {
  const [countdown, setCountdown] = useState(activeSignal?.expiresInSeconds || 15);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (!activeSignal) return;
    setCountdown(activeSignal.expiresInSeconds);
    const interval = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : activeSignal.initialExpirySeconds || 15));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSignal]);

  const strength = activeSignal?.strength || 45;

  // Strength classification
  let strengthLabel = 'WAITING / NO TRADE';
  let strengthBadgeColor = 'bg-[#0B0E11] text-[#848E9C] border border-[#2B2F36]';
  let strengthBarColor = 'bg-[#2B2F36]';

  if (strength >= 90) {
    strengthLabel = 'VERY STRONG';
    strengthBadgeColor = 'bg-green-500/15 text-green-400 border border-green-500/40';
    strengthBarColor = 'bg-green-500';
  } else if (strength >= 80) {
    strengthLabel = 'STRONG';
    strengthBadgeColor = 'bg-blue-500/15 text-blue-400 border border-blue-500/40';
    strengthBarColor = 'bg-blue-500';
  } else if (strength >= 75) {
    strengthLabel = 'MODERATE';
    strengthBadgeColor = 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/40';
    strengthBarColor = 'bg-yellow-500';
  } else {
    strengthLabel = 'BELOW THRESHOLD (<75%)';
    strengthBadgeColor = 'bg-[#0B0E11] text-[#848E9C] border border-[#2B2F36]';
    strengthBarColor = 'bg-[#2B2F36]';
  }

  const isBullish =
    activeSignal?.direction === 'RISE' ||
    activeSignal?.direction === 'BUY' ||
    activeSignal?.signalType?.includes('OVER') ||
    activeSignal?.signalType?.includes('EVEN') ||
    activeSignal?.signalType?.includes('MATCHES');

  const isBearish =
    activeSignal?.direction === 'FALL' ||
    activeSignal?.direction === 'SELL' ||
    activeSignal?.signalType?.includes('UNDER') ||
    activeSignal?.signalType?.includes('ODD') ||
    activeSignal?.signalType?.includes('DIFFERS');

  // Calculate Entry, Stop Loss (Exit), and Take Profit (Exit)
  const curPrice = activeSignal?.entryPrice || asset.currentPrice;
  const isForex = asset.category === 'forex';
  const isCrypto = asset.category === 'crypto';
  const offset = curPrice * (isForex ? 0.0018 : isCrypto ? 0.012 : 0.0035);

  const entryPoint = activeSignal?.entryPrice || curPrice;
  const takeProfitExit = activeSignal?.takeProfit || (isBullish ? entryPoint + offset * 2.0 : entryPoint - offset * 2.0);
  const stopLossExit = activeSignal?.stopLoss || (isBullish ? entryPoint - offset : entryPoint + offset);
  const rrRatio = '1 : 2.0';

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-3 font-mono">
      {/* 1. Main Signal Card */}
      <div
        id="main-signal-card"
        className={`rounded-lg border ${
          isDarkMode ? 'bg-[#161A1E] border-[#2B2F36]' : 'bg-white border-slate-200'
        } p-4 shadow-sm space-y-3`}
      >
        {/* Header with Signal Type & Expiry Timer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2B2F36] pb-3">
          <div className="flex items-center space-x-3">
            <div
              className={`w-11 h-11 rounded-lg flex items-center justify-center font-bold text-lg ${
                activeSignal
                  ? isBullish
                    ? 'bg-green-500/15 text-green-400 border border-green-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                    : isBearish
                    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/40 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
                    : 'bg-blue-500/15 text-blue-400 border border-blue-500/40'
                  : 'bg-[#0B0E11] text-[#848E9C] border border-[#2B2F36]'
              }`}
            >
              {activeSignal ? (
                isBullish ? <ArrowUpRight className="w-6 h-6" /> : isBearish ? <ArrowDownRight className="w-6 h-6" /> : <Zap className="w-6 h-6" />
              ) : (
                <Radio className="w-5 h-5 text-blue-400 animate-pulse" />
              )}
            </div>
            <div>
              <div className="text-[10px] text-[#848E9C] uppercase font-bold flex items-center gap-1.5">
                <span>{activeSignal ? 'ACTIVE TRADING SIGNAL' : 'MARKET SCANNER'}</span>
                <span className={`w-1.5 h-1.5 rounded-full ${activeSignal ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400 animate-ping'}`} />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
                {activeSignal ? (
                  <span
                    className={
                      isBullish ? 'text-green-400' : isBearish ? 'text-rose-400' : 'text-blue-400'
                    }
                  >
                    {activeSignal.signalType}
                  </span>
                ) : (
                  <span className="text-[#848E9C]">NO ACTIVE SIGNAL</span>
                )}
                {activeSignal?.targetDigit !== undefined && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40">
                    Digit [{activeSignal.targetDigit}]
                  </span>
                )}
              </h2>
            </div>
          </div>

          {/* Expiry Countdown or Scanning Badge */}
          {activeSignal ? (
            <div className="flex items-center space-x-2 bg-[#0B0E11] px-3 py-1.5 rounded border border-[#2B2F36]">
              <Clock className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
              <div>
                <div className="text-[9px] text-[#848E9C] uppercase font-bold">Signal Validity</div>
                <div className="text-xs font-mono font-bold text-yellow-300">
                  00:{countdown.toString().padStart(2, '0')}s
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 bg-[#0B0E11] px-2.5 py-1.5 rounded border border-blue-500/30 text-blue-400 text-xs">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Analyzing Live Chart</span>
            </div>
          )}
        </div>

        {/* Signal Strength Meter */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-[#848E9C] font-bold uppercase">Confidence Score:</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${strengthBadgeColor}`}>
                {strengthLabel}
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-white tracking-tight">
              {activeSignal ? `${strength}%` : 'Scanning...'}
            </div>
          </div>

          <div className="w-full bg-[#0B0E11] rounded h-2.5 overflow-hidden p-0.5 border border-[#2B2F36]">
            <div
              className={`h-full rounded transition-all duration-500 ${strengthBarColor}`}
              style={{ width: `${activeSignal ? strength : 25}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-[#848E9C]">
            <span>
              Strategy: <strong className="text-white">{activeSignal?.strategyName || 'Multi-Strategy Confluence Scanner'}</strong>
            </span>
            <span>
              Market Condition: <strong className="text-blue-400 uppercase">{marketCondition}</strong>
            </span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SIGNAL DISPLAY: ACTIVE SIGNAL, ENTRY POINT & EXIT POINTS     */}
        {/* ============================================================ */}
        <div
          id="signal-entry-exit-display-box"
          className="p-3 rounded-lg bg-[#0B0E11] border border-[#2B2F36] space-y-2.5 shadow-inner"
        >
          <div className="flex items-center justify-between border-b border-[#2B2F36] pb-1.5">
            <div className="flex items-center space-x-1.5">
              <Target className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                {activeSignal ? 'Active Signal Order Parameters' : 'Live Order Trigger Status'}
              </span>
            </div>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/30">
              {activeSignal ? `R:R ${rrRatio}` : 'Awaiting Entry Setup'}
            </span>
          </div>

          {activeSignal ? (
            /* ACTIVE SIGNAL ENTRY & EXIT POINT CARDS */
            <div className="space-y-2 text-xs">
              {/* 1. ENTRY POINT */}
              <div className="p-2.5 rounded bg-[#161A1E] border border-blue-500/40 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                    🎯
                  </div>
                  <div>
                    <div className="text-[9px] uppercase font-bold text-[#848E9C] flex items-center gap-1.5">
                      <span>ENTRY POINT</span>
                      <span className="text-[8px] px-1 rounded bg-blue-500/15 text-blue-300">EXECUTION</span>
                    </div>
                    <div className="text-sm font-mono font-bold text-white tracking-wide">
                      {entryPoint.toFixed(asset.digits)}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => copyToClipboard(entryPoint.toFixed(asset.digits), 'entry')}
                  className="py-1 px-2 rounded bg-[#0B0E11] hover:bg-[#1E2329] border border-[#2B2F36] text-[10px] text-[#848E9C] hover:text-white flex items-center gap-1 cursor-pointer transition"
                  title="Copy Entry Price"
                >
                  {copiedField === 'entry' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedField === 'entry' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* 2. EXIT POINT 1: TAKE PROFIT (TP / TARGET) */}
              <div className="p-2.5 rounded bg-[#161A1E] border border-green-500/30 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded bg-green-500/20 text-green-400 flex items-center justify-center font-bold text-xs">
                    🟢
                  </div>
                  <div>
                    <div className="text-[9px] uppercase font-bold text-green-400 flex items-center gap-1.5">
                      <span>EXIT POINT (TAKE PROFIT / TP)</span>
                      <span className="text-[8px] px-1 rounded bg-green-500/20 text-green-300 font-mono">+2.0R</span>
                    </div>
                    <div className="text-sm font-mono font-bold text-green-400 tracking-wide">
                      {takeProfitExit.toFixed(asset.digits)}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => copyToClipboard(takeProfitExit.toFixed(asset.digits), 'tp')}
                  className="py-1 px-2 rounded bg-[#0B0E11] hover:bg-[#1E2329] border border-[#2B2F36] text-[10px] text-[#848E9C] hover:text-white flex items-center gap-1 cursor-pointer transition"
                  title="Copy Take Profit Price"
                >
                  {copiedField === 'tp' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedField === 'tp' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* 3. EXIT POINT 2: STOP LOSS (SL / INVALIDATION) */}
              <div className="p-2.5 rounded bg-[#161A1E] border border-rose-500/30 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs">
                    🔴
                  </div>
                  <div>
                    <div className="text-[9px] uppercase font-bold text-rose-400 flex items-center gap-1.5">
                      <span>EXIT POINT (STOP LOSS / SL)</span>
                      <span className="text-[8px] px-1 rounded bg-rose-500/20 text-rose-300 font-mono">-1.0R</span>
                    </div>
                    <div className="text-sm font-mono font-bold text-rose-400 tracking-wide">
                      {stopLossExit.toFixed(asset.digits)}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => copyToClipboard(stopLossExit.toFixed(asset.digits), 'sl')}
                  className="py-1 px-2 rounded bg-[#0B0E11] hover:bg-[#1E2329] border border-[#2B2F36] text-[10px] text-[#848E9C] hover:text-white flex items-center gap-1 cursor-pointer transition"
                  title="Copy Stop Loss Price"
                >
                  {copiedField === 'sl' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedField === 'sl' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* NO ACTIVE SIGNAL - SCANNING & WAITING VIEW */
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded bg-[#161A1E] border border-[#2B2F36] space-y-2">
                <div className="flex items-center space-x-2 text-yellow-400">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <div className="font-bold text-xs">Criteria Pending for {asset.symbol}</div>
                </div>
                <p className="text-[11px] text-[#848E9C] leading-relaxed">
                  The analysis engine is actively streaming live chart data and calculating indicators. No strategy currently meets the strict ≥75% confidence entry criteria.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#2B2F36] text-[10px]">
                  <div>
                    <span className="text-[#848E9C]">Current Price:</span>{' '}
                    <strong className="text-white font-mono">{asset.currentPrice.toFixed(asset.digits)}</strong>
                  </div>
                  <div>
                    <span className="text-[#848E9C]">Execution Rule:</span>{' '}
                    <strong className="text-yellow-300">Wait for Confluence</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Live Chart Analysis Status Strip */}
          <div className="pt-1.5 flex items-center justify-between text-[10px] text-[#848E9C] border-t border-[#2B2F36]">
            <span className="flex items-center space-x-1.5 text-emerald-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#10b981]" />
              <span>Real-Time Chart Analysis Active</span>
            </span>
            <span className="font-mono text-[9px] text-[#848E9C]">
              {asset.symbol} Live Feed
            </span>
          </div>
        </div>
      </div>

      {/* 2. Strategy Analysis & Single-Strategy Rule Ranking Table */}
      <div
        id="strategy-ranking-table-panel"
        className={`rounded-lg border ${
          isDarkMode ? 'bg-[#161A1E] border-[#2B2F36]' : 'bg-white border-slate-200'
        } p-3.5 shadow-sm space-y-2.5`}
      >
        <div className="flex items-center justify-between border-b border-[#2B2F36] pb-2">
          <div className="flex items-center space-x-2">
            <Award className="w-3.5 h-3.5 text-yellow-400" />
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Strategy Confluence & Ranking
              </h3>
              <p className="text-[10px] text-[#848E9C]">
                Mandate: <strong className="text-yellow-300">ONE TRADE = ONE STRATEGY</strong>
              </p>
            </div>
          </div>
          <span className="text-[9px] px-2 py-0.5 rounded bg-[#0B0E11] text-[#848E9C] font-mono border border-[#2B2F36]">
            {strategyScores.length} Evaluated
          </span>
        </div>

        {/* Ranking List */}
        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
          {strategyScores.map((strat, index) => {
            const isWinner = index === 0 && strat.confidence >= 60;

            return (
              <div
                key={strat.id}
                id={`strategy-row-${strat.id}`}
                className={`p-2 rounded border transition ${
                  isWinner
                    ? 'bg-blue-500/10 border-blue-500/40'
                    : 'bg-[#0B0E11] border-[#2B2F36] hover:bg-[#1E2329]'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 min-w-0">
                    <span
                      className={`w-4 h-4 rounded flex items-center justify-center font-mono font-bold text-[9px] ${
                        isWinner ? 'bg-blue-600 text-white' : 'bg-[#1E2329] text-[#848E9C] border border-[#2B2F36]'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className="font-bold text-[#EAECEF] text-xs truncate">{strat.name}</span>
                    {isWinner && (
                      <span className="text-[8px] font-black px-1.5 py-0.2 rounded bg-yellow-500 text-slate-950 uppercase">
                        WINNER
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#161A1E] text-blue-300 border border-[#2B2F36]">
                      {strat.signalType}
                    </span>
                    <span className="text-xs font-mono font-bold text-white w-8 text-right">
                      {strat.confidence}%
                    </span>
                  </div>
                </div>

                {/* Score bar */}
                <div className="mt-1.5 w-full bg-[#1E2329] rounded h-1 overflow-hidden">
                  <div
                    className={`h-full rounded ${
                      isWinner ? 'bg-blue-500' : strat.confidence >= 70 ? 'bg-[#848E9C]' : 'bg-[#2B2F36]'
                    }`}
                    style={{ width: `${strat.confidence}%` }}
                  />
                </div>

                <div className="mt-1 text-[10px] text-[#848E9C] flex items-center justify-between">
                  <span className="truncate pr-2">{strat.entryCriteria}</span>
                  <span className="font-mono text-[9px] text-[#848E9C] shrink-0">
                    Win Rate: {strat.winRateHistorical}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

