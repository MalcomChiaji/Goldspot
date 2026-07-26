import React from 'react';
import { IndicatorValues, MarketRegime } from '../types';

interface RegimeGaugeProps {
  regime: MarketRegime;
  indicators?: IndicatorValues;
}

export const RegimeGauge: React.FC<RegimeGaugeProps> = ({ regime, indicators }) => {
  const rsi = indicators?.rsi14 ?? 50;
  const adx = indicators?.adx14 ?? 20;
  const atr = indicators?.atr14 ?? 1.8;

  return (
    <div className="bg-white border border-[#1A1A1A] p-6">
      <div className="flex items-center justify-between border-b border-[#DDD] pb-2 mb-4">
        <h2 className="text-[11px] uppercase tracking-[0.2em] font-sans font-bold text-[#1A1A1A]">
          Signal Factors & Market Regime
        </h2>
        <span className="text-[10px] font-mono text-[#666] uppercase tracking-wider">
          Live Diagnostics
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* RSI Meter */}
        <div className="bg-[#EFECE8] p-3 border border-[#DDD]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#666] block">
            RSI (14)
          </span>
          <p className="text-xl font-bold font-mono text-[#1A1A1A] mt-1">{rsi.toFixed(1)}</p>
          <div className="w-full bg-[#DDD] h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-full ${
                rsi > 70 ? 'bg-[#DC2626]' : rsi < 30 ? 'bg-[#059669]' : 'bg-[#1A1A1A]'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, rsi))}%` }}
            />
          </div>
        </div>

        {/* ADX Trend Strength */}
        <div className="bg-[#EFECE8] p-3 border border-[#DDD]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#666] block">
            ADX Trend
          </span>
          <p className="text-xl font-bold font-mono text-[#1A1A1A] mt-1">{adx.toFixed(1)}</p>
          <div className="w-full bg-[#DDD] h-1.5 mt-2 overflow-hidden">
            <div
              className="h-full bg-[#1A1A1A]"
              style={{ width: `${Math.min(100, (adx / 50) * 100)}%` }}
            />
          </div>
        </div>

        {/* ATR Volatility */}
        <div className="bg-[#EFECE8] p-3 border border-[#DDD]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#666] block">
            ATR Range
          </span>
          <p className="text-xl font-bold font-mono text-[#1A1A1A] mt-1">${atr.toFixed(2)}</p>
          <p className="text-[10px] text-[#888] font-sans mt-0.5">Bar span</p>
        </div>

        {/* Current Regime */}
        <div className="bg-[#EFECE8] p-3 border border-[#DDD]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#666] block">
            Regime
          </span>
          <p className="text-sm font-bold font-serif italic text-[#1A1A1A] mt-1 truncate">{regime}</p>
          <p className="text-[10px] text-[#888] font-sans mt-0.5">Auto-matched</p>
        </div>
      </div>
    </div>
  );
};

