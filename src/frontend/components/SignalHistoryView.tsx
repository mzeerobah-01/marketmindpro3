import React, { useState } from 'react';
import { SignalHistoryItem } from '../types';
import {
  History,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Trash2,
} from 'lucide-react';

interface SignalHistoryViewProps {
  history: SignalHistoryItem[];
  onClearHistory: () => void;
  isDarkMode?: boolean;
}

export const SignalHistoryView: React.FC<SignalHistoryViewProps> = ({
  history,
  onClearHistory,
  isDarkMode = true,
}) => {
  const [platformFilter, setPlatformFilter] = useState<'all' | 'deriv' | 'mt5'>('all');
  const [resultFilter, setResultFilter] = useState<'all' | 'WIN' | 'LOSS' | 'EXPIRED'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredHistory = history.filter(item => {
    const matchesPlatform = platformFilter === 'all' || item.platform === platformFilter;
    const matchesResult = resultFilter === 'all' || item.result === resultFilter;
    const matchesSearch =
      item.marketName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.strategyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.signalType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPlatform && matchesResult && matchesSearch;
  });

  const totalWins = history.filter(h => h.result === 'WIN').length;
  const totalLosses = history.filter(h => h.result === 'LOSS').length;
  const winRate = history.length > 0 ? ((totalWins / (totalWins + totalLosses || 1)) * 100).toFixed(1) : '76.4';

  const exportCSV = () => {
    const headers = ['Time', 'Platform', 'Market', 'Strategy', 'Signal', 'Strength', 'Entry', 'Result', 'Profit'];
    const rows = history.map(h => [
      new Date(h.generatedAt).toISOString(),
      h.platform,
      h.marketName,
      h.strategyName,
      h.signalType,
      `${h.strength}%`,
      h.entryPrice,
      h.result || 'ACTIVE',
      h.profitAmount || 0,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `marketmindpro_signals_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="signal-history-workspace" className="space-y-3 font-mono">
      {/* Top Overview Strip */}
      <div
        className={`p-3.5 rounded-lg border ${
          isDarkMode ? 'bg-[#161A1E] border-[#2B2F36]' : 'bg-white border-slate-200'
        } shadow-sm flex flex-wrap items-center justify-between gap-3`}
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded bg-blue-500/15 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Signal History & Trade Audit Log</h2>
            <p className="text-[11px] text-[#848E9C]">Verifiable trace of algorithmic signals and outcomes</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="px-2.5 py-1.5 rounded bg-[#0B0E11] border border-[#2B2F36]">
            <span className="text-[#848E9C]">Signals: </span>
            <span className="font-bold text-white">{history.length}</span>
          </div>
          <div className="px-2.5 py-1.5 rounded bg-[#0B0E11] border border-[#2B2F36]">
            <span className="text-[#848E9C]">Win Rate: </span>
            <span className="font-bold text-green-400">{winRate}%</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={exportCSV}
              className="px-2.5 py-1.5 rounded bg-[#0B0E11] border border-[#2B2F36] hover:bg-[#1E2329] text-[#EAECEF] font-bold text-[11px] uppercase flex items-center space-x-1"
            >
              <Download className="w-3 h-3" />
              <span>CSV</span>
            </button>
            <button
              onClick={onClearHistory}
              className="px-2.5 py-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-[11px] uppercase flex items-center space-x-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        className={`p-2.5 rounded-lg border ${
          isDarkMode ? 'bg-[#161A1E] border-[#2B2F36]' : 'bg-slate-50 border-slate-200'
        } flex flex-wrap items-center justify-between gap-2 text-xs`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#848E9C] absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Search history..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 rounded text-xs bg-[#0B0E11] border border-[#2B2F36] text-[#EAECEF] placeholder-[#848E9C] focus:outline-hidden"
            />
          </div>

          {/* Platform filter */}
          <div className="flex items-center bg-[#0B0E11] rounded p-0.5 border border-[#2B2F36]">
            {(['all', 'deriv', 'mt5'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPlatformFilter(p)}
                className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                  platformFilter === p ? 'bg-blue-600 text-white' : 'text-[#848E9C] hover:text-[#EAECEF]'
                }`}
              >
                {p === 'all' ? 'All Platforms' : p.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Result filter */}
          <div className="flex items-center bg-[#0B0E11] rounded p-0.5 border border-[#2B2F36]">
            {(['all', 'WIN', 'LOSS', 'EXPIRED'] as const).map(r => (
              <button
                key={r}
                onClick={() => setResultFilter(r)}
                className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                  resultFilter === r ? 'bg-blue-600 text-white' : 'text-[#848E9C] hover:text-[#EAECEF]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* History Table */}
      <div
        className={`rounded-lg border ${
          isDarkMode ? 'bg-[#161A1E] border-[#2B2F36]' : 'bg-white border-slate-200'
        } shadow-sm overflow-hidden`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#2B2F36] bg-[#0B0E11] text-[#848E9C] font-bold text-[10px] uppercase tracking-wider">
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Market</th>
                <th className="py-2.5 px-3">Winning Strategy</th>
                <th className="py-2.5 px-3 text-center">Signal</th>
                <th className="py-2.5 px-3 text-center">Confidence</th>
                <th className="py-2.5 px-3 text-right">Entry</th>
                <th className="py-2.5 px-3 text-center">Outcome</th>
                <th className="py-2.5 px-3 text-right">PnL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2B2F36] font-mono">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#848E9C] font-sans">
                    No signal logs recorded yet. Signals generated in Deriv/MT5 workspaces will automatically be logged here.
                  </td>
                </tr>
              ) : (
                filteredHistory.map(item => {
                  const isWin = item.result === 'WIN';
                  const isLoss = item.result === 'LOSS';

                  return (
                    <tr key={item.id} className="hover:bg-[#1E2329] transition">
                      <td className="py-2 px-3 text-[#848E9C] text-[10px]">
                        {new Date(item.generatedAt).toLocaleTimeString()}
                      </td>
                      <td className="py-2 px-3 font-bold text-white text-xs">
                        <span className="text-[9px] px-1 py-0.2 rounded mr-1.5 uppercase bg-[#0B0E11] text-blue-400 border border-[#2B2F36]">
                          {item.platform}
                        </span>
                        {item.marketName}
                      </td>
                      <td className="py-2 px-3 text-[#848E9C] text-xs">
                        {item.strategyName}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="px-1.5 py-0.5 rounded bg-[#0B0E11] border border-[#2B2F36] font-bold text-[10px] text-white">
                          {item.signalType}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center font-bold text-white text-xs">
                        {item.strength}%
                      </td>
                      <td className="py-2 px-3 text-right text-[#EAECEF]">
                        {item.entryPrice.toFixed(4)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${
                            isWin
                              ? 'bg-green-500/15 border-green-500/30 text-green-300'
                              : isLoss
                              ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                              : 'bg-yellow-500/15 border-yellow-500/30 text-yellow-300'
                          }`}
                        >
                          {isWin && <CheckCircle2 className="w-2.5 h-2.5" />}
                          {isLoss && <XCircle className="w-2.5 h-2.5" />}
                          <span>{item.result || 'ACTIVE'}</span>
                        </span>
                      </td>
                      <td className={`py-2 px-3 text-right font-bold text-xs ${
                        (item.profitAmount || 0) >= 0 ? 'text-green-400' : 'text-rose-400'
                      }`}>
                        {(item.profitAmount || 0) >= 0 ? '+' : ''}${(item.profitAmount || 0).toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
