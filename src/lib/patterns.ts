import { Candle, IndicatorValues, PatternMatch } from '../types';

export function detectPatternsAt(
  candles: Candle[],
  indicators: IndicatorValues[],
  index: number,
  lookback = 30
): PatternMatch[] {
  const matches: PatternMatch[] = [];
  if (index < 10 || index >= candles.length) return matches;

  const current = candles[index];
  const ind = indicators[index];

  // 1. Fair Value Gap (FVG) - 3-bar pattern
  if (index >= 2) {
    const bar0 = candles[index - 2];
    const bar2 = candles[index];

    // Bullish FVG: Low of bar2 > High of bar0
    if (bar2.low > bar0.high) {
      const gapSize = bar2.low - bar0.high;
      if (gapSize >= 0.3) {
        // at least $0.30 gap in Gold
        matches.push({
          type: 'FVG',
          name: 'Bullish Fair Value Gap (FVG)',
          direction: 'BUY',
          confidence: Math.min(0.9, 0.6 + gapSize / 2),
          description: `Unfilled bullish imbalance gap of $${gapSize.toFixed(2)} between $${bar0.high.toFixed(2)} and $${bar2.low.toFixed(2)}`,
          priceLevel: (bar0.high + bar2.low) / 2,
          startIndex: index - 2,
          endIndex: index,
        });
      }
    }

    // Bearish FVG: High of bar2 < Low of bar0
    if (bar2.high < bar0.low) {
      const gapSize = bar0.low - bar2.high;
      if (gapSize >= 0.3) {
        matches.push({
          type: 'FVG',
          name: 'Bearish Fair Value Gap (FVG)',
          direction: 'SELL',
          confidence: Math.min(0.9, 0.6 + gapSize / 2),
          description: `Unfilled bearish imbalance gap of $${gapSize.toFixed(2)} between $${bar2.high.toFixed(2)} and $${bar0.low.toFixed(2)}`,
          priceLevel: (bar0.low + bar2.high) / 2,
          startIndex: index - 2,
          endIndex: index,
        });
      }
    }
  }

  // 2. Break of Structure (BOS)
  const windowStart = Math.max(0, index - 15);
  let highestPrevHigh = -Infinity;
  let lowestPrevLow = Infinity;

  for (let i = windowStart; i < index - 1; i++) {
    if (candles[i].high > highestPrevHigh) highestPrevHigh = candles[i].high;
    if (candles[i].low < lowestPrevLow) lowestPrevLow = candles[i].low;
  }

  if (current.close > highestPrevHigh && candles[index - 1].close <= highestPrevHigh) {
    matches.push({
      type: 'BOS',
      name: 'Bullish Break of Structure (BOS)',
      direction: 'BUY',
      confidence: 0.8,
      description: `Price closed at $${current.close.toFixed(2)} above recent swing high $${highestPrevHigh.toFixed(2)}`,
      priceLevel: highestPrevHigh,
      startIndex: windowStart,
      endIndex: index,
    });
  } else if (current.close < lowestPrevLow && candles[index - 1].close >= lowestPrevLow) {
    matches.push({
      type: 'BOS',
      name: 'Bearish Break of Structure (BOS)',
      direction: 'SELL',
      confidence: 0.8,
      description: `Price closed at $${current.close.toFixed(2)} below recent swing low $${lowestPrevLow.toFixed(2)}`,
      priceLevel: lowestPrevLow,
      startIndex: windowStart,
      endIndex: index,
    });
  }

  // 3. Double Top (M) / Double Bottom (W)
  const startIdx = Math.max(0, index - lookback);
  const recentHighs: { idx: number; high: number }[] = [];
  const recentLows: { idx: number; low: number }[] = [];

  for (let i = startIdx + 1; i < index - 1; i++) {
    if (candles[i].high > candles[i - 1].high && candles[i].high > candles[i + 1].high) {
      recentHighs.push({ idx: i, high: candles[i].high });
    }
    if (candles[i].low < candles[i - 1].low && candles[i].low < candles[i + 1].low) {
      recentLows.push({ idx: i, low: candles[i].low });
    }
  }

  if (recentHighs.length >= 2) {
    const h1 = recentHighs[recentHighs.length - 2];
    const h2 = recentHighs[recentHighs.length - 1];
    const diffPips = Math.abs(h1.high - h2.high);

    if (diffPips <= 0.8 && h2.idx - h1.idx >= 4) {
      matches.push({
        type: 'DOUBLE_TOP_M',
        name: 'Double Top (M Pattern)',
        direction: 'SELL',
        confidence: 0.75,
        description: `Equal peaks near $${h1.high.toFixed(2)} detected (${h2.idx - h1.idx} bars apart)`,
        priceLevel: h1.high,
        startIndex: h1.idx,
        endIndex: h2.idx,
      });
    }
  }

  if (recentLows.length >= 2) {
    const l1 = recentLows[recentLows.length - 2];
    const l2 = recentLows[recentLows.length - 1];
    const diffPips = Math.abs(l1.low - l2.low);

    if (diffPips <= 0.8 && l2.idx - l1.idx >= 4) {
      matches.push({
        type: 'DOUBLE_BOTTOM_W',
        name: 'Double Bottom (W Pattern)',
        direction: 'BUY',
        confidence: 0.75,
        description: `Equal troughs near $${l1.low.toFixed(2)} detected (${l2.idx - l1.idx} bars apart)`,
        priceLevel: l1.low,
        startIndex: l1.idx,
        endIndex: l2.idx,
      });
    }
  }

  // 4. Higher High / Higher Low (HH/HL) or Lower High / Lower Low (LH/LL)
  if (recentHighs.length >= 2 && recentLows.length >= 2) {
    const h1 = recentHighs[recentHighs.length - 2];
    const h2 = recentHighs[recentHighs.length - 1];
    const l1 = recentLows[recentLows.length - 2];
    const l2 = recentLows[recentLows.length - 1];

    if (h2.high > h1.high && l2.low > l1.low) {
      matches.push({
        type: 'HH_HL',
        name: 'Bullish Market Structure (HH/HL)',
        direction: 'BUY',
        confidence: 0.7,
        description: `Sequential Higher High ($${h2.high.toFixed(2)}) and Higher Low ($${l2.low.toFixed(2)})`,
        priceLevel: l2.low,
      });
    } else if (h2.high < h1.high && l2.low < l1.low) {
      matches.push({
        type: 'LH_LL',
        name: 'Bearish Market Structure (LH/LL)',
        direction: 'SELL',
        confidence: 0.7,
        description: `Sequential Lower High ($${h2.high.toFixed(2)}) and Lower Low ($${l2.low.toFixed(2)})`,
        priceLevel: h2.high,
      });
    }
  }

  // 5. Order Block (OB)
  if (index >= 5) {
    const move = current.close - candles[index - 4].close;
    if (move > 1.8) {
      // strong move up -> red candle before move is Demand OB
      for (let j = index - 1; j >= index - 4; j--) {
        if (candles[j].close < candles[j].open) {
          matches.push({
            type: 'ORDER_BLOCK',
            name: 'Bullish Order Block (Demand Zone)',
            direction: 'BUY',
            confidence: 0.75,
            description: `Institutional demand zone formed around $${candles[j].low.toFixed(2)} - $${candles[j].high.toFixed(2)}`,
            priceLevel: (candles[j].low + candles[j].high) / 2,
            startIndex: j,
            endIndex: index,
          });
          break;
        }
      }
    } else if (move < -1.8) {
      // strong move down -> green candle before move is Supply OB
      for (let j = index - 1; j >= index - 4; j--) {
        if (candles[j].close > candles[j].open) {
          matches.push({
            type: 'ORDER_BLOCK',
            name: 'Bearish Order Block (Supply Zone)',
            direction: 'SELL',
            confidence: 0.75,
            description: `Institutional supply zone formed around $${candles[j].low.toFixed(2)} - $${candles[j].high.toFixed(2)}`,
            priceLevel: (candles[j].low + candles[j].high) / 2,
            startIndex: j,
            endIndex: index,
          });
          break;
        }
      }
    }
  }

  // 6. Extension Fade (Mean Reversion)
  if (ind && ind.rsi14 !== undefined && ind.ema21 !== undefined && ind.atr14 !== undefined) {
    const dist = Math.abs(current.close - ind.ema21);
    if (ind.rsi14 >= 72 && dist > 1.8 * ind.atr14) {
      matches.push({
        type: 'EXTENSION_FADE',
        name: 'Overextended Reversion (Bearish Fade)',
        direction: 'SELL',
        confidence: 0.65,
        description: `Price is $${dist.toFixed(2)} away from EMA21 with RSI ${ind.rsi14.toFixed(1)} - ripe for mean-reversion pull back`,
        priceLevel: ind.ema21,
      });
    } else if (ind.rsi14 <= 28 && dist > 1.8 * ind.atr14) {
      matches.push({
        type: 'EXTENSION_FADE',
        name: 'Overextended Reversion (Bullish Fade)',
        direction: 'BUY',
        confidence: 0.65,
        description: `Price is $${dist.toFixed(2)} below EMA21 with RSI ${ind.rsi14.toFixed(1)} - ripe for mean-reversion bounce`,
        priceLevel: ind.ema21,
      });
    }
  }

  return matches;
}
