import React, { useState } from 'react';
import { ActiveSignal, CandleData, DigitStat, MarketAsset, SmcOverlay, StrategyScore, TickData } from '../types';
import { TradingChart } from './TradingChart';
import { DigitAnalysisPanel } from './DigitAnalysisPanel';
import { SignalAnalysisPanel } from './SignalAnalysisPanel';
import {
  Activity,
  ChevronDown,
  Layers,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';

interface DerivAnalysisViewProps {
  markets: MarketAsset[];
  selectedMarket: MarketAsset;
  onSelectMarket: (market: MarketAsset) => void;
  candles: CandleData[];
  ticks: TickData[];
  digitStats: DigitStat[];
  lastTickDigit: number;
  sampleSize: number;
  onSampleSizeChange: (size: number) => void;
  activeSignal: ActiveSignal | null;
  strategyScores: StrategyScore[];
  marketCondition: string;
  smcOverlays: SmcOverlay[];
  onExecuteTrade: (signal: ActiveSignal) => void;
  isDarkMode?: boolean;
}

export const DerivAnalysisView: React.FC<DerivAnalysisViewProps> = ({
  markets,
  selectedMarket,
  onSelectMarket,
  candles,
  ticks,
  digitStats,
  lastTickDigit,
  sampleSize,
  onSampleSizeChange,
  activeSignal,
  strategyScores,
  marketCondition,
  smcOverlays,
  onExecuteTrade,
  isDarkMode = true,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1M');

  const filteredMarkets = markets.filter(m => {
    const matchesCat =
      selectedCategory === 'all' ||
      (selectedCategory === 'volatility' && m.category === 'volatility') ||
      (selectedCategory === 'volatility_1s' && m.category === 'volatility_1s') ||
      (selectedCategory === 'boom' && m.category === 'boom') ||
      (selectedCategory === 'crash' && m.category === 'crash') ||
      (selectedCategory === 'step' && m.category === 'step');
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div id="deriv-analysis-workspace" className="space-y-3 font-mono">
      {/* 1. Top Market Selector & Status Strip */}
      <div
        id="deriv-market-selector-strip"
        className={`p-3.5 rounded-lg border ${
          isDarkMode ? 'bg-[#161A1E] border-[#2B2F36]' : 'bg-white border-slate-200'
        } shadow-sm space-y-2.5`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Active Market Info Header */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-green-500/15 border border-green-500/40 flex items-center justify-center font-bold text-green-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-white uppercase">{selectedMarket.name}</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-green-500/15 text-green-300 border border-green-500/30">
                  {selectedMarket.symbol}
                </span>
              </div>
              <div className="flex items-center space-x-3 text-[11px] text-[#848E9C] mt-0.5">
                <span>
                  Price: <strong className="text-white font-mono">{selectedMarket.currentPrice.toFixed(selectedMarket.digits)}</strong>
                </span>
                <span>•</span>
                <span>
                  Trend: <strong className="text-green-400 capitalize">{selectedMarket.trend.replace('_', ' ')}</strong>
                </span>
                <span>•</span>
                <span>
                  Volatility: <strong className="text-yellow-400 uppercase">{selectedMarket.volatility}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Search & Category Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#848E9C] absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Search indices..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 rounded text-xs bg-[#0B0E11] border border-[#2B2F36] text-[#EAECEF] placeholder-[#848E9C] focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div className="flex items-center bg-[#0B0E11] rounded p-0.5 border border-[#2B2F36] text-xs">
              {[
                { id: 'all', label: 'All' },
                { id: 'volatility', label: 'Vol (Continuous)' },
                { id: 'volatility_1s', label: 'Vol (1s)' },
                { id: 'boom', label: 'Boom' },
                { id: 'crash', label: 'Crash' },
                { id: 'step', label: 'Step' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition ${
                    selectedCategory === cat.id
                      ? 'bg-blue-600 text-white'
                      : 'text-[#848E9C] hover:text-[#EAECEF]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Market Switcher Carousel */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
          {filteredMarkets.map(m => {
            const isSelected = m.id === selectedMarket.id;
            return (
              <button
                key={m.id}
                id={`btn-select-market-${m.id}`}
                onClick={() => onSelectMarket(m)}
                className={`px-2.5 py-1.5 rounded border whitespace-nowrap flex items-center space-x-2 transition ${
                  isSelected
                    ? 'bg-blue-500/20 border-blue-500/50 text-white'
                    : 'bg-[#0B0E11] border-[#2B2F36] text-[#848E9C] hover:bg-[#1E2329] hover:text-[#EAECEF]'
                }`}
              >
                <div className="text-left">
                  <div className="font-bold text-white text-xs">{m.symbol}</div>
                  <div className="text-[10px] font-mono text-[#848E9C]">{m.currentPrice.toFixed(m.digits)}</div>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#161A1E] text-green-400 border border-[#2B2F36]">
                    {m.signalStrength}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Main Workspace Layout: Chart & Signals on Left/Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left Column: Live Chart & Digit Analysis (8 cols) */}
        <div className="lg:col-span-8 space-y-3">
          {/* Live Chart */}
          <TradingChart
            asset={selectedMarket}
            candles={candles}
            ticks={ticks}
            smcOverlays={smcOverlays}
            selectedTimeframe={selectedTimeframe}
            onTimeframeChange={setSelectedTimeframe}
            isDarkMode={isDarkMode}
          />

          {/* Deriv Digit Analysis Panel */}
          <DigitAnalysisPanel
            digitStats={digitStats}
            lastTickDigit={lastTickDigit}
            ticks={ticks}
            sampleSize={sampleSize}
            onSampleSizeChange={onSampleSizeChange}
            isDarkMode={isDarkMode}
          />
        </div>

        {/* Right Column: Main Signal Panel & Strategy Ranking (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <SignalAnalysisPanel
            asset={selectedMarket}
            activeSignal={activeSignal}
            strategyScores={strategyScores}
            marketCondition={marketCondition}
            onExecuteTrade={onExecuteTrade}
            isDarkMode={isDarkMode}
          />
        </div>
      </div>
    </div>
  );
};
