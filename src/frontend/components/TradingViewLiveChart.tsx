import React, { useEffect, useRef, useState } from 'react';
import { MarketAsset } from '../types';
import { Maximize2, Minimize2, RefreshCw, BarChart2, Layers } from 'lucide-react';

interface TradingViewLiveChartProps {
  asset: MarketAsset;
  selectedTimeframe?: string;
  isDarkMode?: boolean;
  onTimeframeChange?: (tf: string) => void;
  height?: string | number;
}

// Global window typing for TradingView widget
declare global {
  interface Window {
    TradingView?: {
      widget: new (config: any) => any;
    };
  }
}

export const TradingViewLiveChart: React.FC<TradingViewLiveChartProps> = ({
  asset,
  selectedTimeframe = '60',
  isDarkMode = true,
  onTimeframeChange,
  height = '520px',
}) => {
  const containerId = useRef(`tv_chart_${Math.random().toString(36).substring(2, 9)}`).current;
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Map asset symbol to TradingView symbol
  const getTvSymbol = (symbol: string, category?: string): string => {
    const clean = symbol.toUpperCase().replace(/[\/\-_]/g, '');

    // Forex mapping
    if (clean === 'EURUSD') return 'OANDA:EURUSD';
    if (clean === 'GBPUSD') return 'OANDA:GBPUSD';
    if (clean === 'USDJPY') return 'OANDA:USDJPY';
    if (clean === 'AUDUSD') return 'OANDA:AUDUSD';
    if (clean === 'USDCAD') return 'OANDA:USDCAD';
    if (clean === 'USDCHF') return 'OANDA:USDCHF';
    if (clean === 'NZDUSD') return 'OANDA:NZDUSD';
    if (clean === 'EURGBP') return 'OANDA:EURGBP';
    if (clean === 'EURJPY') return 'OANDA:EURJPY';
    if (clean === 'GBPJPY') return 'OANDA:GBPJPY';

    // Commodities / Metals
    if (clean === 'XAUUSD' || clean === 'GOLD') return 'OANDA:XAUUSD';
    if (clean === 'XAGUSD' || clean === 'SILVER') return 'OANDA:XAGUSD';
    if (clean === 'OILCRUDE' || clean === 'USOIL' || clean === 'WTI') return 'TVC:USOIL';
    if (clean === 'OILBRENT' || clean === 'UKOIL') return 'TVC:UKOIL';

    // Indices
    if (clean === 'US30' || clean === 'DJ30' || clean === 'WS30') return 'FOREXCOM:DJI';
    if (clean === 'SPX500' || clean === 'US500' || clean === 'SP500') return 'FOREXCOM:SPX500';
    if (clean === 'NAS100' || clean === 'USTEC' || clean === 'NQ100') return 'FOREXCOM:NSXUSD';
    if (clean === 'UK100' || clean === 'FTSE100') return 'FOREXCOM:UK100';
    if (clean === 'GER40' || clean === 'DAX40') return 'FOREXCOM:GER40';

    // Crypto
    if (clean === 'BTCUSD' || clean === 'BTCUSDT' || clean === 'BTC') return 'BINANCE:BTCUSDT';
    if (clean === 'ETHUSD' || clean === 'ETHUSDT' || clean === 'ETH') return 'BINANCE:ETHUSDT';
    if (clean === 'SOLUSD' || clean === 'SOLUSDT') return 'BINANCE:SOLUSDT';
    if (clean === 'XRPUSD' || clean === 'XRPUSDT') return 'BINANCE:XRPUSDT';

    // Deriv synthetics fallback to prominent currency/index for technical analysis
    if (clean.includes('VOL') || clean.includes('HZ') || clean.includes('CRASH') || clean.includes('BOOM')) {
      return 'OANDA:EURUSD';
    }

    return `FX:${clean}`;
  };

  // Convert timeframe string to TradingView interval
  const getTvInterval = (tf: string): string => {
    switch (tf) {
      case '1M':
      case '1m':
      case '1':
        return '1';
      case '5M':
      case '5m':
      case '5':
        return '5';
      case '15M':
      case '15m':
      case '15':
        return '15';
      case '30M':
      case '30m':
      case '30':
        return '30';
      case '1H':
      case '60M':
      case '60m':
      case '60':
        return '60';
      case '4H':
      case '240':
        return '240';
      case '1D':
      case 'D':
        return 'D';
      case '1W':
      case 'W':
        return 'W';
      default:
        return '60';
    }
  };

  // Load TradingView script
  useEffect(() => {
    if (window.TradingView) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      setScriptLoaded(true);
    };
    document.head.appendChild(script);

    return () => {
      // Keep script in head for subsequent mounts
    };
  }, []);

  // Initialize widget when script is loaded or parameters change
  useEffect(() => {
    if (!scriptLoaded || !window.TradingView) return;

    const tvSymbol = getTvSymbol(asset.symbol, asset.category);
    const tvInterval = getTvInterval(selectedTimeframe);

    const widget = new window.TradingView.widget({
      container_id: containerId,
      autosize: true,
      symbol: tvSymbol,
      interval: tvInterval,
      timezone: 'Etc/UTC',
      theme: isDarkMode ? 'dark' : 'light',
      style: '1', // 1 = candles, 3 = area, 8 = heikin ashi
      locale: 'en',
      toolbar_bg: isDarkMode ? '#131722' : '#f1f5f9',
      enable_publishing: false,
      allow_symbol_change: true,
      hide_side_toolbar: false,
      withdateranges: true,
      studies: [
        'MASimple@tv-basicstudies',
        'RSI@tv-basicstudies',
      ],
    });

    return () => {
      // Widget cleanup if needed
    };
  }, [scriptLoaded, asset.symbol, selectedTimeframe, isDarkMode]);

  const tvSymbolDisplay = getTvSymbol(asset.symbol, asset.category);

  return (
    <div
      id="tradingview-live-chart-wrapper"
      className={`rounded-lg border ${
        isDarkMode ? 'bg-[#131722] border-[#2B2F36]' : 'bg-white border-slate-200'
      } overflow-hidden shadow-sm flex flex-col ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none w-screen h-screen' : ''
      }`}
      style={{ height: isFullscreen ? '100vh' : height }}
    >
      {/* Chart Top Toolbar */}
      <div className="px-3 py-2 border-b border-[#2B2F36] bg-[#0E1114] flex flex-wrap items-center justify-between gap-2 shrink-0 font-mono text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
          <span className="font-bold text-white uppercase flex items-center gap-1.5">
            <BarChart2 className="w-4 h-4 text-blue-400" />
            <span>TradingView Live Market Feed</span>
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 font-bold">
            {tvSymbolDisplay}
          </span>
        </div>

        {/* Timeframe selector & Fullscreen */}
        <div className="flex items-center space-x-1.5">
          <div className="flex items-center bg-[#0B0E11] rounded p-0.5 border border-[#2B2F36]">
            {['1M', '5M', '15M', '1H', '4H', '1D'].map((tf) => (
              <button
                key={tf}
                onClick={() => onTimeframeChange?.(tf)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition ${
                  selectedTimeframe.toUpperCase() === tf.toUpperCase() ||
                  (tf === '1H' && selectedTimeframe === '60')
                    ? 'bg-blue-600 text-white'
                    : 'text-[#848E9C] hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 rounded bg-[#161A1E] border border-[#2B2F36] text-[#848E9C] hover:text-white cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* TradingView Widget Container */}
      <div className="relative flex-1 w-full h-full min-h-[350px] bg-[#0f0f0f]">
        {!scriptLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0f0f0f] text-[#848E9C] space-x-2 font-mono text-xs">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
            <span>Loading TradingView Engine...</span>
          </div>
        )}
        <div id={containerId} className="w-full h-full" style={{ minHeight: '350px' }} />
      </div>
    </div>
  );
};
