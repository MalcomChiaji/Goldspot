import { Candle, IndicatorValues } from '../types';

export function calculateSMA(data: number[], period: number): (number | undefined)[] {
  const result: (number | undefined)[] = new Array(data.length);
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
    if (i >= period) {
      sum -= data[i - period];
    }
    if (i >= period - 1) {
      result[i] = sum / period;
    }
  }
  return result;
}

export function calculateEMA(data: number[], period: number): (number | undefined)[] {
  const result: (number | undefined)[] = new Array(data.length);
  if (data.length < period) return result;

  const multiplier = 2 / (period + 1);
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  let ema = sum / period;
  result[period - 1] = ema;

  for (let i = period; i < data.length; i++) {
    ema = (data[i] - ema) * multiplier + ema;
    result[i] = ema;
  }
  return result;
}

export function calculateRSI(closes: number[], period: number = 14): (number | undefined)[] {
  const result: (number | undefined)[] = new Array(closes.length);
  if (closes.length <= period) return result;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change >= 0) gains += change;
    else losses -= change;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  if (avgLoss === 0) {
    result[period] = 100;
  } else {
    const rs = avgGain / avgLoss;
    result[period] = 100 - 100 / (1 + rs);
  }

  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    const gain = change >= 0 ? change : 0;
    const loss = change < 0 ? -change : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) {
      result[i] = 100;
    } else {
      const rs = avgGain / avgLoss;
      result[i] = 100 - 100 / (1 + rs);
    }
  }

  return result;
}

export function calculateMACD(
  closes: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): {
  macdLine: (number | undefined)[];
  macdSignal: (number | undefined)[];
  macdHist: (number | undefined)[];
} {
  const fastEMA = calculateEMA(closes, fastPeriod);
  const slowEMA = calculateEMA(closes, slowPeriod);

  const macdLineArr: (number | undefined)[] = new Array(closes.length);

  for (let i = 0; i < closes.length; i++) {
    if (fastEMA[i] !== undefined && slowEMA[i] !== undefined) {
      macdLineArr[i] = fastEMA[i]! - slowEMA[i]!;
    }
  }

  const validMacdValues: number[] = [];
  const validIndices: number[] = [];
  for (let i = 0; i < macdLineArr.length; i++) {
    if (macdLineArr[i] !== undefined) {
      validMacdValues.push(macdLineArr[i]!);
      validIndices.push(i);
    }
  }

  const signalEMA = calculateEMA(validMacdValues, signalPeriod);

  const macdSignalArr: (number | undefined)[] = new Array(closes.length);
  const macdHistArr: (number | undefined)[] = new Array(closes.length);

  for (let k = 0; k < validIndices.length; k++) {
    const origIdx = validIndices[k];
    const sigVal = signalEMA[k];
    if (sigVal !== undefined && macdLineArr[origIdx] !== undefined) {
      macdSignalArr[origIdx] = sigVal;
      macdHistArr[origIdx] = macdLineArr[origIdx]! - sigVal;
    }
  }

  return {
    macdLine: macdLineArr,
    macdSignal: macdSignalArr,
    macdHist: macdHistArr,
  };
}

export function calculateBollingerBands(
  closes: number[],
  period = 20,
  stdDevMult = 2
): {
  upper: (number | undefined)[];
  middle: (number | undefined)[];
  lower: (number | undefined)[];
} {
  const sma = calculateSMA(closes, period);
  const upper: (number | undefined)[] = new Array(closes.length);
  const lower: (number | undefined)[] = new Array(closes.length);

  for (let i = period - 1; i < closes.length; i++) {
    const mean = sma[i];
    if (mean === undefined) continue;

    let varianceSum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const diff = closes[j] - mean;
      varianceSum += diff * diff;
    }
    const stdDev = Math.sqrt(varianceSum / period);
    upper[i] = mean + stdDevMult * stdDev;
    lower[i] = mean - stdDevMult * stdDev;
  }

  return { upper, middle: sma, lower };
}

export function calculateATR(candles: Candle[], period = 14): (number | undefined)[] {
  const atr: (number | undefined)[] = new Array(candles.length);
  if (candles.length <= period) return atr;

  const tr: number[] = new Array(candles.length);
  tr[0] = candles[0].high - candles[0].low;

  for (let i = 1; i < candles.length; i++) {
    const h = candles[i].high;
    const l = candles[i].low;
    const prevC = candles[i - 1].close;

    const tr1 = h - l;
    const tr2 = Math.abs(h - prevC);
    const tr3 = Math.abs(l - prevC);
    tr[i] = Math.max(tr1, tr2, tr3);
  }

  let trSum = 0;
  for (let i = 0; i < period; i++) {
    trSum += tr[i];
  }
  let currentATR = trSum / period;
  atr[period - 1] = currentATR;

  for (let i = period; i < candles.length; i++) {
    currentATR = (currentATR * (period - 1) + tr[i]) / period;
    atr[i] = currentATR;
  }

  return atr;
}

