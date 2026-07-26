import React, { useEffect, useState } from 'react';
import {
  AiCalibrationResult,
  BacktestResult,
  Candle,
  ChartImageInput,
  EngineConfig,
  ImageAnalysisResult,
  IndicatorValues,
  MarketRegime,
  NewsSentimentAnalysis,
  PriceAlert,
  Timeframe,
  TradeSignal,
} from './types';

import { BacktestDashboard } from './components/BacktestDashboard';
import { CalibrationPanel } from './components/CalibrationPanel';
import { Header } from './components/Header';
import { LiveChart } from './components/LiveChart';
import { MultiImageAnalyzer } from './components/MultiImageAnalyzer';
import { NewsSentimentSection } from './components/NewsSentimentSection';
import { PriceAlertSection } from './components/PriceAlertSection';
import { RegimeGauge } from './components/RegimeGauge';
import { SignalCard } from './components/SignalCard';

import { playAlertSound } from './lib/sound';
import { Activity, ArrowDownRight, ArrowUpRight, Zap } from 'lucide-react';

export default function App() {
  const [timeframe, setTimeframe] = useState<Timeframe>('15m');
  const [activeTab, setActiveTab] = useState<'terminal' | 'backtest' | 'vision' | 'calibration' | 'sentiment' | 'alerts'>('terminal');

  const [candles, setCandles] = useState<Candle[]>([]);
  const [indicators, setIndicators] = useState<IndicatorValues[]>([]);
  const [regime, setRegime] = useState<MarketRegime>('RANGING');
  const [latestSignal, setLatestSignal] = useState<TradeSignal | null>(null);
  const [multiTimeframeSignals, setMultiTimeframeSignals] = useState<Record<string, TradeSignal | null>>({});
  const [currentPrice, setCurrentPrice] = useState<number>(2742.5);

  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [backtestLoading, setBacktestLoading] = useState<boolean>(false);

  const [engineConfig, setEngineConfig] = useState<EngineConfig | null>(null);
  const [calibrating, setCalibrating] = useState<boolean>(false);
  const [aiCalibrationResult, setAiCalibrationResult] = useState<AiCalibrationResult | null>(null);
  const [aiCalibrationHistory, setAiCalibrationHistory] = useState<AiCalibrationResult[]>([]);
  const [autoSamplingEnabled, setAutoSamplingEnabled] = useState<boolean>(true);

  const [newsSentiment, setNewsSentiment] = useState<NewsSentimentAnalysis | null>(null);
  const [newsSentimentLoading, setNewsSentimentLoading] = useState<boolean>(false);

  // Price Alerts State
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aurum_price_alerts');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return [
      {
        id: 'alert-1',
        targetPrice: 2750.0,
        condition: 'CROSSES_ABOVE',
        label: 'High-Yield Resistance Breakout Level',
        note: '4H Liquidity Order Block cluster',
        createdAt: Date.now() - 3600000,
        triggered: false,
        isHighYield: true,
        soundEnabled: true,
        timeframe: '15m',
      },
      {
        id: 'alert-2',
        targetPrice: 2735.0,
        condition: 'CROSSES_BELOW',
        label: 'Order Block Support Safeguard',
        note: 'Key invalidation stop loss level',
        createdAt: Date.now() - 3600000,
        triggered: false,
        isHighYield: true,
        soundEnabled: true,
        timeframe: '15m',
      },
      {
        id: 'alert-3',
        targetPrice: 2755.0,
        condition: 'TAKE_PROFIT',
        label: 'Take Profit Target 2 Extension',
        note: 'Secondary Fibonacci expansion target',
        createdAt: Date.now() - 1800000,
        triggered: false,
        isHighYield: true,
        soundEnabled: true,
        timeframe: '15m',
      },
    ];
  });

  // Save Price Alerts to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('aurum_price_alerts', JSON.stringify(alerts));
    }
  }, [alerts]);

  // Real-time price alert evaluator
  useEffect(() => {
    if (currentPrice <= 0) return;

    setAlerts((prevAlerts) => {
      let updated = false;
      const nextAlerts = prevAlerts.map((alert) => {
        if (alert.triggered) return alert;

        let isHit = false;
        if (alert.condition === 'CROSSES_ABOVE' && currentPrice >= alert.targetPrice) {
          isHit = true;
        } else if (alert.condition === 'CROSSES_BELOW' && currentPrice <= alert.targetPrice) {
          isHit = true;
        } else if (
          (alert.condition === 'ENTRY_POINT' || alert.condition === 'TAKE_PROFIT' || alert.condition === 'STOP_LOSS') &&
          Math.abs(currentPrice - alert.targetPrice) <= 0.8
        ) {
          isHit = true;
        }

        if (isHit) {
          updated = true;
          if (alert.soundEnabled) {
            playAlertSound(alert.isHighYield ? 'HIGH_YIELD' : 'ALERT');
          }
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(`Gold Price Alert: ${alert.label}`, {
              body: `XAUUSD Gold price hit $${(currentPrice || 0).toFixed(2)} (Target $${(alert.targetPrice || 0).toFixed(2)})!`,
              icon: '/favicon.ico',
            });
          }
          return {
            ...alert,
            triggered: true,
            triggeredAt: Date.now(),
            triggeredPrice: currentPrice,
          };
        }
        return alert;
      });

      return updated ? nextAlerts : prevAlerts;
    });
  }, [currentPrice]);

  const handleAddAlert = (newAlert: Omit<PriceAlert, 'id' | 'createdAt' | 'triggered'>) => {
    const alert: PriceAlert = {
      ...newAlert,
      id: 'alert-' + Date.now(),
      createdAt: Date.now(),
      triggered: false,
    };
    setAlerts((prev) => [alert, ...prev]);
  };

  const handleDeleteAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleClearTriggeredAlerts = () => {
    setAlerts((prev) => prev.filter((a) => !a.triggered));
  };

  // Fetch Live OHLCV & Signals

  const loadData = async (tf: Timeframe) => {
    try {
      const res = await fetch(`/api/signals?timeframe=${tf}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentPrice(data.currentPrice || 2742.5);
        setRegime(data.regime || 'RANGING');
        setLatestSignal(data.latestSignal || null);
        setMultiTimeframeSignals(data.multiTimeframeSignals || {});
      }

      const ohlcvRes = await fetch(`/api/ohlcv?timeframe=${tf}`);
      if (ohlcvRes.ok) {
        const ohlcvData = await ohlcvRes.json();
        setCandles(ohlcvData.candles || []);
        setIndicators(ohlcvData.indicators || []);
      }
    } catch (err) {
      console.error('Failed to load chart/signal data:', err);
    }
  };

  // Fetch Backtest Results
  const loadBacktest = async (tf: Timeframe) => {
    setBacktestLoading(true);
    try {
      const res = await fetch(`/api/backtest?timeframe=${tf}`);
      if (res.ok) {
        const data = await res.json();
        setBacktestResult(data);
      }
    } catch (err) {
      console.error('Failed to load backtest:', err);
    } finally {
      setBacktestLoading(false);
    }
  };

  // Fetch Engine Config & AI Calibration Status
  const loadConfig = async () => {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        setEngineConfig(data);
      }
    } catch (err) {
      console.error('Failed to load config:', err);
    }
  };

  const loadAiCalibrationStatus = async () => {
    try {
      const res = await fetch('/api/ai-calibrate');
      if (res.ok) {
        const data = await res.json();
        setAiCalibrationHistory(data.history || []);
        if (data.lastResult) setAiCalibrationResult(data.lastResult);
        if (data.autoStatus) setAutoSamplingEnabled(data.autoStatus.enabled);
        if (data.currentConfig) setEngineConfig(data.currentConfig);
      }
    } catch (err) {
      console.error('Failed to load AI calibration status:', err);
    }
  };

  const loadNewsSentiment = async (tf: Timeframe = timeframe) => {
    setNewsSentimentLoading(true);
    try {
      const res = await fetch(`/api/news-sentiment?timeframe=${tf}`);
      if (res.ok) {
        const data = await res.json();
        setNewsSentiment(data);
      }
    } catch (err) {
      console.error('Failed to load news sentiment:', err);
    } finally {
      setNewsSentimentLoading(false);
    }
  };

  useEffect(() => {
    loadData(timeframe);
    loadConfig();
    loadAiCalibrationStatus();
    loadNewsSentiment(timeframe);
  }, [timeframe]);

  useEffect(() => {
    if (activeTab === 'backtest' && !backtestResult) {
      loadBacktest(timeframe);
    }
    if (activeTab === 'sentiment' && !newsSentiment) {
      loadNewsSentiment(timeframe);
    }
  }, [activeTab, timeframe]);

  // Polling interval for live data (every 30s)
  useEffect(() => {
    const interval = setInterval(() => {
      loadData(timeframe);
    }, 30000);
    return () => clearInterval(interval);
  }, [timeframe]);

  const handleTimeframeChange = (tf: Timeframe) => {
    setTimeframe(tf);
    loadData(tf);
    if (activeTab === 'backtest') {
      loadBacktest(tf);
    }
    if (activeTab === 'sentiment') {
      loadNewsSentiment(tf);
    }
  };

  const handleRunCalibration = async () => {
    setCalibrating(true);
    try {
      const res = await fetch('/api/ai-calibrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeframe }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.result) {
          setAiCalibrationResult(data.result);
          setEngineConfig(data.result.optimizedConfig);
        }
        if (data.history) setAiCalibrationHistory(data.history);
        loadData(timeframe);
        loadBacktest(timeframe);
      }
    } catch (err) {
      console.error('Calibration failed:', err);
    } finally {
      setCalibrating(false);
    }
  };

  const handleToggleAutoSampling = async (enabled: boolean) => {
    try {
      const res = await fetch('/api/ai-calibrate/toggle-auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      if (res.ok) {
        const data = await res.json();
        setAutoSamplingEnabled(data.enabled);
      }
    } catch (err) {
      console.error('Failed to toggle auto sampling:', err);
    }
  };

  const handleAnalyzeImages = async (images: ChartImageInput[]): Promise<ImageAnalysisResult> => {
    const res = await fetch('/api/analyze-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images, timeframe }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to analyze chart images');
    }

    return await res.json();
  };

  const handleUpdateConfig = async (newCfg: EngineConfig) => {
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCfg),
      });
      if (res.ok) {
        const data = await res.json();
        setEngineConfig(data);
        loadData(timeframe);
      }
    } catch (err) {
      console.error('Failed to update config:', err);
    }
  };

  const hasTriggeredAlerts = alerts.some((a) => a.triggered);
  const activeAlertsCount = alerts.filter((a) => !a.triggered).length;

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#1A1A1A] font-sans antialiased pb-12">
      {/* Top Bar Header */}
      <Header
        currentPrice={currentPrice}
        priceChange={0.42}
        regime={regime}
        timeframe={timeframe}
        onTimeframeChange={handleTimeframeChange}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        calibrationWarning={backtestResult?.calibrationWarning}
        hasTriggeredAlerts={hasTriggeredAlerts}
        activeAlertsCount={activeAlertsCount}
      />


      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Multi-Timeframe Matrix Snapshot */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {(['5m', '15m', '1h', '4h'] as Timeframe[]).map((tf) => {
            const sig = multiTimeframeSignals[tf];
            const isBuy = sig?.direction === 'BUY';
            const isSell = sig?.direction === 'SELL';

            return (
              <button
                key={tf}
                onClick={() => handleTimeframeChange(tf)}
                className={`p-3 border text-left transition-all cursor-pointer ${
                  timeframe === tf
                    ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                    : 'bg-white text-[#1A1A1A] border-[#DDD] hover:border-[#1A1A1A]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] uppercase tracking-widest font-mono font-bold ${
                    timeframe === tf ? 'text-[#DDD]' : 'text-[#666]'
                  }`}>{tf} Timeframe</span>
                  {sig ? (
                    <span className={`px-1.5 py-0.5 text-[9px] font-bold font-mono ${
                      isBuy ? 'bg-[#059669] text-white' : 'bg-[#DC2626] text-white'
                    }`}>
                      {sig.direction} ({sig.confidenceScore}%)
                    </span>
                  ) : (
                    <span className={`text-[9px] font-mono ${timeframe === tf ? 'text-[#AAA]' : 'text-[#999]'}`}>MONITORING</span>
                  )}
                </div>

                <div className="mt-2 flex items-center justify-between font-mono">
                  <span className="text-xs font-bold">
                    {sig && typeof sig.entryPrice === 'number' ? `$${sig.entryPrice.toFixed(2)}` : 'No Signal'}
                  </span>
                  {sig && (
                    <span className={`text-[10px] ${timeframe === tf ? 'text-amber-400' : 'text-[#1A1A1A]'}`}>
                      ~{sig.estimatedPips} pips
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Terminal */}
        {activeTab === 'terminal' && (
          <div className="space-y-6">
            {/* Quick Macro Sentiment Teaser Banner */}
            {newsSentiment && (
              <div className="bg-[#F9F8F6] border border-[#1A1A1A] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-[#1A1A1A] text-white text-[10px] uppercase font-bold tracking-widest">
                    Macro Pulse
                  </span>
                  <span className="font-bold text-[#1A1A1A]">
                    Gold Sentiment: {newsSentiment.overallBias} ({newsSentiment.overallSentimentScore > 0 ? `+${newsSentiment.overallSentimentScore}` : newsSentiment.overallSentimentScore})
                  </span>
                  <span className="text-[#666] hidden md:inline truncate max-w-md font-sans text-[11px]">
                    — {newsSentiment.aiMacroSummary}
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab('sentiment')}
                  className="text-[10px] uppercase font-bold underline decoration-amber-500 underline-offset-4 text-[#1A1A1A] hover:text-amber-600 transition shrink-0 cursor-pointer"
                >
                  View Full News Feed →
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <LiveChart
                  candles={candles}
                  indicators={indicators}
                  signal={latestSignal}
                />
              </div>

              <div className="space-y-6">
                <SignalCard signal={latestSignal} currentPrice={currentPrice} />
                <RegimeGauge
                  regime={regime}
                  indicators={indicators.length > 0 ? indicators[indicators.length - 1] : undefined}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Walk-Forward Backtest */}
        {activeTab === 'backtest' && (
          <BacktestDashboard
            result={backtestResult}
            loading={backtestLoading || calibrating}
            onRunCalibration={handleRunCalibration}
            onSelectTimeframe={handleTimeframeChange}
          />
        )}

        {/* Tab 3: AI Vision Multi-Chart Analyzer */}
        {activeTab === 'vision' && (
          <MultiImageAnalyzer onAnalyzeImages={handleAnalyzeImages} />
        )}

        {/* Tab 4: Engine Config & Calibration */}
        {activeTab === 'calibration' && engineConfig && (
          <CalibrationPanel
            config={engineConfig}
            timeframe={timeframe}
            onUpdateConfig={handleUpdateConfig}
            onRunAiCalibration={handleRunCalibration}
            loading={calibrating}
            calibrationResult={aiCalibrationResult}
            calibrationHistory={aiCalibrationHistory}
            autoSamplingEnabled={autoSamplingEnabled}
            onToggleAutoSampling={handleToggleAutoSampling}
          />
        )}

        {/* Tab 5: Macro News & Sentiment Analysis */}
        {activeTab === 'sentiment' && (
          <NewsSentimentSection
            sentimentData={newsSentiment}
            loading={newsSentimentLoading}
            onRefresh={() => loadNewsSentiment(timeframe)}
            timeframe={timeframe}
            currentPrice={currentPrice}
          />
        )}

        {/* Tab 6: High-Yield Price Alerts */}
        {activeTab === 'alerts' && (
          <PriceAlertSection
            currentPrice={currentPrice}
            alerts={alerts}
            onAddAlert={handleAddAlert}
            onDeleteAlert={handleDeleteAlert}
            onClearTriggeredAlerts={handleClearTriggeredAlerts}
            activeSignal={latestSignal}
            timeframe={timeframe}
          />
        )}
      </main>
    </div>
  );
}

