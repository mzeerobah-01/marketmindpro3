import React, { useState } from 'react';
import { DigitStat, TickData } from '../types';
import { Activity, BarChart2, Hash, Zap, RefreshCw, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';

interface DigitAnalysisPanelProps {
  digitStats: DigitStat[];
  lastTickDigit: number;
  ticks: TickData[];
  sampleSize: number;
  onSampleSizeChange: (size: number) => void;
  isDarkMode?: boolean;
}

export const DigitAnalysisPanel: React.FC<DigitAnalysisPanelProps> = ({
  digitStats,
  lastTickDigit,
  ticks,
  sampleSize,
  onSampleSizeChange,
  isDarkMode = true,
}) => {
  const [activeTab, setActiveTab] = useState<'circles' | 'bars' | 'history'>('circles');

  // Key stats
  const highest = digitStats.find(d => d.rank === 'highest');
  const secondHighest = digitStats.find(d => d.rank === 'second_highest');
  const lowest = digitStats.find(d => d.rank === 'lowest');
  const secondLowest = digitStats.find(d => d.rank === 'second_lowest');

  const sampleTicks = ticks.slice(-sampleSize);
  const evenCount = sampleTicks.filter(t => t.lastDigit % 2 === 0).length;
  const oddCount = sampleTicks.length - evenCount;
  const evenPct = sampleTicks.length ? ((evenCount / sampleTicks.length) * 100).toFixed(1) : '50.0';
  const oddPct = sampleTicks.length ? ((oddCount / sampleTicks.length) * 100).toFixed(1) : '50.0';

  const underCount = sampleTicks.filter(t => t.lastDigit < 5).length;
  const overCount = sampleTicks.length - underCount;
  const underPct = sampleTicks.length ? ((underCount / sampleTicks.length) * 100).toFixed(1) : '50.0';
  const overPct = sampleTicks.length ? ((overCount / sampleTicks.length) * 100).toFixed(1) : '50.0';

  // Helper for digit circle color
  const getCircleStyles = (stat: DigitStat) => {
    switch (stat.colorTag) {
      case 'green':
        return isDarkMode
          ? 'border-green-500 bg-green-500/15 text-green-400 shadow-[0_0_10px_rgba(16,185,129,0.2)] ring-1 ring-green-500/40'
          : 'border-emerald-600 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-400';
      case 'blue':
        return isDarkMode
          ? 'border-blue-500 bg-blue-500/15 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)] ring-1 ring-blue-500/40'
          : 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-400';
      case 'yellow':
        return isDarkMode
          ? 'border-yellow-500 bg-yellow-500/15 text-yellow-400 ring-1 ring-yellow-500/40'
          : 'border-amber-600 bg-amber-50 text-amber-700 ring-1 ring-amber-400';
      case 'red':
        return isDarkMode
          ? 'border-rose-500 bg-rose-500/15 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.2)] ring-1 ring-rose-500/40'
          : 'border-rose-600 bg-rose-50 text-rose-700 ring-2 ring-rose-400';
      default:
        return isDarkMode
          ? 'border-[#2B2F36] bg-[#0B0E11] text-[#848E9C] hover:border-[#3B4048]'
          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300';
    }
  };

  const getRankBadge = (stat: DigitStat) => {
    switch (stat.colorTag) {
      case 'green':
        return <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-green-500/20 text-green-300 border border-green-500/30">MAX</span>;
      case 'blue':
        return <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">2ND</span>;
      case 'yellow':
        return <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">LOW 2</span>;
      case 'red':
        return <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">MIN</span>;
      default:
        return null;
    }
  };

  return (
    <div
      id="deriv-digit-analysis-panel"
      className={`rounded-lg border ${
        isDarkMode ? 'bg-[#161A1E] border-[#2B2F36]' : 'bg-white border-slate-200'
      } shadow-sm overflow-hidden flex flex-col font-mono`}
    >
      {/* Header */}
      <div
        className={`px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-2 ${
          isDarkMode ? 'bg-[#1E2329] border-[#2B2F36]' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
            <Hash className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Deriv Digit Probability Matrix
            </h3>
            <p className="text-[10px] text-[#848E9C]">Real-time tick digit distribution & frequency</p>
          </div>
        </div>

        {/* View mode tabs & Sample Size */}
        <div className="flex items-center space-x-2">
          {/* Sample Size */}
          <div className="flex items-center bg-[#0B0E11] rounded p-0.5 border border-[#2B2F36] text-xs">
            <span className="text-[#848E9C] px-1.5 py-0.5 text-[10px] uppercase font-bold">Ticks:</span>
            {[25, 50, 100, 500].map(sz => (
              <button
                key={sz}
                id={`btn-sample-size-${sz}`}
                onClick={() => onSampleSizeChange(sz)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition ${
                  sampleSize === sz ? 'bg-blue-600 text-white shadow-xs' : 'text-[#848E9C] hover:text-[#EAECEF]'
                }`}
              >
                {sz}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-[#2B2F36]" />

          {/* Sub Tab Buttons */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('circles')}
              className={`px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wider ${
                activeTab === 'circles' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-[#848E9C] hover:text-[#EAECEF]'
              }`}
            >
              Matrix
            </button>
            <button
              onClick={() => setActiveTab('bars')}
              className={`px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wider ${
                activeTab === 'bars' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-[#848E9C] hover:text-[#EAECEF]'
              }`}
            >
              Bars
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wider ${
                activeTab === 'history' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-[#848E9C] hover:text-[#EAECEF]'
              }`}
            >
              Feed
            </button>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-3.5 space-y-3">
        {/* Color Ranking Legend */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs py-1 px-2.5 rounded bg-[#0B0E11] border border-[#2B2F36]">
          <span className="text-[#848E9C] text-[10px] uppercase font-bold">Ranks:</span>
          <div className="flex items-center space-x-3 text-[10px]">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_6px_#10b981]" />
              <span className="text-green-400 font-bold">Green (MAX)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_6px_#3b82f6]" />
              <span className="text-blue-400 font-bold">Blue (2nd)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-yellow-400 font-bold">Yellow (Low 2)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_#ef4444]" />
              <span className="text-rose-400 font-bold">Red (MIN)</span>
            </div>
          </div>
          <div className="text-[10px] text-[#848E9C]">
            Live Tick: <span className="font-mono font-bold text-rose-400">[{lastTickDigit}]</span>
          </div>
        </div>

        {/* 1. CIRCLE VIEW WITH MOVING RED CURSOR */}
        {activeTab === 'circles' && (
          <div id="digit-circles-container" className="relative pt-6 pb-1">
            {/* Grid of 10 digits (0 through 9) */}
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {digitStats.map(stat => {
                const isCurrent = stat.digit === lastTickDigit;

                return (
                  <div key={stat.digit} className="relative flex flex-col items-center">
                    {/* Moving Red Triangular Cursor */}
                    <div
                      className={`absolute -top-5 transition-all duration-300 transform ${
                        isCurrent ? 'opacity-100 scale-110 translate-y-0' : 'opacity-0 scale-75 -translate-y-2'
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-[8px] font-extrabold text-rose-500 uppercase font-mono">
                          LIVE
                        </span>
                        <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-rose-500 drop-shadow-[0_2px_4px_rgba(244,63,94,0.6)]" />
                      </div>
                    </div>

                    {/* Circular Card */}
                    <div
                      id={`digit-circle-${stat.digit}`}
                      className={`w-full aspect-square max-w-[72px] rounded-lg border flex flex-col items-center justify-center p-1 transition-all duration-200 ${getCircleStyles(
                        stat
                      )} ${isCurrent ? 'scale-105 shadow-md border-rose-500' : ''}`}
                    >
                      <div className="text-sm sm:text-base font-bold font-mono tracking-tight">{stat.digit}</div>
                      <div className="text-[10px] font-bold font-mono">
                        {stat.percentage.toFixed(1)}%
                      </div>
                      <div className="mt-0.5">{getRankBadge(stat)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. DISTRIBUTION BARS VIEW */}
        {activeTab === 'bars' && (
          <div id="digit-bars-container" className="space-y-1.5 py-1">
            {digitStats.map(stat => {
              const isCurrent = stat.digit === lastTickDigit;
              let barColor = 'bg-[#2B2F36]';
              if (stat.colorTag === 'green') barColor = 'bg-green-500';
              else if (stat.colorTag === 'blue') barColor = 'bg-blue-500';
              else if (stat.colorTag === 'yellow') barColor = 'bg-yellow-500';
              else if (stat.colorTag === 'red') barColor = 'bg-rose-500';

              return (
                <div key={stat.digit} className="flex items-center space-x-2 text-xs">
                  <div className="w-5 font-mono font-bold text-center flex items-center justify-center">
                    {stat.digit}
                    {isCurrent && <span className="ml-1 text-rose-500 font-black">▶</span>}
                  </div>
                  <div className="flex-1 bg-[#0B0E11] rounded h-3 overflow-hidden p-0.5 border border-[#2B2F36]">
                    <div
                      className={`h-full rounded transition-all duration-300 ${barColor}`}
                      style={{ width: `${Math.max(4, stat.percentage * 3.2)}%` }}
                    />
                  </div>
                  <div className="w-12 text-right font-mono font-bold text-[#EAECEF] text-xs">{stat.percentage.toFixed(1)}%</div>
                  <div className="w-10 text-right">{getRankBadge(stat)}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* 3. LAST 25 TICKS HISTORY FEED */}
        {activeTab === 'history' && (
          <div id="last-25-ticks-table" className="overflow-x-auto max-h-56 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#2B2F36] text-[#848E9C] font-semibold text-[10px] uppercase">
                  <th className="py-1 px-2.5"># Tick</th>
                  <th className="py-1 px-2.5">Price</th>
                  <th className="py-1 px-2.5 text-center">Digit</th>
                  <th className="py-1 px-2.5 text-center">Type</th>
                  <th className="py-1 px-2.5 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2B2F36]">
                {ticks
                  .slice(-25)
                  .reverse()
                  .map((t, idx) => {
                    const isNewest = idx === 0;
                    const isEven = t.lastDigit % 2 === 0;
                    const isOver = t.lastDigit >= 5;

                    return (
                      <tr
                        key={t.id}
                        className={`transition-colors ${
                          isNewest ? 'bg-blue-500/10 font-bold text-blue-300' : 'hover:bg-[#1E2329]'
                        }`}
                      >
                        <td className="py-1 px-2.5 font-mono text-[#848E9C] text-[11px]">
                          {t.id} {isNewest && <span className="text-[9px] text-green-400 font-bold ml-1">LATEST</span>}
                        </td>
                        <td className="py-1 px-2.5 font-mono font-bold text-[#EAECEF] text-[11px]">
                          {t.price.toFixed(4)}
                        </td>
                        <td className="py-1 px-2.5 text-center">
                          <span
                            className={`inline-block w-5 h-5 leading-5 rounded font-mono font-bold text-center text-xs ${
                              isNewest
                                ? 'bg-rose-600 text-white animate-pulse'
                                : 'bg-[#0B0E11] text-[#EAECEF] border border-[#2B2F36]'
                            }`}
                          >
                            {t.lastDigit}
                          </span>
                        </td>
                        <td className="py-1 px-2.5 text-center space-x-1">
                          <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${isEven ? 'bg-blue-500/20 text-blue-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                            {isEven ? 'EVEN' : 'ODD'}
                          </span>
                          <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${isOver ? 'bg-green-500/20 text-green-300' : 'bg-rose-500/20 text-rose-300'}`}>
                            {isOver ? 'OVER' : 'UNDER'}
                          </span>
                        </td>
                        <td className="py-1 px-2.5 text-right font-mono text-[#848E9C] text-[10px]">
                          {new Date(t.timestamp).toLocaleTimeString()}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}

        {/* Statistical Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#2B2F36]">
          <div className="p-2 rounded bg-[#0B0E11] border border-[#2B2F36]">
            <div className="text-[10px] text-[#848E9C] uppercase">Dominant (Green)</div>
            <div className="text-xs font-bold text-green-400 font-mono flex items-center justify-between mt-0.5">
              <span>Digit {highest?.digit ?? '-'}</span>
              <span>{highest?.percentage.toFixed(1)}%</span>
            </div>
          </div>
          <div className="p-2 rounded bg-[#0B0E11] border border-[#2B2F36]">
            <div className="text-[10px] text-[#848E9C] uppercase">Weakest (Red)</div>
            <div className="text-xs font-bold text-rose-400 font-mono flex items-center justify-between mt-0.5">
              <span>Digit {lowest?.digit ?? '-'}</span>
              <span>{lowest?.percentage.toFixed(1)}%</span>
            </div>
          </div>
          <div className="p-2 rounded bg-[#0B0E11] border border-[#2B2F36]">
            <div className="text-[10px] text-[#848E9C] uppercase">Even / Odd Split</div>
            <div className="text-xs font-bold text-blue-300 font-mono flex items-center justify-between mt-0.5">
              <span>E: {evenPct}%</span>
              <span>O: {oddPct}%</span>
            </div>
          </div>
          <div className="p-2 rounded bg-[#0B0E11] border border-[#2B2F36]">
            <div className="text-[10px] text-[#848E9C] uppercase">Over / Under Split</div>
            <div className="text-xs font-bold text-yellow-300 font-mono flex items-center justify-between mt-0.5">
              <span>O: {overPct}%</span>
              <span>U: {underPct}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
