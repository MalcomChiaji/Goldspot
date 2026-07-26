import {
  Candle,
  EngineConfig,
  IndicatorValues,
  MarketRegime,
  PatternMatch,
  Timeframe,
  TradeSignal,
} from '../types';
import { getEngineConfig } from './config';
import { computeAllIndicators } from './indicators';
import { detectPatternsAt } from './patterns';

export function detectMarketRegime(
  candles: Candle[],
  indicators: IndicatorValues[],
  index: number
): MarketRegime {
  if (index < 20) return 'RANGING';

  const current = candles[index];
  const ind = indicators[index];

  if (!ind) return 'RANGING';

  const atr = ind.atr14 || 1.5;

  // Calculate 20-period average ATR
  let atrSum = 0;
  let count = 0;
  for (let i = Math.max(0, index - 20); i <= index; i++) {
    if (indicators[i]?.atr14) {
      atrSum += indicators[i].atr14!;
      count++;
    }
  }
  const avgATR = count > 0 ? atrSum / count : atr;

  // 1. High Volatility Check
  if (atr > 1.45 * avgATR) {
    return 'HIGH_VOLATILITY';
  }

  // 2. Extension Check
  if (ind.rsi14 !== undefined && (ind.rsi14 >= 72 || ind.rsi14 <= 28)) {
    return 'EXTENSION';
  }
  if (ind.ema21 !== undefined) {
    const distFromEMA = Math.abs(current.close - ind.ema21);
    if (distFromEMA > 2.0 * atr) {
      return 'EXTENSION';
    }
  }

  // 3. Trending Check
  const adx = ind.adx14 || 0;
  if (adx >= 22) {
    if (
      ind.ema50 !== undefined &&
      ind.ema200 !== undefined &&
      current.close > ind.ema50 &&
      ind.ema50 > ind.ema200
    ) {
      return 'TRENDING_UP';
    }
    if (
      ind.ema50 !== undefined &&
      ind.ema200 !== undefined &&
      current.close < ind.ema50 &&
      ind.ema50 < ind.ema200
    ) {
      return 'TRENDING_DOWN';
    }
  }

  // Default to Ranging
  return 'RANGING';
}

export function computeConfidenceScoreAt(
  candles: Candle[],
  indicators: IndicatorValues[],
  index: number,
  timeframe: Timeframe,
  config: EngineConfig = getEngineConfig()
): number {
  if (index < 20 || index >= candles.length) return 50;

  const ind = indicators[index];
  if (!ind) return 50;

  const regime = detectMarketRegime(candles, indicators, index);
  const patterns = detectPatternsAt(candles, indicators, index);

  let buyScore = 0;
  let sellScore = 0;

  if (ind.ema9 && ind.ema21) {
    if (ind.ema9 > ind.ema21) buyScore += 15;
    else sellScore += 15;
  }

  if (ind.rsi14) {
    if (ind.rsi14 > 50 && ind.rsi14 < 68) buyScore += 12;
    else if (ind.rsi14 < 50 && ind.rsi14 > 32) sellScore += 12;
    else if (ind.rsi14 <= 30) buyScore += 18;
    else if (ind.rsi14 >= 70) sellScore += 18;
  }

  if (ind.macdHist !== undefined) {
    if (ind.macdHist > 0) buyScore += 10;
    else if (ind.macdHist < 0) sellScore += 10;
  }

  if (ind.stochK !== undefined && ind.stochD !== undefined) {
    if (ind.stochK > ind.stochD && ind.stochK < 80) buyScore += 10;
    else if (ind.stochK < ind.stochD && ind.stochK > 20) sellScore += 10;
  }

  for (const p of patterns) {
    if (p.direction === 'BUY') buyScore += Math.round(p.confidence * 25);
    else sellScore += Math.round(p.confidence * 25);
  }

  let totalScore = 0;
  if (buyScore > sellScore) {
    totalScore = buyScore;
    if (regime === 'TRENDING_UP') totalScore += 15;
    if (regime === 'TRENDING_DOWN') totalScore -= 20;
  } else {
    totalScore = sellScore;
    if (regime === 'TRENDING_DOWN') totalScore += 15;
    if (regime === 'TRENDING_UP') totalScore -= 20;
  }

  if (regime === 'EXTENSION') {
    totalScore = totalScore * config.extensionFadeFactor;
  }

  return Math.min(95, Math.max(30, Math.round(totalScore)));
}

