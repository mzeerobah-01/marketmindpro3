import React, { useEffect, useState } from 'react';
import { AccountState, AppNotification } from '../types';
import { UserSession } from '../services/apiClient';
import {
  Activity,
  Bell,
  CheckCircle2,
  ChevronDown,
  Globe,
  Moon,
  Radio,
  RefreshCw,
  Sun,
  TrendingUp,
  User,
  Zap,
  X,
  Sliders,
  LogOut,
  ShieldCheck,
} from 'lucide-react';

interface HeaderProps {
  accounts: AccountState;
  onToggleAccountMode: (platform: 'deriv' | 'mt5') => void;
  notifications: AppNotification[];
  onDismissNotification: (id: string) => void;
  onClearAllNotifications: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenSettings: () => void;
  currentUser?: UserSession | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  accounts,
  onToggleAccountMode,
  notifications,
  onDismissNotification,
  onClearAllNotifications,
  isDarkMode,
  onToggleDarkMode,
  onOpenSettings,
  currentUser,
  onLogout,
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState<'deriv' | 'mt5' | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour12: false }));
      setDateStr(now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const unreadCount = notifications.filter(n => !n.read && !n.dismissed).length;

  return (
    <header
      id="main-header"
      className={`sticky top-0 z-40 border-b ${
        isDarkMode ? 'bg-[#161A1E] border-[#2B2F36] text-[#EAECEF]' : 'bg-white border-slate-200 text-slate-900'
      } transition-colors`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Live Clock */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2.5">
            <div className="text-xl font-bold tracking-tight flex items-center gap-2">
              <span className="text-blue-500 text-2xl">◈</span>
              <span className="text-[#EAECEF]">MarketMind</span><span className="text-blue-400">Pro</span>
            </div>
            <span className="text-[9px] font-mono uppercase font-bold px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
              v1.0
            </span>
          </div>

          <div className="h-6 w-px bg-[#2B2F36] hidden md:block"></div>

          <div className="hidden md:flex items-center space-x-2 text-[11px] font-mono text-[#848E9C]">
            <span className="uppercase">{dateStr}</span>
            <span className="text-[#2B2F36]">•</span>
            <span className="text-blue-400 font-bold">{timeStr}</span>
          </div>
        </div>

        {/* Account Cards (Deriv & MT5) */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Deriv Account Card */}
          <div className="relative">
            <button
              id="btn-deriv-account-menu"
              onClick={() => setShowAccountDropdown(showAccountDropdown === 'deriv' ? null : 'deriv')}
              className={`flex items-center space-x-2 px-2.5 py-1 rounded border text-left text-xs transition font-mono ${
                isDarkMode ? 'bg-[#1E2329] border-[#2B2F36] hover:border-slate-600' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#10b981]" />
              <div>
                <div className="text-[10px] text-[#848E9C] font-semibold uppercase flex items-center space-x-1">
                  <span>Deriv:</span>
                  <span className="uppercase text-[9px] text-green-400 font-bold">{accounts.deriv.activeAccount}</span>
                </div>
                <div className="font-mono font-bold text-white text-[11px]">
                  ${(accounts.deriv.activeAccount === 'demo' ? accounts.deriv.demoBalance : accounts.deriv.realBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#848E9C] ml-1" />
            </button>

            {showAccountDropdown === 'deriv' && (
              <div
                className={`absolute right-0 top-12 z-50 w-56 p-3 rounded-lg border shadow-2xl ${
                  isDarkMode ? 'bg-[#161A1E] border-[#2B2F36] text-[#EAECEF]' : 'bg-white border-slate-200 text-slate-900'
                }`}
              >
                <div className="text-[10px] font-bold text-[#848E9C] uppercase tracking-wider mb-2 border-b border-[#2B2F36] pb-1">
                  Deriv Account State
                </div>
                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between py-1 border-b border-[#2B2F36]/60">
                    <span className="text-[#848E9C]">Demo Balance:</span>
                    <span className="font-bold text-white">${accounts.deriv.demoBalance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#2B2F36]/60">
                    <span className="text-[#848E9C]">Real Balance:</span>
                    <span className="font-bold text-green-400">${accounts.deriv.realBalance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 text-[10px] text-[#848E9C]">
                    <span>Last Sync:</span>
                    <span>{accounts.deriv.lastSync}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onToggleAccountMode('deriv');
                    setShowAccountDropdown(null);
                  }}
                  className="mt-2.5 w-full py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono uppercase tracking-wider transition"
                >
                  Switch to {accounts.deriv.activeAccount === 'demo' ? 'Real' : 'Demo'}
                </button>
              </div>
            )}
          </div>

          {/* MT5 Account Card */}
          <div className="relative">
            <button
              id="btn-mt5-account-menu"
              onClick={() => setShowAccountDropdown(showAccountDropdown === 'mt5' ? null : 'mt5')}
              className={`flex items-center space-x-2 px-2.5 py-1 rounded border text-left text-xs transition font-mono ${
                isDarkMode ? 'bg-[#1E2329] border-[#2B2F36] hover:border-slate-600' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#10b981]" />
              <div>
                <div className="text-[10px] text-[#848E9C] font-semibold uppercase flex items-center space-x-1">
                  <span>MT5:</span>
                  <span className="uppercase text-[9px] text-green-400 font-bold">{accounts.mt5.activeAccount}</span>
                </div>
                <div className="font-mono font-bold text-white text-[11px]">
                  ${(accounts.mt5.activeAccount === 'demo' ? accounts.mt5.demoBalance : accounts.mt5.realBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#848E9C] ml-1" />
            </button>

            {showAccountDropdown === 'mt5' && (
              <div
                className={`absolute right-0 top-12 z-50 w-56 p-3 rounded-lg border shadow-2xl ${
                  isDarkMode ? 'bg-[#161A1E] border-[#2B2F36] text-[#EAECEF]' : 'bg-white border-slate-200 text-slate-900'
                }`}
              >
                <div className="text-[10px] font-bold text-[#848E9C] uppercase tracking-wider mb-2 border-b border-[#2B2F36] pb-1">
                  MT5 Account State
                </div>
                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between py-1 border-b border-[#2B2F36]/60">
                    <span className="text-[#848E9C]">Demo Balance:</span>
                    <span className="font-bold text-white">${accounts.mt5.demoBalance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#2B2F36]/60">
                    <span className="text-[#848E9C]">Real Balance:</span>
                    <span className="font-bold text-green-400">${accounts.mt5.realBalance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 text-[10px] text-[#848E9C]">
                    <span>Last Sync:</span>
                    <span>{accounts.mt5.lastSync}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onToggleAccountMode('mt5');
                    setShowAccountDropdown(null);
                  }}
                  className="mt-2.5 w-full py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono uppercase tracking-wider transition"
                >
                  Switch to {accounts.mt5.activeAccount === 'demo' ? 'Real' : 'Demo'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Action icons & Theme toggle */}
        <div className="flex items-center space-x-1.5">
          {/* Notifications button */}
          <div className="relative">
            <button
              id="btn-notifications-toggle"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-1.5 rounded bg-[#1E2329] border border-[#2B2F36] hover:bg-[#2B2F36] text-[#848E9C] hover:text-white transition"
              title="Notifications & Alerts"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center font-mono">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Popover */}
            {showNotifications && (
              <div
                className={`absolute right-0 top-11 z-50 w-80 max-h-96 overflow-y-auto p-3 rounded-lg border shadow-2xl ${
                  isDarkMode ? 'bg-[#161A1E] border-[#2B2F36] text-[#EAECEF]' : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#2B2F36]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#848E9C]">Intelligence Alert Stream</span>
                  <button
                    onClick={onClearAllNotifications}
                    className="text-[10px] text-blue-400 hover:underline font-mono"
                  >
                    Clear All
                  </button>
                </div>

                <div className="divide-y divide-[#2B2F36]/60 mt-2 space-y-1">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-[#848E9C] font-mono">No active notifications</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className="py-2 flex items-start justify-between gap-2 text-xs">
                        <div>
                          <div className="font-bold text-white flex items-center space-x-1.5 text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_6px_#3b82f6]" />
                            <span>{n.title}</span>
                          </div>
                          <p className="text-[#848E9C] text-[11px] mt-0.5 leading-tight">{n.message}</p>
                          <span className="text-[9px] text-slate-500 font-mono">
                            {new Date(n.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <button
                          onClick={() => onDismissNotification(n.id)}
                          className="text-[#848E9C] hover:text-white p-0.5 rounded"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Settings Button */}
          <button
            id="btn-open-settings-header"
            onClick={onOpenSettings}
            className="p-1.5 rounded bg-[#1E2329] border border-[#2B2F36] hover:bg-[#2B2F36] text-[#848E9C] hover:text-white transition"
            title="Settings & API Bridges"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Theme Toggle */}
          <button
            id="btn-theme-toggle"
            onClick={onToggleDarkMode}
            className="p-1.5 rounded bg-[#1E2329] border border-[#2B2F36] hover:bg-[#2B2F36] text-[#848E9C] hover:text-white transition"
            title="Toggle Dark/Light Mode"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
          </button>

          {/* User Account / Logout Menu */}
          {currentUser && (
            <div className="relative pl-1 border-l border-[#2B2F36] ml-1">
              <button
                id="btn-user-profile-menu"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center space-x-2 px-2 py-1 rounded bg-[#1E2329] border border-[#2B2F36] hover:border-slate-600 transition"
              >
                <div className="w-6 h-6 rounded bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-[10px] font-bold text-white font-mono shadow-sm">
                  KR
                </div>
                <div className="hidden lg:block text-left font-mono">
                  <div className="text-[11px] font-semibold text-[#EAECEF] leading-tight truncate max-w-[110px]">
                    {currentUser.name || 'Kabui Robah'}
                  </div>
                  <div className="text-[9px] text-emerald-400 flex items-center gap-1 leading-tight">
                    <span className="w-1 h-1 rounded-full bg-emerald-400" /> Authorized
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 text-[#848E9C]" />
              </button>

              {showUserDropdown && (
                <div
                  id="user-profile-dropdown"
                  className="absolute right-0 mt-2 w-64 rounded-lg bg-[#161A1E] border border-[#2B2F36] shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100"
                >
                  <div className="pb-2 border-b border-[#2B2F36]">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-xs font-bold text-white font-mono">
                        KR
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-xs font-bold text-[#EAECEF] truncate">{currentUser.name}</div>
                        <div className="text-[10px] text-[#848E9C] font-mono truncate">{currentUser.email}</div>
                      </div>
                    </div>
                    <div className="mt-2 text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 inline-block">
                      {currentUser.role || 'Terminal Admin'}
                    </div>
                  </div>

                  <div className="py-2 space-y-1 text-xs">
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onOpenSettings();
                      }}
                      className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded hover:bg-[#1E2329] text-[#848E9C] hover:text-[#EAECEF] transition text-left"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Security & Terminal Settings</span>
                    </button>
                  </div>

                  <div className="pt-2 border-t border-[#2B2F36]">
                    <button
                      id="btn-header-logout"
                      onClick={() => {
                        setShowUserDropdown(false);
                        if (onLogout) onLogout();
                      }}
                      className="w-full flex items-center justify-center space-x-2 px-3 py-1.5 rounded bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold font-mono transition cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Lock & Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
