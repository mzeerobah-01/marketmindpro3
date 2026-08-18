import React, { useState } from 'react';
import { StrategyDefinition } from '../types';
import {
  BookOpen,
  Search,
  CheckCircle2,
  Layers,
  Zap,
  Target,
  Shield,
  ArrowRight,
} from 'lucide-react';

interface StrategyLibraryViewProps {
  strategies: StrategyDefinition[];
  isDarkMode?: boolean;
}

export const StrategyLibraryView: React.FC<StrategyLibraryViewProps> = ({
  strategies,
  isDarkMode = true,
}) => {
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>(strategies[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStrategies = strategies.filter(
    s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedStrategy = strategies.find(s => s.id === selectedStrategyId) || strategies[0];

  const winRate = selectedStrategy?.winRateHistorical || selectedStrategy?.historicalWinRate || 75;
  const profitFactor = selectedStrategy?.profitFactor || 1.85;
  const indicators = selectedStrategy?.requiredIndicators || selectedStrategy?.indicatorsUsed || ['Price Action'];
  const markets = selectedStrategy?.recommendedMarkets || ['Volatility Indices', 'Forex'];
  const platforms = selectedStrategy?.applicablePlatforms || ['Deriv', 'MT5'];

  return (
    <div id="strategy-library-workspace" className="space-y-3 font-mono">
      {/* Header */}
      <div
        className={`p-3.5 rounded-lg border ${
          isDarkMode ? 'bg-[#161A1E] border-[#2B2F36]' : 'bg-white border-slate-200'
        } shadow-sm flex flex-wrap items-center justify-between gap-3`}
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded bg-blue-500/15 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Strategy Documentation Library</h2>
            <p className="text-[11px] text-[#848E9C]">
              Technical documentation, mathematical rules, and execution criteria
            </p>
          </div>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#848E9C] absolute left-2.5 top-2" />
          <input
            type="text"
            placeholder="Search strategies..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1 rounded text-xs bg-[#0B0E11] border border-[#2B2F36] text-[#EAECEF] placeholder-[#848E9C] focus:outline-hidden focus:border-blue-500"
          />
        </div>
      </div>

      {/* 2-Column Library Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left: Strategy Directory (4 cols) */}
        <div
          className={`lg:col-span-4 p-2.5 rounded-lg border ${
            isDarkMode ? 'bg-[#161A1E] border-[#2B2F36]' : 'bg-white border-slate-200'
          } space-y-1.5 max-h-[750px] overflow-y-auto`}
        >
          <div className="text-[10px] font-bold text-[#848E9C] uppercase px-2 py-1">Strategy Index</div>
          {filteredStrategies.map(strat => {
            const isSelected = strat.id === selectedStrategyId;
            const stratWinRate = strat.winRateHistorical || strat.historicalWinRate || 75;
            return (
              <button
                key={strat.id}
                onClick={() => setSelectedStrategyId(strat.id)}
                className={`w-full text-left p-2.5 rounded border text-xs transition ${
                  isSelected
                    ? 'bg-blue-500/20 border-blue-500/50 text-white'
                    : 'bg-[#0B0E11] border-[#2B2F36] text-[#848E9C] hover:bg-[#1E2329] hover:text-[#EAECEF]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white truncate text-xs">{strat.name}</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#161A1E] text-blue-400 border border-[#2B2F36] shrink-0">
                    {strat.category}
                  </span>
                </div>
                <div className="text-[10px] text-[#848E9C] mt-1 flex items-center justify-between">
                  <span className="truncate">{strat.defaultContractType || strat.recommendedTimeframe || 'Standard'}</span>
                  <span className="font-mono text-green-400 font-bold">{stratWinRate}%</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right: Strategy Deep Dive Document (8 cols) */}
        <div
          className={`lg:col-span-8 p-4 sm:p-5 rounded-lg border ${
            isDarkMode ? 'bg-[#161A1E] border-[#2B2F36]' : 'bg-white border-slate-200'
          } space-y-4`}
        >
          {selectedStrategy && (
            <>
              {/* Header */}
              <div className="border-b border-[#2B2F36] pb-3.5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
                      {selectedStrategy.category}
                    </span>
                    <span className="text-xs text-[#848E9C]">
                      Platforms: {platforms.join(' & ')}
                    </span>
                  </div>
                  <h1 className="text-xl font-bold text-white uppercase mt-1">{selectedStrategy.name}</h1>
                </div>

                <div className="flex items-center space-x-2 text-xs font-mono">
                  <div className="p-2 rounded bg-[#0B0E11] border border-[#2B2F36] text-center">
                    <div className="text-[9px] text-[#848E9C] uppercase font-bold">Win Rate</div>
                    <div className="text-sm font-bold text-green-400 mt-0.5">{winRate}%</div>
                  </div>
                  <div className="p-2 rounded bg-[#0B0E11] border border-[#2B2F36] text-center">
                    <div className="text-[9px] text-[#848E9C] uppercase font-bold">Profit Factor</div>
                    <div className="text-sm font-bold text-blue-400 mt-0.5">{profitFactor.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              {/* Core Description */}
              <div className="space-y-1.5">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#848E9C] flex items-center space-x-1.5">
                  <Zap className="w-3.5 h-3.5 text-yellow-400" />
                  <span>Strategy Overview & Philosophy</span>
                </h3>
                <p className="text-xs text-[#EAECEF] leading-relaxed bg-[#0B0E11] p-3 rounded border border-[#2B2F36] font-sans">
                  {selectedStrategy.description}
                </p>
              </div>

              {/* Precise Indicator Parameters & Required Inputs */}
              <div className="space-y-1.5">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#848E9C] flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                  <span>Technical Indicators & Setup Requirements</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded bg-[#0B0E11] border border-[#2B2F36]">
                    <span className="text-[#848E9C] block text-[10px] uppercase font-bold">Required Indicators:</span>
                    <span className="font-semibold text-white mt-0.5 block">
                      {indicators.join(', ')}
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-[#0B0E11] border border-[#2B2F36]">
                    <span className="text-[#848E9C] block text-[10px] uppercase font-bold">Recommended Assets:</span>
                    <span className="font-semibold text-white mt-0.5 block">
                      {markets.join(', ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Precise Entry Rules */}
              <div className="space-y-1.5">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#848E9C] flex items-center space-x-1.5">
                  <Target className="w-3.5 h-3.5 text-green-400" />
                  <span>Mathematical Entry & Trigger Criteria</span>
                </h3>
                <div className="p-3 rounded bg-green-500/10 border border-green-500/30 text-xs text-green-300 space-y-1">
                  <div className="font-mono text-xs">{selectedStrategy.entryCriteria}</div>
                  <div className="text-[10px] text-green-400/80">
                    *Automated evaluation engine verifies confluence in real-time on every tick and candle close.
                  </div>
                </div>
              </div>

              {/* Risk Management & Expiry Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
                <div className="p-2.5 rounded bg-[#0B0E11] border border-[#2B2F36]">
                  <div className="text-[9px] text-[#848E9C] uppercase font-bold">Default Contract</div>
                  <div className="font-bold text-white mt-0.5">{selectedStrategy.defaultContractType || 'Contract Execution'}</div>
                </div>
                <div className="p-2.5 rounded bg-[#0B0E11] border border-[#2B2F36]">
                  <div className="text-[9px] text-[#848E9C] uppercase font-bold">Recommended Expiry</div>
                  <div className="font-bold text-yellow-400 mt-0.5">{selectedStrategy.defaultExpiryTicks || 5} Ticks / 1-5 Mins</div>
                </div>
                <div className="p-2.5 rounded bg-[#0B0E11] border border-[#2B2F36]">
                  <div className="text-[9px] text-[#848E9C] uppercase font-bold">Risk Rule</div>
                  <div className="font-bold text-green-400 mt-0.5">Strict Confirmation Required</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
