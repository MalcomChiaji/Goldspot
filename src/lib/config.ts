import { EngineConfig } from '../types';

export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  atrStopMultiplier: {
    trending: 1.5,
    ranging: 1.0,
    extension: 2.0,
  },
  atrTargetMultiplier: {
    trending: 2.5,
    ranging: 1.5,
    extension: 1.0,
  },
  extensionFadeFactor: 0.6, // scale factor down for overextended counter-trend signals
  minConfidence: 0.55, // 55% minimum threshold for trade signals
  rsiOverbought: 70,
  rsiOversold: 30,
  adxTrendThreshold: 25,
  patternLookback: {
    flag: 20,
    doubleTop: 40,
    bos: 10,
    fvg: 15,
  },
};

let currentConfig: EngineConfig = { ...DEFAULT_ENGINE_CONFIG };

export function getEngineConfig(): EngineConfig {
  return currentConfig;
}

export function updateEngineConfig(partial: Partial<EngineConfig>): EngineConfig {
  currentConfig = {
    ...currentConfig,
    ...partial,
    atrStopMultiplier: {
      ...currentConfig.atrStopMultiplier,
      ...(partial.atrStopMultiplier || {}),
    },
    atrTargetMultiplier: {
      ...currentConfig.atrTargetMultiplier,
      ...(partial.atrTargetMultiplier || {}),
    },
    patternLookback: {
      ...currentConfig.patternLookback,
      ...(partial.patternLookback || {}),
    },
  };
  return currentConfig;
}

export function resetEngineConfig(): EngineConfig {
  currentConfig = { ...DEFAULT_ENGINE_CONFIG };
  return currentConfig;
}
