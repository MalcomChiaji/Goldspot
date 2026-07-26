import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, CandlestickSeries, LineSeries } from 'lightweight-charts';
import { Candle, IndicatorValues, TradeSignal } from '../types';

interface LiveChartProps {
  candles: Candle[];
  indicators?: IndicatorValues[];
  signal?: TradeSignal | null;
}

export const LiveChart: React.FC<LiveChartProps> = ({ candles, indicators = [], signal }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current || candles.length === 0) return;

    // Clean up previous chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#FFFFFF' },
        textColor: '#1A1A1A',
      },
      grid: {
        vertLines: { color: '#EEEEEE' },
        horzLines: { color: '#EEEEEE' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#DDDDDD',
      },
      timeScale: {
        borderColor: '#DDDDDD',
        timeVisible: true,
        secondsVisible: false,
      },
      width: containerRef.current.clientWidth,
      height: 480,
    });

    chartRef.current = chart;

    // Add Candlestick Series
    const candleSeries = (chart as any).addCandlestickSeries
      ? (chart as any).addCandlestickSeries({
          upColor: '#059669',
          downColor: '#DC2626',
          borderVisible: false,
          wickUpColor: '#059669',
          wickDownColor: '#DC2626',
        })
      : chart.addSeries(CandlestickSeries, {
          upColor: '#059669',
          downColor: '#DC2626',
          borderVisible: false,
          wickUpColor: '#059669',
          wickDownColor: '#DC2626',
        });

    const formattedCandles = candles.map((c) => ({
      time: c.time as any,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    candleSeries.setData(formattedCandles);

    // EMA Lines
    const addLine = (options: any) =>
      (chart as any).addLineSeries ? (chart as any).addLineSeries(options) : chart.addSeries(LineSeries, options);

    // EMA 9 (Dark Neutral)
    const ema9Series = addLine({
      color: '#1A1A1A',
      lineWidth: 1.5,
      title: 'EMA 9',
    });
    const ema9Data = candles
      .map((c, idx) => ({
        time: c.time as any,
        value: indicators[idx]?.ema9,
      }))
      .filter((d): d is { time: any; value: number } => d.value !== undefined);
    ema9Series.setData(ema9Data);

    // EMA 21 (Gold / Amber)
    const ema21Series = addLine({
      color: '#D97706',
      lineWidth: 1.5,
      title: 'EMA 21',
    });
    const ema21Data = candles
      .map((c, idx) => ({
        time: c.time as any,
        value: indicators[idx]?.ema21,
      }))
      .filter((d): d is { time: any; value: number } => d.value !== undefined);
    ema21Series.setData(ema21Data);

    // EMA 50 (Slate Blue)
    const ema50Series = addLine({
      color: '#2563EB',
      lineWidth: 1.5,
      title: 'EMA 50',
    });
    const ema50Data = candles
      .map((c, idx) => ({
        time: c.time as any,
        value: indicators[idx]?.ema50,
      }))
      .filter((d): d is { time: any; value: number } => d.value !== undefined);
    ema50Series.setData(ema50Data);

    // Overlay Trade Signal Lines if present
    if (signal) {
      const isBuy = signal.direction === 'BUY';

      // Entry Price Line
      if (typeof signal.entryPrice === 'number') {
        candleSeries.createPriceLine({
          price: signal.entryPrice,
          color: '#1A1A1A',
          lineWidth: 2,
          lineStyle: 0,
          axisLabelVisible: true,
          title: `ENTRY $${(signal.entryPrice || 0).toFixed(2)}`,
        });
      }

      // Stop Loss Line
      if (typeof signal.stopLoss === 'number') {
        candleSeries.createPriceLine({
          price: signal.stopLoss,
          color: '#DC2626',
          lineWidth: 2,
          lineStyle: 2,
          axisLabelVisible: true,
          title: `SL $${(signal.stopLoss || 0).toFixed(2)}`,
        });
      }

      // Take Profit 1 Line
      if (typeof signal.takeProfit1 === 'number') {
        candleSeries.createPriceLine({
          price: signal.takeProfit1,
          color: '#059669',
          lineWidth: 2,
          lineStyle: 1,
          axisLabelVisible: true,
          title: `TP1 $${(signal.takeProfit1 || 0).toFixed(2)} (~${signal.estimatedPips || 0} pips)`,
        });
      }

      // Take Profit 2 Line
      if (typeof signal.takeProfit2 === 'number') {
        candleSeries.createPriceLine({
          price: signal.takeProfit2,
          color: '#047857',
          lineWidth: 1,
          lineStyle: 3,
          axisLabelVisible: true,
          title: `TP2 $${(signal.takeProfit2 || 0).toFixed(2)}`,
        });
      }
    }

    chart.timeScale().fitContent();

    // Handle Resize
    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
        });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [candles, indicators, signal]);

  return (
    <div className="bg-white border border-[#1A1A1A] p-5">
      <div className="flex items-center justify-between border-b border-[#DDD] pb-3 mb-3">
        <div className="flex items-center gap-4">
          <span className="text-[11px] font-sans font-bold uppercase tracking-[0.2em] text-[#1A1A1A]">
            XAUUSD Technical Chart
          </span>
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span className="text-[#1A1A1A] flex items-center gap-1 font-semibold">
              <span className="w-2.5 h-0.5 bg-[#1A1A1A]" /> EMA 9
            </span>
            <span className="text-[#D97706] flex items-center gap-1 font-semibold">
              <span className="w-2.5 h-0.5 bg-[#D97706]" /> EMA 21
            </span>
            <span className="text-[#2563EB] flex items-center gap-1 font-semibold">
              <span className="w-2.5 h-0.5 bg-[#2563EB]" /> EMA 50
            </span>
          </div>
        </div>

        {signal && (
          <div className="px-2.5 py-1 text-[10px] font-sans font-bold uppercase tracking-widest bg-[#1A1A1A] text-white">
            PLAN: {signal.direction} @ ${(signal.entryPrice || 0).toFixed(2)}
          </div>
        )}
      </div>

      <div ref={containerRef} className="w-full h-[480px] border border-[#EEE]" />
    </div>
  );
};

