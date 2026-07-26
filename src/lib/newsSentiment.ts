import { GoogleGenAI, Type } from '@google/genai';
import { MacroDriverSummary, NewsItem, NewsSentimentAnalysis } from '../types';

export const INITIAL_NEWS_ITEMS: NewsItem[] = [
  {
    id: 'news-1',
    title: 'Fed Rate Cut Expectations Firm Up Following Cool Core PCE Inflation Data',
    source: 'Federal Reserve Wire',
    timestamp: Date.now() - 1000 * 60 * 18,
    timeAgo: '18m ago',
    category: 'FED_POLICY',
    sentiment: 'BULLISH',
    score: 82,
    impact: 'HIGH',
    summary: 'Core PCE price index rose 0.2% month-over-month, matching estimates and keeping 25bps September rate cut odds at 88%. Real yields eased 6bps.',
    goldEffect: 'Lower US real yields reduce the opportunity cost of holding non-yielding Gold bullion, providing strong upward structural tailwinds.',
  },
  {
    id: 'news-2',
    title: 'US Dollar Index (DXY) Slides Below 103.50 Support as Treasury Yields Flatten',
    source: 'Bloomberg FX',
    timestamp: Date.now() - 1000 * 60 * 42,
    timeAgo: '42m ago',
    category: 'DXY_DOLLAR',
    sentiment: 'BULLISH',
    score: 68,
    impact: 'HIGH',
    summary: 'The Greenback retreats across major currency pairs as 10-year Treasury yields drop to 4.18%, breaking a 4-day technical consolidation channel.',
    goldEffect: 'Dollar weakness makes dollar-denominated Gold cheaper for international buyers, accelerating spot buying momentum above key technical resistance.',
  },
  {
    id: 'news-3',
    title: 'Geopolitical Safe-Haven Demand Surges Amid Middle East Escalation Headlines',
    source: 'Reuters Intelligence',
    timestamp: Date.now() - 1000 * 60 * 85,
    timeAgo: '1h 25m ago',
    category: 'GEOPOLITICS',
    sentiment: 'BULLISH',
    score: 91,
    impact: 'HIGH',
    summary: 'Renewed maritime tension in critical trade corridors drives institutional risk hedging across commodities and sovereign bonds.',
    goldEffect: 'Classic safe-haven inflow premium adds immediate spot support, insulating Gold from temporary intra-day equities spikes.',
  },
  {
    id: 'news-4',
    title: 'Central Bank Gold Reserve Buying Reaches Record Q2 Pace Led by Sovereign Vaults',
    source: 'World Gold Council',
    timestamp: Date.now() - 1000 * 60 * 180,
    timeAgo: '3h ago',
    category: 'CENTRAL_BANKS',
    sentiment: 'BULLISH',
    score: 75,
    impact: 'MEDIUM',
    summary: 'Global central banks reported 183 metric tonnes of net official sector acquisitions in Q2, reinforcing structural long-term floor demand.',
    goldEffect: 'Persistent sovereign accumulation establishes a strong structural price floor, neutralizing minor speculative profit-taking dips.',
  },
  {
    id: 'news-5',
    title: 'US ISM Manufacturing PMI Unexpectedly Rebounds to 50.8, Capping Dollar Losses',
    source: 'Financial Times',
    timestamp: Date.now() - 1000 * 60 * 310,
    timeAgo: '5h ago',
    category: 'INFLATION',
    sentiment: 'BEARISH',
    score: -45,
    impact: 'MEDIUM',
    summary: 'New orders and prices-paid sub-indices expand slightly above consensus, tempering aggressive multi-cut Fed expectations in the short term.',
    goldEffect: 'Temporarily triggers intraday pullback in spot Gold as short-term traders take profits near high-extension order blocks.',
  },
  {
    id: 'news-6',
    title: 'Global ETF Inflows into Gold Products Turn Positive After 4 Months of Outflows',
    source: 'Morningstar Commodities',
    timestamp: Date.now() - 1000 * 60 * 480,
    timeAgo: '8h ago',
    category: 'YIELDS',
    sentiment: 'BULLISH',
    score: 62,
    impact: 'LOW',
    summary: 'Western physically-backed Gold ETFs recorded +$1.4B in net creations last week, signaling retail and wealth manager participation returning.',
    goldEffect: 'Broadens market liquidity base and strengthens bullish trend continuity across higher timeframes (4H & Daily).',
  },
];

