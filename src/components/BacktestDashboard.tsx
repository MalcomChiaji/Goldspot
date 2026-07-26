import React, { useState } from 'react';
import { AlertTriangle, Cpu, RefreshCw } from 'lucide-react';
import { BacktestResult, Timeframe } from '../types';

interface BacktestDashboardProps {
  result: BacktestResult | null;
  loading: boolean;
  onRunCalibration: () => void;
  onSelectTimeframe: (tf: Timeframe) => void;
}

export const BacktestDashboard: React.FC<BacktestDashboardProps> = ({
  result,
  loading,
  onRunCalibration,
}) => {
  const [tradeFilter, setTradeFilter] = useState<'ALL' | 'WIN' | 'LOSS'>('ALL');

  if (loading) {
    return (
      <div className="bg-white border border-[#1A1A1A] p-12 text-center my-6">
        <RefreshCw className="w-8 h-8 text-[#1A1A1A] animate-spin mx-auto mb-3" />
        <h3 className="text-base font-serif font-bold italic text-[#1A1A1A]">Running Temporal Walk-Forward Backtest...</h3>
        <p className="text-xs text-[#666] mt-2 font-sans max-w-md mx-auto">
          Executing 70% In-Sample / 30% Out-of-Sample split empirical validation across historical COMEX Gold tick bars.
        </p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-white border border-[#1A1A1A] p-8 text-center my-6">
        <Cpu className="w-8 h-8 text-[#666] mx-auto mb-3" />
        <h3 className="text-sm font-sans font-bold uppercase tracking-widest text-[#1A1A1A]">No Backtest Results Loaded</h3>
        <button
          onClick={onRunCalibration}
          className="mt-4 px-4 py-2 bg-[#1A1A1A] text-white font-sans text-xs font-bold uppercase tracking-widest cursor-pointer hover:bg-black transition-colors"
        >
          Run Model Backtest & Calibration
        </button>
      </div>
    );
  }

  const filteredTrades = result.trades.filter((t) => {
    if (tradeFilter === 'WIN') return t.pipsPnL > 0;
    if (tradeFilter === 'LOSS') return t.pipsPnL <= 0;
    return true;
  });

  const maxEq = Math.max(...result.equityCurve.map((e) => e.equity), 10000);
  const minEq = Math.min(...result.equityCurve.map((e) => e.equity), 10000);
  const rangeEq = maxEq - minEq || 1000;

  return (
    <div className="space-y-6 my-6 font-sans">
      {/* Honest Calibration Notice */}
      {result.calibrationWarning && (
        <div className="bg-[#1A1A1A] text-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-amber-400">Out-Of-Sample Calibration Alert</h4>
              <p className="text-xs text-[#EEE] mt-1 font-sans opacity-90">
                Out-of-sample Profit Factor is currently below optimal target ({result.outOfSample.profitFactor}). Re-calibration is recommended to adjust weights for current volatility.
              </p>
            </div>
          </div>
          <button
            onClick={onRunCalibration}
            className="px-4 py-2 bg-white text-[#1A1A1A] font-bold text-[10px] uppercase tracking-widest hover:bg-[#EFECE8] transition shrink-0 cursor-pointer"
          >
            Re-Calibrate Engine
          </button>
        </div>
      )}

      {/* KPI Performance Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Win Rate */}
        <div className="bg-white border border-[#1A1A1A] p-5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#666] block">
            Test Win Rate (Out-of-Sample)
          </span>
          <p className="text-3xl font-serif font-black italic text-[#059669] mt-1">
            {result.outOfSample.winRate}%
          </p>
          <p className="text-[10px] font-mono text-[#666] mt-1">
            In-Sample: {result.inSample.winRate}% ({result.inSample.totalTrades} trades)
          </p>
        </div>

        {/* Profit Factor */}
        <div className="bg-white border border-[#1A1A1A] p-5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#666] block">
            Test Profit Factor
          </span>
          <p className="text-3xl font-serif font-black italic text-[#1A1A1A] mt-1">
            {result.outOfSample.profitFactor}
          </p>
          <p className="text-[10px] font-mono text-[#666] mt-1">
            In-Sample PF: {result.inSample.profitFactor}
          </p>
        </div>

        {/* Out of Sample Pips */}
        <div className="bg-white border border-[#1A1A1A] p-5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#666] block">
            Out-of-Sample Pips
          </span>
          <p className="text-3xl font-serif font-black italic text-[#059669] mt-1">
            +{result.outOfSample.totalPips}
          </p>
          <p className="text-[10px] font-mono text-[#666] mt-1">
            Total Pips: +{result.overall.totalPips} pips
          </p>
        </div>

        {/* Max Drawdown */}
        <div className="bg-white border border-[#1A1A1A] p-5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#666] block">
            Max Drawdown / Sharpe
          </span>
          <p className="text-3xl font-serif font-black italic text-[#DC2626] mt-1">
            -{result.overall.maxDrawdownPercent}%
          </p>
          <p className="text-[10px] font-mono text-[#666] mt-1">
            Sharpe Ratio: {result.overall.sharpeRatio}
          </p>
        </div>
      </div>

      {/* Equity Curve SVG Chart */}
      <div className="bg-white border border-[#1A1A1A] p-6">
        <div className="flex items-center justify-between border-b border-[#DDD] pb-3 mb-4">
          <div>
            <h3 className="text-[11px] uppercase tracking-[0.2em] font-sans font-bold text-[#1A1A1A]">
              Walk-Forward Equity Curve ($10,000 Base Capital)
            </h3>
            <p className="text-xs text-[#666] mt-0.5">Dashed vertical line indicates 70% In-Sample / 30% Out-of-Sample split.</p>
          </div>
          <div className="text-xs font-mono text-[#059669] font-bold">
            Final: ${result.equityCurve.length > 0 ? result.equityCurve[result.equityCurve.length - 1].equity.toLocaleString() : '10,000'}
          </div>
        </div>

        {/* SVG Equity Line */}
        <div className="w-full h-56 bg-[#F9F8F6] border border-[#DDD] p-3 relative">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 800 200" preserveAspectRatio="none">
            {/* Split boundary vertical line */}
            <line x1="560" y1="0" x2="560" y2="200" stroke="#D97706" strokeDasharray="4 4" strokeWidth="1.5" />
            <text x="565" y="20" fill="#D97706" fontSize="10" fontFamily="sans-serif" fontWeight="bold">OUT-OF-SAMPLE TEST PHASE →</text>

            {/* Equity path */}
            {result.equityCurve.length > 1 && (
              <polyline
                fill="none"
                stroke="#1A1A1A"
                strokeWidth="2"
                points={result.equityCurve
                  .map((e, idx) => {
                    const x = (idx / (result.equityCurve.length - 1)) * 800;
                    const y = 190 - ((e.equity - minEq) / rangeEq) * 170;
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />
            )}
          </svg>
        </div>
      </div>

      {/* Regime Breakdown Table */}
      <div className="bg-white border border-[#1A1A1A] p-6">
        <h3 className="text-[11px] uppercase tracking-[0.2em] font-sans font-bold text-[#1A1A1A] border-b border-[#DDD] pb-2 mb-4">
          Performance Breakdown by Market Regime
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left font-mono">
            <thead className="bg-[#EFECE8] text-[#1A1A1A] uppercase tracking-wider text-[10px] border-b border-[#DDD]">
              <tr>
                <th className="py-2.5 px-3">Regime</th>
                <th className="py-2.5 px-3">Total Trades</th>
                <th className="py-2.5 px-3">Win Rate</th>
                <th className="py-2.5 px-3">Profit Factor</th>
                <th className="py-2.5 px-3">Net Pips PnL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEE]">
              {result.regimeBreakdown.map((r) => (
                <tr key={r.regime} className="hover:bg-[#F9F8F6]">
                  <td className="py-2.5 px-3 font-bold text-[#1A1A1A]">{r.regime}</td>
                  <td className="py-2.5 px-3 text-[#666]">{r.count}</td>
                  <td className="py-2.5 px-3 font-bold text-[#059669]">{r.winRate}%</td>
                  <td className="py-2.5 px-3 text-[#1A1A1A]">{r.profitFactor}</td>
                  <td className={`py-2.5 px-3 font-bold ${r.pips >= 0 ? 'text-[#059669]' : 'text-[#DC2626]'}`}>
                    {r.pips >= 0 ? `+${r.pips}` : r.pips} pips
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trade Log Table */}
      <div className="bg-white border border-[#1A1A1A] p-6">
        <div className="flex items-center justify-between border-b border-[#DDD] pb-3 mb-4">
          <h3 className="text-[11px] uppercase tracking-[0.2em] font-sans font-bold text-[#1A1A1A]">
            Historical Trade Log ({filteredTrades.length} Trades)
          </h3>
          <div className="flex items-center border border-[#1A1A1A] bg-white p-0.5">
            {(['ALL', 'WIN', 'LOSS'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setTradeFilter(filter)}
                className={`px-3 py-1 text-[10px] font-sans font-bold uppercase tracking-widest cursor-pointer transition ${
                  tradeFilter === filter ? 'bg-[#1A1A1A] text-white' : 'text-[#666] hover:text-[#1A1A1A]'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-xs text-left font-mono">
            <thead className="bg-[#EFECE8] text-[#1A1A1A] uppercase tracking-wider text-[10px] border-b border-[#DDD] sticky top-0">
              <tr>
                <th className="py-2 px-3">Type</th>
                <th className="py-2 px-3">Entry</th>
                <th className="py-2 px-3">SL</th>
                <th className="py-2 px-3">TP1</th>
                <th className="py-2 px-3">Exit</th>
                <th className="py-2 px-3">Reason</th>
                <th className="py-2 px-3">Pips PnL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEE]">
              {filteredTrades.map((t) => (
                <tr key={t.id} className="hover:bg-[#F9F8F6]">
                  <td className="py-2 px-3 font-bold">
                    <span className={t.direction === 'BUY' ? 'text-[#059669]' : 'text-[#DC2626]'}>
                      {t.direction}
                    </span>
                  </td>
                  <td className="py-2 px-3">${(t.entryPrice || 0).toFixed(2)}</td>
                  <td className="py-2 px-3 text-[#DC2626]">${(t.stopLoss || 0).toFixed(2)}</td>
                  <td className="py-2 px-3 text-[#059669]">${(t.takeProfit1 || 0).toFixed(2)}</td>
                  <td className="py-2 px-3">${(t.exitPrice || 0).toFixed(2)}</td>
                  <td className="py-2 px-3">
                    <span className="px-1.5 py-0.5 text-[10px] bg-[#EFECE8] text-[#1A1A1A] border border-[#DDD]">
                      {t.exitReason}
                    </span>
                  </td>
                  <td className={`py-2 px-3 font-bold ${t.pipsPnL >= 0 ? 'text-[#059669]' : 'text-[#DC2626]'}`}>
                    {t.pipsPnL >= 0 ? `+${t.pipsPnL}` : t.pipsPnL} pips
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