export function generateSignalAt(
  candles: Candle[],
  indicators: IndicatorValues[],
  index: number,
  timeframe: Timeframe,
  config: EngineConfig = getEngineConfig()
): TradeSignal | null {
  if (index < 20 || index >= candles.length) return null;

  const current = candles[index];
  const ind = indicators[index];
  if (!ind) return null;

  const regime = detectMarketRegime(candles, indicators, index);
  const patterns = detectPatternsAt(candles, indicators, index);

  let buyScore = 0;
  let sellScore = 0;
  const reasoning: string[] = [];

  // Indicator factors
  if (ind.ema9 && ind.ema21) {
    if (ind.ema9 > ind.ema21) {
      buyScore += 15;
      reasoning.push('EMA 9/21 bullish alignment (EMA 9 > EMA 21)');
    } else {
      sellScore += 15;
      reasoning.push('EMA 9/21 bearish alignment (EMA 9 < EMA 21)');
    }
  }

  if (ind.rsi14) {
    if (ind.rsi14 > 50 && ind.rsi14 < 68) {
      buyScore += 12;
      reasoning.push(`RSI (${ind.rsi14.toFixed(1)}) in bullish momentum zone`);
    } else if (ind.rsi14 < 50 && ind.rsi14 > 32) {
      sellScore += 12;
      reasoning.push(`RSI (${ind.rsi14.toFixed(1)}) in bearish momentum zone`);
    } else if (ind.rsi14 <= 30) {
      buyScore += 18;
      reasoning.push(`RSI (${ind.rsi14.toFixed(1)}) oversold - rebound likely`);
    } else if (ind.rsi14 >= 70) {
      sellScore += 18;
      reasoning.push(`RSI (${ind.rsi14.toFixed(1)}) overbought - pullback likely`);
    }
  }

  if (ind.macdHist !== undefined) {
    if (ind.macdHist > 0) {
      buyScore += 10;
      reasoning.push('MACD histogram positive');
    } else if (ind.macdHist < 0) {
      sellScore += 10;
      reasoning.push('MACD histogram negative');
    }
  }

  if (ind.stochK !== undefined && ind.stochD !== undefined) {
    if (ind.stochK > ind.stochD && ind.stochK < 80) {
      buyScore += 10;
      reasoning.push('Stochastic %K crossed above %D');
    } else if (ind.stochK < ind.stochD && ind.stochK > 20) {
      sellScore += 10;
      reasoning.push('Stochastic %K crossed below %D');
    }
  }

  // Pattern factors
  for (const p of patterns) {
    if (p.direction === 'BUY') {
      buyScore += Math.round(p.confidence * 25);
      reasoning.push(`Pattern detected: ${p.name}`);
    } else {
      sellScore += Math.round(p.confidence * 25);
      reasoning.push(`Pattern detected: ${p.name}`);
    }
  }

  // Regime adjustment
  let totalScore = 0;
  let direction: 'BUY' | 'SELL' = 'BUY';

  if (buyScore > sellScore) {
    direction = 'BUY';
    totalScore = buyScore;
    if (regime === 'TRENDING_UP') totalScore += 15;
    if (regime === 'TRENDING_DOWN') totalScore -= 20; // counter-trend penalty
  } else {
    direction = 'SELL';
    totalScore = sellScore;
    if (regime === 'TRENDING_DOWN') totalScore += 15;
    if (regime === 'TRENDING_UP') totalScore -= 20;
  }

  if (regime === 'EXTENSION') {
    totalScore = totalScore * config.extensionFadeFactor;
    reasoning.push('Extension regime active: applying confidence fade factor');
  }

  const confidenceScore = Math.min(95, Math.max(30, Math.round(totalScore)));
  const confidenceDecimal = confidenceScore / 100;

  if (confidenceDecimal < config.minConfidence) {
    return null; // Confidence below threshold
  }

  // Generate historical confidence trend for the last 10 periods
  const confidenceHistory: number[] = [];
  const historyLookback = 10;
  for (let i = Math.max(0, index - historyLookback + 1); i <= index; i++) {
    confidenceHistory.push(computeConfidenceScoreAt(candles, indicators, i, timeframe, config));
  }

  // Calculate SL, TP1, TP2, and Estimated Pips
  const atr = ind.atr14 || 1.8;

  let stopMult = config.atrStopMultiplier.trending;
  let targetMult = config.atrTargetMultiplier.trending;

  if (regime === 'RANGING') {
    stopMult = config.atrStopMultiplier.ranging;
    targetMult = config.atrTargetMultiplier.ranging;
  } else if (regime === 'EXTENSION' || regime === 'HIGH_VOLATILITY') {
    stopMult = config.atrStopMultiplier.extension;
    targetMult = config.atrTargetMultiplier.extension;
  }

  const entryPrice = Number(current.close.toFixed(2));
  const slDistance = atr * stopMult;
  const tp1Distance = slDistance * 1.5;
  const tp2Distance = slDistance * 2.5;

  let stopLoss: number;
  let takeProfit1: number;
  let takeProfit2: number;

  if (direction === 'BUY') {
    stopLoss = Number((entryPrice - slDistance).toFixed(2));
    takeProfit1 = Number((entryPrice + tp1Distance).toFixed(2));
    takeProfit2 = Number((entryPrice + tp2Distance).toFixed(2));
  } else {
    stopLoss = Number((entryPrice + slDistance).toFixed(2));
    takeProfit1 = Number((entryPrice - tp1Distance).toFixed(2));
    takeProfit2 = Number((entryPrice - tp2Distance).toFixed(2));
  }

  // 1 Gold Pip = $0.10 price difference (e.g. $15 movement = 150 pips)
  const estimatedPips = Math.round(Math.abs(takeProfit1 - entryPrice) * 10);
  const riskRewardRatio = Number((tp1Distance / slDistance).toFixed(2));

  return {
    id: `SIG-${timeframe}-${current.time}-${Math.floor(Math.random() * 1000)}`,
    timestamp: current.time,
    symbol: 'XAUUSD',
    timeframe,
    direction,
    entryPrice,
    stopLoss,
    takeProfit1,
    takeProfit2,
    estimatedPips,
    riskRewardRatio,
    confidenceScore,
    confidenceHistory,
    regime,
    patterns,
    indicators: ind,
    reasoning: Array.from(new Set(reasoning)),
    status: 'ACTIVE',
  };
}

export function analyzeCandles(
  candles: Candle[],
  timeframe: Timeframe,
  config?: EngineConfig
): {
  latestSignal: TradeSignal | null;
  indicators: IndicatorValues[];
  regime: MarketRegime;
  patterns: PatternMatch[];
} {
  const indicators = computeAllIndicators(candles);
  const lastIndex = candles.length - 1;

  const regime = detectMarketRegime(candles, indicators, lastIndex);
  const patterns = detectPatternsAt(candles, indicators, lastIndex);
  const latestSignal = generateSignalAt(candles, indicators, lastIndex, timeframe, config);

  return {
    latestSignal,
    indicators,
    regime,
    patterns,
  };
}
