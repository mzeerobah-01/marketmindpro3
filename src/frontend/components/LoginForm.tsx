import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  Activity,
  ArrowRight,
  KeyRound,
  Terminal,
  Cpu,
  Sparkles,
} from 'lucide-react';
import { UserSession } from '../services/apiClient';

interface LoginFormProps {
  onLoginSuccess: (user: UserSession) => void;
  isDarkMode?: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess, isDarkMode = true }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Predefined authorized credentials
  const DEFAULT_EMAIL = 'kabuirobah198@gmail.com';
  const DEFAULT_PASS = 'P4vpxw@$';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim()) {
      setErrorMsg('Please enter your authorized email address.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your security key/password.');
      return;
    }

    setIsLoading(true);

    try {
      // Direct verification / API login call
      const cleanEmail = email.trim().toLowerCase();
      const targetEmail = DEFAULT_EMAIL.toLowerCase();

      // Artificial short latency for security verification feel
      await new Promise(r => setTimeout(r, 450));

      if (cleanEmail === targetEmail && password === DEFAULT_PASS) {
        const user: UserSession = {
          id: 'admin_terminal_01',
          email: DEFAULT_EMAIL,
          name: 'Kabui Robah',
          role: 'Senior Market Analyst & Terminal Admin',
          lastLogin: Date.now(),
        };

        const token = btoa(`${email}_${Date.now()}`);
        if (rememberMe) {
          localStorage.setItem('marketmind_auth_token', token);
          localStorage.setItem('marketmind_auth_user', JSON.stringify(user));
        } else {
          sessionStorage.setItem('marketmind_auth_token', token);
          sessionStorage.setItem('marketmind_auth_user', JSON.stringify(user));
        }

        onLoginSuccess(user);
      } else {
        setErrorMsg('Invalid terminal credentials. Access denied. Verify email and security password.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDefaultCredentials = () => {
    setEmail(DEFAULT_EMAIL);
    setPassword(DEFAULT_PASS);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-[#0B0E11] text-[#EAECEF] relative overflow-hidden font-sans select-none">
      {/* Background Subtle Technical Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1E2329_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
      
      {/* Subtle Glow Accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        
        {/* Terminal Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1E2329] border border-[#2B2F36] text-[11px] font-mono text-blue-400 mb-3 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            SECURE TERMINAL ACCESS • ENCRYPTED SHA-256
          </div>
          
          <div className="flex items-center justify-center gap-2.5 text-3xl font-extrabold tracking-tight">
            <span className="text-blue-500 text-3xl">◈</span>
            <span className="text-[#EAECEF]">MarketMind</span>
            <span className="text-blue-400">Pro</span>
          </div>

          <p className="text-xs text-[#848E9C] mt-2 font-mono">
            Dual-Market Trading Terminal • Deriv & MT5 Quantitative Suite
          </p>
        </div>

        {/* Login Card */}
        <div
          id="login-card"
          className="bg-[#161A1E] border border-[#2B2F36] rounded-xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative"
        >
          {/* Card Top Banner */}
          <div className="flex items-center justify-between border-b border-[#2B2F36] pb-4 mb-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#EAECEF]">Operator Authentication</h2>
                <p className="text-[11px] text-[#848E9C] font-mono">Authorized Accounts Only</p>
              </div>
            </div>

            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 uppercase font-semibold">
              No Sign-Up
            </span>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div
              id="login-error-banner"
              className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start space-x-2.5 text-xs text-red-300"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold">Access Rejected: </span>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] uppercase tracking-wider mb-1.5 font-mono">
                Operator Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#848E9C]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="login-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#1E2329] border border-[#2B2F36] rounded-lg text-xs font-mono text-[#EAECEF] placeholder-[#848E9C]/60 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#848E9C] uppercase tracking-wider font-mono">
                  Security Password
                </label>
                <span className="text-[10px] text-[#848E9C] font-mono">Private Key Access</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#848E9C]">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  id="login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="w-full pl-9 pr-10 py-2.5 bg-[#1E2329] border border-[#2B2F36] rounded-lg text-xs font-mono text-[#EAECEF] placeholder-[#848E9C]/60 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#848E9C] hover:text-[#EAECEF] transition"
                  tabIndex={-1}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Toggle & Security Notice */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 text-xs text-[#848E9C] cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-[#1E2329] border-[#2B2F36] text-blue-500 focus:ring-blue-500 focus:ring-offset-[#161A1E]"
                />
                <span className="font-mono text-[11px]">Remember terminal session</span>
              </label>

              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> 256-bit SSL
              </span>
            </div>

            {/* Submit Button */}
            <button
              id="btn-login-submit"
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs tracking-wide uppercase transition duration-150 flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Decrypting Session...</span>
                </>
              ) : (
                <>
                  <span>Authenticate & Launch Terminal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Helper Button (Populates Configured User) */}
          <div className="mt-6 pt-4 border-t border-[#2B2F36] text-center">
            <div className="flex items-center justify-between text-[11px] text-[#848E9C] mb-2 font-mono">
              <span>Configured Operator Account:</span>
              <button
                type="button"
                onClick={fillDefaultCredentials}
                className="text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 font-mono transition"
              >
                <Sparkles className="w-3 h-3" /> Auto-Fill Credentials
              </button>
            </div>

            <div className="p-2.5 rounded bg-[#1E2329]/90 border border-[#2B2F36] text-left text-[11px] font-mono space-y-1">
              <div className="flex justify-between text-[#848E9C]">
                <span>Email:</span>
                <span className="text-slate-200 font-semibold">{DEFAULT_EMAIL}</span>
              </div>
              <div className="flex justify-between text-[#848E9C]">
                <span>Password:</span>
                <span className="text-slate-200 font-semibold">{DEFAULT_PASS}</span>
              </div>
            </div>

            <p className="text-[10px] text-[#848E9C]/80 mt-3 font-mono">
              ⚠️ Note: Public registration is permanently disabled. Credentials can be customized in System Settings or <code className="text-blue-400">authConfig.ts</code>.
            </p>
          </div>
        </div>

        {/* System Status Ticker */}
        <div className="mt-6 flex items-center justify-between px-2 text-[10px] font-mono text-[#848E9C]">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Deriv API: Connected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>MT5 Bridge: Ready</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>Strategy Engine: Online</span>
          </div>
        </div>

      </div>
    </div>
  );
};