export function calculateStochastic(
  candles: Candle[],
  kPeriod = 14,
  dPeriod = 3
): {
  k: (number | undefined)[];
  d: (number | undefined)[];
} {
  const kArr: (number | undefined)[] = new Array(candles.length);

  for (let i = kPeriod - 1; i < candles.length; i++) {
    let highestHigh = -Infinity;
    let lowestLow = Infinity;

    for (let j = i - kPeriod + 1; j <= i; j++) {
      if (candles[j].high > highestHigh) highestHigh = candles[j].high;
      if (candles[j].low < lowestLow) lowestLow = candles[j].low;
    }

    const range = highestHigh - lowestLow;
    if (range > 0) {
      kArr[i] = ((candles[i].close - lowestLow) / range) * 100;
    } else {
      kArr[i] = 50;
    }
  }

  const validK: number[] = [];
  const validIndices: number[] = [];
  for (let i = 0; i < kArr.length; i++) {
    if (kArr[i] !== undefined) {
      validK.push(kArr[i]!);
      validIndices.push(i);
    }
  }

  const dSmooth = calculateSMA(validK, dPeriod);
  const dArr: (number | undefined)[] = new Array(candles.length);

  for (let idx = 0; idx < validIndices.length; idx++) {
    const origIdx = validIndices[idx];
    dArr[origIdx] = dSmooth[idx];
  }

  return { k: kArr, d: dArr };
}

export function calculateVWAP(candles: Candle[]): (number | undefined)[] {
  const vwap: (number | undefined)[] = new Array(candles.length);
  let cumVolume = 0;
  let cumTPV = 0;

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const typicalPrice = (c.high + c.low + c.close) / 3;
    const vol = c.volume > 0 ? c.volume : 1;

    cumTPV += typicalPrice * vol;
    cumVolume += vol;

    vwap[i] = cumTPV / cumVolume;
  }

  return vwap;
}

export function calculateADX(candles: Candle[], period = 14): (number | undefined)[] {
  const adx: (number | undefined)[] = new Array(candles.length);
  if (candles.length < period * 2) return adx;

  const tr: number[] = [];
  const plusDM: number[] = [];
  const minusDM: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevHigh = candles[i - 1].high;
    const prevLow = candles[i - 1].low;
    const prevClose = candles[i - 1].close;

    const trVal = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    tr.push(trVal);

    const upMove = high - prevHigh;
    const downMove = prevLow - low;

    if (upMove > downMove && upMove > 0) {
      plusDM.push(upMove);
    } else {
      plusDM.push(0);
    }

    if (downMove > upMove && downMove > 0) {
      minusDM.push(downMove);
    } else {
      minusDM.push(0);
    }
  }

  let trSmoothed = tr.slice(0, period).reduce((a, b) => a + b, 0);
  let plusDMSmoothed = plusDM.slice(0, period).reduce((a, b) => a + b, 0);
  let minusDMSmoothed = minusDM.slice(0, period).reduce((a, b) => a + b, 0);

  const dxList: number[] = [];

  for (let i = period; i < tr.length; i++) {
    trSmoothed = trSmoothed - trSmoothed / period + tr[i];
    plusDMSmoothed = plusDMSmoothed - plusDMSmoothed / period + plusDM[i];
    minusDMSmoothed = minusDMSmoothed - minusDMSmoothed / period + minusDM[i];

    const plusDI = trSmoothed > 0 ? (plusDMSmoothed / trSmoothed) * 100 : 0;
    const minusDI = trSmoothed > 0 ? (minusDMSmoothed / trSmoothed) * 100 : 0;

    const sumDI = plusDI + minusDI;
    const dx = sumDI > 0 ? (Math.abs(plusDI - minusDI) / sumDI) * 100 : 0;
    dxList.push(dx);

    if (dxList.length >= period) {
      if (dxList.length === period) {
        let adxVal = dxList.reduce((a, b) => a + b, 0) / period;
        adx[i + 1] = adxVal;
      } else {
        const prevADX = adx[i]!;
        if (prevADX !== undefined) {
          const adxVal = (prevADX * (period - 1) + dx) / period;
          adx[i + 1] = adxVal;
        }
      }
    }
  }

  return adx;
}

export function computeAllIndicators(candles: Candle[]): IndicatorValues[] {
  const closes = candles.map((c) => c.close);

  const ema9 = calculateEMA(closes, 9);
  const ema21 = calculateEMA(closes, 21);
  const ema50 = calculateEMA(closes, 50);
  const ema200 = calculateEMA(closes, 200);
  const rsi14 = calculateRSI(closes, 14);
  const { macdLine, macdSignal, macdHist } = calculateMACD(closes);
  const { upper: upperBB, middle: middleBB, lower: lowerBB } = calculateBollingerBands(closes);
  const atr14 = calculateATR(candles, 14);
  const { k: stochK, d: stochD } = calculateStochastic(candles);
  const vwap = calculateVWAP(candles);
  const adx14 = calculateADX(candles);

  const result: IndicatorValues[] = new Array(candles.length);
  for (let i = 0; i < candles.length; i++) {
    result[i] = {
      ema9: ema9[i],
      ema21: ema21[i],
      ema50: ema50[i],
      ema200: ema200[i],
      rsi14: rsi14[i],
      macdLine: macdLine[i],
      macdSignal: macdSignal[i],
      macdHist: macdHist[i],
      upperBB: upperBB[i],
      middleBB: middleBB[i],
      lowerBB: lowerBB[i],
      atr14: atr14[i],
      stochK: stochK[i],
      stochD: stochD[i],
      vwap: vwap[i],
      adx14: adx14[i],
    };
  }

  return result;
}
