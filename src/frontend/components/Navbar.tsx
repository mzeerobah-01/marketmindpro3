import React, { useState } from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Cpu,
  Calculator,
  History,
  BarChart3,
  BookOpen,
  Settings,
  Menu,
  X,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'deriv'
  | 'mt5'
  | 'risk'
  | 'history'
  | 'performance'
  | 'library'
  | 'settings';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isDarkMode?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab, isDarkMode = true }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Global Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'deriv', label: 'Deriv Analysis Tool', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'mt5', label: 'MT5 Analysis Tool', icon: <Cpu className="w-4 h-4" /> },
    { id: 'risk', label: 'Risk Calculator', icon: <Calculator className="w-4 h-4" /> },
    { id: 'history', label: 'Signal History', icon: <History className="w-4 h-4" /> },
    { id: 'performance', label: 'Strategy Performance', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'library', label: 'Strategy Library', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings & Bridge', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <nav
      id="main-navigation-bar"
      className={`border-b ${
        isDarkMode ? 'bg-[#161A1E] border-[#2B2F36]' : 'bg-slate-100 border-slate-200'
      } sticky top-[57px] z-30`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center justify-between space-x-1 py-1 overflow-x-auto scrollbar-none">
          <div className="flex items-center space-x-1">
            {navItems.map(item => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-blue-500/10 text-blue-400 border-b-2 border-blue-400 font-bold'
                      : isDarkMode
                      ? 'text-[#848E9C] hover:text-[#EAECEF] hover:bg-[#1E2329]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile / Tablet Toggle Bar */}
        <div className="flex lg:hidden items-center justify-between py-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-white">
            <span className="text-[#848E9C]">Current View:</span>
            <span className="text-blue-400 uppercase">{navItems.find(i => i.id === currentTab)?.label}</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded bg-[#1E2329] border border-[#2B2F36] text-[#848E9C] hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden pb-3 pt-1 grid grid-cols-2 gap-1.5">
            {navItems.map(item => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center space-x-2 px-3 py-2 rounded text-xs font-bold uppercase tracking-wider text-left border ${
                    isActive
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                      : 'bg-[#1E2329] border-[#2B2F36] text-[#848E9C] hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
};
