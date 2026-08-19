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
  Send,
  Sliders,
  FileCode,
  Globe,
} from 'lucide-react';
import { mt5Bridge, MT5BridgeStatus, MT5AccountStatus, MT5WebhookSignal } from '../services/mt5BridgeService';

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
  const [activeTab, setActiveTab] = useState<'bridge_ea' | 'webhook_setup' | 'test_signals' | 'account_sync'>('bridge_ea');

  const [accountNumber, setAccountNumber] = useState('8839210');
  const [server, setServer] = useState('MetaQuotes-Demo');
  const [accountType, setAccountType] = useState<'demo' | 'real'>('demo');
  const [balance, setBalance] = useState('25000.00');
  const [equity, setEquity] = useState('25000.00');
  const [currency, setCurrency] = useState('USD');

  // Webhook settings
  const [webhookSecret, setWebhookSecret] = useState(() => localStorage.getItem('mmp_webhook_secret') || 'mmp_mt5_secret_2026');
  const [signalFilePath, setSignalFilePath] = useState(() => localStorage.getItem('mmp_signal_file_path') || '');

  // Test signal form
  const [testAction, setTestAction] = useState<'BUY' | 'SELL' | 'CLOSE' | 'CLOSEALL'>('BUY');
  const [testSymbol, setTestSymbol] = useState('EURUSD');
  const [testLot, setTestLot] = useState('0.10');
  const [testSl, setTestSl] = useState('50');
  const [testTp, setTestTp] = useState('100');
  const [testComment, setTestComment] = useState('tv-bridge-strategy');
  const [isSendingSignal, setIsSendingSignal] = useState(false);

  const [bridgeStatus, setBridgeStatus] = useState<MT5BridgeStatus | null>(null);
  const [dispatchedSignals, setDispatchedSignals] = useState<MT5WebhookSignal[]>([]);
  const [isCheckingPing, setIsCheckingPing] = useState(false);
  const [copiedMql, setCopiedMql] = useState(false);
  const [copiedWebhookUrl, setCopiedWebhookUrl] = useState(false);
  const [copiedTvAlert, setCopiedTvAlert] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const webhookUrl = `${currentOrigin}/api/mt5/webhook`;

  useEffect(() => {
    if (isOpen) {
      checkBridge();
      loadSignals();
    }
  }, [isOpen]);

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

  const loadSignals = async () => {
    const signals = await mt5Bridge.fetchSignals();
    setDispatchedSignals(signals);
  };

  const handleSaveConfig = async () => {
    localStorage.setItem('mmp_webhook_secret', webhookSecret);
    localStorage.setItem('mmp_signal_file_path', signalFilePath);
    await mt5Bridge.updateConfig({ webhookSecret, signalFilePath });
    setFeedback({
      type: 'success',
      message: 'MT5 Webhook Bridge configuration saved successfully!',
    });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleSendTestSignal = async () => {
    setIsSendingSignal(true);
    const res = await mt5Bridge.sendTestSignal({
      action: testAction,
      symbol: testSymbol,
      lot: parseFloat(testLot) || 0.1,
      sl: parseFloat(testSl) || 0,
      tp: parseFloat(testTp) || 0,
      comment: testComment,
    });
    setIsSendingSignal(false);

    if (res.success) {
      setFeedback({
        type: 'success',
        message: `Signal [${testAction} ${testSymbol}] dispatched to MT5 Bridge!`,
      });
      loadSignals();
    } else {
      setFeedback({
        type: 'error',
        message: res.message || 'Failed to dispatch signal',
      });
    }
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleConnectAndSync = () => {
    const numBalance = parseFloat(balance) || 10000;

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
    fetch('/api/mt5/download/tv-bridge-ea')
      .then(r => r.text())
      .then(code => {
        navigator.clipboard.writeText(code);
        setCopiedMql(true);
        setTimeout(() => setCopiedMql(false), 2500);
      });
  };

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhookUrl(true);
    setTimeout(() => setCopiedWebhookUrl(false), 2500);
  };

  const copyTradingViewAlert = () => {
    const alertJson = JSON.stringify(
      {
        secret: webhookSecret,
        action: 'buy',
        symbol: '{{ticker}}',
        lot: 0.1,
        sl: 50,
        tp: 100,
        comment: 'mmp-tv-strategy',
      },
      null,
      2
    );
    navigator.clipboard.writeText(alertJson);
    setCopiedTvAlert(true);
    setTimeout(() => setCopiedTvAlert(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div
      id="mt5-connect-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-mono"
    >
      <div
        className={`w-full max-w-2xl rounded-xl border ${
          isDarkMode ? 'bg-[#161A1E] border-[#2B2F36] text-[#EAECEF]' : 'bg-white border-slate-200 text-slate-900'
        } shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2B2F36] shrink-0 bg-[#0B0E11]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/40 text-blue-400 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
                <span>MetaTrader 5 & TradingView Bridge Gateway</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  TV_Bridge_EA
                </span>
              </h2>
              <p className="text-[10px] text-[#848E9C]">Automated signal execution, webhook routing & terminal synchronization</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-[#848E9C] hover:text-white cursor-pointer transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center px-4 bg-[#0E1114] border-b border-[#2B2F36] gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('bridge_ea')}
            className={`py-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'bridge_ea'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-[#848E9C] hover:text-[#EAECEF]'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>1. TV_Bridge_EA.mq5</span>
          </button>

          <button
            onClick={() => setActiveTab('webhook_setup')}
            className={`py-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'webhook_setup'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-[#848E9C] hover:text-[#EAECEF]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>2. Webhook & Secret</span>
          </button>

          <button
            onClick={() => setActiveTab('test_signals')}
            className={`py-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'test_signals'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-[#848E9C] hover:text-[#EAECEF]'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>3. Test Signal Dispatcher</span>
          </button>

          <button
            onClick={() => setActiveTab('account_sync')}
            className={`py-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'account_sync'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-[#848E9C] hover:text-[#EAECEF]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>4. MT5 Account Sync</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Bridge Status Indicator Banner */}
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
                  <span>MT5 Bridge Engine:</span>
                  <span
                    className={`uppercase font-mono text-[11px] ${
                      bridgeStatus?.isTerminalConnected ? 'text-green-400' : 'text-blue-400'
                    }`}
                  >
                    {bridgeStatus?.isTerminalConnected ? '● TERMINAL CONNECTED & ACTIVE' : '● READY (LISTENING ON PORT 3000)'}
                  </span>
                </div>
                <div className="text-[10px] text-[#848E9C] mt-0.5">
                  Webhook URL: <code className="text-blue-300">{webhookUrl}</code>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                checkBridge();
                loadSignals();
              }}
              disabled={isCheckingPing}
              className="py-1 px-2.5 rounded bg-[#161A1E] border border-[#2B2F36] hover:bg-[#1E2329] text-xs font-bold text-white flex items-center space-x-1 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 text-blue-400 ${isCheckingPing ? 'animate-spin' : ''}`} />
              <span>Ping</span>
            </button>
          </div>

          {/* Feedback banner */}
          {feedback && (
            <div
              className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-green-500/10 border border-green-500/30 text-green-300'
                  : 'bg-red-500/10 border border-red-500/30 text-red-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* TAB 1: TV_Bridge_EA.mq5 */}
          {activeTab === 'bridge_ea' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-[#0B0E11] border border-[#2B2F36] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-blue-400" />
                    <span>TV_Bridge_EA.mq5 (MQL5 Expert Advisor)</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyMqlCode}
                      className="py-1 px-2.5 rounded bg-[#161A1E] hover:bg-[#1E2329] border border-[#2B2F36] text-[11px] font-bold text-white flex items-center gap-1 cursor-pointer"
                    >
                      {copiedMql ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-[#848E9C]" />}
                      <span>{copiedMql ? 'Copied' : 'Copy Code'}</span>
                    </button>
                    <a
                      href="/api/mt5/download/tv-bridge-ea"
                      download="TV_Bridge_EA.mq5"
                      className="py-1 px-2.5 rounded bg-blue-600 hover:bg-blue-500 text-[11px] font-bold text-white flex items-center gap-1 shadow-xs"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download .mq5</span>
                    </a>
                  </div>
                </div>

                <p className="text-[11px] text-[#848E9C] leading-relaxed">
                  This Expert Advisor reads trading signals from the common file <code className="text-blue-300">Common\Files\tv_signal.txt</code> and executes BUY, SELL, CLOSE, and CLOSEALL orders on MetaTrader 5 using native <code className="text-emerald-400">CTrade</code> with customizable SL/TP and slippage protection.
                </p>

                {/* Setup Steps */}
                <div className="space-y-2 pt-2 border-t border-[#2B2F36]">
                  <span className="text-[10px] uppercase font-bold text-[#848E9C]">Installation Steps in MT5:</span>
                  <ol className="list-decimal list-inside text-[11px] text-[#EAECEF] space-y-1.5 pl-1">
                    <li>Open MetaTrader 5 and click <strong className="text-white">File → Open Data Folder</strong>.</li>
                    <li>Navigate to <code className="text-blue-300">MQL5\Experts\</code> and paste <strong className="text-white">TV_Bridge_EA.mq5</strong>.</li>
                    <li>In MT5, open the Navigator panel (Ctrl+N), right-click <strong className="text-white">Expert Advisors</strong> and click <strong className="text-white">Refresh</strong>.</li>
                    <li>Drag <strong className="text-white">TV_Bridge_EA</strong> onto any chart (e.g. EURUSD).</li>
                    <li>Ensure <strong className="text-emerald-400">"Allow Algo Trading"</strong> is enabled in the top toolbar!</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Webhook & TradingView Alert Setup */}
          {activeTab === 'webhook_setup' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-[#0B0E11] border border-[#2B2F36] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-blue-400" />
                    <span>TradingView Webhook Configuration</span>
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[#848E9C] text-[10px] uppercase font-bold mb-1">Webhook URL</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={webhookUrl}
                        className="w-full px-2.5 py-1.5 rounded bg-[#161A1E] border border-[#2B2F36] text-blue-300 font-mono text-xs select-all"
                      />
                      <button
                        onClick={copyWebhook}
                        className="py-1.5 px-3 rounded bg-[#1E2329] hover:bg-[#2B2F36] border border-[#2B2F36] text-xs font-bold text-white flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        {copiedWebhookUrl ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedWebhookUrl ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#848E9C] text-[10px] uppercase font-bold mb-1">Secret Key (WEBHOOK_SECRET)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={webhookSecret}
                        onChange={(e) => setWebhookSecret(e.target.value)}
                        placeholder="mmp_mt5_secret_2026"
                        className="w-full px-2.5 py-1.5 rounded bg-[#161A1E] border border-[#2B2F36] text-[#EAECEF] font-mono text-xs focus:outline-hidden focus:border-blue-500"
                      />
                      <button
                        onClick={handleSaveConfig}
                        className="py-1.5 px-3 rounded bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shrink-0 cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#848E9C] text-[10px] uppercase font-bold mb-1">
                      Signal File Path (Optional / Defaults to Common\Files\tv_signal.txt)
                    </label>
                    <input
                      type="text"
                      value={signalFilePath}
                      onChange={(e) => setSignalFilePath(e.target.value)}
                      placeholder="C:\Users\AppData\Roaming\MetaQuotes\Terminal\Common\Files\tv_signal.txt"
                      className="w-full px-2.5 py-1.5 rounded bg-[#161A1E] border border-[#2B2F36] text-[#EAECEF] font-mono text-xs focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* TradingView Alert JSON Template */}
                <div className="pt-3 border-t border-[#2B2F36] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#848E9C]">TradingView Alert Message JSON:</span>
                    <button
                      onClick={copyTradingViewAlert}
                      className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedTvAlert ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedTvAlert ? 'Copied JSON' : 'Copy Alert JSON'}</span>
                    </button>
                  </div>
                  <pre className="p-2.5 rounded bg-[#161A1E] border border-[#2B2F36] text-[10px] text-emerald-400 overflow-x-auto">
{`{
  "secret": "${webhookSecret}",
  "action": "buy",
  "symbol": "{{ticker}}",
  "lot": 0.10,
  "sl": 50,
  "tp": 100,
  "comment": "tradingview-mmp"
}`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Test Signal Dispatcher */}
          {activeTab === 'test_signals' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-[#0B0E11] border border-[#2B2F36] space-y-3">
                <span className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Send className="w-4 h-4 text-blue-400" />
                  <span>Send Immediate Test Signal to MT5</span>
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[#848E9C] text-[10px] uppercase font-bold mb-1">Action</label>
                    <select
                      value={testAction}
                      onChange={(e) => setTestAction(e.target.value as any)}
                      className="w-full px-2 py-1.5 rounded bg-[#161A1E] border border-[#2B2F36] text-white font-mono text-xs"
                    >
                      <option value="BUY">BUY</option>
                      <option value="SELL">SELL</option>
                      <option value="CLOSE">CLOSE</option>
                      <option value="CLOSEALL">CLOSEALL</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#848E9C] text-[10px] uppercase font-bold mb-1">Symbol</label>
                    <input
                      type="text"
                      value={testSymbol}
                      onChange={(e) => setTestSymbol(e.target.value.toUpperCase())}
                      placeholder="EURUSD"
                      className="w-full px-2 py-1.5 rounded bg-[#161A1E] border border-[#2B2F36] text-white font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[#848E9C] text-[10px] uppercase font-bold mb-1">Lot Size</label>
                    <input
                      type="text"
                      value={testLot}
                      onChange={(e) => setTestLot(e.target.value)}
                      placeholder="0.10"
                      className="w-full px-2 py-1.5 rounded bg-[#161A1E] border border-[#2B2F36] text-white font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[#848E9C] text-[10px] uppercase font-bold mb-1">SL (pips)</label>
                    <input
                      type="text"
                      value={testSl}
                      onChange={(e) => setTestSl(e.target.value)}
                      placeholder="50"
                      className="w-full px-2 py-1.5 rounded bg-[#161A1E] border border-[#2B2F36] text-white font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] text-[#848E9C]">
                    Format: <code className="text-blue-300">{`${testAction}|${testSymbol}|${testLot}|${testSl}|${testTp}|${testComment}`}</code>
                  </span>

                  <button
                    onClick={handleSendTestSignal}
                    disabled={isSendingSignal}
                    className="py-1.5 px-4 rounded bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSendingSignal ? 'Dispatching...' : 'Dispatch Signal to MT5'}</span>
                  </button>
                </div>
              </div>

              {/* Dispatched Signals Queue */}
              <div className="p-3.5 rounded-lg bg-[#0B0E11] border border-[#2B2F36] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-[#848E9C]">Live Signal Queue & History ({dispatchedSignals.length})</span>
                  <button onClick={loadSignals} className="text-[10px] text-blue-400 hover:underline flex items-center gap-1 cursor-pointer">
                    <RefreshCw className="w-3 h-3" /> Refresh
                  </button>
                </div>

                {dispatchedSignals.length === 0 ? (
                  <div className="text-center py-4 text-[#848E9C] text-[11px]">
                    No signals dispatched yet. Click "Dispatch Signal to MT5" or send a TradingView webhook alert.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {dispatchedSignals.slice(0, 10).map((sig) => (
                      <div key={sig.id} className="p-2 rounded bg-[#161A1E] border border-[#2B2F36] flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              sig.action === 'BUY'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : sig.action === 'SELL'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {sig.action}
                          </span>
                          <span className="font-bold text-white">{sig.symbol}</span>
                          <span className="text-[#848E9C]">Lot: {sig.lot}</span>
                          <span className="text-[#848E9C]">SL: {sig.sl} / TP: {sig.tp}</span>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-mono">● {sig.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: MT5 Account Sync */}
          {activeTab === 'account_sync' && (
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
          )}
        </div>

        {/* Footer actions */}
        <div className="p-3.5 border-t border-[#2B2F36] bg-[#0B0E11] flex items-center justify-between shrink-0">
          <span className="text-[10px] text-[#848E9C]">
            Live Webhook & EA Bridge Connected to Port 3000
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded text-xs font-bold text-[#848E9C] hover:text-white cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleConnectAndSync}
              className="px-4 py-1.5 rounded text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center space-x-1.5 uppercase cursor-pointer transition shadow-md shadow-blue-600/20"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Save & Sync MT5</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

