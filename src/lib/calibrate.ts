import { BacktestResult, Candle, EngineConfig, Timeframe } from '../types';
import { runWalkForwardBacktest } from './backtest';
import { DEFAULT_ENGINE_CONFIG, updateEngineConfig } from './config';

export function runGridCalibration(
  candles: Candle[],
  timeframe: Timeframe
): {
  bestConfig: EngineConfig;
  bestBacktest: BacktestResult;
  testedCount: number;
} {
  let bestConfig = { ...DEFAULT_ENGINE_CONFIG };
  let bestProfitFactor = -1;
  let bestBacktestResult: BacktestResult | null = null;
  let count = 0;

  const stopSwitches = [1.2, 1.5, 1.8];
  const targetSwitches = [1.8, 2.2, 2.6];
  const fadeSwitches = [0.5, 0.65, 0.8];
  const confSwitches = [0.52, 0.58, 0.62];

  for (const stopMult of stopSwitches) {
    for (const targetMult of targetSwitches) {
      for (const fadeFactor of fadeSwitches) {
        for (const minConf of confSwitches) {
          count++;
          const testConfig: EngineConfig = {
            ...DEFAULT_ENGINE_CONFIG,
            atrStopMultiplier: {
              trending: stopMult,
              ranging: stopMult * 0.8,
              extension: stopMult * 1.3,
            },
            atrTargetMultiplier: {
              trending: targetMult,
              ranging: targetMult * 0.7,
              extension: targetMult * 0.5,
            },
            extensionFadeFactor: fadeFactor,
            minConfidence: minConf,
          };

          const backtest = runWalkForwardBacktest(candles, timeframe, testConfig, 0.7);

          // Evaluate primarily on In-Sample Profit Factor & Trade Volume
          if (
            backtest.inSample.totalTrades >= 5 &&
            backtest.inSample.profitFactor > bestProfitFactor
          ) {
            bestProfitFactor = backtest.inSample.profitFactor;
            bestConfig = testConfig;
            bestBacktestResult = backtest;
          }
        }
      }
    }
  }

  if (!bestBacktestResult) {
    bestBacktestResult = runWalkForwardBacktest(candles, timeframe, DEFAULT_ENGINE_CONFIG, 0.7);
  }

  // Save calibrated config as current active engine config
  updateEngineConfig(bestConfig);

  return {
    bestConfig,
    bestBacktest: bestBacktestResult,
    testedCount: count,
  };
}
