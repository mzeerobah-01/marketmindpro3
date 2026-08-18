import React, { useEffect, useRef, useState } from 'react';
import { CandleData, MarketAsset, SmcOverlay, TickData } from '../types';
import {
  calculateADX,
  calculateBollingerBands,
  calculateCCI,
  calculateEMA,
  calculateMACD,
  calculateRSI,
  calculateStochasticRSI,
} from '../services/technicalAnalysis';
import {
  Maximize2,
  Minimize2,
  TrendingUp,
  Sliders,
  Eye,
  EyeOff,
  Layers,
  ZoomIn,
  ZoomOut,
  RefreshCw,
} from 'lucide-react';

interface TradingChartProps {
  asset: MarketAsset;
  candles: CandleData[];
  ticks: TickData[];
  smcOverlays?: SmcOverlay[];
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  onTimeframeChange?: (tf: string) => void;
  selectedTimeframe?: string;
  isDarkMode?: boolean;
}

export const TradingChart: React.FC<TradingChartProps> = ({
  asset,
  candles,
  ticks,
  smcOverlays = [],
  entryPrice,
  stopLoss,
  takeProfit,
  onTimeframeChange,
  selectedTimeframe = '1M',
  isDarkMode = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [chartType, setChartType] = useState<'candles' | 'line' | 'ticks'>('candles');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [crosshair, setCrosshair] = useState<{ x: number; y: number; price: number; time: number } | null>(null);

  // Indicators toggle state
  const [showEMA20, setShowEMA20] = useState(true);
  const [showEMA200, setShowEMA200] = useState(true);
  const [showBollinger, setShowBollinger] = useState(false);
  const [showSMC, setShowSMC] = useState(true);
  const [subChart, setSubChart] = useState<'none' | 'rsi' | 'stoch' | 'macd' | 'adx' | 'cci'>('rsi');
  const [showIndicatorMenu, setShowIndicatorMenu] = useState(false);

  // Main canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 420;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Color theme definitions
    const bg = isDarkMode ? '#0B0E11' : '#ffffff';
    const gridColor = isDarkMode ? '#1E2329' : '#f1f5f9';
    const textColor = isDarkMode ? '#848E9C' : '#64748b';
    const upColor = '#10b981';
    const downColor = '#ef4444';
    const ema20Color = '#3b82f6';
    const ema200Color = '#eab308';
    const bbColor = 'rgba(59, 130, 246, 0.25)';

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    if (chartType === 'ticks') {
      // Render Tick Chart
      renderTickChart(ctx, width, height, ticks, isDarkMode, textColor, gridColor, asset);
      return;
    }

    if (candles.length === 0) return;

    // Slice candles based on zoom level
    const visibleCount = Math.max(15, Math.floor((candles.length * 0.9) / zoomLevel));
    const visibleCandles = candles.slice(-visibleCount);
    const visiblePrices = visibleCandles.map(c => c.close);

    // Indicator calculations
    const allClose = candles.map(c => c.close);
    const ema20 = calculateEMA(allClose, 20).slice(-visibleCount);
    const ema200 = calculateEMA(allClose, 200).slice(-visibleCount);
    const bb = calculateBollingerBands(allClose, 20, 2);
    const bbUpper = bb.upper.slice(-visibleCount);
    const bbLower = bb.lower.slice(-visibleCount);
    const bbMid = bb.middle.slice(-visibleCount);

    const subChartHeight = subChart === 'none' ? 0 : 90;
    const mainChartHeight = height - subChartHeight - 30; // 30px for time axis
    const priceScaleWidth = 65;
    const chartWidth = width - priceScaleWidth;

    // Min / Max Price
    let minPrice = Math.min(...visibleCandles.map(c => c.low));
    let maxPrice = Math.max(...visibleCandles.map(c => c.high));

    if (showBollinger) {
      minPrice = Math.min(minPrice, ...bbLower);
      maxPrice = Math.max(maxPrice, ...bbUpper);
    }
    if (entryPrice) {
      minPrice = Math.min(minPrice, entryPrice * 0.999);
      maxPrice = Math.max(maxPrice, entryPrice * 1.001);
    }
    if (stopLoss) minPrice = Math.min(minPrice, stopLoss * 0.999);
    if (takeProfit) maxPrice = Math.max(maxPrice, takeProfit * 1.001);

    const priceRange = maxPrice - minPrice || 1;
    const padding = priceRange * 0.08;
    const paddedMin = minPrice - padding;
    const paddedMax = maxPrice + padding;
    const paddedRange = paddedMax - paddedMin;

    const getY = (price: number) => {
      return mainChartHeight - ((price - paddedMin) / paddedRange) * mainChartHeight;
    };

    const candleWidth = Math.max(2, chartWidth / visibleCount);
    const getX = (index: number) => index * candleWidth + candleWidth / 2;

    // Draw Price Grid & Axes
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillStyle = textColor;

    const priceSteps = 5;
    for (let i = 0; i <= priceSteps; i++) {
      const p = paddedMin + (paddedRange / priceSteps) * i;
      const y = getY(p);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartWidth, y);
      ctx.stroke();

      ctx.fillText(p.toFixed(asset.digits), chartWidth + 6, y + 3);
    }

    // Vertical time grid lines
    const timeSteps = 6;
    for (let i = 0; i < timeSteps; i++) {
      const idx = Math.floor((visibleCount / timeSteps) * i);
      if (visibleCandles[idx]) {
        const x = getX(idx);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, mainChartHeight);
        ctx.stroke();

        const d = new Date(visibleCandles[idx].time);
        const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        ctx.fillText(timeStr, x - 14, height - 10);
      }
    }

    // 1. Draw SMC Overlays (Order Blocks & FVGs)
    if (showSMC && smcOverlays.length > 0) {
      smcOverlays.forEach(smc => {
        const yTop = getY(smc.priceUpper || smc.price * 1.001);
        const yBot = getY(smc.priceLower || smc.price * 0.999);
        const blockHeight = Math.max(4, Math.abs(yBot - yTop));
        const startY = Math.min(yTop, yBot);

        if (smc.type === 'order_block') {
          ctx.fillStyle = smc.direction === 'bullish' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)';
          ctx.strokeStyle = smc.direction === 'bullish' ? 'rgba(16, 185, 129, 0.6)' : 'rgba(239, 68, 68, 0.6)';
          ctx.fillRect(0, startY, chartWidth, blockHeight);
          ctx.strokeRect(0, startY, chartWidth, blockHeight);

          ctx.fillStyle = smc.direction === 'bullish' ? '#10b981' : '#ef4444';
          ctx.fillText(`[SMC OB] ${smc.label}`, 12, startY + 12);
        } else if (smc.type === 'fvg') {
          ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
          ctx.fillRect(chartWidth * 0.3, startY, chartWidth * 0.7, blockHeight);
          ctx.strokeRect(chartWidth * 0.3, startY, chartWidth * 0.7, blockHeight);
          ctx.fillStyle = '#f59e0b';
          ctx.fillText(`[FVG] Imbalance`, chartWidth * 0.35, startY + 12);
        } else if (smc.type === 'bos' || smc.type === 'choch') {
          const y = getY(smc.price);
          ctx.strokeStyle = smc.type === 'bos' ? '#06b6d4' : '#a855f7';
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(chartWidth * 0.4, y);
          ctx.lineTo(chartWidth, y);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = smc.type === 'bos' ? '#06b6d4' : '#a855f7';
          ctx.fillText(`-- ${smc.label} --`, chartWidth * 0.45, y - 4);
        }
      });
    }

    // 2. Draw Bollinger Bands
    if (showBollinger) {
      ctx.fillStyle = 'rgba(168, 85, 247, 0.05)';
      ctx.beginPath();
      for (let i = 0; i < visibleCount; i++) {
        const x = getX(i);
        const y = getY(bbUpper[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      for (let i = visibleCount - 1; i >= 0; i--) {
        const x = getX(i);
        const y = getY(bbLower[i]);
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();

      // Upper Line
      ctx.strokeStyle = bbColor;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i = 0; i < visibleCount; i++) {
        const x = getX(i);
        const y = getY(bbUpper[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Lower Line
      ctx.beginPath();
      for (let i = 0; i < visibleCount; i++) {
        const x = getX(i);
        const y = getY(bbLower[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Mid Line
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      for (let i = 0; i < visibleCount; i++) {
        const x = getX(i);
        const y = getY(bbMid[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 3. Draw EMAs
    if (showEMA20) {
      ctx.strokeStyle = ema20Color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < visibleCount; i++) {
        const x = getX(i);
        const y = getY(ema20[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    if (showEMA200) {
      ctx.strokeStyle = ema200Color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < visibleCount; i++) {
        const x = getX(i);
        const y = getY(ema200[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // 4. Render Candles or Line Chart
    if (chartType === 'candles') {
      const bodyWidth = Math.max(2, candleWidth * 0.75);

      visibleCandles.forEach((candle, i) => {
        const x = getX(i);
        const openY = getY(candle.open);
        const closeY = getY(candle.close);
        const highY = getY(candle.high);
        const lowY = getY(candle.low);
        const isUp = candle.close >= candle.open;

        ctx.strokeStyle = isUp ? upColor : downColor;
        ctx.fillStyle = isUp ? upColor : downColor;
        ctx.lineWidth = 1;

        // Wick
        ctx.beginPath();
        ctx.moveTo(x, highY);
        ctx.lineTo(x, lowY);
        ctx.stroke();

        // Body
        const top = Math.min(openY, closeY);
        const height = Math.max(1.5, Math.abs(closeY - openY));
        ctx.fillRect(x - bodyWidth / 2, top, bodyWidth, height);
      });
    } else {
      // Line Chart (Area)
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < visibleCount; i++) {
        const x = getX(i);
        const y = getY(visibleCandles[i].close);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Area gradient
      const lastX = getX(visibleCount - 1);
      ctx.lineTo(lastX, mainChartHeight);
      ctx.lineTo(getX(0), mainChartHeight);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, 0, 0, mainChartHeight);
      grad.addColorStop(0, 'rgba(59, 130, 246, 0.25)');
      grad.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // 5. Draw Entry, Stop Loss, Take Profit lines if MT5 or active signal
    if (entryPrice) {
      const y = getY(entryPrice);
      ctx.strokeStyle = '#3b82f6';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartWidth, y);
      ctx.stroke();
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(chartWidth + 2, y - 9, 60, 18);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`ENTRY`, chartWidth + 6, y + 4);
      ctx.setLineDash([]);
    }

    if (stopLoss) {
      const y = getY(stopLoss);
      ctx.strokeStyle = '#ef4444';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartWidth, y);
      ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(chartWidth + 2, y - 9, 60, 18);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`SL`, chartWidth + 6, y + 4);
      ctx.setLineDash([]);
    }

    if (takeProfit) {
      const y = getY(takeProfit);
      ctx.strokeStyle = '#10b981';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartWidth, y);
      ctx.stroke();
      ctx.fillStyle = '#10b981';
      ctx.fillRect(chartWidth + 2, y - 9, 60, 18);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`TP`, chartWidth + 6, y + 4);
      ctx.setLineDash([]);
    }

    // Current Price Pulse Line
    const curPrice = visibleCandles[visibleCandles.length - 1].close;
    const curY = getY(curPrice);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(0, curY);
    ctx.lineTo(chartWidth, curY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Current price badge on scale
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(chartWidth, curY - 9, priceScaleWidth, 18);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px JetBrains Mono, monospace';
    ctx.fillText(curPrice.toFixed(asset.digits), chartWidth + 4, curY + 4);

    // 6. Sub-chart rendering (RSI, Stochastic, ADX, MACD, CCI)
    if (subChart !== 'none') {
      const subTop = mainChartHeight + 10;
      const subBottom = height - 25;
      const subRange = subBottom - subTop;

      // Divider line
      ctx.strokeStyle = gridColor;
      ctx.beginPath();
      ctx.moveTo(0, subTop - 5);
      ctx.lineTo(width, subTop - 5);
      ctx.stroke();

      if (subChart === 'rsi') {
        const rsiData = calculateRSI(allClose, 14).slice(-visibleCount);
        ctx.fillStyle = textColor;
        ctx.fillText(`RSI(14): ${rsiData[rsiData.length - 1]?.toFixed(1)}`, 10, subTop + 12);

        // 70 and 30 levels
        const y70 = subTop + subRange * 0.3;
        const y30 = subTop + subRange * 0.7;
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.beginPath();
        ctx.moveTo(0, y70);
        ctx.lineTo(chartWidth, y70);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
        ctx.beginPath();
        ctx.moveTo(0, y30);
        ctx.lineTo(chartWidth, y30);
        ctx.stroke();

        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < visibleCount; i++) {
          const x = getX(i);
          const val = rsiData[i] || 50;
          const y = subBottom - (val / 100) * subRange;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      } else if (subChart === 'adx') {
        const adxResult = calculateADX(candles, 14);
        const adx = adxResult.adx.slice(-visibleCount);
        const pdi = adxResult.plusDI.slice(-visibleCount);
        const mdi = adxResult.minusDI.slice(-visibleCount);

        ctx.fillStyle = textColor;
        ctx.fillText(`ADX(14): ${adx[adx.length - 1]?.toFixed(1)} | +DI: ${pdi[pdi.length - 1]?.toFixed(1)} | -DI: ${mdi[mdi.length - 1]?.toFixed(1)}`, 10, subTop + 12);

        // 25 threshold
        const y25 = subBottom - (25 / 60) * subRange;
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(0, y25);
        ctx.lineTo(chartWidth, y25);
        ctx.stroke();
        ctx.setLineDash([]);

        // Plot ADX, +DI, -DI
        const plotLine = (data: number[], color: string) => {
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          for (let i = 0; i < visibleCount; i++) {
            const x = getX(i);
            const val = Math.min(60, Math.max(0, data[i] || 0));
            const y = subBottom - (val / 60) * subRange;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        };

        plotLine(adx, '#ffffff'); // White: ADX
        plotLine(pdi, '#10b981'); // Green: +DI
        plotLine(mdi, '#ef4444'); // Red: -DI
      } else if (subChart === 'stoch') {
        const stochData = calculateStochasticRSI(allClose, 14, 14, 3, 3);
        const k = stochData.kLine.slice(-visibleCount);
        const d = stochData.dLine.slice(-visibleCount);

        ctx.fillStyle = textColor;
        ctx.fillText(`StochRSI(14,3,3) K: ${k[k.length - 1]?.toFixed(1)} | D: ${d[d.length - 1]?.toFixed(1)}`, 10, subTop + 12);

        // Plot K and D
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < visibleCount; i++) {
          const x = getX(i);
          const y = subBottom - ((k[i] || 50) / 100) * subRange;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.strokeStyle = '#f43f5e';
        ctx.beginPath();
        for (let i = 0; i < visibleCount; i++) {
          const x = getX(i);
          const y = subBottom - ((d[i] || 50) / 100) * subRange;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }
  }, [candles, ticks, chartType, isFullscreen, zoomLevel, showEMA20, showEMA200, showBollinger, showSMC, subChart, isDarkMode, asset, entryPrice, stopLoss, takeProfit, smcOverlays]);

  // Render Tick Chart
  const renderTickChart = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    tickList: TickData[],
    dark: boolean,
    textColor: string,
    gridColor: string,
    asset: MarketAsset
  ) => {
    const visibleTicks = tickList.slice(-40);
    if (visibleTicks.length < 2) return;

    const prices = visibleTicks.map(t => t.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const padding = range * 0.1;
    const pMin = min - padding;
    const pMax = max + padding;
    const pRange = pMax - pMin;

    const priceScaleWidth = 65;
    const chartW = width - priceScaleWidth;
    const chartH = height - 30;

    const getY = (p: number) => chartH - ((p - pMin) / pRange) * chartH;
    const getX = (i: number) => (i / (visibleTicks.length - 1)) * chartW;

    // Grid
    ctx.strokeStyle = gridColor;
    ctx.beginPath();
    for (let i = 0; i <= 4; i++) {
      const p = pMin + (pRange / 4) * i;
      const y = getY(p);
      ctx.moveTo(0, y);
      ctx.lineTo(chartW, y);
      ctx.fillStyle = textColor;
      ctx.fillText(p.toFixed(asset.digits), chartW + 5, y + 3);
    }
    ctx.stroke();

    // Line
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    visibleTicks.forEach((t, i) => {
      const x = getX(i);
      const y = getY(t.price);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Tick dots with last digit badge
    visibleTicks.forEach((t, i) => {
      const x = getX(i);
      const y = getY(t.price);
      const isLast = i === visibleTicks.length - 1;

      ctx.fillStyle = isLast ? '#ef4444' : '#06b6d4';
      ctx.beginPath();
      ctx.arc(x, y, isLast ? 5 : 3, 0, Math.PI * 2);
      ctx.fill();

      // Show digit on top of tick
      ctx.fillStyle = isLast ? '#ef4444' : textColor;
      ctx.font = 'bold 9px JetBrains Mono, monospace';
      ctx.fillText(`${t.lastDigit}`, x - 3, y - 7);
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !containerRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCrosshair({ x, y, price: asset.currentPrice, time: Date.now() });
  };

  return (
    <div
      ref={containerRef}
      id="trading-chart-container"
      className={`relative flex flex-col rounded-lg border ${
        isDarkMode ? 'bg-[#161A1E] border-[#2B2F36]' : 'bg-white border-slate-200'
      } overflow-hidden shadow-sm transition-all font-mono`}
      style={{ height: isFullscreen ? '100vh' : '480px' }}
    >
      {/* Chart Toolbar */}
      <div
        id="chart-top-toolbar"
        className={`flex items-center justify-between px-3 py-1.5 border-b text-xs ${
          isDarkMode ? 'bg-[#161A1E] border-[#2B2F36] text-[#848E9C]' : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}
      >
        <div className="flex items-center space-x-2">
          {/* Timeframe selector */}
          <div className="flex items-center bg-[#0B0E11] rounded p-0.5 border border-[#2B2F36]">
            {['1T', '1M', '2M', '5M', '15M', '1H'].map(tf => (
              <button
                key={tf}
                id={`btn-timeframe-${tf}`}
                onClick={() => {
                  if (tf === '1T') setChartType('ticks');
                  else {
                    if (chartType === 'ticks') setChartType('candles');
                    onTimeframeChange?.(tf);
                  }
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                  (tf === '1T' && chartType === 'ticks') || (chartType !== 'ticks' && selectedTimeframe === tf)
                    ? 'bg-blue-600 text-white'
                    : 'text-[#848E9C] hover:text-[#EAECEF]'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="h-3.5 w-px bg-[#2B2F36] mx-1" />

          {/* Chart Style */}
          <div className="flex items-center space-x-1">
            <button
              id="btn-chart-type-candles"
              onClick={() => setChartType('candles')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                chartType === 'candles' ? 'bg-[#2B2F36] text-white' : 'text-[#848E9C] hover:text-[#EAECEF]'
              }`}
            >
              Candles
            </button>
            <button
              id="btn-chart-type-line"
              onClick={() => setChartType('line')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                chartType === 'line' ? 'bg-[#2B2F36] text-white' : 'text-[#848E9C] hover:text-[#EAECEF]'
              }`}
            >
              Line Area
            </button>
          </div>
        </div>

        {/* Right Toolbar Controls */}
        <div className="flex items-center space-x-2">
          {/* Indicators dropdown toggle */}
          <div className="relative">
            <button
              id="btn-toggle-indicators-dropdown"
              onClick={() => setShowIndicatorMenu(!showIndicatorMenu)}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] font-bold uppercase border ${
                showIndicatorMenu
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : isDarkMode
                  ? 'bg-[#0B0E11] border-[#2B2F36] text-[#848E9C] hover:text-[#EAECEF] hover:bg-[#1E2329]'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Indicators & SMC</span>
            </button>

            {showIndicatorMenu && (
              <div
                id="indicators-dropdown-menu"
                className={`absolute right-0 top-8 z-30 w-56 p-3 rounded border shadow-xl ${
                  isDarkMode ? 'bg-[#161A1E] border-[#2B2F36] text-[#EAECEF]' : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                <div className="text-[10px] font-bold text-[#848E9C] uppercase tracking-wider mb-2">Overlays</div>
                <div className="space-y-1.5 text-xs">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                      <span>EMA 20</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={showEMA20}
                      onChange={e => setShowEMA20(e.target.checked)}
                      className="rounded accent-blue-600"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />
                      <span>EMA 200</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={showEMA200}
                      onChange={e => setShowEMA200(e.target.checked)}
                      className="rounded accent-blue-600"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                      <span>Bollinger Bands</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={showBollinger}
                      onChange={e => setShowBollinger(e.target.checked)}
                      className="rounded accent-blue-600"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                      <span>SMC (OB / FVG / BOS)</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={showSMC}
                      onChange={e => setShowSMC(e.target.checked)}
                      className="rounded accent-blue-600"
                    />
                  </label>
                </div>

                <div className="h-px bg-[#2B2F36] my-2" />
                <div className="text-[10px] font-bold text-[#848E9C] uppercase tracking-wider mb-2">Oscillator Panel</div>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  {(['rsi', 'adx', 'stoch', 'none'] as const).map(osc => (
                    <button
                      key={osc}
                      onClick={() => setSubChart(osc)}
                      className={`px-2 py-1 rounded text-center text-[10px] font-bold uppercase ${
                        subChart === osc
                          ? 'bg-blue-600 text-white'
                          : 'bg-[#0B0E11] hover:bg-[#1E2329] text-[#848E9C] border border-[#2B2F36]'
                      }`}
                    >
                      {osc === 'stoch' ? 'Stoch RSI' : osc.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Zoom controls */}
          <div className="flex items-center space-x-1">
            <button
              id="btn-chart-zoom-in"
              onClick={() => setZoomLevel(prev => Math.min(prev + 0.2, 2.5))}
              className="p-1 rounded hover:bg-[#2B2F36] text-[#848E9C] hover:text-[#EAECEF]"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              id="btn-chart-zoom-out"
              onClick={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.6))}
              className="p-1 rounded hover:bg-[#2B2F36] text-[#848E9C] hover:text-[#EAECEF]"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            id="btn-chart-fullscreen"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 rounded hover:bg-[#2B2F36] text-[#848E9C] hover:text-[#EAECEF]"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative flex-1 w-full h-full cursor-crosshair">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setCrosshair(null)}
          className="w-full h-full block"
        />

        {/* Floating live price watermark & SMC legend */}
        <div className="absolute top-2.5 left-2.5 pointer-events-none space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-white uppercase">{asset.name}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#0B0E11] text-green-400 font-mono border border-[#2B2F36]">
              {asset.currentPrice.toFixed(asset.digits)}
            </span>
          </div>
          <div className="text-[10px] text-[#848E9C] flex items-center space-x-2 font-mono">
            {showEMA20 && <span className="text-blue-400">EMA20</span>}
            {showEMA200 && <span className="text-yellow-400">EMA200</span>}
            {showBollinger && <span className="text-blue-300">BB(20,2)</span>}
            {showSMC && <span className="text-green-400">SMC</span>}
          </div>
        </div>
      </div>
    </div>
  );
};
