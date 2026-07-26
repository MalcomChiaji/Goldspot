import React from 'react';
import { ArrowUpRight, ArrowDownRight, Target, Shield, Zap, Sparkles, CheckCircle2, Award, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { TradeSignal } from '../types';

interface SignalCardProps {
  signal: TradeSignal | null;
  currentPrice: number;
}

export const SignalCard: React.FC<SignalCardProps> = ({ signal, currentPrice }) => {
  if (!signal) {
    return (
      <div className="bg-white border border-[#1A1A1A] p-6 text-center">
        <div className="w-10 h-10 border border-[#1A1A1A] text-[#1A1A1A] flex items-center justify-center mx-auto mb-3 font-serif italic text-lg font-bold">
          !
        </div>
        <h3 className="text-sm font-sans font-bold uppercase tracking-widest text-[#1A1A1A]">No Active Forecast Signal</h3>
        <p className="text-xs text-[#666] mt-2 max-w-sm mx-auto font-sans leading-relaxed">
          The quant engine is actively scanning price structures. High-probability trades trigger when setup confluence exceeds minimum calibration thresholds.
        </p>
      </div>
    );
  }

  const isBuy = signal.direction === 'BUY';

  const [hoveredIdx, setHoveredIdx] = React.useState<number | null>(null);

  // Confidence history calculation for mini trend line chart
  const history = signal.confidenceHistory && signal.confidenceHistory.length > 0
    ? signal.confidenceHistory
    : [
        Math.max(30, signal.confidenceScore - 12),
        Math.max(30, signal.confidenceScore - 8),
        Math.max(30, signal.confidenceScore - 5),
        Math.max(30, signal.confidenceScore - 2),
        signal.confidenceScore
      ];

  const startConf = history[0];
  const endConf = history[history.length - 1];
  const delta = endConf - startConf;

  const minVal = Math.max(0, Math.min(...history) - 5);
  const maxVal = Math.min(100, Math.max(...history) + 5);
  const valRange = maxVal - minVal || 1;

  const points = history.map((val, idx) => {
    const x = (idx / Math.max(1, history.length - 1)) * 280;
    const y = 38 - ((val - minVal) / valRange) * 28 + 4;
    return { x, y, val };
  });

  const linePath = points.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L 280 48 L 0 48 Z`;

  const activePoint = hoveredIdx !== null ? points[hoveredIdx] : points[points.length - 1];

  return (
    <div className="bg-white border border-[#1A1A1A] p-6 relative flex flex-col justify-between">
      {/* Section Header Eyebrow */}
      <div className="flex items-center justify-between border-b border-[#DDD] pb-2 mb-4">
        <h2 className="text-[11px] uppercase tracking-[0.2em] font-sans font-bold text-[#1A1A1A]">
          Active Forecast Plan
        </h2>
        <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 bg-[#EFECE8] text-[#1A1A1A] font-bold border border-[#DDD]">
          {signal.timeframe} Frame
        </span>
      </div>

      {/* Headline Trade Direction */}
      <div className="mb-4">
        <div className="flex items-baseline justify-between">
          <p className={`text-5xl sm:text-6xl font-serif font-black italic tracking-tighter leading-none mb-1 ${
            isBuy ? 'text-[#059669]' : 'text-[#DC2626]'
          }`}>
            {signal.direction}
          </p>
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-widest font-sans font-bold text-[#666] block">Confidence</span>
            <span className="text-2xl font-black font-mono text-[#1A1A1A]">{signal.confidenceScore}%</span>
          </div>
        </div>
        <p className="text-xs italic font-sans text-[#666]">
          Targeting Mean Reversion & Market Structure Confluence
        </p>
      </div>

      {/* Confidence Score Trend Chart */}
      <div className="mb-6 bg-[#F9F8F6] border border-[#DDD] p-3.5 font-sans">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            {delta > 0 ? (
              <TrendingUp className="w-3.5 h-3.5 text-[#059669]" />
            ) : delta < 0 ? (
              <TrendingDown className="w-3.5 h-3.5 text-[#DC2626]" />
            ) : (
              <Activity className="w-3.5 h-3.5 text-[#666]" />
            )}
            <span className="text-[10px] uppercase tracking-widest font-bold text-[#1A1A1A]">
              Confidence Trend ({signal.timeframe})
            </span>
          </div>
          <span
            className={`text-[10px] font-mono font-bold px-1.5 py-0.5 border ${
              delta > 0
                ? 'bg-[#059669]/10 border-[#059669] text-[#059669]'
                : delta < 0
                ? 'bg-[#DC2626]/10 border-[#DC2626] text-[#DC2626]'
                : 'bg-[#EFECE8] border-[#DDD] text-[#666]'
            }`}
          >
            {delta > 0 ? `+${delta}% Certainty Increasing` : delta < 0 ? `${delta}% Certainty Decreasing` : 'Steady Certainty'}
          </span>
        </div>

        {/* SVG Sparkline Chart */}
        <div className="relative pt-1">
          <svg viewBox="0 0 280 48" className="w-full h-11 overflow-visible select-none">
            <defs>
              <linearGradient id={`confGrad-${signal.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={delta >= 0 ? '#059669' : '#DC2626'} stopOpacity="0.25" />
                <stop offset="100%" stopColor={delta >= 0 ? '#059669' : '#DC2626'} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Baseline dotted 50% line */}
            <line
              x1="0"
              y1={38 - ((50 - minVal) / valRange) * 28 + 4}
              x2="280"
              y2={38 - ((50 - minVal) / valRange) * 28 + 4}
              stroke="#DDD"
              strokeDasharray="2 2"
              strokeWidth="1"
            />

            {/* Area fill */}
            <path d={areaPath} fill={`url(#confGrad-${signal.id})`} />

            {/* Line path */}
            <path
              d={linePath}
              fill="none"
              stroke={delta >= 0 ? '#059669' : '#DC2626'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data Points */}
            {points.map((pt, idx) => {
              const isHovered = hoveredIdx === idx;
              const isLast = idx === points.length - 1;
              return (
                <circle
                  key={idx}
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 4.5 : isLast ? 3.5 : 2}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className={`cursor-pointer transition-all ${
                    isLast ? 'fill-[#1A1A1A] stroke-white stroke-2' : 'fill-[#888] hover:fill-[#1A1A1A]'
                  }`}
                />
              );
            })}
          </svg>

          {/* Start and End / Hover statistics */}
          <div className="flex justify-between items-center text-[9px] font-mono font-bold text-[#666] mt-1 border-t border-[#EAE7E2] pt-1">
            <span>Start: {startConf}%</span>
            <span className="text-[#1A1A1A]">
              {hoveredIdx !== null ? `Bar -${history.length - 1 - hoveredIdx}: ` : 'Current: '}
              <strong className={delta >= 0 ? 'text-[#059669]' : 'text-[#DC2626]'}>
                {activePoint.val}%
              </strong>
            </span>
            <span>Peak: {Math.max(...history)}%</span>
          </div>
        </div>
      </div>

      {/* Trade Parameters Table */}
      <div className="space-y-3 font-sans mb-6">
        <div className="flex justify-between items-center border-b border-[#EEE] pb-2">
          <span className="text-xs text-[#666] font-medium">Entry Signal</span>
          <span className="font-bold font-mono text-sm text-[#1A1A1A]">${(signal.entryPrice || 0).toFixed(2)}</span>
        </div>

        <div className="flex justify-between items-center border-b border-[#EEE] pb-2">
          <span className="text-xs text-[#666] font-medium">Take Profit (1.5R)</span>
          <span className="font-bold font-mono text-sm text-[#059669]">${(signal.takeProfit1 || 0).toFixed(2)}</span>
        </div>

        <div className="flex justify-between items-center border-b border-[#EEE] pb-2">
          <span className="text-xs text-[#666] font-medium">Take Profit (Runner 2.5R)</span>
          <span className="font-bold font-mono text-sm text-[#059669]">${(signal.takeProfit2 || 0).toFixed(2)}</span>
        </div>

        <div className="flex justify-between items-center border-b border-[#EEE] pb-2">
          <span className="text-xs text-[#666] font-medium">Stop Loss</span>
          <span className="font-bold font-mono text-sm text-[#DC2626]">${(signal.stopLoss || 0).toFixed(2)}</span>
        </div>

        <div className="pt-2 flex justify-between items-end">
          <div>
            <p className="text-3xl font-serif font-bold italic leading-none text-[#1A1A1A]">
              ~{signal.estimatedPips} <span className="text-xs font-sans not-italic uppercase tracking-widest opacity-60">Pips</span>
            </p>
            <p className="text-[10px] text-[#666] font-bold tracking-wider mt-1 uppercase">Estimated Volatility Range</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-mono font-bold text-[#1A1A1A]">1 : {signal.riskRewardRatio}</p>
            <p className="text-[10px] text-[#666] uppercase tracking-wider font-bold">R : R Ratio</p>
          </div>
        </div>
      </div>

      {/* Dark Highlight Callout Card */}
      <div className="bg-[#1A1A1A] text-white p-5 rounded-none mb-6">
        <h3 className="text-[10px] uppercase tracking-[0.2em] font-sans font-bold opacity-60 mb-2">
          Signal Confluence Rationale
        </h3>
        <ul className="space-y-1.5 text-xs font-sans opacity-90">
          {signal.reasoning.map((r, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">•</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Pattern Badges */}
      {signal.patterns.length > 0 && (
        <div>
          <span className="text-[10px] uppercase tracking-[0.15em] font-sans font-bold text-[#666] block mb-2">
            Technical Patterns Detected:
          </span>
          <div className="flex flex-wrap gap-2">
            {signal.patterns.map((p, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 text-[11px] font-sans font-bold bg-[#EFECE8] text-[#1A1A1A] border border-[#DDD]"
              >
                {p.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

