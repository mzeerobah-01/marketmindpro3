import React from 'react';
import { ShieldCheck, TrendingUp, Cpu, Radio, Zap } from 'lucide-react';

interface FooterProps {
  isDarkMode?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ isDarkMode = true }) => {
  return (
    <footer
      id="main-footer"
      className={`border-t mt-8 ${
        isDarkMode ? 'bg-[#0B0E11] border-[#2B2F36] text-[#848E9C]' : 'bg-slate-50 border-slate-200 text-slate-600'
      } text-xs py-4 font-mono`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & status */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-white font-bold">
              <TrendingUp className="w-3 h-3" />
            </div>
            <span className="font-bold text-white tracking-tight text-xs">MARKETMIND PRO</span>
          </div>
          <span className="text-[#2B2F36]">•</span>
          <span className="text-[10px] font-mono text-green-400 flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span>DUAL-FEED ACTIVE</span>
          </span>
          <span className="text-[#2B2F36]">•</span>
          <span className="text-[10px] text-[#848E9C] font-mono">v1.0.0 INSTITUTIONAL</span>
        </div>

        {/* Disclaimer */}
        <p className="text-[10px] text-[#848E9C] text-center md:text-right max-w-xl">
          MarketMindPro is a decision-support & quantitative analysis platform. Trading synthetic indices, forex, and commodities carries risk. Signals generated algorithmically with strict Confluence Rules.
        </p>
      </div>
    </footer>
  );
};
