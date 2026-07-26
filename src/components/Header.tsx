import React from 'react';
import { Activity, Cpu, LineChart, Sliders, Eye, Newspaper, Bell, TrendingUp, TrendingDown } from 'lucide-react';
import { MarketRegime, Timeframe } from '../types';

interface HeaderProps {
  currentPrice: number;
  priceChange: number;
  regime: MarketRegime;
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  activeTab: 'terminal' | 'backtest' | 'vision' | 'calibration' | 'sentiment' | 'alerts';
  onTabChange: (tab: 'terminal' | 'backtest' | 'vision' | 'calibration' | 'sentiment' | 'alerts') => void;
  calibrationWarning?: boolean;
  hasTriggeredAlerts?: boolean;
  activeAlertsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentPrice,
  priceChange,
  regime,
  timeframe,
  onTimeframeChange,
  activeTab,
  onTabChange,
  calibrationWarning,
  hasTriggeredAlerts,
  activeAlertsCount = 0,
}) => {
  const getRegimeText = (r: MarketRegime) => {
    switch (r) {
      case 'TRENDING_UP':
        return 'Bullish Trend';
      case 'TRENDING_DOWN':
        return 'Bearish Trend';
      case 'EXTENSION':
        return 'Over-Extension';
      case 'HIGH_VOLATILITY':
        return 'High Volatility';
      default:
        return 'Ranging / Consolidation';
    }
  };

  return (
    <header className="bg-[#F9F8F6] border-b border-[#1A1A1A] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between py-4 gap-4">
          {/* Logo Title & Live Price Ticker */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-[0.2em] font-sans font-bold text-[#666]">
                Quantitative Research Division
              </span>
              <h1 className="text-3xl sm:text-4xl font-serif font-black italic tracking-tighter leading-none mt-1 text-[#1A1A1A]">
                Aurum Quant
              </h1>
            </div>

            {/* Live Ticker Metrics */}
            <div className="flex items-center gap-6 font-sans border-l sm:border-l border-[#DDD] sm:pl-6">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#666] font-bold">Live GC=F (Proxy)</p>
                <p className="text-lg sm:text-xl font-bold font-mono text-[#1A1A1A]">
                  ${currentPrice > 0 ? currentPrice.toFixed(2) : '2,742.50'}
                  <span className={`text-xs ml-1.5 ${priceChange >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {priceChange >= 0 ? '+' : ''}{priceChange}%
                  </span>
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#666] font-bold">Market Regime</p>
                <p className="text-sm sm:text-base font-bold italic underline decoration-2 underline-offset-4 text-[#1A1A1A]">
                  {getRegimeText(regime)}
                </p>
              </div>
            </div>
          </div>

          {/* Timeframe Selector & Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Timeframe Buttons */}
            <div className="flex items-center border border-[#1A1A1A] p-0.5 bg-white">
              {(['5m', '15m', '1h', '4h'] as Timeframe[]).map((tf) => (
                <button
                  key={tf}
                  onClick={() => onTimeframeChange(tf)}
                  className={`px-3 py-1 text-[10px] font-sans font-bold uppercase tracking-widest cursor-pointer transition-colors ${
                    timeframe === tf
                      ? 'bg-[#1A1A1A] text-white'
                      : 'text-[#666] hover:text-[#1A1A1A]'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            {/* View Navigation Tabs */}
            <nav className="flex items-center border border-[#1A1A1A] p-0.5 bg-white">
              <button
                onClick={() => onTabChange('terminal')}
                className={`px-3 py-1 text-[10px] font-sans font-bold uppercase tracking-widest flex items-center gap-1.5 cursor-pointer transition-colors ${
                  activeTab === 'terminal'
                    ? 'bg-[#1A1A1A] text-white'
                    : 'text-[#666] hover:text-[#1A1A1A]'
                }`}
              >
                <LineChart className="w-3 h-3" />
                <span>Terminal</span>
              </button>

              <button
                onClick={() => onTabChange('backtest')}
                className={`px-3 py-1 text-[10px] font-sans font-bold uppercase tracking-widest flex items-center gap-1.5 cursor-pointer transition-colors relative ${
                  activeTab === 'backtest'
                    ? 'bg-[#1A1A1A] text-white'
                    : 'text-[#666] hover:text-[#1A1A1A]'
                }`}
              >
                <Cpu className="w-3 h-3" />
                <span>Backtest</span>
                {calibrationWarning && (
                  <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping absolute -top-1 -right-1" />
                )}
              </button>

              <button
                onClick={() => onTabChange('vision')}
                className={`px-3 py-1 text-[10px] font-sans font-bold uppercase tracking-widest flex items-center gap-1.5 cursor-pointer transition-colors ${
                  activeTab === 'vision'
                    ? 'bg-[#1A1A1A] text-white'
                    : 'text-[#666] hover:text-[#1A1A1A]'
                }`}
              >
                <Eye className="w-3 h-3" />
                <span>AI Vision</span>
              </button>

              <button
                onClick={() => onTabChange('calibration')}
                className={`px-3 py-1 text-[10px] font-sans font-bold uppercase tracking-widest flex items-center gap-1.5 cursor-pointer transition-colors ${
                  activeTab === 'calibration'
                    ? 'bg-[#1A1A1A] text-white'
                    : 'text-[#666] hover:text-[#1A1A1A]'
                }`}
              >
                <Sliders className="w-3 h-3" />
                <span>Calibration</span>
              </button>

              <button
                onClick={() => onTabChange('sentiment')}
                className={`px-3 py-1 text-[10px] font-sans font-bold uppercase tracking-widest flex items-center gap-1.5 cursor-pointer transition-colors ${
                  activeTab === 'sentiment'
                    ? 'bg-[#1A1A1A] text-white'
                    : 'text-[#666] hover:text-[#1A1A1A]'
                }`}
              >
                <Newspaper className="w-3 h-3 text-amber-400" />
                <span>News Sentiment</span>
              </button>

              <button
                onClick={() => onTabChange('alerts')}
                className={`px-3 py-1 text-[10px] font-sans font-bold uppercase tracking-widest flex items-center gap-1.5 cursor-pointer transition-colors relative ${
                  activeTab === 'alerts'
                    ? 'bg-[#1A1A1A] text-white'
                    : 'text-[#666] hover:text-[#1A1A1A]'
                }`}
              >
                <Bell className="w-3 h-3 text-rose-500" />
                <span>Alerts</span>
                {activeAlertsCount > 0 && (
                  <span className="bg-[#1A1A1A] text-amber-400 text-[9px] px-1 py-0.2 rounded-none font-mono">
                    {activeAlertsCount}
                  </span>
                )}
                {hasTriggeredAlerts && (
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping absolute -top-1 -right-1 border border-white" />
                )}
              </button>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};


