import React from 'react';
import { AccountState, ActiveSignal, MarketAsset, StrategyScore } from '../types';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  Cpu,
  Layers,
  Radio,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Zap,
} from 'lucide-react';

interface DashboardViewProps {
  accounts: AccountState;
  derivSignal: ActiveSignal | null;
  mt5Signal: ActiveSignal | null;
  derivMarkets: MarketAsset[];
  mt5Markets: MarketAsset[];
  strategyScores: StrategyScore[];
  onSelectMarket: (market: MarketAsset) => void;
  onNavigateTab: (tab: any) => void;
  isDarkMode?: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  accounts,
  derivSignal,
  mt5Signal,
  derivMarkets,
  mt5Markets,
  strategyScores,
  onSelectMarket,
  onNavigateTab,
  isDarkMode = true,
}) => {
  return (
    <div id="global-dashboard-view" className="space-y-4">
      {/* 1. Account Cards & 4-Way Connection Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Deriv Account Card */}
        <div
          id="dashboard-deriv-card"
          className={`p-4 rounded-lg border ${
            isDarkMode ? 'bg-[#161A1E] border-[#2B2F36]' : 'bg-white border-slate-200'
          } shadow-sm space-y-3 font-mono`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#10b981]" />
              <div>
                <h3 className="font-bold text-xs text-[#EAECEF] uppercase tracking-wider">DERIV SYNTHETICS</h3>
                <span className="text-[10px] text-green-400">Connected • WebSocket</span>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('deriv')}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1 uppercase font-bold"
            >
              <span>Terminal</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="p-2.5 rounded bg-[#0B0E11] border border-[#2B2F36]">
              <div className="text-[10px] text-[#848E9C] uppercase">Demo Balance</div>
              <div className="text-base font-bold text-white mt-0.5">
                ${accounts.deriv.demoBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[9px] text-[#848E9C]">Virtual Account</div>
            </div>
            <div className="p-2.5 rounded bg-[#0B0E11] border border-[#2B2F36]">
              <div className="text-[10px] text-[#848E9C] uppercase">Real Balance</div>
              <div className="text-base font-bold text-green-400 mt-0.5">
                ${accounts.deriv.realBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[9px] text-green-500/80">Active Live Funds</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-[#848E9C] pt-1 border-t border-[#2B2F36]">
            <span>Active: <strong className="text-white uppercase">{accounts.deriv.activeAccount}</strong></span>
            <span>Sync: {accounts.deriv.lastSync}</span>
          </div>
        </div>

        {/* MT5 Account Card */}
        <div
          id="dashboard-mt5-card"
          className={`p-4 rounded-lg border ${
            isDarkMode ? 'bg-[#161A1E] border-[#2B2F36]' : 'bg-white border-slate-200'
          } shadow-sm space-y-3 font-mono`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_#3b82f6]" />
              <div>
                <h3 className="font-bold text-xs text-[#EAECEF] uppercase tracking-wider">META TRADER 5</h3>
                <span className="text-[10px] text-blue-400">Connected • Bridge Feed</span>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('mt5')}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1 uppercase font-bold"
            >
              <span>Terminal</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="p-2.5 rounded bg-[#0B0E11] border border-[#2B2F36]">
              <div className="text-[10px] text-[#848E9C] uppercase">Demo Balance</div>
              <div className="text-base font-bold text-white mt-0.5">
                ${accounts.mt5.demoBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[9px] text-[#848E9C]">Broker Virtual</div>
            </div>
            <div className="p-2.5 rounded bg-[#0B0E11] border border-[#2B2F36]">
              <div className="text-[10px] text-[#848E9C] uppercase">Real Balance</div>
              <div className="text-base font-bold text-blue-400 mt-0.5">
                ${accounts.mt5.realBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[9px] text-blue-500/80">Live Equity</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-[#848E9C] pt-1 border-t border-[#2B2F36]">
            <span>Active: <strong className="text-white uppercase">{accounts.mt5.activeAccount}</strong></span>
            <span>Sync: {accounts.mt5.lastSync}</span>
          </div>
        </div>

        {/* Dedicated Connection Status Matrix */}
        <div
          id="dashboard-connection-status-panel"
          className={`p-4 rounded-lg border ${
            isDarkMode ? 'bg-[#161A1E] border-[#2B2F36]' : 'bg-white border-slate-200'
          } shadow-sm space-y-2.5 flex flex-col justify-between font-mono`}
        >
          <div>
            <div className="flex items-center space-x-2 text-[11px] font-bold uppercase tracking-wider text-[#848E9C] mb-2">
              <Radio className="w-3.5 h-3.5 text-blue-400" />
              <span>Real-Time Engine Status</span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between p-1.5 rounded bg-[#0B0E11] border border-[#2B2F36]">
                <span className="text-[#848E9C] text-[11px]">Deriv Gateway</span>
                <span className="flex items-center space-x-1.5 text-green-400 font-bold text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_6px_#10b981]" />
                  <span>ONLINE</span>
                </span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-[#0B0E11] border border-[#2B2F36]">
                <span className="text-[#848E9C] text-[11px]">MT5 Bridge</span>
                <span className="flex items-center space-x-1.5 text-green-400 font-bold text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_6px_#10b981]" />
                  <span>ONLINE</span>
                </span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-[#0B0E11] border border-[#2B2F36]">
                <span className="text-[#848E9C] text-[11px]">Data Feed</span>
                <span className="flex items-center space-x-1.5 text-blue-400 font-bold text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_6px_#3b82f6]" />
                  <span>60Hz LIVE</span>
                </span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-[#0B0E11] border border-[#2B2F36]">
                <span className="text-[#848E9C] text-[11px]">Analysis Engine</span>
                <span className="flex items-center space-x-1.5 text-green-400 font-bold text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_6px_#10b981]" />
                  <span>ACTIVE</span>
                </span>
              </div>
            </div>
          </div>

          <div className="pt-1 text-[9px] text-[#848E9C] flex items-center justify-between">
            <span>Latency: <strong className="text-white">14ms</strong></span>
            <span>All systems nominal</span>
          </div>
        </div>
      </div>

      {/* 2. Active Signals (Deriv vs MT5) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-bold text-[#848E9C] uppercase tracking-wider flex items-center space-x-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span>Active Trading Intelligence Signals</span>
          </h2>
          <span className="text-[10px] text-[#848E9C] font-mono">Single-Strategy Confluence Architecture</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono">
          {/* Deriv Active Signal Card */}
          <div
            id="dashboard-deriv-signal"
            className={`p-4 rounded-lg border ${
              isDarkMode ? 'bg-[#161A1E] border-[#2B2F36]' : 'bg-white border-slate-200'
            } shadow-sm space-y-3`}
          >
            <div className="flex items-center justify-between border-b border-[#2B2F36] pb-2">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/30">
                  DERIV SYNTHETIC
                </span>
                <span className="font-bold text-white text-xs">{derivSignal?.marketName || 'Volatility 75'}</span>
              </div>
              <span className="text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-500/30 px-2 py-0.5 rounded">
                Confidence: {derivSignal?.strength || 94}%
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] text-[#848E9C] uppercase">Winning Strategy</div>
                <div className="font-bold text-xs text-white mt-0.5">{derivSignal?.strategyName || 'SMC Order Block'}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-[#848E9C] uppercase">Signal Action</div>
                <div className="text-xl font-black text-green-400">{derivSignal?.signalType || 'RISE'}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs pt-1">
              <div className="p-2 rounded bg-[#0B0E11] border border-[#2B2F36]">
                <div className="text-[9px] text-[#848E9C] uppercase">Entry Ref</div>
                <div className="font-bold text-white mt-0.5 text-xs">{derivSignal?.entryPrice.toFixed(2) || '4521.34'}</div>
              </div>
              <div className="p-2 rounded bg-[#0B0E11] border border-[#2B2F36]">
                <div className="text-[9px] text-[#848E9C] uppercase">Contract</div>
                <div className="font-bold text-blue-300 mt-0.5 text-xs truncate">{derivSignal?.recommendedContract || 'Rise Contract'}</div>
              </div>
              <div className="p-2 rounded bg-[#0B0E11] border border-[#2B2F36]">
                <div className="text-[9px] text-[#848E9C] uppercase">Risk Level</div>
                <div className="font-bold text-green-400 mt-0.5 text-xs">{derivSignal?.riskLevel || 'LOW'}</div>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('deriv')}
              className="w-full py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 transition"
            >
              <span>Open Deriv Analysis Terminal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* MT5 Active Signal Card */}
          <div
            id="dashboard-mt5-signal"
            className={`p-4 rounded-lg border ${
              isDarkMode ? 'bg-[#161A1E] border-[#2B2F36]' : 'bg-white border-slate-200'
            } shadow-sm space-y-3`}
          >
            <div className="flex items-center justify-between border-b border-[#2B2F36] pb-2">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  MT5 FOREX & METALS
                </span>
                <span className="font-bold text-white text-xs">{mt5Signal?.marketName || 'EUR/USD'}</span>
              </div>
              <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 rounded">
                Confidence: {mt5Signal?.strength || 89}%
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] text-[#848E9C] uppercase">Winning Strategy</div>
                <div className="font-bold text-xs text-white mt-0.5">{mt5Signal?.strategyName || 'EMA Trend Pullback'}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-[#848E9C] uppercase">Signal Action</div>
                <div className="text-xl font-black text-blue-400">{mt5Signal?.signalType || 'BUY'}</div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-1.5 text-xs pt-1">
              <div className="p-1.5 rounded bg-[#0B0E11] border border-[#2B2F36]">
                <div className="text-[8px] text-[#848E9C] uppercase">Entry</div>
                <div className="font-bold text-white mt-0.5 text-[11px] truncate">{mt5Signal?.entryPrice.toFixed(5) || '1.17420'}</div>
              </div>
              <div className="p-1.5 rounded bg-[#0B0E11] border border-[#2B2F36]">
                <div className="text-[8px] text-[#848E9C] uppercase">Stop Loss</div>
                <div className="font-bold text-rose-400 mt-0.5 text-[11px] truncate">{mt5Signal?.stopLoss?.toFixed(5) || '1.17280'}</div>
              </div>
              <div className="p-1.5 rounded bg-[#0B0E11] border border-[#2B2F36]">
                <div className="text-[8px] text-[#848E9C] uppercase">Take Profit</div>
                <div className="font-bold text-green-400 mt-0.5 text-[11px] truncate">{mt5Signal?.takeProfit?.toFixed(5) || '1.17700'}</div>
              </div>
              <div className="p-1.5 rounded bg-[#0B0E11] border border-[#2B2F36]">
                <div className="text-[8px] text-[#848E9C] uppercase">R:R Ratio</div>
                <div className="font-bold text-blue-300 mt-0.5 text-[11px] truncate">{mt5Signal?.riskReward || '1:2.0'}</div>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('mt5')}
              className="w-full py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 transition"
            >
              <span>Open MT5 Analysis Terminal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Market Condition Scanner Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#848E9C] uppercase tracking-wider flex items-center space-x-2">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>Market Condition Scanner (Deriv & MT5 Data Grid)</span>
          </h3>
          <span className="text-[10px] text-[#848E9C] font-mono">Real-time quote matrix</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[...derivMarkets.slice(0, 4), ...mt5Markets.slice(0, 2)].map(m => {
            const isPos = m.change24h >= 0;
            return (
              <div
                key={m.id}
                onClick={() => {
                  onSelectMarket(m);
                  onNavigateTab(m.platform);
                }}
                className={`p-2.5 rounded-lg border cursor-pointer transition-all hover:border-blue-500 font-mono ${
                  isDarkMode ? 'bg-[#161A1E] border-[#2B2F36]' : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-[#848E9C] uppercase">{m.platform}</span>
                  <span className={`text-[10px] font-bold ${isPos ? 'text-green-400' : 'text-rose-400'}`}>
                    {isPos ? '+' : ''}{m.change24h}%
                  </span>
                </div>
                <div className="font-bold text-xs text-white truncate mt-1">{m.symbol}</div>
                <div className="font-bold text-sm text-[#EAECEF] mt-0.5">
                  {m.currentPrice.toFixed(m.digits)}
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[9px] text-[#848E9C]">
                  <span className="capitalize">{m.trend.replace('_', ' ')}</span>
                  <span className="px-1.5 py-0.2 rounded bg-[#0B0E11] text-blue-400 font-bold border border-[#2B2F36]">
                    {m.signalStrength}%
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
