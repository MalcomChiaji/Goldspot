export type Timeframe = '5m' | '15m' | '1h' | '4h';

export interface Candle {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorValues {
  ema9?: number;
  ema21?: number;
  ema50?: number;
  ema200?: number;
  rsi14?: number;
  macdLine?: number;
  macdSignal?: number;
  macdHist?: number;
  upperBB?: number;
  middleBB?: number;
  lowerBB?: number;
  atr14?: number;
  stochK?: number;
  stochD?: number;
  vwap?: number;
  adx14?: number;
}

export type PatternType =
  | 'HH_HL'
  | 'LH_LL'
  | 'DOUBLE_TOP_M'
  | 'DOUBLE_BOTTOM_W'
  | 'BULL_FLAG'
  | 'BEAR_FLAG'
  | 'BOS'
  | 'ORDER_BLOCK'
  | 'FVG'
  | 'EXTENSION_FADE';

export interface PatternMatch {
  type: PatternType;
  name: string;
  direction: 'BUY' | 'SELL';
  confidence: number;
  description: string;
  priceLevel?: number;
  startIndex?: number;
  endIndex?: number;
}

export type MarketRegime =
  | 'TRENDING_UP'
  | 'TRENDING_DOWN'
  | 'RANGING'
  | 'HIGH_VOLATILITY'
  | 'EXTENSION';

export interface ConfidencePoint {
  time: number;
  score: number;
}

export interface TradeSignal {
  id: string;
  timestamp: number;
  symbol: string;
  timeframe: Timeframe;
  direction: 'BUY' | 'SELL';
  entryPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  estimatedPips: number;
  riskRewardRatio: number;
  confidenceScore: number; // 0 - 100
  confidenceHistory?: number[]; // Historical confidence scores for active timeframe
  regime: MarketRegime;
  patterns: PatternMatch[];
  indicators: IndicatorValues;
  reasoning: string[];
  status: 'ACTIVE' | 'EXPIRED' | 'WIN' | 'LOSS';
}

export interface RegimeMultipliers {
  trending: number;
  ranging: number;
  extension: number;
}

export interface EngineConfig {
  atrStopMultiplier: RegimeMultipliers;
  atrTargetMultiplier: RegimeMultipliers;
  extensionFadeFactor: number; // scales confidence when market is over-extended
  minConfidence: number; // threshold 0-1 (e.g. 0.55 = 55%)
  rsiOverbought: number;
  rsiOversold: number;
  adxTrendThreshold: number;
  patternLookback: {
    flag: number;
    doubleTop: number;
    bos: number;
    fvg: number;
  };
}

export interface BacktestTrade {
  id: string;
  entryTime: number;
  exitTime: number;
  timeframe: Timeframe;
  direction: 'BUY' | 'SELL';
  entryPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  exitPrice: number;
  exitReason: 'TP1' | 'TP2' | 'SL' | 'CLOSE';
  pipsPnL: number;
  percentagePnL: number;
  regime: MarketRegime;
}

export interface EquityPoint {
  time: string;
  timestamp: number;
  equity: number;
  drawdown: number;
  inSample: boolean;
}

export interface MetricSet {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number; // %
  profitFactor: number;
  maxDrawdownPercent: number;
  totalPips: number;
  sharpeRatio: number;
  avgWinPips: number;
  avgLossPips: number;
}

export interface RegimePerformance {
  regime: MarketRegime;
  count: number;
  winRate: number;
  profitFactor: number;
  pips: number;
}

export interface BacktestResult {
  symbol: string;
  timeframe: Timeframe;
  totalTrades: number;
  overall: MetricSet;
  inSample: MetricSet;
  outOfSample: MetricSet;
  equityCurve: EquityPoint[];
  trades: BacktestTrade[];
  regimeBreakdown: RegimePerformance[];
  calibrationWarning: boolean; // true if outOfSample profitFactor < 1.0 or winRate < 45%
  trainRatio: number;
}

export interface ChartImageInput {
  id: string;
  dataUrl: string; // base64 data url
  mimeType: string;
  timeframe: Timeframe;
  label?: string;
}

export interface KeyLevel {
  price: number;
  type: 'SUPPORT' | 'RESISTANCE' | 'ORDER_BLOCK' | 'FVG';
  label: string;
}

export interface ImageAnalysisResult {
  direction: 'BUY' | 'SELL' | 'NEUTRAL';
  entryPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  estimatedPips: number;
  confidence: number; // 0-100
  primaryPatterns: string[];
  keyLevels: KeyLevel[];
  timeframeConfluence: string;
  summary: string;
  fullReasoning: string[];
  analyzedImagesCount: number;
}

export interface AiCalibrationImprovement {
  profitFactorDelta: number;
  winRateDelta: number;
  drawdownDelta: number;
  rationale: string[];
}

export interface AiCalibrationResult {
  id: string;
  timestamp: number;
  timeframe: Timeframe;
  status: 'SUCCESS' | 'OPTIMIZED' | 'NO_CHANGE_NEEDED';
  previousConfig: EngineConfig;
  optimizedConfig: EngineConfig;
  baselineMetrics: MetricSet;
  calibratedMetrics: MetricSet;
  aiDiagnosis: string;
  keyInsights: string[];
  improvements: AiCalibrationImprovement;
  sampledBarsCount: number;
  samplingSummary: string;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  timestamp: number;
  timeAgo: string;
  category: 'FED_POLICY' | 'INFLATION' | 'GEOPOLITICS' | 'DXY_DOLLAR' | 'YIELDS' | 'CENTRAL_BANKS';
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  score: number; // -100 to +100
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  summary: string;
  goldEffect: string;
}

export interface MacroDriverSummary {
  category: string;
  label: string;
  status: string;
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  score: number; // -100 to +100
  keyFactor: string;
}

export interface NewsSentimentAnalysis {
  timestamp: number;
  overallSentimentScore: number; // -100 to +100
  overallBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  bullishPercentage: number;
  bearishPercentage: number;
  neutralPercentage: number;
  aiMacroSummary: string;
  confluenceWithQuant: string;
  drivers: MacroDriverSummary[];
  news: NewsItem[];
}

export type AlertCondition = 'CROSSES_ABOVE' | 'CROSSES_BELOW' | 'ENTRY_POINT' | 'STOP_LOSS' | 'TAKE_PROFIT';

export interface PriceAlert {
  id: string;
  targetPrice: number;
  condition: AlertCondition;
  label: string;
  note?: string;
  createdAt: number;
  triggered: boolean;
  triggeredAt?: number;
  triggeredPrice?: number;
  isHighYield?: boolean; // Highlighted as a key quantitative trade level
  soundEnabled: boolean;
  timeframe?: Timeframe;
}