export const INITIAL_MACRO_DRIVERS: MacroDriverSummary[] = [
  {
    category: 'FED_POLICY',
    label: 'Fed Interest Rate Trajectory',
    status: 'Easing Cycle Anticipated',
    bias: 'BULLISH',
    score: 80,
    keyFactor: '88% market implied probability of 25bps Sep rate cut',
  },
  {
    category: 'DXY_DOLLAR',
    label: 'US Dollar Index (DXY)',
    status: 'Bearish Breakdown Below 103.50',
    bias: 'BULLISH',
    score: 70,
    keyFactor: 'Multi-week consolidation channel broken down',
  },
  {
    category: 'GEOPOLITICS',
    label: 'Global Geopolitical Risk',
    status: 'Elevated Risk Premium',
    bias: 'BULLISH',
    score: 88,
    keyFactor: 'Active institutional safe-haven hedging',
  },
  {
    category: 'CENTRAL_BANKS',
    label: 'Central Bank Accumulation',
    status: 'Record Sovereign Buying',
    bias: 'BULLISH',
    score: 75,
    keyFactor: '183 tonnes net Q2 additions to official reserves',
  },
];

export async function analyzeNewsSentiment(
  aiClient?: GoogleGenAI | null,
  activeSignalDirection?: string,
  timeframe: string = '15m'
): Promise<NewsSentimentAnalysis> {
  const newsList = INITIAL_NEWS_ITEMS;
  const drivers = INITIAL_MACRO_DRIVERS;

  // Calculate scores
  const totalScore = newsList.reduce((acc, curr) => acc + curr.score, 0);
  const avgScore = Math.round(totalScore / newsList.length);

  const bullishCount = newsList.filter((n) => n.sentiment === 'BULLISH').length;
  const bearishCount = newsList.filter((n) => n.sentiment === 'BEARISH').length;
  const neutralCount = newsList.filter((n) => n.sentiment === 'NEUTRAL').length;
  const total = newsList.length;

  const bullishPercentage = Math.round((bullishCount / total) * 100);
  const bearishPercentage = Math.round((bearishCount / total) * 100);
  const neutralPercentage = Math.round((neutralCount / total) * 100);

  let overallBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'BULLISH';
  if (avgScore > 20) overallBias = 'BULLISH';
  else if (avgScore < -20) overallBias = 'BEARISH';
  else overallBias = 'NEUTRAL';

  let aiMacroSummary =
    'Macroeconomic news drivers strongly favor Gold (XAUUSD) upside. Dovish Federal Reserve rate expectations, falling US real Treasury yields, and persistent central bank reserve accumulation form a powerful structural bullish backdrop.';
  
  let confluenceWithQuant =
    `Macro sentiment (+${avgScore} Net Score) aligns strongly with active ${timeframe} technical structure. Dovish yield expectations provide fundamental backing to technical breakout patterns.`;

  if (aiClient) {
    try {
      const prompt = `
You are an elite Senior Macroeconomic Strategist and Gold (XAUUSD) Sentiment Analyst at a top quantitative hedge fund.
Analyze the following macroeconomic news events and macro drivers impacting Gold:

=== LATEST NEWS ARTICLES ===
${JSON.stringify(
  newsList.map((n) => ({ title: n.title, source: n.source, category: n.category, summary: n.summary })),
  null,
  2
)}

=== TECHNICAL QUANT SIGNAL CONTEXT ===
Active Quant Technical Signal Direction: ${activeSignalDirection || 'BUY'} on ${timeframe} timeframe.

=== INSTRUCTIONS ===
1. Synthesize a concise, authoritative 2-3 sentence AI Macro Summary explaining the net impact of Fed monetary policy, DXY dollar index movements, and real yields on spot Gold bullion.
2. Evaluate Macro-Technical Confluence: Explain in 2 sentences whether current macroeconomic news sentiment reinforces or contradicts the active ${activeSignalDirection || 'BUY'} quantitative technical signal.
3. Keep tone professional, precise, and institutional.
`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              aiMacroSummary: { type: Type.STRING },
              confluenceWithQuant: { type: Type.STRING },
            },
            required: ['aiMacroSummary', 'confluenceWithQuant'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      if (parsed.aiMacroSummary) aiMacroSummary = parsed.aiMacroSummary;
      if (parsed.confluenceWithQuant) confluenceWithQuant = parsed.confluenceWithQuant;
    } catch (err) {
      console.warn('Gemini API AI news sentiment analysis call failed, using quantitative fallback:', err);
    }
  }

  return {
    timestamp: Date.now(),
    overallSentimentScore: avgScore,
    overallBias,
    bullishPercentage,
    bearishPercentage,
    neutralPercentage,
    aiMacroSummary,
    confluenceWithQuant,
    drivers,
    news: newsList,
  };
}
