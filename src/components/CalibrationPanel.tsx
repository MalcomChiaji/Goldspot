import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  Zap,
  TrendingUp,
  Shield,
  Target,
  Sliders,
  CheckCircle2,
  Clock,
  Activity,
  RotateCcw,
  Bot,
  Brain,
  History,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { AiCalibrationResult, EngineConfig, Timeframe } from '../types';
import { DEFAULT_ENGINE_CONFIG } from '../lib/config';

interface CalibrationPanelProps {
  config: EngineConfig;
  timeframe: Timeframe;
  onUpdateConfig: (config: EngineConfig) => void;
  onRunAiCalibration: () => Promise<void>;
  loading: boolean;
  calibrationResult?: AiCalibrationResult | null;
  calibrationHistory?: AiCalibrationResult[];
  autoSamplingEnabled?: boolean;
  onToggleAutoSampling?: (enabled: boolean) => Promise<void>;
}

export const CalibrationPanel: React.FC<CalibrationPanelProps> = ({
  config,
  timeframe,
  onUpdateConfig,
  onRunAiCalibration,
  loading,
  calibrationResult,
  calibrationHistory = [],
  autoSamplingEnabled = true,
  onToggleAutoSampling,
}) => {
  const [activeTab, setActiveTab] = useState<'insights' | 'parameters' | 'history'>('insights');
  const [isAutoEnabled, setIsAutoEnabled] = useState<boolean>(autoSamplingEnabled);

  useEffect(() => {
    setIsAutoEnabled(autoSamplingEnabled);
  }, [autoSamplingEnabled]);

  const handleToggleAuto = async () => {
    const nextState = !isAutoEnabled;
    setIsAutoEnabled(nextState);
    if (onToggleAutoSampling) {
      await onToggleAutoSampling(nextState);
    }
  };

  const handleReset = () => {
    onUpdateConfig(DEFAULT_ENGINE_CONFIG);
  };

  const lastResult = calibrationResult || (calibrationHistory.length > 0 ? calibrationHistory[0] : null);

  return (
    <div className="bg-white border border-[#1A1A1A] p-6 my-6 space-y-6 font-sans">
      {/* Top Banner & Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-[#DDD] pb-5 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-[#1A1A1A] text-white text-[10px] uppercase font-mono font-bold tracking-widest flex items-center gap-1">
              <Bot className="w-3 h-3 text-amber-400" />
              AI Quantitative Auto-Calibration
            </span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#EFECE8] border border-[#DDD] text-[10px] font-mono font-bold">
              <span className={`w-2 h-2 rounded-full ${isAutoEnabled ? 'bg-[#059669] animate-pulse' : 'bg-[#999]'}`} />
              {isAutoEnabled ? 'Continuous Sampling Active (3m)' : 'Auto-Sampling Paused'}
            </div>
          </div>
          <p className="text-xs text-[#666] max-w-2xl">
            Replaced legacy manual grid-search with a continuous Gemini 3.6 Flash AI optimization loop. The engine periodically samples backtest performance, evaluates regime drawdowns, and automatically adjusts <code className="font-mono bg-[#EFECE8] px-1 py-0.2 rounded">ENGINE_CONFIG</code> parameters.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Toggle Auto Sampling */}
          <button
            onClick={handleToggleAuto}
            className={`px-3 py-2 border text-xs font-mono font-bold flex items-center gap-2 cursor-pointer transition ${
              isAutoEnabled
                ? 'bg-[#059669]/10 border-[#059669] text-[#059669] hover:bg-[#059669]/20'
                : 'bg-[#EFECE8] border-[#DDD] text-[#666] hover:text-[#1A1A1A]'
            }`}
            title="Toggle periodic background sampling and parameter auto-adjustment"
          >
            {isAutoEnabled ? <ToggleRight className="w-4 h-4 text-[#059669]" /> : <ToggleLeft className="w-4 h-4 text-[#666]" />}
            <span>{isAutoEnabled ? 'Auto-Sampling On' : 'Auto-Sampling Off'}</span>
          </button>

          {/* Trigger Manual AI Calibration */}
          <button
            onClick={onRunAiCalibration}
            disabled={loading}
            className="px-4 py-2 bg-[#1A1A1A] text-white font-sans text-xs font-bold uppercase tracking-widest hover:bg-black disabled:opacity-50 transition cursor-pointer flex items-center gap-2 shadow-sm"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-400" />
            )}
            <span>{loading ? 'AI Calibrating Engine...' : 'Run AI Calibration Now'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-[#EAE7E2] gap-6 text-xs font-mono font-bold">
        <button
          onClick={() => setActiveTab('insights')}
          className={`pb-2.5 flex items-center gap-1.5 transition border-b-2 cursor-pointer ${
            activeTab === 'insights'
              ? 'border-[#1A1A1A] text-[#1A1A1A]'
              : 'border-transparent text-[#888] hover:text-[#1A1A1A]'
          }`}
        >
          <Brain className="w-4 h-4" />
          <span>AI Quant Diagnosis & Metrics</span>
        </button>

        <button
          onClick={() => setActiveTab('parameters')}
          className={`pb-2.5 flex items-center gap-1.5 transition border-b-2 cursor-pointer ${
            activeTab === 'parameters'
              ? 'border-[#1A1A1A] text-[#1A1A1A]'
              : 'border-transparent text-[#888] hover:text-[#1A1A1A]'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Active Engine Parameters Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-2.5 flex items-center gap-1.5 transition border-b-2 cursor-pointer ${
            activeTab === 'history'
              ? 'border-[#1A1A1A] text-[#1A1A1A]'
              : 'border-transparent text-[#888] hover:text-[#1A1A1A]'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Sampling Audit Log ({calibrationHistory.length})</span>
        </button>
      </div>

      {/* Tab 1: AI Quant Diagnosis & Metrics */}
      {activeTab === 'insights' && (
        <div className="space-y-6">
          {/* Latest AI Calibration Summary Card */}
          {lastResult ? (
            <div className="bg-[#F9F8F6] border border-[#DDD] p-5 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-[#EAE7E2] pb-3 gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-[#059669] rounded-full" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] font-mono">
                    Latest AI Calibration Summary ({lastResult.timeframe})
                  </span>
                  <span className="text-[10px] text-[#666] font-mono">
                    • {new Date(lastResult.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <span className="text-[10px] font-mono bg-[#EFECE8] border border-[#DDD] px-2 py-0.5 text-[#1A1A1A]">
                  Sampled {lastResult.sampledBarsCount} historical bars
                </span>
              </div>

              {/* AI Narrative Diagnosis */}
              <div className="bg-white border border-[#EAE7E2] p-4 text-xs leading-relaxed text-[#1A1A1A] font-sans">
                <p className="font-semibold text-[#1A1A1A] mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  Gemini Quant Evaluation Narrative:
                </p>
                <p className="text-[#333]">{lastResult.aiDiagnosis}</p>

                {lastResult.keyInsights && lastResult.keyInsights.length > 0 && (
                  <ul className="mt-3 space-y-1 text-[11px] text-[#555] font-sans border-t border-[#F0ECE6] pt-2">
                    {lastResult.keyInsights.map((insight, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Improvement Metric Deltas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Profit Factor Delta */}
                <div className="bg-white border border-[#DDD] p-3 font-mono">
                  <p className="text-[10px] uppercase text-[#666] font-bold">Profit Factor</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-lg font-black text-[#1A1A1A]">
                      {lastResult.calibratedMetrics.profitFactor}
                    </span>
                    <span
                      className={`text-xs font-bold ${
                        lastResult.improvements.profitFactorDelta >= 0 ? 'text-[#059669]' : 'text-[#DC2626]'
                      }`}
                    >
                      {lastResult.improvements.profitFactorDelta >= 0 ? '+' : ''}
                      {lastResult.improvements.profitFactorDelta}
                    </span>
                  </div>
                  <p className="text-[9px] text-[#888] mt-0.5">Prior: {lastResult.baselineMetrics.profitFactor}</p>
                </div>

                {/* Win Rate Delta */}
                <div className="bg-white border border-[#DDD] p-3 font-mono">
                  <p className="text-[10px] uppercase text-[#666] font-bold">Win Rate</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-lg font-black text-[#1A1A1A]">
                      {lastResult.calibratedMetrics.winRate}%
                    </span>
                    <span
                      className={`text-xs font-bold ${
                        lastResult.improvements.winRateDelta >= 0 ? 'text-[#059669]' : 'text-[#DC2626]'
                      }`}
                    >
                      {lastResult.improvements.winRateDelta >= 0 ? '+' : ''}
                      {lastResult.improvements.winRateDelta}%
                    </span>
                  </div>
                  <p className="text-[9px] text-[#888]">Prior: {lastResult.baselineMetrics.winRate}%</p>
                </div>

                {/* Max Drawdown Delta */}
                <div className="bg-white border border-[#DDD] p-3 font-mono">
                  <p className="text-[10px] uppercase text-[#666] font-bold">Max Drawdown</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-lg font-black text-[#1A1A1A]">
                      {lastResult.calibratedMetrics.maxDrawdownPercent}%
                    </span>
                    <span
                      className={`text-xs font-bold ${
                        lastResult.improvements.drawdownDelta >= 0 ? 'text-[#059669]' : 'text-[#DC2626]'
                      }`}
                    >
                      {lastResult.improvements.drawdownDelta >= 0 ? '-' : '+'}
                      {Math.abs(lastResult.improvements.drawdownDelta)}%
                    </span>
                  </div>
                  <p className="text-[9px] text-[#888]">Prior: {lastResult.baselineMetrics.maxDrawdownPercent}%</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#F9F8F6] border border-[#DDD] p-8 text-center space-y-3 font-sans">
              <Activity className="w-8 h-8 text-[#888] mx-auto animate-bounce" />
              <p className="text-sm font-bold text-[#1A1A1A]">Engine Auto-Calibration Ready</p>
              <p className="text-xs text-[#666] max-w-md mx-auto">
                No recent calibration runs recorded yet. Click <strong>"Run AI Calibration Now"</strong> or leave continuous background auto-sampling active to calibrate the engine parameters.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Active Engine Parameters Matrix */}
      {activeTab === 'parameters' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#DDD] pb-3">
            <div>
              <p className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider font-mono">
                Current Config Values
              </p>
              <p className="text-[11px] text-[#666]">
                These parameters govern ATR stop distances, target multipliers, confidence thresholds, and indicator lookbacks across all trading routines.
              </p>
            </div>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 border border-[#DDD] bg-[#EFECE8] hover:bg-[#DDD] text-xs font-mono font-bold text-[#1A1A1A] flex items-center gap-1.5 cursor-pointer transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-xs">
            {/* ATR Stop Multipliers */}
            <div className="bg-[#F9F8F6] border border-[#DDD] p-4 space-y-2">
              <div className="flex items-center justify-between border-b border-[#EAE7E2] pb-1.5">
                <span className="font-bold text-[#1A1A1A] uppercase text-[10px]">ATR Stop Multipliers</span>
                <Shield className="w-3.5 h-3.5 text-[#059669]" />
              </div>
              <div className="space-y-1 text-[11px] text-[#333]">
                <div className="flex justify-between">
                  <span>Trending:</span>
                  <span className="font-bold">{config.atrStopMultiplier.trending}× ATR</span>
                </div>
                <div className="flex justify-between">
                  <span>Ranging:</span>
                  <span className="font-bold">{config.atrStopMultiplier.ranging}× ATR</span>
                </div>
                <div className="flex justify-between">
                  <span>Extension:</span>
                  <span className="font-bold">{config.atrStopMultiplier.extension}× ATR</span>
                </div>
              </div>
            </div>

            {/* ATR Target Multipliers */}
            <div className="bg-[#F9F8F6] border border-[#DDD] p-4 space-y-2">
              <div className="flex items-center justify-between border-b border-[#EAE7E2] pb-1.5">
                <span className="font-bold text-[#1A1A1A] uppercase text-[10px]">ATR Target Multipliers</span>
                <Target className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div className="space-y-1 text-[11px] text-[#333]">
                <div className="flex justify-between">
                  <span>Trending:</span>
                  <span className="font-bold">{config.atrTargetMultiplier.trending}× ATR</span>
                </div>
                <div className="flex justify-between">
                  <span>Ranging:</span>
                  <span className="font-bold">{config.atrTargetMultiplier.ranging}× ATR</span>
                </div>
                <div className="flex justify-between">
                  <span>Extension:</span>
                  <span className="font-bold">{config.atrTargetMultiplier.extension}× ATR</span>
                </div>
              </div>
            </div>

            {/* Signal & Filter Thresholds */}
            <div className="bg-[#F9F8F6] border border-[#DDD] p-4 space-y-2">
              <div className="flex items-center justify-between border-b border-[#EAE7E2] pb-1.5">
                <span className="font-bold text-[#1A1A1A] uppercase text-[10px]">Signal & Filter Limits</span>
                <Zap className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <div className="space-y-1 text-[11px] text-[#333]">
                <div className="flex justify-between">
                  <span>Min Confidence:</span>
                  <span className="font-bold">{Math.round(config.minConfidence * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Extension Fade Factor:</span>
                  <span className="font-bold">{config.extensionFadeFactor}</span>
                </div>
                <div className="flex justify-between">
                  <span>ADX Trend Min:</span>
                  <span className="font-bold">{config.adxTrendThreshold}</span>
                </div>
              </div>
            </div>

            {/* RSI Thresholds */}
            <div className="bg-[#F9F8F6] border border-[#DDD] p-4 space-y-2">
              <div className="flex items-center justify-between border-b border-[#EAE7E2] pb-1.5">
                <span className="font-bold text-[#1A1A1A] uppercase text-[10px]">RSI Overbought/Oversold</span>
                <Activity className="w-3.5 h-3.5 text-purple-500" />
              </div>
              <div className="space-y-1 text-[11px] text-[#333]">
                <div className="flex justify-between">
                  <span>RSI Overbought:</span>
                  <span className="font-bold">{config.rsiOverbought}</span>
                </div>
                <div className="flex justify-between">
                  <span>RSI Oversold:</span>
                  <span className="font-bold">{config.rsiOversold}</span>
                </div>
              </div>
            </div>

            {/* Pattern Lookbacks */}
            <div className="bg-[#F9F8F6] border border-[#DDD] p-4 space-y-2 md:col-span-2 lg:col-span-2">
              <div className="flex items-center justify-between border-b border-[#EAE7E2] pb-1.5">
                <span className="font-bold text-[#1A1A1A] uppercase text-[10px]">Pattern Engine Lookbacks (Bars)</span>
                <Clock className="w-3.5 h-3.5 text-[#666]" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-[#333]">
                <div>
                  <span className="text-[#666] block text-[9px]">Bull/Bear Flag:</span>
                  <span className="font-bold">{config.patternLookback.flag} bars</span>
                </div>
                <div>
                  <span className="text-[#666] block text-[9px]">Double Top/Bot:</span>
                  <span className="font-bold">{config.patternLookback.doubleTop} bars</span>
                </div>
                <div>
                  <span className="text-[#666] block text-[9px]">Break of Struct:</span>
                  <span className="font-bold">{config.patternLookback.bos} bars</span>
                </div>
                <div>
                  <span className="text-[#666] block text-[9px]">Fair Value Gap:</span>
                  <span className="font-bold">{config.patternLookback.fvg} bars</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Sampling Audit Log */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <p className="text-xs text-[#666]">
            Audit history of AI Auto-Calibration runs performed during live operations or manual requests.
          </p>

          {calibrationHistory.length > 0 ? (
            <div className="border border-[#DDD] overflow-x-auto font-mono text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#EFECE8] border-b border-[#DDD] text-[10px] uppercase text-[#666]">
                  <tr>
                    <th className="p-3">Time</th>
                    <th className="p-3">TF</th>
                    <th className="p-3">Profit Factor</th>
                    <th className="p-3">Win Rate</th>
                    <th className="p-3">Drawdown</th>
                    <th className="p-3">Bars</th>
                    <th className="p-3">AI Diagnosis Summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE7E2]">
                  {calibrationHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-[#F9F8F6]">
                      <td className="p-3 text-[#1A1A1A] font-bold whitespace-nowrap">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="p-3 uppercase text-[#666]">{item.timeframe}</td>
                      <td className="p-3 font-bold text-[#059669]">
                        {item.calibratedMetrics.profitFactor} ({item.improvements.profitFactorDelta >= 0 ? '+' : ''}{item.improvements.profitFactorDelta})
                      </td>
                      <td className="p-3 font-bold">
                        {item.calibratedMetrics.winRate}% ({item.improvements.winRateDelta >= 0 ? '+' : ''}{item.improvements.winRateDelta}%)
                      </td>
                      <td className="p-3 text-[#666]">{item.calibratedMetrics.maxDrawdownPercent}%</td>
                      <td className="p-3 text-[#888]">{item.sampledBarsCount}</td>
                      <td className="p-3 text-[#444] font-sans truncate max-w-xs">{item.aiDiagnosis}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-[#F9F8F6] border border-[#DDD] p-6 text-center text-xs text-[#666] font-mono">
              No historical sampling logs accumulated in current session.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
