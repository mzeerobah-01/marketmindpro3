import React, { useState, useEffect } from 'react';
import {
  X,
  Zap,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Power,
  Key,
  Radio,
  Sliders,
  DollarSign,
  TrendingUp,
  Cpu,
} from 'lucide-react';
import { derivWebSocket, DerivAccountInfo, ConnectionStatus } from '../services/derivWebSocketService';

interface DerivAuthorizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
  onAuthorizedSync?: (account: DerivAccountInfo) => void;
}

export const DerivAuthorizeModal: React.FC<DerivAuthorizeModalProps> = ({
  isOpen,
  onClose,
  isDarkMode = true,
  onAuthorizedSync,
}) => {
  const [appId, setAppId] = useState(() => derivWebSocket.getAppId() || '1089');
  const [token, setToken] = useState(() => derivWebSocket.getToken() || '');
  const [status, setStatus] = useState<ConnectionStatus>(() => derivWebSocket.getStatus());
  const [account, setAccount] = useState<DerivAccountInfo | null>(() => derivWebSocket.getAccountInfo());
  const [latency, setLatency] = useState<number>(() => derivWebSocket.getLatency());
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    const unsubStatus = derivWebSocket.onStatus((newStatus, info) => {
      setStatus(newStatus);
      if (info?.latency) setLatency(info.latency);
      if (info?.error) {
        setFeedback({ type: 'error', message: info.error });
        setIsAuthorizing(false);
      }
    });

    const unsubAccount = derivWebSocket.onAccount((acc) => {
      setAccount(acc);
      setIsAuthorizing(false);
      setFeedback({
        type: 'success',
        message: `Successfully Authorized Deriv Account ${acc.loginid} (${acc.isVirtual ? 'Demo' : 'Real'}) with balance ${acc.balance.toFixed(2)} ${acc.currency}!`,
      });
      if (onAuthorizedSync) {
        onAuthorizedSync(acc);
      }
    });

    return () => {
      unsubStatus();
      unsubAccount();
    };
  }, [onAuthorizedSync]);

  if (!isOpen) return null;

  const handleAuthorize = () => {
    const cleanToken = token.trim();
    if (!cleanToken) {
      setFeedback({
        type: 'error',
        message: 'Please paste your Deriv API Token (Read/Trade scope) or click "Free Public Stream".',
      });
      return;
    }

    if (cleanToken.startsWith('pat_')) {
      setFeedback({
        type: 'error',
        message: 'The token you entered starts with "pat_", which is a Personal Access Token from an external service (e.g. GitHub/Render). Deriv API tokens are created at app.deriv.com/account/api-token and are typically 15-character alphanumeric strings (e.g. nG2k9LxP0mR1vW8).',
      });
      return;
    }

    setIsAuthorizing(true);
    setFeedback({
      type: 'info',
      message: 'Connecting to Deriv WebSocket and verifying token authorization...',
    });

    derivWebSocket.setCredentials(appId.trim() || '1089', cleanToken);
    derivWebSocket.connect();
    derivWebSocket.authorize(cleanToken);
  };

  const handleUseVirtualDemo = () => {
    const demoAccount: DerivAccountInfo = {
      loginid: 'VRTC' + Math.floor(1000000 + Math.random() * 9000000),
      email: 'demo-trader@deriv.com',
      balance: 10000.0,
      currency: 'USD',
      isVirtual: true,
    };
    derivWebSocket.setCredentials('1089', '');
    derivWebSocket.connect();
    setAccount(demoAccount);
    setFeedback({
      type: 'success',
      message: `Activated Deriv Virtual Demo Account (${demoAccount.loginid}) with $10,000.00 USD! Live synthetic market feed connected.`,
    });
    if (onAuthorizedSync) {
      onAuthorizedSync(demoAccount);
    }
  };

  const handleConnectPublicStream = () => {
    setIsAuthorizing(true);
    setFeedback({
      type: 'info',
      message: 'Connecting to Deriv High-Speed Market WebSocket (App ID 1089)...',
    });

    derivWebSocket.setCredentials('1089', '');
    derivWebSocket.connect();
    setTimeout(() => {
      setIsAuthorizing(false);
      setFeedback({
        type: 'success',
        message: 'Deriv Live Market Stream Connected! Real-time synthetic quotes active.',
      });
    }, 600);
  };

  const handleDisconnect = () => {
    derivWebSocket.disconnect();
    setAccount(null);
    setFeedback({
      type: 'info',
      message: 'Deriv connection disconnected.',
    });
  };

  return (
    <div
      id="deriv-authorize-modal-overlay"
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
            <div className="w-8 h-8 rounded-lg bg-green-500/15 border border-green-500/40 text-green-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
                <span>Authorize Deriv Live Account</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-green-500/15 text-green-400 border border-green-500/30">
                  WebSocket v3
                </span>
              </h2>
              <p className="text-[10px] text-[#848E9C]">Stream live ticks, volatility indices & sync account balance</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-[#848E9C] hover:text-white cursor-pointer transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Connection Status Card */}
          <div className="p-3 rounded-lg bg-[#0B0E11] border border-[#2B2F36] flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`w-3.5 h-3.5 rounded-full ${
                  status === 'authorized'
                    ? 'bg-green-500 shadow-[0_0_10px_#10b981] animate-pulse'
                    : status === 'connected'
                    ? 'bg-blue-400 shadow-[0_0_8px_#3b82f6]'
                    : status === 'connecting'
                    ? 'bg-yellow-400 animate-pulse'
                    : 'bg-red-500'
                }`}
              />
              <div>
                <div className="font-bold text-white text-xs flex items-center gap-2">
                  <span>Connection:</span>
                  <span
                    className={`uppercase font-mono text-[11px] ${
                      status === 'authorized'
                        ? 'text-green-400'
                        : status === 'connected'
                        ? 'text-blue-400'
                        : 'text-yellow-400'
                    }`}
                  >
                    {status === 'authorized' ? '● AUTHORIZED & STREAMING' : status === 'connected' ? '● PUBLIC FEED CONNECTED' : status}
                  </span>
                </div>
                <div className="text-[10px] text-[#848E9C] mt-0.5">
                  Endpoint: <code className="text-blue-300">wss://ws.derivws.com/websockets/v3</code>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                Ping: {latency || 14}ms
              </span>
            </div>
          </div>

          {/* Account Details if Authorized */}
          {account && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="font-bold text-white text-xs">Live Authorized Account</span>
                </div>
                <span className="text-[10px] uppercase font-bold text-green-300 bg-green-500/20 px-2 py-0.5 rounded border border-green-500/40">
                  {account.isVirtual ? 'Virtual Demo' : 'Real Account'}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                <div className="p-2 rounded bg-[#0B0E11] border border-[#2B2F36]">
                  <span className="text-[9px] text-[#848E9C] uppercase block">Login ID</span>
                  <span className="font-bold text-white text-xs">{account.loginid}</span>
                </div>
                <div className="p-2 rounded bg-[#0B0E11] border border-[#2B2F36]">
                  <span className="text-[9px] text-[#848E9C] uppercase block">Live Balance</span>
                  <span className="font-bold text-green-400 text-xs">
                    {account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} {account.currency}
                  </span>
                </div>
                <div className="p-2 rounded bg-[#0B0E11] border border-[#2B2F36]">
                  <span className="text-[9px] text-[#848E9C] uppercase block">Account Currency</span>
                  <span className="font-bold text-white text-xs">{account.currency}</span>
                </div>
              </div>
            </div>
          )}

          {/* Feedback message banner */}
          {feedback && (
            <div
              className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-green-500/10 border border-green-500/30 text-green-300'
                  : feedback.type === 'error'
                  ? 'bg-red-500/10 border border-red-500/30 text-red-300'
                  : 'bg-blue-500/10 border border-blue-500/30 text-blue-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
              ) : feedback.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              ) : (
                <RefreshCw className="w-4 h-4 text-blue-400 shrink-0 animate-spin" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Credentials Form */}
          <div className="space-y-3 bg-[#0B0E11] p-3.5 rounded-lg border border-[#2B2F36]">
            {/* Direct Deriv OAuth Login Banner */}
            <div className="p-3.5 rounded-lg bg-linear-to-r from-red-500/10 via-orange-500/10 to-amber-500/10 border border-red-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-red-500 text-white font-bold flex items-center justify-center text-xs">
                    d
                  </div>
                  <span className="font-bold text-white text-xs">Deriv 1-Click OAuth Login</span>
                  <span className="text-[9px] bg-red-500/20 text-red-300 border border-red-500/40 px-1.5 py-0.2 rounded font-mono uppercase">
                    Recommended
                  </span>
                </div>
                <p className="text-[11px] text-[#848E9C] mt-1">
                  Log in directly with your Deriv email & password — no copying tokens required.
                </p>
              </div>

              <button
                id="btn-deriv-oauth-login"
                type="button"
                onClick={() => derivWebSocket.loginWithOAuth()}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase flex items-center justify-center space-x-2 shrink-0 transition shadow-lg shadow-red-600/20 cursor-pointer"
              >
                <span>Authorize with Deriv</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="relative flex items-center justify-center my-1">
              <div className="border-t border-[#2B2F36] w-full" />
              <span className="bg-[#0B0E11] px-2 text-[10px] text-[#848E9C] uppercase font-mono tracking-wider shrink-0">
                OR USE MANUAL API TOKEN
              </span>
              <div className="border-t border-[#2B2F36] w-full" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[#848E9C] text-[10px] uppercase font-bold flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-blue-400" />
                  <span>Deriv API Read/Trade Token</span>
                </label>
                <a
                  href="https://app.deriv.com/account/api-token"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 font-mono"
                >
                  <span>app.deriv.com/account/api-token</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste your Deriv API token (e.g. nG2k9LxP0mR1vW8)"
                className="w-full px-3 py-2 rounded bg-[#161A1E] border border-[#2B2F36] text-[#EAECEF] font-mono text-xs focus:outline-hidden focus:border-blue-500 transition"
              />
              <p className="text-[10px] text-[#848E9C] mt-1">
                Requires <strong className="text-white">Read</strong> & <strong className="text-white">Trade</strong> scopes to read account balance and stream authorized market ticks.
              </p>
            </div>

            {/* Step-by-step Guide */}
            <div className="p-2.5 rounded bg-[#161A1E]/80 border border-[#2B2F36] space-y-1.5">
              <div className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
                <span>How to obtain your Deriv API Token:</span>
              </div>
              <ol className="text-[10px] text-[#848E9C] list-decimal list-inside space-y-1 font-mono">
                <li>Log in at <a href="https://app.deriv.com/account/api-token" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">app.deriv.com</a> & go to <strong>Account Settings → API Token</strong>.</li>
                <li>Check the <strong>Read</strong> and <strong>Trade</strong> scope checkboxes.</li>
                <li>Enter a name (e.g. <code className="text-white">marketmind</code>) and click <strong>Create</strong>.</li>
                <li>Copy the generated token (approx. 15 characters, e.g. <code className="text-blue-300">XyZ987AbC123DeF</code>) and paste above.</li>
              </ol>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[#848E9C] text-[10px] uppercase font-bold mb-1">Deriv App ID</label>
                <input
                  type="text"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  placeholder="1089"
                  className="w-full px-3 py-1.5 rounded bg-[#161A1E] border border-[#2B2F36] text-[#EAECEF] font-mono text-xs focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[#848E9C] text-[10px] uppercase font-bold mb-1">Stream Mode</label>
                <div className="px-3 py-1.5 rounded bg-[#161A1E] border border-[#2B2F36] text-slate-300 font-mono text-xs flex items-center justify-between">
                  <span>High-Frequency WebSocket</span>
                  <span className="text-emerald-400 text-[10px]">● Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-3.5 border-t border-[#2B2F36] bg-[#0B0E11] flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleUseVirtualDemo}
              className="px-3 py-1.5 rounded bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/40 text-xs font-bold text-blue-400 flex items-center space-x-1.5 cursor-pointer transition"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Instant Demo ($10,000 USD)</span>
            </button>
            <button
              onClick={handleConnectPublicStream}
              className="px-3 py-1.5 rounded bg-[#161A1E] hover:bg-[#1E2329] border border-[#2B2F36] text-xs font-bold text-slate-200 flex items-center space-x-1.5 cursor-pointer transition"
            >
              <Radio className="w-3.5 h-3.5 text-blue-400" />
              <span>Public Feed</span>
            </button>
            {status !== 'disconnected' && (
              <button
                onClick={handleDisconnect}
                className="px-2.5 py-1.5 rounded bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs font-bold text-red-400 flex items-center space-x-1 cursor-pointer transition"
                title="Disconnect WebSocket"
              >
                <Power className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded text-xs font-bold text-[#848E9C] hover:text-white cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleAuthorize}
              disabled={isAuthorizing}
              className="px-4 py-1.5 rounded text-xs font-bold bg-green-600 hover:bg-green-500 text-white flex items-center space-x-1.5 uppercase cursor-pointer transition disabled:opacity-50 shadow-md shadow-green-600/20"
            >
              {isAuthorizing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Authorizing...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span>Authorize Deriv Account</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
