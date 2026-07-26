import React, { useState } from 'react';
import {
  Bell,
  BellRing,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  VolumeX,
  Target,
  Zap,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Info,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Radio,
  Sparkles,
} from 'lucide-react';
import { AlertCondition, PriceAlert, Timeframe, TradeSignal } from '../types';
import { playAlertSound } from '../lib/sound';

interface PriceAlertSectionProps {
  currentPrice: number;
  alerts: PriceAlert[];
  onAddAlert: (alert: Omit<PriceAlert, 'id' | 'createdAt' | 'triggered'>) => void;
  onDeleteAlert: (id: string) => void;
  onClearTriggeredAlerts: () => void;
  activeSignal: TradeSignal | null;
  timeframe: Timeframe;
}

export const PriceAlertSection: React.FC<PriceAlertSectionProps> = ({
  currentPrice,
  alerts,
  onAddAlert,
  onDeleteAlert,
  onClearTriggeredAlerts,
  activeSignal,
  timeframe,
}) => {
  const [targetPrice, setTargetPrice] = useState<string>(
    currentPrice > 0 ? (currentPrice + 5).toFixed(2) : '2747.50'
  );
  const [condition, setCondition] = useState<AlertCondition>('CROSSES_ABOVE');
  const [label, setLabel] = useState<string>('Custom Price Target');
  const [note, setNote] = useState<string>('');
  const [isHighYield, setIsHighYield] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [notificationPermission, setNotificationPermission] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  const activeAlerts = alerts.filter((a) => !a.triggered);
  const triggeredAlerts = alerts.filter((a) => a.triggered);

  const requestBrowserNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === 'granted') {
        new Notification('Aurum Quant Price Alerts Enabled', {
          body: 'You will receive desktop browser alerts when Gold (XAUUSD) hits your target levels.',
          icon: '/favicon.ico',
        });
      }
    }
  };

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(targetPrice);
    if (isNaN(priceNum) || priceNum <= 0) return;

    onAddAlert({
      targetPrice: priceNum,
      condition,
      label: label.trim() || `Target $${priceNum.toFixed(2)}`,
      note: note.trim(),
      isHighYield,
      soundEnabled,
      timeframe,
    });

    // Reset fields slightly above or below current
    setNote('');
  };

  const handleTestSound = () => {
    playAlertSound('HIGH_YIELD');
  };

  // Quick preset helper
  const addQuickPreset = (price: number, presetCondition: AlertCondition, presetLabel: string, highYield = true) => {
    onAddAlert({
      targetPrice: price,
      condition: presetCondition,
      label: presetLabel,
      note: `Auto-preset from active ${timeframe} ${activeSignal?.type || 'Quant'} trade setup`,
      isHighYield: highYield,
      soundEnabled: true,
      timeframe,
    });
  };

  return (
    <div className="bg-white border border-[#1A1A1A] p-6 my-6 space-y-6 font-sans">
      {/* Top Banner & Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#DDD] pb-5 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-[#1A1A1A] text-white text-[10px] uppercase font-mono font-bold tracking-widest flex items-center gap-1">
              <BellRing className="w-3 h-3 text-amber-400" />
              High-Yield Trade Point Price Alerts
            </span>

            {/* Red Dot Badge if triggered alerts exist */}
            {triggeredAlerts.length > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-rose-100 border border-rose-300 text-rose-800 text-[10px] font-mono font-bold">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                {triggeredAlerts.length} Price Alert{triggeredAlerts.length > 1 ? 's' : ''} Triggered!
              </span>
            )}
          </div>
          <p className="text-xs text-[#666] max-w-2xl">
            Monitor real-time XAUUSD spot price movements against key quantitative trade entry points, liquidity take-profit zones, and stop-loss levels with browser notifications and Web Audio chimes.
          </p>
        </div>

        {/* Audio Test & Notification Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleTestSound}
            className="px-3 py-1.5 bg-[#EFECE8] border border-[#DDD] hover:bg-[#DDD] text-xs font-mono font-bold text-[#1A1A1A] flex items-center gap-1.5 cursor-pointer transition"
            title="Test Web Audio Synthesizer Chime"
          >
            <Volume2 className="w-3.5 h-3.5 text-amber-600" />
            <span>Test Sound</span>
          </button>

          {notificationPermission !== 'granted' && (
            <button
              onClick={requestBrowserNotificationPermission}
              className="px-3 py-1.5 bg-amber-500 text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-amber-400 cursor-pointer transition flex items-center gap-1.5 shadow-sm"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Enable Browser Alerts</span>
            </button>
          )}
        </div>
      </div>

      {/* Triggered Alerts Alert Box (If Any Triggered) */}
      {triggeredAlerts.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-600 p-4 space-y-3 font-mono">
          <div className="flex items-center justify-between border-b border-rose-200 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-600 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-rose-900 flex items-center gap-1">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                Triggered High-Yield Price Alerts ({triggeredAlerts.length})
              </span>
            </div>
            <button
              onClick={onClearTriggeredAlerts}
              className="text-[10px] uppercase font-bold text-rose-800 hover:text-rose-900 underline underline-offset-2 cursor-pointer"
            >
              Acknowledge & Clear All
            </button>
          </div>

          <div className="space-y-2">
            {triggeredAlerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-white border border-rose-300 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 font-bold text-[#1A1A1A]">
                    <span className="px-1.5 py-0.5 bg-rose-600 text-white text-[9px] uppercase">
                      {alert.condition.replace('_', ' ')}
                    </span>
                    <span>{alert.label}</span>
                    <span className="text-rose-700 font-mono text-sm">${(alert.targetPrice || 0).toFixed(2)}</span>
                  </div>
                  {alert.note && <p className="text-[11px] text-[#666] font-sans mt-0.5">{alert.note}</p>}
                </div>

                <div className="text-right text-[10px] text-[#666] shrink-0 font-mono">
                  <div>Hit at ${alert.triggeredPrice ? alert.triggeredPrice.toFixed(2) : (currentPrice || 0).toFixed(2)}</div>
                  <div>{alert.triggeredAt ? new Date(alert.triggeredAt).toLocaleTimeString() : 'Just now'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* One-Click High-Yield Preset Bar from Active Quant Signal */}
      {activeSignal && (
        <div className="bg-[#F9F8F6] border border-[#DDD] p-4 space-y-3 font-sans">
          <div className="flex items-center justify-between border-b border-[#EAE7E2] pb-2">
            <span className="text-xs font-bold uppercase font-mono tracking-wider text-[#1A1A1A] flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Active {timeframe} Signal High-Yield Trade Point Presets
            </span>
            <span className="text-[10px] font-mono bg-white border border-[#DDD] px-2 py-0.5 text-[#1A1A1A]">
              {activeSignal.direction} {activeSignal.regime} @ ${(activeSignal.entryPrice || 0).toFixed(2)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
            {/* Entry Price Preset */}
            <button
              onClick={() =>
                addQuickPreset(
                  activeSignal.entryPrice,
                  activeSignal.direction === 'BUY' ? 'CROSSES_BELOW' : 'CROSSES_ABOVE',
                  `High-Yield Entry (${activeSignal.direction})`,
                  true
                )
              }
              className="bg-white border border-[#DDD] hover:border-[#1A1A1A] p-3 text-left space-y-1 transition cursor-pointer group"
            >
              <div className="flex justify-between items-center text-[10px] text-[#666] font-bold uppercase">
                <span>Entry Level</span>
                <Target className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
              </div>
              <p className="text-sm font-bold text-[#1A1A1A]">${(activeSignal.entryPrice || 0).toFixed(2)}</p>
              <span className="text-[9px] text-blue-700 font-sans block">+ Add Entry Alert</span>
            </button>

            {/* Take Profit 1 Preset */}
            <button
              onClick={() =>
                addQuickPreset(
                  activeSignal.takeProfit1,
                  activeSignal.direction === 'BUY' ? 'CROSSES_ABOVE' : 'CROSSES_BELOW',
                  `Take Profit 1 Target (${activeSignal.direction})`,
                  true
                )
              }
              className="bg-white border border-[#DDD] hover:border-[#1A1A1A] p-3 text-left space-y-1 transition cursor-pointer group"
            >
              <div className="flex justify-between items-center text-[10px] text-[#666] font-bold uppercase">
                <span>Take Profit 1</span>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
              </div>
              <p className="text-sm font-bold text-emerald-700">${(activeSignal.takeProfit1 || 0).toFixed(2)}</p>
              <span className="text-[9px] text-emerald-800 font-sans block">+ Add TP1 Target Alert</span>
            </button>

            {/* Take Profit 2 Preset (+1.5x) */}
            <button
              onClick={() => {
                const tp2 = activeSignal.takeProfit2 || activeSignal.takeProfit1;
                addQuickPreset(
                  Number(tp2.toFixed(2)),
                  activeSignal.direction === 'BUY' ? 'CROSSES_ABOVE' : 'CROSSES_BELOW',
                  `Take Profit 2 Extension (${activeSignal.direction})`,
                  true
                );
              }}
              className="bg-white border border-[#DDD] hover:border-[#1A1A1A] p-3 text-left space-y-1 transition cursor-pointer group"
            >
              <div className="flex justify-between items-center text-[10px] text-[#666] font-bold uppercase">
                <span>Take Profit 2</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
              </div>
              <p className="text-sm font-bold text-amber-600">
                ${(activeSignal.takeProfit2 || activeSignal.takeProfit1 || 0).toFixed(2)}
              </p>
              <span className="text-[9px] text-amber-800 font-sans block">+ Add TP2 Extension Alert</span>
            </button>

            {/* Stop Loss Preset */}
            <button
              onClick={() =>
                addQuickPreset(
                  activeSignal.stopLoss,
                  activeSignal.direction === 'BUY' ? 'CROSSES_BELOW' : 'CROSSES_ABOVE',
                  `Stop Loss Safeguard (${activeSignal.direction})`,
                  false
                )
              }
              className="bg-white border border-[#DDD] hover:border-[#1A1A1A] p-3 text-left space-y-1 transition cursor-pointer group"
            >
              <div className="flex justify-between items-center text-[10px] text-[#666] font-bold uppercase">
                <span>Stop Loss</span>
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600 group-hover:scale-110 transition-transform" />
              </div>
              <p className="text-sm font-bold text-rose-700">${(activeSignal.stopLoss || 0).toFixed(2)}</p>
              <span className="text-[9px] text-rose-800 font-sans block">+ Add Stop Loss Alert</span>
            </button>
          </div>
        </div>
      )}

      {/* Manual Price Alert Form & Active List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Add Alert Form (5 Cols) */}
        <div className="lg:col-span-5 bg-[#F9F8F6] border border-[#DDD] p-5 space-y-4">
          <div className="border-b border-[#EAE7E2] pb-2">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#1A1A1A] flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-[#1A1A1A]" />
              Set Custom Price Alert
            </h3>
            <p className="text-[11px] text-[#666]">
              Current Gold Price: <strong className="font-mono text-[#1A1A1A]">${currentPrice.toFixed(2)}</strong>
            </p>
          </div>

          <form onSubmit={handleCreateAlert} className="space-y-3 font-mono text-xs">
            {/* Target Price */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#666] mb-1">Target Price (USD/oz)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.10"
                  required
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  className="w-full bg-white border border-[#DDD] px-3 py-1.5 text-sm font-bold text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
                />
                {/* Quick Delta Offset Buttons */}
                <button
                  type="button"
                  onClick={() => setTargetPrice((currentPrice + 5).toFixed(2))}
                  className="px-2 py-1 bg-white border border-[#DDD] text-[10px] hover:bg-[#EFECE8]"
                >
                  +$5
                </button>
                <button
                  type="button"
                  onClick={() => setTargetPrice((currentPrice - 5).toFixed(2))}
                  className="px-2 py-1 bg-white border border-[#DDD] text-[10px] hover:bg-[#EFECE8]"
                >
                  -$5
                </button>
              </div>
            </div>

            {/* Condition Select */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#666] mb-1">Trigger Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as AlertCondition)}
                className="w-full bg-white border border-[#DDD] px-3 py-1.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
              >
                <option value="CROSSES_ABOVE">📈 Crosses Above Target Price</option>
                <option value="CROSSES_BELOW">📉 Crosses Below Target Price</option>
                <option value="ENTRY_POINT">🎯 High-Yield Entry Point Hit</option>
                <option value="TAKE_PROFIT">💰 Take Profit Level Reached</option>
                <option value="STOP_LOSS">🛡️ Stop Loss Safeguard Reached</option>
              </select>
            </div>

            {/* Label */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#666] mb-1">Alert Label</label>
              <input
                type="text"
                placeholder="e.g. Resistance Breakout $2750"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full bg-white border border-[#DDD] px-3 py-1.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] font-sans"
              />
            </div>

            {/* Note */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#666] mb-1">Trade Strategy Note</label>
              <input
                type="text"
                placeholder="e.g. Order block liquidity sweep"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-white border border-[#DDD] px-3 py-1.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] font-sans"
              />
            </div>

            {/* Checkboxes */}
            <div className="flex items-center gap-4 pt-1 font-sans text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isHighYield}
                  onChange={(e) => setIsHighYield(e.target.checked)}
                  className="rounded-none border-[#DDD] text-[#1A1A1A]"
                />
                <span className="text-[11px] font-bold">Mark as High-Yield Point</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="rounded-none border-[#DDD] text-[#1A1A1A]"
                />
                <span className="text-[11px]">Audio Chime</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-[#1A1A1A] text-white font-sans text-xs font-bold uppercase tracking-widest hover:bg-black transition cursor-pointer flex items-center justify-center gap-2 mt-2 shadow-sm"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>Create Price Alert</span>
            </button>
          </form>
        </div>

        {/* Active Alerts List (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex justify-between items-center border-b border-[#DDD] pb-2">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#1A1A1A] flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-[#1A1A1A]" />
              Active Price Target Watchlist ({activeAlerts.length})
            </h3>
            <span className="text-[10px] font-mono text-[#666]">Evaluating live price ticks continuous</span>
          </div>

          {activeAlerts.length > 0 ? (
            <div className="space-y-3 font-mono">
              {activeAlerts.map((alert) => {
                const cp = currentPrice || 2742.50;
                const distance = (alert.targetPrice || 0) - cp;
                const distancePct = cp > 0 ? ((distance / cp) * 100).toFixed(2) : '0.00';
                const isNear = Math.abs(distance) <= 3.0;

                return (
                  <div
                    key={alert.id}
                    className={`p-3.5 border transition space-y-2 ${
                      alert.isHighYield
                        ? 'bg-[#FFFDF9] border-amber-400 shadow-sm'
                        : 'bg-white border-[#DDD] hover:border-[#1A1A1A]'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F0ECE6] pb-2">
                      <div className="flex items-center gap-2">
                        {/* High Yield Tag */}
                        {alert.isHighYield && (
                          <span className="px-1.5 py-0.5 bg-amber-500 text-black text-[9px] font-bold uppercase tracking-widest flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" /> High-Yield Target
                          </span>
                        )}

                        <span className="text-xs font-bold text-[#1A1A1A] font-sans">{alert.label}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Distance Indicator */}
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 border ${
                            isNear
                              ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                              : 'bg-[#EFECE8] text-[#666] border-[#DDD]'
                          }`}
                        >
                          {distance > 0 ? `+$${distance.toFixed(2)}` : `-$${Math.abs(distance).toFixed(2)}`} (
                          {distancePct}%)
                        </span>

                        {/* Delete Button */}
                        <button
                          onClick={() => onDeleteAlert(alert.id)}
                          className="text-[#888] hover:text-rose-600 transition cursor-pointer"
                          title="Delete Alert"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-[#666]">
                          {alert.condition.replace('_', ' ')}
                        </span>
                        <span className="text-base font-bold text-[#1A1A1A] font-mono">
                          ${alert.targetPrice.toFixed(2)}
                        </span>
                      </div>

                      <div className="text-[10px] text-[#888] font-mono flex items-center gap-2">
                        <span>Created {new Date(alert.createdAt).toLocaleTimeString()}</span>
                        {alert.soundEnabled && <Volume2 className="w-3 h-3 text-[#666]" />}
                      </div>
                    </div>

                    {alert.note && (
                      <p className="text-[11px] text-[#555] font-sans border-t border-[#F0ECE6] pt-1.5 italic">
                        "{alert.note}"
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-[#F9F8F6] border border-[#DDD] p-8 text-center text-xs text-[#666] font-mono space-y-2">
              <Bell className="w-6 h-6 text-[#888] mx-auto opacity-50" />
              <p className="font-bold text-[#1A1A1A]">No Active Price Alerts</p>
              <p className="text-[11px] text-[#666] font-sans max-w-sm mx-auto">
                Set custom price target alerts or click any high-yield signal preset button above to track key Gold entry, take profit, and stop loss points.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
