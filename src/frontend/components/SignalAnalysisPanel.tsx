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
} from 'lucide-react';

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

  useEffect(() => {
    if (!activeSignal) return;
    setCountdown(activeSignal.expiresInSeconds);
    const interval = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : activeSignal.initialExpirySeconds || 15));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSignal]);

  const strength = activeSignal?.strength || 50;

  // Strength classification
  let strengthLabel = 'NO TRADE';
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
  } else if (strength >= 70) {
    strengthLabel = 'MODERATE';
    strengthBadgeColor = 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/40';
    strengthBarColor = 'bg-yellow-500';
  } else if (strength >= 60) {
    strengthLabel = 'WEAK';
    strengthBadgeColor = 'bg-rose-500/15 text-rose-400 border border-rose-500/40';
    strengthBarColor = 'bg-rose-500';
  }

  const isBullish =
    activeSignal?.direction === 'RISE' ||
    activeSignal?.direction === 'BUY' ||
    activeSignal?.signalType?.includes('OVER');
  const isBearish =
    activeSignal?.direction === 'FALL' ||
    activeSignal?.direction === 'SELL' ||
    activeSignal?.signalType?.includes('UNDER');

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
              className={`w-10 h-10 rounded flex items-center justify-center font-bold text-lg ${
                isBullish
                  ? 'bg-green-500/15 text-green-400 border border-green-500/40'
                  : isBearish
                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/40'
                  : 'bg-blue-500/15 text-blue-400 border border-blue-500/40'
              }`}
            >
              {isBullish ? <ArrowUpRight className="w-5 h-5" /> : isBearish ? <ArrowDownRight className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
            </div>
            <div>
              <div className="text-[10px] text-[#848E9C] uppercase font-bold">PRIMARY SIGNAL</div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
                <span>{activeSignal?.signalType || 'WAIT'}</span>
                {activeSignal?.targetDigit !== undefined && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40">
                    Digit [{activeSignal.targetDigit}]
                  </span>
                )}
              </h2>
            </div>
          </div>

          {/* Expiry Countdown */}
          <div className="flex items-center space-x-2 bg-[#0B0E11] px-3 py-1.5 rounded border border-[#2B2F36]">
            <Clock className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
            <div>
              <div className="text-[9px] text-[#848E9C] uppercase font-bold">Signal Validity</div>
              <div className="text-xs font-mono font-bold text-yellow-300">
                00:{countdown.toString().padStart(2, '0')}s
              </div>
            </div>
          </div>
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
              {strength}%
            </div>
          </div>

          <div className="w-full bg-[#0B0E11] rounded h-2.5 overflow-hidden p-0.5 border border-[#2B2F36]">
            <div
              className={`h-full rounded transition-all duration-500 ${strengthBarColor}`}
              style={{ width: `${strength}%` }}
            />
          </div>
          <p className="text-[10px] text-[#848E9C]">
            *Algorithmically verified with mathematical single-strategy confluence.
          </p>
        </div>

        {/* Signal Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="p-2 rounded bg-[#0B0E11] border border-[#2B2F36]">
            <div className="text-[9px] text-[#848E9C] uppercase">Winning Strategy</div>
            <div className="text-[11px] font-bold text-white truncate mt-0.5" title={activeSignal?.strategyName}>
              {activeSignal?.strategyName || 'Multi-Factor Engine'}
            </div>
          </div>
          <div className="p-2 rounded bg-[#0B0E11] border border-[#2B2F36]">
            <div className="text-[9px] text-[#848E9C] uppercase">Entry Ref</div>
            <div className="text-[11px] font-mono font-bold text-blue-400 mt-0.5">
              {activeSignal?.entryPrice.toFixed(asset.digits) || asset.currentPrice.toFixed(asset.digits)}
            </div>
          </div>
          <div className="p-2 rounded bg-[#0B0E11] border border-[#2B2F36]">
            <div className="text-[9px] text-[#848E9C] uppercase">Market Structure</div>
            <div className="text-[11px] font-bold text-green-400 truncate mt-0.5">
              {marketCondition}
            </div>
          </div>
          <div className="p-2 rounded bg-[#0B0E11] border border-[#2B2F36]">
            <div className="text-[9px] text-[#848E9C] uppercase">Risk Level</div>
            <div className="text-[11px] font-bold text-green-300 mt-0.5 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span>{activeSignal?.riskLevel || 'LOW'}</span>
            </div>
          </div>
        </div>

        {/* Execution & Action Buttons */}
        <div className="pt-1 flex flex-wrap items-center gap-2">
          <button
            id="btn-execute-signal-now"
            onClick={() => activeSignal && onExecuteTrade?.(activeSignal)}
            className="flex-1 py-2 px-3 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition active:scale-98"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Simulate / Send Trade Signal to Bot</span>
          </button>
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
