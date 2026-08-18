import React, { useState } from 'react';
import { StrategyDefinition } from '../types';
import {
  BarChart3,
  CheckCircle,
  TrendingUp,
  Percent,
  Layers,
  Award,
  Zap,
  Filter,
} from 'lucide-react';

interface StrategyPerformanceViewProps {
  strategies: StrategyDefinition[];
  onToggleStrategy: (id: string) => void;
  isDarkMode?: boolean;
}

export const StrategyPerformanceView: React.FC<StrategyPerformanceViewProps> = ({
  strategies,
  onToggleStrategy,
  isDarkMode = true,
}) => {
  const [platformFilter, setPlatformFilter] = useState<'all' | 'deriv' | 'mt5' | 'both'>('all');

  const filtered = strategies.filter(s => {
    const platforms = s.applicablePlatforms || ['deriv', 'mt5'];
    if (platformFilter === 'all') return true;
    if (platformFilter === 'both') return platforms.includes('both') || platforms.length > 1;
    return platforms.includes(platformFilter) || platforms.includes('both');
  });

  const avgWinRate = (
    strategies.reduce((acc, s) => acc + (s.winRateHistorical || s.historicalWinRate || 75), 0) /
    (strategies.length || 1)
  ).toFixed(1);

  return (
    <div id="strategy-performance-workspace" className="space-y-3 font-mono">
      {/* Header */}
      <div
        className={`p-3.5 rounded-lg border ${
          isDarkMode ? 'bg-[#161A1E] border-[#2B2F36]' : 'bg-white border-slate-200'
        } shadow-sm flex flex-wrap items-center justify-between gap-3`}
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded bg-blue-500/15 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Strategy Performance Matrix</h2>
            <p className="text-[11px] text-[#848E9C]">
              Real-time analytics and controls for multi-strategy confluence engine
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="px-3 py-1.5 rounded bg-[#0B0E11] border border-[#2B2F36] font-mono text-[11px]">
            <span className="text-[#848E9C]">Average Win Rate: </span>
            <span className="font-bold text-green-400">{avgWinRate}%</span>
          </div>

          <div className="flex items-center bg-[#0B0E11] rounded p-0.5 border border-[#2B2F36]">
            {(['all', 'deriv', 'mt5', 'both'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPlatformFilter(p)}
                className={`px-2.5 py-1 rounded text-[10px] uppercase font-bold ${
                  platformFilter === p ? 'bg-blue-600 text-white' : 'text-[#848E9C] hover:text-[#EAECEF]'
                }`}
              >
                {p === 'both' ? 'Dual-Market' : p.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Strategy Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(strat => {
          const platforms = strat.applicablePlatforms || ['deriv', 'mt5'];
          const winRate = strat.winRateHistorical || strat.historicalWinRate || 75;
          const profitFactor = strat.profitFactor || 1.85;
          const totalTrades = strat.totalTradesHistorical || strat.totalSignals || 200;
          const indicators = strat.requiredIndicators || strat.indicatorsUsed || ['Price Action'];
          const markets = strat.recommendedMarkets || ['Volatility Indices', 'Forex'];

          return (
            <div
              key={strat.id}
              className={`p-3.5 rounded-lg border transition ${
                strat.enabled
                  ? isDarkMode
                    ? 'bg-[#161A1E] border-[#2B2F36] hover:border-[#3a414b]'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                  : 'bg-[#0B0E11] border-[#2B2F36] opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
                      {strat.category}
                    </span>
                    <span className="text-[9px] text-[#848E9C] font-mono">
                      {platforms.join(', ')}
                    </span>
                  </div>
                  <h3 className="font-bold text-xs text-white uppercase mt-1">{strat.name}</h3>
                </div>

                {/* Enable/Disable Toggle */}
                <button
                  id={`toggle-strat-${strat.id}`}
                  onClick={() => onToggleStrategy(strat.id)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    strat.enabled ? 'bg-blue-600' : 'bg-[#2B2F36]'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      strat.enabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <p className="text-[11px] text-[#848E9C] mt-2 line-clamp-2 leading-relaxed font-sans">
                {strat.description}
              </p>

              {/* Performance Metrics */}
              <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-[#2B2F36] text-xs">
                <div className="p-2 rounded bg-[#0B0E11] border border-[#2B2F36]">
                  <div className="text-[9px] text-[#848E9C] uppercase font-bold">Historical Win</div>
                  <div className="text-xs font-mono font-bold text-green-400 mt-0.5">
                    {winRate}%
                  </div>
                </div>
                <div className="p-2 rounded bg-[#0B0E11] border border-[#2B2F36]">
                  <div className="text-[9px] text-[#848E9C] uppercase font-bold">Profit Factor</div>
                  <div className="text-xs font-mono font-bold text-blue-400 mt-0.5">
                    {profitFactor.toFixed(2)}
                  </div>
                </div>
                <div className="p-2 rounded bg-[#0B0E11] border border-[#2B2F36]">
                  <div className="text-[9px] text-[#848E9C] uppercase font-bold">Total Tested</div>
                  <div className="text-xs font-mono font-bold text-[#EAECEF] mt-0.5">
                    {totalTrades}
                  </div>
                </div>
              </div>

              {/* Indicators & Markets */}
              <div className="mt-2.5 space-y-1 text-[10px] text-[#848E9C]">
                <div>
                  <span className="text-[#848E9C]">Indicators: </span>
                  <span className="text-[#EAECEF]">{indicators.join(', ')}</span>
                </div>
                <div>
                  <span className="text-[#848E9C]">Target Assets: </span>
                  <span className="text-[#EAECEF]">{markets.join(', ')}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
