import React, { useState, useEffect } from 'react';
import {
  X,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Download,
  Copy,
  Check,
  RefreshCw,
  Terminal,
  Activity,
  Zap,
  Server,
  Key,
  Shield,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { mt5Bridge, MT5BridgeStatus, MT5AccountStatus } from '../services/mt5BridgeService';

interface MT5ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
  onMT5AccountSync?: (account: {
    accountNumber: string;
    server: string;
    demoBalance: number;
    realBalance: number;
    activeAccount: 'demo' | 'real';
    currency: string;
  }) => void;
}

export const MT5ConnectModal: React.FC<MT5ConnectModalProps> = ({
  isOpen,
  onClose,
  isDarkMode = true,
  onMT5AccountSync,
}) => {
  const [accountNumber, setAccountNumber] = useState('8839210');
  const [server, setServer] = useState('MetaQuotes-Demo');
  const [accountType, setAccountType] = useState<'demo' | 'real'>('demo');
  const [balance, setBalance] = useState('25000.00');
  const [equity, setEquity] = useState('25000.00');
  const [currency, setCurrency] = useState('USD');
  const [leverage, setLeverage] = useState('100');

  const [bridgeStatus, setBridgeStatus] = useState<MT5BridgeStatus | null>(null);
  const [isCheckingPing, setIsCheckingPing] = useState(false);
  const [copiedMql, setCopiedMql] = useState(false);
  const [copiedPy, setCopiedPy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      checkBridge();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const checkBridge = async () => {
    setIsCheckingPing(true);
    const status = await mt5Bridge.fetchBridgeStatus();
    if (status) {
      setBridgeStatus(status);
      if (status.accounts && status.accounts.length > 0) {
        const lastAcc = status.accounts[status.accounts.length - 1];
        setAccountNumber(lastAcc.accountNumber);
        setServer(lastAcc.server);
        setBalance(lastAcc.balance.toFixed(2));
        setEquity(lastAcc.equity.toFixed(2));
      }
    }
    setIsCheckingPing(false);
  };

  const handleConnectAndSync = () => {
    const numBalance = parseFloat(balance) || 10000;
    const numEquity = parseFloat(equity) || numBalance;

    if (onMT5AccountSync) {
      onMT5AccountSync({
        accountNumber,
        server,
        demoBalance: accountType === 'demo' ? numBalance : 25000,
        realBalance: accountType === 'real' ? numBalance : 2500,
        activeAccount: accountType,
        currency,
      });
    }

    setFeedback({
      type: 'success',
      message: `MT5 Account #${accountNumber} (${server}) synced successfully with $${numBalance.toLocaleString()} ${currency}!`,
    });

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const copyMqlCode = () => {
    const mqlCode = `//+------------------------------------------------------------------+
//|                                     MarketMindPro_Bridge.mq5     |
//|                        Copyright 2026, MarketMindPro Systems     |
//+------------------------------------------------------------------+
#property strict
input string WebhookURL = "http://localhost:3000/api/mt5/push-tick";
input int    TimerIntervalMs = 500;

int OnInit() {
   EventSetMillisecondTimer(TimerIntervalMs);
   Print("MarketMindPro MT5 Bridge Active for symbol: ", _Symbol);
   return(INIT_SUCCEEDED);
}
void OnDeinit(const int reason) { EventKillTimer(); }
void OnTimer() {
   MqlTick tick;
   if(!SymbolInfoTick(_Symbol, tick)) return;
   string payload = StringFormat(
      "{\\"symbol\\":\\"%s\\",\\"price\\":%.5f,\\"bid\\":%.5f,\\"ask\\":%.5f,\\"digits\\":%d,\\"timestamp\\":%I64d,\\"accountNumber\\":\\"%d\\",\\"server\\":\\"%s\\",\\"balance\\":%.2f,\\"equity\\":%.2f}",
      _Symbol, tick.bid, tick.bid, tick.ask, _Digits, (long)tick.time_msc,
      AccountInfoInteger(ACCOUNT_LOGIN), AccountInfoString(ACCOUNT_SERVER),
      AccountInfoDouble(ACCOUNT_BALANCE), AccountInfoDouble(ACCOUNT_EQUITY)
   );
   char postData[], result[];
   string resultHeaders;
   StringToCharArray(payload, postData, 0, WHOLE_ARRAY, CP_UTF8);
   WebRequest("POST", WebhookURL, "Content-Type: application/json\\r\\n", 500, postData, result, resultHeaders);
}`;
    navigator.clipboard.writeText(mqlCode);
    setCopiedMql(true);
    setTimeout(() => setCopiedMql(false), 2500);
  };

  const copyPyCode = () => {
    const pyCode = `import time, requests, MetaTrader5 as mt5
SERVER_URL = "http://localhost:3000/api/mt5/push-tick"
SYMBOLS = ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD", "US30", "BTCUSD"]
if mt5.initialize():
    print("[✓] Connected to MetaTrader 5 Terminal")
    acc = mt5.account_info()
    while True:
        for s in SYMBOLS:
            t, i = mt5.symbol_info_tick(s), mt5.symbol_info(s)
            if t and i:
                requests.post(SERVER_URL, json={"symbol": s, "price": t.bid, "bid": t.bid, "ask": t.ask, "digits": i.digits, "timestamp": int(t.time_msc), "accountNumber": str(acc.login if acc else "MT5-USER"), "server": str(acc.server if acc else "Demo"), "balance": float(acc.balance if acc else 10000.0), "equity": float(acc.equity if acc else 10000.0)}, timeout=0.3)
        time.sleep(0.5)`;
    navigator.clipboard.writeText(pyCode);
    setCopiedPy(true);
    setTimeout(() => setCopiedPy(false), 2500);
  };

  return (
    <div
      id="mt5-connect-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-mono"
    >
      <div
        className={`w-full max-w-xl rounded-xl border ${
          isDarkMode ? 'bg-[#161A1E] border-[#2B2F36] text-[#EAECEF]' : 'bg-white border-slate-200 text-slate-900'
        } shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2B2F36] shrink-0 bg-[#0B0E11]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/40 text-blue-400 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
                <span>Connect MetaTrader 5 Account</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  Bridge Gateway
                </span>
              </h2>
              <p className="text-[10px] text-[#848E9C]">Stream live Forex, Commodities, Indices & sync MT5 terminal balance</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-[#848E9C] hover:text-white cursor-pointer transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Bridge Status Card */}
          <div className="p-3 rounded-lg bg-[#0B0E11] border border-[#2B2F36] flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`w-3.5 h-3.5 rounded-full ${
                  bridgeStatus?.isTerminalConnected
                    ? 'bg-green-500 shadow-[0_0_10px_#10b981] animate-pulse'
                    : 'bg-blue-400 shadow-[0_0_8px_#3b82f6]'
                }`}
              />
              <div>
                <div className="font-bold text-white text-xs flex items-center gap-2">
                  <span>MT5 Bridge Gateway:</span>
                  <span
                    className={`uppercase font-mono text-[11px] ${
                      bridgeStatus?.isTerminalConnected ? 'text-green-400' : 'text-blue-400'
                    }`}
                  >
                    {bridgeStatus?.isTerminalConnected ? '● TERMINAL CONNECTED & STREAMING' : '● ONLINE (STANDBY / LIVE WEB FEED)'}
                  </span>
                </div>
                <div className="text-[10px] text-[#848E9C] mt-0.5">
                  Ingestion URL: <code className="text-blue-300">/api/mt5/push-tick</code>
                </div>
              </div>
            </div>

            <button
              onClick={checkBridge}
              disabled={isCheckingPing}
              className="py-1 px-2.5 rounded bg-[#161A1E] border border-[#2B2F36] hover:bg-[#1E2329] text-xs font-bold text-white flex items-center space-x-1 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 text-blue-400 ${isCheckingPing ? 'animate-spin' : ''}`} />
              <span>Ping Gateway</span>
            </button>
          </div>

          {/* Feedback banner */}
          {feedback && (
            <div
              className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-green-500/10 border border-green-500/30 text-green-300'
                  : 'bg-blue-500/10 border border-blue-500/30 text-blue-300'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Account Configuration Inputs */}
          <div className="space-y-3 bg-[#0B0E11] p-3.5 rounded-lg border border-[#2B2F36]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#848E9C] text-[10px] uppercase font-bold mb-1">MT5 Account Number</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="8839210"
                  className="w-full px-2.5 py-1.5 rounded bg-[#161A1E] border border-[#2B2F36] text-[#EAECEF] font-mono text-xs focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[#848E9C] text-[10px] uppercase font-bold mb-1">Broker Server</label>
                <input
                  type="text"
                  value={server}
                  onChange={(e) => setServer(e.target.value)}
                  placeholder="MetaQuotes-Demo / Exness-Real"
                  className="w-full px-2.5 py-1.5 rounded bg-[#161A1E] border border-[#2B2F36] text-[#EAECEF] font-mono text-xs focus:outline-hidden focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[#848E9C] text-[10px] uppercase font-bold mb-1">Account Mode</label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded bg-[#161A1E] border border-[#2B2F36] text-[#EAECEF] font-mono text-xs focus:outline-hidden"
                >
                  <option value="demo">Demo / Virtual</option>
                  <option value="real">Real / Live Account</option>
                </select>
              </div>

              <div>
                <label className="block text-[#848E9C] text-[10px] uppercase font-bold mb-1">Account Balance ($)</label>
                <input
                  type="number"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  placeholder="25000"
                  className="w-full px-2.5 py-1.5 rounded bg-[#161A1E] border border-[#2B2F36] text-[#EAECEF] font-mono text-xs focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[#848E9C] text-[10px] uppercase font-bold mb-1">Currency</label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  placeholder="USD"
                  className="w-full px-2.5 py-1.5 rounded bg-[#161A1E] border border-[#2B2F36] text-[#EAECEF] font-mono text-xs focus:outline-hidden focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* MQL5 & Python EA Scripts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-[#0B0E11] border border-[#2B2F36] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-blue-400" />
                  <span>MQL5 EA Bridge</span>
                </span>
                <a
                  href="/api/mt5/download/ea"
                  download="MarketMindPro_Bridge.mq5"
                  className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  <span>.mq5</span>
                </a>
              </div>
              <p className="text-[10px] text-[#848E9C]">Attach this EA to any MT5 chart to stream live prices & balance to MarketMindPro.</p>
              <button
                onClick={copyMqlCode}
                className="w-full py-1.5 px-2.5 rounded bg-[#161A1E] hover:bg-[#1E2329] border border-[#2B2F36] text-xs font-bold text-white flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                {copiedMql ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-[#848E9C]" />}
                <span>{copiedMql ? 'Copied MQL5 Script!' : 'Copy MQL5 Code'}</span>
              </button>
            </div>

            <div className="p-3 rounded-lg bg-[#0B0E11] border border-[#2B2F36] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-blue-400" />
                  <span>Python Terminal Bridge</span>
                </span>
                <a
                  href="/api/mt5/download/python-bridge"
                  download="mt5_bridge.py"
                  className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  <span>.py</span>
                </a>
              </div>
              <p className="text-[10px] text-[#848E9C]">Python connector using official <code className="text-blue-300">MetaTrader5</code> library.</p>
              <button
                onClick={copyPyCode}
                className="w-full py-1.5 px-2.5 rounded bg-[#161A1E] hover:bg-[#1E2329] border border-[#2B2F36] text-xs font-bold text-white flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                {copiedPy ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-[#848E9C]" />}
                <span>{copiedPy ? 'Copied Python Script!' : 'Copy Python Code'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-3.5 border-t border-[#2B2F36] bg-[#0B0E11] flex items-center justify-between shrink-0">
          <span className="text-[10px] text-[#848E9C]">
            Live quotes active across Forex, Metals, Indices
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded text-xs font-bold text-[#848E9C] hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConnectAndSync}
              className="px-4 py-1.5 rounded text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center space-x-1.5 uppercase cursor-pointer transition shadow-md shadow-blue-600/20"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Connect MT5 & Sync Balance</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
