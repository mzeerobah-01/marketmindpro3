import React, { useState } from 'react';
import { ActiveSignal, CandleData, MarketAsset, SmcOverlay, StrategyScore, TickData } from '../types';
import { TradingChart } from './TradingChart';
import { SignalAnalysisPanel } from './SignalAnalysisPanel';
import {
  Cpu,
  Search,
  TrendingUp,
  TrendingDown,
  Layers,
  Shield,
  Zap,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Send,
  BarChart2,
  Radio,
} from 'lucide-react';

interface MT5AnalysisViewProps {
  markets: MarketAsset[];
  selectedMarket: MarketAsset;
  onSelectMarket: (market: MarketAsset) => void;
  candles: CandleData[];
  ticks: TickData[];
  activeSignal: ActiveSignal | null;
  strategyScores: StrategyScore[];
  marketCondition: string;
  smcOverlays: SmcOverlay[];
  onExecuteTrade: (signal: ActiveSignal) => void;
  onOpenMT5Connect?: () => void;
  isDarkMode?: boolean;
}

export const MT5AnalysisView: React.FC<MT5AnalysisViewProps> = ({
  markets,
  selectedMarket,
  onSelectMarket,
  candles,
  ticks,
  activeSignal,
  strategyScores,
  marketCondition,
  smcOverlays,
  onExecuteTrade,
  onOpenMT5Connect,
  isDarkMode = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState('15M');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredMarkets = markets.filter(m => {
    const matchesCat =
      selectedCategory === 'all' ||
      (selectedCategory === 'forex' && m.category === 'forex') ||
      (selectedCategory === 'commodities' && m.category === 'commodities') ||
      (selectedCategory === 'indices' && m.category === 'indices') ||
      (selectedCategory === 'crypto' && m.category === 'crypto');
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Calculate SL / TP values for TradingView / MT5 asset
  const curPrice = selectedMarket.currentPrice;
  const isBuy = activeSignal?.direction === 'BUY' || activeSignal?.direction === 'RISE';
  const slOffset = curPrice * 0.003;
  const tpOffset = slOffset * 2.0; // 1:2 R:R

  const calculatedEntry = activeSignal?.entryPrice || curPrice;
  const calculatedSL = isBuy ? calculatedEntry - slOffset : calculatedEntry + slOffset;
  const calculatedTP = isBuy ? calculatedEntry + tpOffset : calculatedEntry - tpOffset;

  return (
    <div id="tradingview-analysis-workspace" className="space-y-3 font-mono">
      {/* 1. Market Selector & Status Strip */}
      <div
        id="tv-market-selector-strip"
        className={`p-3.5 rounded-lg border ${
          isDarkMode ? 'bg-[#161A1E] border-[#2B2F36]' : 'bg-white border-slate-200'
        } shadow-sm space-y-2.5`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded bg-blue-500/15 border border-blue-500/40 flex items-center justify-center font-bold text-blue-400">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-white uppercase">{selectedMarket.name}</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
                  {selectedMarket.symbol}
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  TradingView Live Feed
                </span>
              </div>
              <div className="flex items-center space-x-3 text-[11px] text-[#848E9C] mt-0.5">
                <span>
                  Price: <strong className="text-white font-mono">{selectedMarket.currentPrice.toFixed(selectedMarket.digits)}</strong>
                </span>
                <span>•</span>
                <span>
                  Pip: <strong className="text-white font-mono">{selectedMarket.pipSize}</strong>
                </span>
                <span>•</span>
                <span>
                  Trend: <strong className="text-blue-400 capitalize">{selectedMarket.trend.replace('_', ' ')}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Search, Category Pills & Connect MT5 Button */}
          <div className="flex flex-wrap items-center gap-2">
            {onOpenMT5Connect && (
              <button
                id="btn-mt5-workspace-connect"
                onClick={onOpenMT5Connect}
                className="px-2.5 py-1.5 rounded bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/40 text-blue-400 font-mono text-[11px] font-bold uppercase flex items-center space-x-1.5 transition cursor-pointer"
                title="Connect MetaTrader 5 Account"
              >
                <Cpu className="w-3.5 h-3.5 text-blue-400" />
                <span>MT5 Bridge</span>
              </button>
            )}

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#848E9C] absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Search symbol..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 rounded text-xs bg-[#0B0E11] border border-[#2B2F36] text-[#EAECEF] placeholder-[#848E9C] focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div className="flex items-center bg-[#0B0E11] rounded p-0.5 border border-[#2B2F36] text-xs">
              {[
                { id: 'all', label: 'All' },
                { id: 'forex', label: 'Forex' },
                { id: 'commodities', label: 'Metals / Oil' },
                { id: 'indices', label: 'Indices' },
                { id: 'crypto', label: 'Crypto' },
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

        {/* Quick Symbol Switcher */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
          {filteredMarkets.map(m => {
            const isSelected = m.id === selectedMarket.id;
            return (
              <button
                key={m.id}
                id={`btn-select-mt5-market-${m.id}`}
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
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#161A1E] text-blue-400 border border-[#2B2F36]">
                    {m.signalStrength}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left Column: Live TradingView Chart with Entry/SL/TP Markers (8 cols) */}
        <div className="lg:col-span-8 space-y-3">
          <TradingChart
            asset={selectedMarket}
            candles={candles}
            ticks={ticks}
            smcOverlays={smcOverlays}
            entryPrice={calculatedEntry}
            stopLoss={calculatedSL}
            takeProfit={calculatedTP}
            selectedTimeframe={selectedTimeframe}
            onTimeframeChange={setSelectedTimeframe}
            isDarkMode={isDarkMode}
            defaultEngine="tradingview"
          />

          {/* Trade Parameters & Risk/Reward Card */}
          <div
            id="tradingview-trade-setup-card"
            className={`p-3.5 rounded-lg border ${
              isDarkMode ? 'bg-[#161A1E] border-[#2B2F36]' : 'bg-white border-slate-200'
            } shadow-sm space-y-2.5`}
          >
            <div className="flex items-center justify-between border-b border-[#2B2F36] pb-2">
              <div className="flex items-center space-x-2">
                <Target className="w-3.5 h-3.5 text-blue-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Live Signal Order Parameters (Entry & Exit Points)
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-green-400 bg-green-500/10 border border-green-500/30 px-2 py-0.5 rounded">
                R:R 1:2.0
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2 rounded bg-[#0B0E11] border border-[#2B2F36]">
                <div className="text-[9px] text-[#848E9C] uppercase font-bold">Signal Status</div>
                <div className="text-xs font-bold mt-0.5 flex items-center space-x-1">
                  {activeSignal ? (
                    isBuy ? (
                      <>
                        <ArrowUpRight className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-green-400">BUY / LONG</span>
                      </>
                    ) : (
                      <>
                        <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
                        <span className="text-rose-400">SELL / SHORT</span>
                      </>
                    )
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                      <span className="text-[#848E9C]">SCANNING MARKET</span>
                    </>
                  )}
                </div>
              </div>
              <div className="p-2 rounded bg-[#0B0E11] border border-blue-500/30">
                <div className="text-[9px] text-[#848E9C] uppercase font-bold">🎯 Entry Point</div>
                <div className="text-xs font-mono font-bold text-white mt-0.5">
                  {activeSignal ? calculatedEntry.toFixed(selectedMarket.digits) : 'Awaiting Trigger'}
                </div>
              </div>
              <div className="p-2 rounded bg-[#0B0E11] border border-rose-500/30">
                <div className="text-[9px] text-rose-400 uppercase font-bold">🔴 Exit Point (SL)</div>
                <div className="text-xs font-mono font-bold text-rose-400 mt-0.5">
                  {activeSignal ? calculatedSL.toFixed(selectedMarket.digits) : 'Pending Setup'}
                </div>
              </div>
              <div className="p-2 rounded bg-[#0B0E11] border border-green-500/30">
                <div className="text-[9px] text-green-400 uppercase font-bold">🟢 Exit Point (TP)</div>
                <div className="text-xs font-mono font-bold text-green-400 mt-0.5">
                  {activeSignal ? calculatedTP.toFixed(selectedMarket.digits) : 'Pending Setup'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Signal Panel & Ranking Table (4 cols) */}
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

