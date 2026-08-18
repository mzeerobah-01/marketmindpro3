import React, { useState } from 'react';
import { AccountState, MarketAsset, RiskManagementSettings } from '../types';
import {
  Calculator,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  AlertTriangle,
  Flame,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Percent,
  RefreshCw,
  Sliders,
} from 'lucide-react';

interface RiskCalculatorViewProps {
  accounts: AccountState;
  riskSettings: RiskManagementSettings;
  onUpdateRiskSettings: (settings: Partial<RiskManagementSettings>) => void;
  onToggleEmergencyLock: () => void;
  onResetRiskLimits: () => void;
  derivMarkets: MarketAsset[];
  mt5Markets: MarketAsset[];
  isDarkMode?: boolean;
}

export const RiskCalculatorView: React.FC<RiskCalculatorViewProps> = ({
  accounts,
  riskSettings,
  onUpdateRiskSettings,
  onToggleEmergencyLock,
  onResetRiskLimits,
  derivMarkets,
  mt5Markets,
  isDarkMode = true,
}) => {
  const [activeTab, setActiveTab] = useState<'deriv' | 'mt5'>('deriv');

  // Deriv inputs
  const [derivBalance, setDerivBalance] = useState<number>(accounts.deriv.realBalance || 1250);
  const [derivRiskPct, setDerivRiskPct] = useState<number>(2.0);
  const [derivDailyLossLimit, setDerivDailyLossLimit] = useState<number>(100);
  const [derivDailyTarget, setDerivDailyTarget] = useState<number>(250);
  const [derivPlannedTrades, setDerivPlannedTrades] = useState<number>(10);
  const [derivStakeMethod, setDerivStakeMethod] = useState<RiskManagementSettings['stakeMethod']>('percentage');

  // MT5 inputs
  const [mt5Balance, setMt5Balance] = useState<number>(accounts.mt5.realBalance || 2500);
  const [mt5RiskPct, setMt5RiskPct] = useState<number>(1.5);
  const [mt5Entry, setMt5Entry] = useState<number>(1.17420);
  const [mt5SL, setMt5SL] = useState<number>(1.17280);
  const [mt5TP, setMt5TP] = useState<number>(1.17700);
  const [mt5PipValue, setMt5PipValue] = useState<number>(10);

  // Deriv Calculations
  const calculatedDerivStake = (derivBalance * (derivRiskPct / 100)) / (derivStakeMethod === 'dalembert' ? 1.5 : 1);
  const maxDailyRiskAmount = (derivBalance * (riskSettings.maxDailyLoss / 100));
  const remainingDailyRisk = Math.max(0, maxDailyRiskAmount - riskSettings.dailyLossTotal);

  // MT5 Calculations
  const slDistancePips = Math.abs(mt5Entry - mt5SL) * 10000;
  const tpDistancePips = Math.abs(mt5TP - mt5Entry) * 10000;
  const riskAmountUsd = mt5Balance * (mt5RiskPct / 100);
  const recommendedLotSize = slDistancePips > 0 ? (riskAmountUsd / (slDistancePips * mt5PipValue)) : 0.1;
  const riskRewardRatio = slDistancePips > 0 ? (tpDistancePips / slDistancePips).toFixed(2) : '1:2.0';
  const potentialProfitUsd = recommendedLotSize * tpDistancePips * mt5PipValue;

  // Status classification
  let riskStatus: 'SAFE' | 'CAUTION' | 'HIGH RISK' | 'TRADING LOCKED' = 'SAFE';
  let riskStatusColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';

  if (riskSettings.isLocked) {
    riskStatus = 'TRADING LOCKED';
    riskStatusColor = 'bg-rose-500/20 text-rose-400 border-rose-500/40';
  } else if (riskSettings.currentDrawdown >= riskSettings.maxDrawdownLimit * 0.8) {
    riskStatus = 'HIGH RISK';
    riskStatusColor = 'bg-rose-500/20 text-rose-400 border-rose-500/40';
  } else if (riskSettings.currentDrawdown >= riskSettings.maxDrawdownLimit * 0.5) {
    riskStatus = 'CAUTION';
    riskStatusColor = 'bg-amber-500/20 text-amber-400 border-amber-500/40';
  }

  return (
    <div id="risk-calculator-workspace" className="space-y-4 font-mono">
      {/* 1. Global Risk Status & Circuit Breaker Monitor */}
      <div
        id="global-risk-status-panel"
        className={`p-4 rounded-lg border ${
          riskSettings.isLocked
            ? 'bg-rose-950/20 border-rose-800/80'
            : isDarkMode
            ? 'bg-[#161A1E] border-[#2B2F36]'
            : 'bg-white border-slate-200'
        } shadow-sm space-y-3`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2B2F36] pb-3">
          <div className="flex items-center space-x-3">
            <div
              className={`w-9 h-9 rounded flex items-center justify-center font-bold ${
                riskSettings.isLocked ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'
              }`}
            >
              {riskSettings.isLocked ? <Lock className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-[10px] text-[#848E9C] font-bold uppercase">Automated Account Protection</div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Circuit Status:</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${riskStatusColor}`}>
                  {riskStatus}
                </span>
              </h2>
            </div>
          </div>

          {/* Emergency Lock / Reset buttons */}
          <div className="flex items-center space-x-2">
            <button
              id="btn-emergency-stop-circuit-breaker"
              onClick={onToggleEmergencyLock}
              className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition ${
                riskSettings.isLocked
                  ? 'bg-green-600 hover:bg-green-500 text-white'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-md'
              }`}
            >
              {riskSettings.isLocked ? (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Unlock Terminal</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Emergency Kill Switch</span>
                </>
              )}
            </button>
            <button
              onClick={onResetRiskLimits}
              className="px-2.5 py-1.5 rounded text-xs font-bold uppercase tracking-wider bg-[#0B0E11] hover:bg-[#1E2329] text-[#848E9C] hover:text-white border border-[#2B2F36] flex items-center space-x-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Live Risk Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <div className="p-2.5 rounded bg-[#0B0E11] border border-[#2B2F36]">
            <div className="text-[10px] text-[#848E9C] uppercase">Risk / Trade</div>
            <div className="text-base font-bold text-blue-400 mt-0.5">
              {riskSettings.riskPercentage.toFixed(1)}%
            </div>
            <div className="text-[9px] text-[#848E9C]">Per position cap</div>
          </div>
          <div className="p-2.5 rounded bg-[#0B0E11] border border-[#2B2F36]">
            <div className="text-[10px] text-[#848E9C] uppercase">Current Drawdown</div>
            <div className="text-base font-bold text-yellow-400 mt-0.5">
              {riskSettings.currentDrawdown.toFixed(1)}%
            </div>
            <div className="text-[9px] text-[#848E9C]">Peak-to-trough</div>
          </div>
          <div className="p-2.5 rounded bg-[#0B0E11] border border-[#2B2F36]">
            <div className="text-[10px] text-[#848E9C] uppercase">Daily Loss Limit</div>
            <div className="text-base font-bold text-rose-400 mt-0.5">
              ${riskSettings.dailyLossTotal.toFixed(2)} / ${riskSettings.maxDailyLoss}
            </div>
            <div className="text-[9px] text-[#848E9C]">Hard stop threshold</div>
          </div>
          <div className="p-2.5 rounded bg-[#0B0E11] border border-[#2B2F36]">
            <div className="text-[10px] text-[#848E9C] uppercase">Profit Progress</div>
            <div className="text-base font-bold text-green-400 mt-0.5">
              ${riskSettings.dailyProfitTotal.toFixed(2)} / ${riskSettings.dailyProfitTarget}
            </div>
            <div className="text-[9px] text-[#848E9C]">Target lock</div>
          </div>
          <div className="p-2.5 rounded bg-[#0B0E11] border border-[#2B2F36]">
            <div className="text-[10px] text-[#848E9C] uppercase">Loss Streak</div>
            <div className="text-base font-bold text-white mt-0.5">
              {riskSettings.consecutiveLosses} / {riskSettings.consecutiveLossLimit}
            </div>
            <div className="text-[9px] text-[#848E9C]">Pause trigger</div>
          </div>
        </div>
      </div>

      {/* 2. Calculator Workspace Tabs */}
      <div
        id="risk-calculator-tabs-panel"
        className={`p-4 rounded-lg border ${
          isDarkMode ? 'bg-[#161A1E] border-[#2B2F36]' : 'bg-white border-slate-200'
        } shadow-sm space-y-4`}
      >
        <div className="flex items-center justify-between border-b border-[#2B2F36] pb-3">
          <div className="flex items-center space-x-2">
            <Calculator className="w-4 h-4 text-blue-400" />
            <h3 className="font-bold text-white text-xs uppercase tracking-wider">Position & Stake Sizing Calculator</h3>
          </div>

          <div className="flex items-center bg-[#0B0E11] rounded p-0.5 border border-[#2B2F36] text-xs">
            <button
              onClick={() => setActiveTab('deriv')}
              className={`px-3 py-1 rounded text-[11px] font-bold uppercase transition ${
                activeTab === 'deriv' ? 'bg-blue-600 text-white' : 'text-[#848E9C] hover:text-[#EAECEF]'
              }`}
            >
              Deriv Calculator
            </button>
            <button
              onClick={() => setActiveTab('mt5')}
              className={`px-3 py-1 rounded text-[11px] font-bold uppercase transition ${
                activeTab === 'mt5' ? 'bg-blue-600 text-white' : 'text-[#848E9C] hover:text-[#EAECEF]'
              }`}
            >
              MT5 Calculator
            </button>
          </div>
        </div>

        {/* Tab 1: Deriv Calculator */}
        {activeTab === 'deriv' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Inputs (7 cols) */}
            <div className="lg:col-span-7 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#848E9C] uppercase block mb-1">
                    Account Balance ($ USD)
                  </label>
                  <input
                    type="number"
                    value={derivBalance}
                    onChange={e => setDerivBalance(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded bg-[#0B0E11] border border-[#2B2F36] text-white font-mono font-bold text-xs focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#848E9C] uppercase block mb-1">
                    Risk Percentage Per Trade (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={derivRiskPct}
                    onChange={e => setDerivRiskPct(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded bg-[#0B0E11] border border-[#2B2F36] text-white font-mono font-bold text-xs focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#848E9C] uppercase block mb-1">
                    Max Daily Loss ($ USD)
                  </label>
                  <input
                    type="number"
                    value={derivDailyLossLimit}
                    onChange={e => setDerivDailyLossLimit(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded bg-[#0B0E11] border border-[#2B2F36] text-white font-mono font-bold text-xs focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#848E9C] uppercase block mb-1">
                    Daily Profit Target ($ USD)
                  </label>
                  <input
                    type="number"
                    value={derivDailyTarget}
                    onChange={e => setDerivDailyTarget(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded bg-[#0B0E11] border border-[#2B2F36] text-white font-mono font-bold text-xs focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Stake Strategy Selection */}
              <div>
                <label className="text-[11px] font-bold text-[#848E9C] uppercase block mb-1.5">
                  Money Management & Staking Model
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'percentage', label: 'Percentage Risk', desc: 'Scales with balance' },
                    { id: 'fixed', label: 'Fixed Staking', desc: 'Constant monetary stake' },
                    { id: 'anti_martingale', label: 'Anti-Martingale', desc: 'Increase on win, reset loss' },
                    { id: 'dalembert', label: "D'Alembert Model", desc: 'Linear unit progression' },
                    { id: 'dynamic', label: 'Dynamic Sizing', desc: 'Volatility & win streak' },
                    { id: 'ai_adaptive', label: 'AI Adaptive Risk', desc: 'Confidence-weighted sizing' },
                  ].map(m => (
                    <button
                      key={m.id}
                      onClick={() => setDerivStakeMethod(m.id as any)}
                      className={`p-2 rounded border text-left text-xs transition ${
                        derivStakeMethod === m.id
                          ? 'bg-blue-500/20 border-blue-500/50 text-white'
                          : 'bg-[#0B0E11] border-[#2B2F36] text-[#848E9C] hover:text-[#EAECEF]'
                      }`}
                    >
                      <div className="font-bold text-white text-xs">{m.label}</div>
                      <div className="text-[9px] text-[#848E9C] mt-0.5">{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Calculated Outputs (5 cols) */}
            <div className="lg:col-span-5 p-3.5 rounded bg-[#0B0E11] border border-[#2B2F36] flex flex-col justify-between space-y-3">
              <div>
                <div className="text-[10px] font-bold text-[#848E9C] uppercase mb-2.5">Calculated Output Summary</div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded bg-[#161A1E] border border-[#2B2F36]">
                    <span className="text-[#848E9C] text-[11px]">Recommended Stake:</span>
                    <span className="text-lg font-mono font-bold text-green-400">
                      ${calculatedDerivStake.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-[#161A1E] border border-[#2B2F36]">
                    <span className="text-[#848E9C] text-[11px]">Max Daily Risk:</span>
                    <span className="font-mono font-bold text-white">${maxDailyRiskAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-[#161A1E] border border-[#2B2F36]">
                    <span className="text-[#848E9C] text-[11px]">Remaining Daily Risk:</span>
                    <span className="font-mono font-bold text-blue-400">${remainingDailyRisk.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-[#161A1E] border border-[#2B2F36]">
                    <span className="text-[#848E9C] text-[11px]">Loss Streak Safety:</span>
                    <span className="font-mono font-bold text-yellow-300">{riskSettings.consecutiveLossLimit} Trades</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() =>
                  onUpdateRiskSettings({
                    riskPercentage: derivRiskPct,
                    maxDailyLoss: derivDailyLossLimit,
                    dailyProfitTarget: derivDailyTarget,
                    stakeMethod: derivStakeMethod,
                  })
                }
                className="w-full py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider"
              >
                Apply Parameters
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: MT5 Calculator */}
        {activeTab === 'mt5' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Inputs (7 cols) */}
            <div className="lg:col-span-7 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#848E9C] uppercase block mb-1">
                    MT5 Balance ($ USD)
                  </label>
                  <input
                    type="number"
                    value={mt5Balance}
                    onChange={e => setMt5Balance(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded bg-[#0B0E11] border border-[#2B2F36] text-white font-mono font-bold text-xs focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#848E9C] uppercase block mb-1">
                    Risk Percentage (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={mt5RiskPct}
                    onChange={e => setMt5RiskPct(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded bg-[#0B0E11] border border-[#2B2F36] text-white font-mono font-bold text-xs focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#848E9C] uppercase block mb-1">
                    Entry Price
                  </label>
                  <input
                    type="number"
                    step="0.00001"
                    value={mt5Entry}
                    onChange={e => setMt5Entry(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded bg-[#0B0E11] border border-[#2B2F36] text-white font-mono font-bold text-xs focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#848E9C] uppercase block mb-1">
                    Stop Loss Price (SL)
                  </label>
                  <input
                    type="number"
                    step="0.00001"
                    value={mt5SL}
                    onChange={e => setMt5SL(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded bg-[#0B0E11] border border-[#2B2F36] text-white font-mono font-bold text-xs focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#848E9C] uppercase block mb-1">
                    Take Profit Price (TP)
                  </label>
                  <input
                    type="number"
                    step="0.00001"
                    value={mt5TP}
                    onChange={e => setMt5TP(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded bg-[#0B0E11] border border-[#2B2F36] text-white font-mono font-bold text-xs focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#848E9C] uppercase block mb-1">
                    Pip Value (1 Standard Lot) ($)
                  </label>
                  <input
                    type="number"
                    value={mt5PipValue}
                    onChange={e => setMt5PipValue(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded bg-[#0B0E11] border border-[#2B2F36] text-white font-mono font-bold text-xs focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Outputs (5 cols) */}
            <div className="lg:col-span-5 p-3.5 rounded bg-[#0B0E11] border border-[#2B2F36] flex flex-col justify-between space-y-3">
              <div>
                <div className="text-[10px] font-bold text-[#848E9C] uppercase mb-2.5">Lot & R:R Summary</div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded bg-[#161A1E] border border-[#2B2F36]">
                    <span className="text-[#848E9C] text-[11px]">Recommended Lot Size:</span>
                    <span className="text-lg font-mono font-bold text-blue-400">
                      {recommendedLotSize.toFixed(2)} Lots
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-[#161A1E] border border-[#2B2F36]">
                    <span className="text-[#848E9C] text-[11px]">SL Distance:</span>
                    <span className="font-mono font-bold text-rose-400">{slDistancePips.toFixed(1)} Pips</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-[#161A1E] border border-[#2B2F36]">
                    <span className="text-[#848E9C] text-[11px]">TP Distance:</span>
                    <span className="font-mono font-bold text-green-400">{tpDistancePips.toFixed(1)} Pips</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-[#161A1E] border border-[#2B2F36]">
                    <span className="text-[#848E9C] text-[11px]">Risk / Reward:</span>
                    <span className="font-mono font-bold text-blue-300">1 : {riskRewardRatio}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-[#161A1E] border border-[#2B2F36]">
                    <span className="text-[#848E9C] text-[11px]">Max Loss / Profit:</span>
                    <span className="font-mono font-bold text-white text-[11px]">
                      -${riskAmountUsd.toFixed(2)} / +${potentialProfitUsd.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() =>
                  onUpdateRiskSettings({
                    riskPercentage: mt5RiskPct,
                  })
                }
                className="w-full py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider"
              >
                Sync Lot Sizing to MT5 Engine
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
