import {
  BacktestResult,
  BacktestTrade,
  Candle,
  EngineConfig,
  EquityPoint,
  MarketRegime,
  MetricSet,
  RegimePerformance,
  Timeframe,
} from '../types';
import { getEngineConfig } from './config';
import { detectMarketRegime, generateSignalAt } from './engine';
import { computeAllIndicators } from './indicators';

export function runWalkForwardBacktest(
  candles: Candle[],
  timeframe: Timeframe,
  config: EngineConfig = getEngineConfig(),
  trainRatio = 0.7
): BacktestResult {
  const indicators = computeAllIndicators(candles);
  const totalBars = candles.length;
  const splitIndex = Math.floor(totalBars * trainRatio);

  const initialEquity = 10000; // $10,000 starting capital
  let currentEquity = initialEquity;
  let peakEquity = initialEquity;
  let maxDrawdownPct = 0;

  const trades: BacktestTrade[] = [];
  const equityCurve: EquityPoint[] = [];

  // Track regime performance
  const regimeStats: Record<MarketRegime, { count: number; wins: number; pnlPips: number; grossProfit: number; grossLoss: number }> = {
    TRENDING_UP: { count: 0, wins: 0, pnlPips: 0, grossProfit: 0, grossLoss: 0 },
    TRENDING_DOWN: { count: 0, wins: 0, pnlPips: 0, grossProfit: 0, grossLoss: 0 },
    RANGING: { count: 0, wins: 0, pnlPips: 0, grossProfit: 0, grossLoss: 0 },
    HIGH_VOLATILITY: { count: 0, wins: 0, pnlPips: 0, grossProfit: 0, grossLoss: 0 },
    EXTENSION: { count: 0, wins: 0, pnlPips: 0, grossProfit: 0, grossLoss: 0 },
  };

  let activeTrade: {
    id: string;
    entryTime: number;
    timeframe: Timeframe;
    direction: 'BUY' | 'SELL';
    entryPrice: number;
    stopLoss: number;
    takeProfit1: number;
    takeProfit2: number;
    regime: MarketRegime;
    startIndex: number;
    inSample: boolean;
  } | null = null;

  for (let i = 25; i < totalBars; i++) {
    const c = candles[i];
    const isInSample = i < splitIndex;

    // Check active trade exit conditions
    if (activeTrade) {
      let exitPrice = 0;
      let exitReason: 'TP1' | 'TP2' | 'SL' | 'CLOSE' | null = null;

      if (activeTrade.direction === 'BUY') {
        if (c.high >= activeTrade.takeProfit2) {
          exitPrice = activeTrade.takeProfit2;
          exitReason = 'TP2';
        } else if (c.high >= activeTrade.takeProfit1) {
          exitPrice = activeTrade.takeProfit1;
          exitReason = 'TP1';
        } else if (c.low <= activeTrade.stopLoss) {
          exitPrice = activeTrade.stopLoss;
          exitReason = 'SL';
        }
      } else {
        // SELL
        if (c.low <= activeTrade.takeProfit2) {
          exitPrice = activeTrade.takeProfit2;
          exitReason = 'TP2';
        } else if (c.low <= activeTrade.takeProfit1) {
          exitPrice = activeTrade.takeProfit1;
          exitReason = 'TP1';
        } else if (c.high >= activeTrade.stopLoss) {
          exitPrice = activeTrade.stopLoss;
          exitReason = 'SL';
        }
      }

      if (exitReason) {
        const pipsPnL =
          activeTrade.direction === 'BUY'
            ? Math.round((exitPrice - activeTrade.entryPrice) * 10)
            : Math.round((activeTrade.entryPrice - exitPrice) * 10);

        // Standard 1 lot ($10/pip) on $10k account
        const dollarPnL = pipsPnL * 10;
        currentEquity += dollarPnL;

        if (currentEquity > peakEquity) peakEquity = currentEquity;
        const currentDrawdown = ((peakEquity - currentEquity) / peakEquity) * 100;
        if (currentDrawdown > maxDrawdownPct) maxDrawdownPct = currentDrawdown;

        const percentagePnL = (dollarPnL / initialEquity) * 100;

        trades.push({
          id: activeTrade.id,
          entryTime: activeTrade.entryTime,
          exitTime: c.time,
          timeframe: activeTrade.timeframe,
          direction: activeTrade.direction,
          entryPrice: activeTrade.entryPrice,
          stopLoss: activeTrade.stopLoss,
          takeProfit1: activeTrade.takeProfit1,
          takeProfit2: activeTrade.takeProfit2,
          exitPrice,
          exitReason,
          pipsPnL,
          percentagePnL,
          regime: activeTrade.regime,
        });

        // Regime stats
        const reg = activeTrade.regime;
        regimeStats[reg].count++;
        regimeStats[reg].pnlPips += pipsPnL;
        if (pipsPnL > 0) {
          regimeStats[reg].wins++;
          regimeStats[reg].grossProfit += pipsPnL;
        } else {
          regimeStats[reg].grossLoss += Math.abs(pipsPnL);
        }

        activeTrade = null;
      }
    }

    // Record equity point
    const d = new Date(c.time * 1000);
    const dateStr = `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    const dd = peakEquity > 0 ? ((peakEquity - currentEquity) / peakEquity) * 100 : 0;

    equityCurve.push({
      time: dateStr,
      timestamp: c.time,
      equity: Math.round(currentEquity),
      drawdown: Number(dd.toFixed(1)),
      inSample: isInSample,
    });

    // Check entry signal if no open trade
    if (!activeTrade) {
      const signal = generateSignalAt(candles, indicators, i, timeframe, config);
      if (signal) {
        const regime = detectMarketRegime(candles, indicators, i);
        activeTrade = {
          id: signal.id,
          entryTime: c.time,
          timeframe,
          direction: signal.direction,
          entryPrice: signal.entryPrice,
          stopLoss: signal.stopLoss,
          takeProfit1: signal.takeProfit1,
          takeProfit2: signal.takeProfit2,
          regime,
          startIndex: i,
          inSample: isInSample,
        };
      }
    }
  }

  // Calculate Metric Sets
  const inSampleTrades = trades.filter((_, idx) => idx < trades.length * trainRatio);
  const outOfSampleTrades = trades.filter((_, idx) => idx >= trades.length * trainRatio);

  const calculateMetrics = (tradeList: BacktestTrade[]): MetricSet => {
    if (tradeList.length === 0) {
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        profitFactor: 0,
        maxDrawdownPercent: 0,
        totalPips: 0,
        sharpeRatio: 0,
        avgWinPips: 0,
        avgLossPips: 0,
      };
    }

    const totalTrades = tradeList.length;
    const wins = tradeList.filter((t) => t.pipsPnL > 0);
    const losses = tradeList.filter((t) => t.pipsPnL <= 0);

    const winningTrades = wins.length;
    const losingTrades = losses.length;

    const winRate = Number(((winningTrades / totalTrades) * 100).toFixed(1));

    const grossProfitPips = wins.reduce((acc, t) => acc + t.pipsPnL, 0);
    const grossLossPips = losses.reduce((acc, t) => acc + Math.abs(t.pipsPnL), 0);

    const profitFactor =
      grossLossPips > 0 ? Number((grossProfitPips / grossLossPips).toFixed(2)) : grossProfitPips > 0 ? 9.99 : 0;

    const totalPips = tradeList.reduce((acc, t) => acc + t.pipsPnL, 0);

    const avgWinPips = winningTrades > 0 ? Math.round(grossProfitPips / winningTrades) : 0;
    const avgLossPips = losingTrades > 0 ? Math.round(grossLossPips / losingTrades) : 0;

    // Sharpe ratio estimation (annualized)
    const returns = tradeList.map((t) => t.percentagePnL);
    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - meanReturn, 2), 0) / (returns.length || 1);
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? Number(((meanReturn / stdDev) * Math.sqrt(252)).toFixed(2)) : 0;

    return {
      totalTrades,
      winningTrades,
      losingTrades,
      winRate,
      profitFactor,
      maxDrawdownPercent: Number(maxDrawdownPct.toFixed(1)),
      totalPips,
      sharpeRatio,
      avgWinPips,
      avgLossPips,
    };
  };

  const overall = calculateMetrics(trades);
  const inSample = calculateMetrics(inSampleTrades);
  const outOfSample = calculateMetrics(outOfSampleTrades);

  // Format regime breakdown
  const regimeBreakdown: RegimePerformance[] = Object.entries(regimeStats).map(([reg, s]) => ({
    regime: reg as MarketRegime,
    count: s.count,
    winRate: s.count > 0 ? Number(((s.wins / s.count) * 100).toFixed(1)) : 0,
    profitFactor: s.grossLoss > 0 ? Number((s.grossProfit / s.grossLoss).toFixed(2)) : s.grossProfit > 0 ? 9.99 : 0,
    pips: s.pnlPips,
  }));

  // Honest warning if out-of-sample edge is poor
  const calibrationWarning = outOfSample.totalTrades > 3 && (outOfSample.profitFactor < 1.05 || outOfSample.winRate < 48);

  return {
    symbol: 'XAUUSD',
    timeframe,
    totalTrades: trades.length,
    overall,
    inSample,
    outOfSample,
    equityCurve,
    trades,
    regimeBreakdown,
    calibrationWarning,
    trainRatio,
  };
}
