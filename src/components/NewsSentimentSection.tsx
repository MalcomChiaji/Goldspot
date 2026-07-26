import React, { useState } from 'react';
import {
  Newspaper,
  Sparkles,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity,
  Filter,
  Search,
  ExternalLink,
  ShieldAlert,
  Globe2,
  DollarSign,
  Landmark,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { NewsItem, NewsSentimentAnalysis, Timeframe } from '../types';

interface NewsSentimentSectionProps {
  sentimentData: NewsSentimentAnalysis | null;
  loading: boolean;
  onRefresh: () => Promise<void>;
  timeframe: Timeframe;
  currentPrice: number;
}

export const NewsSentimentSection: React.FC<NewsSentimentSectionProps> = ({
  sentimentData,
  loading,
  onRefresh,
  timeframe,
  currentPrice,
}) => {
  const [filterSentiment, setFilterSentiment] = useState<'ALL' | 'BULLISH' | 'BEARISH' | 'HIGH_IMPACT'>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!sentimentData) {
    return (
      <div className="bg-white border border-[#1A1A1A] p-8 text-center font-sans space-y-4 my-6">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
        <p className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider font-mono">
          Loading Macroeconomic & News Sentiment Analysis...
        </p>
      </div>
    );
  }

  const {
    overallSentimentScore,
    overallBias,
    bullishPercentage,
    bearishPercentage,
    neutralPercentage,
    aiMacroSummary,
    confluenceWithQuant,
    drivers,
    news,
  } = sentimentData;

  // Filter news
  const filteredNews = news.filter((item) => {
    if (filterSentiment === 'BULLISH' && item.sentiment !== 'BULLISH') return false;
    if (filterSentiment === 'BEARISH' && item.sentiment !== 'BEARISH') return false;
    if (filterSentiment === 'HIGH_IMPACT' && item.impact !== 'HIGH') return false;

    if (filterCategory !== 'ALL' && item.category !== filterCategory) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.source.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'HIGH':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case 'BULLISH':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'BEARISH':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'FED_POLICY':
        return <Landmark className="w-3.5 h-3.5 text-blue-600" />;
      case 'DXY_DOLLAR':
        return <DollarSign className="w-3.5 h-3.5 text-emerald-600" />;
      case 'GEOPOLITICS':
        return <Globe2 className="w-3.5 h-3.5 text-rose-600" />;
      case 'CENTRAL_BANKS':
        return <Landmark className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return <Zap className="w-3.5 h-3.5 text-purple-600" />;
    }
  };

  // Score position calculation (-100 to +100 -> 0% to 100%)
  const gaugePercentage = Math.min(100, Math.max(0, ((overallSentimentScore + 100) / 200) * 100));

  return (
    <div className="bg-white border border-[#1A1A1A] p-6 my-6 space-y-6 font-sans">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#DDD] pb-5 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-[#1A1A1A] text-white text-[10px] uppercase font-mono font-bold tracking-widest flex items-center gap-1">
              <Newspaper className="w-3 h-3 text-amber-400" />
              Macro News & Sentiment Feed
            </span>
            <span className="text-[10px] font-mono font-bold text-[#666] bg-[#EFECE8] border border-[#DDD] px-2 py-0.5">
              Live GC=F (${currentPrice > 0 ? currentPrice.toFixed(2) : '2,742.50'})
            </span>
          </div>
          <p className="text-xs text-[#666] max-w-2xl">
            Real-time macroeconomic news sentiment engine powered by Gemini 3.6 Flash AI. Evaluates central bank communications, interest rate expectations, geopolitical events, and US Dollar movements impacting Gold (XAUUSD).
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="px-4 py-2 bg-[#1A1A1A] text-white font-sans text-xs font-bold uppercase tracking-widest hover:bg-black disabled:opacity-50 transition cursor-pointer flex items-center gap-2 shrink-0 shadow-sm"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
          ) : (
            <Sparkles className="w-4 h-4 text-amber-400" />
          )}
          <span>{loading ? 'Re-Analyzing Sentiment...' : 'Refresh AI Sentiment'}</span>
        </button>
      </div>

      {/* Top Overview: Net Macro Gauge & AI Confluence Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Net Macro Sentiment Score Gauge (5 Cols) */}
        <div className="lg:col-span-5 bg-[#F9F8F6] border border-[#DDD] p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-[#EAE7E2] pb-2">
            <span className="text-xs font-bold uppercase font-mono tracking-wider text-[#1A1A1A]">
              Net Gold Macro Index
            </span>
            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 border ${
                overallSentimentScore >= 0
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border-rose-300'
              }`}
            >
              {overallBias} GOLD ({overallSentimentScore > 0 ? `+${overallSentimentScore}` : overallSentimentScore})
            </span>
          </div>

          {/* Visual Gauge Meter */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-[10px] font-mono text-[#666] uppercase font-bold">
              <span className="text-rose-700">Bearish (-100)</span>
              <span className="text-[#1A1A1A]">Neutral (0)</span>
              <span className="text-emerald-700">Bullish (+100)</span>
            </div>

            <div className="relative w-full h-4 bg-[#EAE7E2] border border-[#CCC] rounded-none overflow-hidden">
              <div
                className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-rose-600 via-amber-400 to-emerald-600 opacity-80"
                style={{ width: '100%' }}
              />
              {/* Pointer Marker */}
              <div
                className="absolute top-0 bottom-0 w-2 bg-black border-x border-white shadow-md transform -translate-x-1/2 transition-all duration-500"
                style={{ left: `${gaugePercentage}%` }}
              />
            </div>

            {/* Proportion Bar */}
            <div className="flex h-2 w-full bg-[#EAE7E2] overflow-hidden border border-[#DDD] mt-3">
              <div
                className="bg-[#059669] h-full"
                style={{ width: `${bullishPercentage}%` }}
                title={`${bullishPercentage}% Bullish News`}
              />
              <div
                className="bg-[#94A3B8] h-full"
                style={{ width: `${neutralPercentage}%` }}
                title={`${neutralPercentage}% Neutral News`}
              />
              <div
                className="bg-[#DC2626] h-full"
                style={{ width: `${bearishPercentage}%` }}
                title={`${bearishPercentage}% Bearish News`}
              />
            </div>

            <div className="flex justify-between text-[10px] font-mono text-[#666] pt-1">
              <span className="flex items-center gap-1 font-bold text-emerald-800">
                <span className="w-2 h-2 rounded-full bg-[#059669]" />
                {bullishPercentage}% Bullish
              </span>
              <span className="flex items-center gap-1 font-bold text-slate-700">
                <span className="w-2 h-2 rounded-full bg-[#94A3B8]" />
                {neutralPercentage}% Neutral
              </span>
              <span className="flex items-center gap-1 font-bold text-rose-800">
                <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
                {bearishPercentage}% Bearish
              </span>
            </div>
          </div>
        </div>

        {/* AI Macro-Technical Confluence Synthesis Box (7 Cols) */}
        <div className="lg:col-span-7 bg-[#F9F8F6] border border-[#DDD] p-5 space-y-3 font-sans">
          <div className="flex items-center justify-between border-b border-[#EAE7E2] pb-2">
            <span className="text-xs font-bold uppercase font-mono tracking-wider text-[#1A1A1A] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Gemini AI Macro Confluence Analysis
            </span>
            <span className="text-[10px] font-mono bg-white border border-[#DDD] px-2 py-0.5 text-[#1A1A1A]">
              Macro/Quant Confluence Active
            </span>
          </div>

          <div className="bg-white border border-[#EAE7E2] p-3.5 text-xs text-[#1A1A1A] leading-relaxed space-y-2">
            <p className="font-semibold text-[#1A1A1A]">{aiMacroSummary}</p>
            <div className="border-t border-[#F0ECE6] pt-2 flex items-start gap-2 text-[11px] text-[#444]">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong className="text-[#1A1A1A]">Quant Confluence: </strong>
                {confluenceWithQuant}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Macro Drivers Matrix */}
      <div>
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#1A1A1A] mb-3">
          Key Macroeconomic Drivers
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
          {drivers.map((driver) => (
            <div key={driver.category} className="bg-[#F9F8F6] border border-[#DDD] p-3.5 space-y-2">
              <div className="flex items-center justify-between border-b border-[#EAE7E2] pb-1.5">
                <div className="flex items-center gap-1.5 font-bold text-[#1A1A1A] text-[11px]">
                  {getCategoryIcon(driver.category)}
                  <span>{driver.label}</span>
                </div>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 border ${
                    driver.bias === 'BULLISH'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border-rose-300'
                  }`}
                >
                  {driver.bias}
                </span>
              </div>

              <div className="space-y-1 text-[11px]">
                <p className="font-bold text-[#1A1A1A]">{driver.status}</p>
                <p className="text-[10px] text-[#666] font-sans leading-snug">{driver.keyFactor}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-t border-b border-[#DDD] py-3 gap-3 font-mono text-xs">
        {/* Sentiment Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase text-[#666] font-bold mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Filter:
          </span>
          {(
            [
              { id: 'ALL', label: 'All Articles' },
              { id: 'BULLISH', label: 'Bullish Gold' },
              { id: 'BEARISH', label: 'Bearish Gold' },
              { id: 'HIGH_IMPACT', label: 'High Impact Only' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterSentiment(tab.id)}
              className={`px-2.5 py-1 text-[10px] uppercase font-bold border transition cursor-pointer ${
                filterSentiment === tab.id
                  ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                  : 'bg-white text-[#666] border-[#DDD] hover:border-[#1A1A1A] hover:text-[#1A1A1A]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#888]" />
          <input
            type="text"
            placeholder="Search news & Fed headlines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F9F8F6] border border-[#DDD] pl-8 pr-3 py-1 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] font-sans"
          />
        </div>
      </div>

      {/* Real-time News Feed Cards */}
      <div className="space-y-4">
        {filteredNews.length > 0 ? (
          filteredNews.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-[#DDD] p-4 hover:border-[#1A1A1A] transition space-y-2.5 font-sans relative"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F0ECE6] pb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Category */}
                  <span className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase text-[#1A1A1A] bg-[#EFECE8] border border-[#DDD] px-2 py-0.5">
                    {getCategoryIcon(item.category)}
                    {item.category.replace('_', ' ')}
                  </span>

                  {/* Impact Tag */}
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 border ${getImpactBadge(item.impact)}`}>
                    {item.impact} IMPACT
                  </span>

                  {/* Source & Time */}
                  <span className="text-[11px] font-mono text-[#666]">{item.source}</span>
                  <span className="text-[10px] font-mono text-[#888]">• {item.timeAgo}</span>
                </div>

                {/* Sentiment Pill */}
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 border flex items-center gap-1 ${getSentimentBadge(
                    item.sentiment
                  )}`}
                >
                  {item.sentiment === 'BULLISH' ? (
                    <TrendingUp className="w-3 h-3 text-emerald-700" />
                  ) : item.sentiment === 'BEARISH' ? (
                    <TrendingDown className="w-3 h-3 text-rose-700" />
                  ) : (
                    <Activity className="w-3 h-3 text-slate-700" />
                  )}
                  <span>
                    {item.sentiment} ({item.score > 0 ? `+${item.score}` : item.score})
                  </span>
                </span>
              </div>

              {/* Title & Summary */}
              <div>
                <h4 className="text-sm font-bold text-[#1A1A1A] leading-snug mb-1 font-sans">{item.title}</h4>
                <p className="text-xs text-[#555] leading-relaxed">{item.summary}</p>
              </div>

              {/* Gold Effect Explanation Box */}
              <div className="bg-[#F9F8F6] border border-[#EAE7E2] p-2.5 text-xs text-[#333] flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#1A1A1A] font-mono text-[10px] uppercase block mb-0.5">
                    Impact on XAUUSD Gold Spot:
                  </strong>
                  <p className="text-[11px] text-[#444] leading-normal">{item.goldEffect}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-[#F9F8F6] border border-[#DDD] p-8 text-center text-xs text-[#666] font-mono">
            No news articles match the selected filter criteria or search query.
          </div>
        )}
      </div>
    </div>
  );
};
