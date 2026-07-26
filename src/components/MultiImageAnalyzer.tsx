import React, { useState } from 'react';
import { Upload, X, Eye, Sparkles, ArrowUpRight, ArrowDownRight, Target, Shield, CheckCircle2, Award, Layers, Loader2 } from 'lucide-react';
import { ChartImageInput, ImageAnalysisResult, Timeframe } from '../types';

interface MultiImageAnalyzerProps {
  onAnalyzeImages: (images: ChartImageInput[]) => Promise<ImageAnalysisResult>;
}

export const MultiImageAnalyzer: React.FC<MultiImageAnalyzerProps> = ({ onAnalyzeImages }) => {
  const [images, setImages] = useState<ChartImageInput[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImageAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    if (images.length + files.length > 5) {
      setError('Maximum 5 chart images allowed for analysis');
      return;
    }

    files.forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newImg: ChartImageInput = {
            id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            dataUrl: event.target.result as string,
            mimeType: file.type || 'image/png',
            timeframe: '15m',
            label: file.name,
          };
          setImages((prev) => [...prev, newImg]);
        }
      };
      reader.readAsDataURL(file);
    });
    setError(null);
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const updateImageTimeframe = (id: string, tf: Timeframe) => {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, timeframe: tf } : img))
    );
  };

  const handleRunAnalysis = async () => {
    if (images.length === 0) {
      setError('Please upload at least 1 chart image screenshot');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await onAnalyzeImages(images);
      setResult(res);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Image analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 my-6 font-sans">
      {/* Upload Box */}
      <div className="bg-white border border-[#1A1A1A] p-6">
        <div className="flex items-center justify-between border-b border-[#DDD] pb-3 mb-4">
          <div>
            <h3 className="text-[11px] uppercase tracking-[0.2em] font-sans font-bold text-[#1A1A1A]">
              Multi-Timeframe AI Chart Vision
            </h3>
            <p className="text-xs text-[#666] mt-0.5">
              Upload 1 to 5 chart screenshots (e.g. 5m + 15m + 1h) for AI confluence analysis.
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold px-2.5 py-1 bg-[#EFECE8] text-[#1A1A1A] border border-[#DDD]">
            {images.length}/5 Screenshots
          </span>
        </div>

        {/* Dropzone */}
        {images.length < 5 && (
          <label className="border-2 border-dashed border-[#1A1A1A] bg-[#F9F8F6] p-6 flex flex-col items-center justify-center cursor-pointer group mb-4 transition-colors hover:bg-white">
            <Upload className="w-8 h-8 text-[#1A1A1A] mb-2" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A]">Select or Drag Chart Screenshots</span>
            <span className="text-[10px] text-[#666] mt-0.5 font-mono">PNG, JPG, or WebP format</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}

        {/* Uploaded Thumbnails */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
            {images.map((img, idx) => (
              <div key={img.id} className="relative bg-[#EFECE8] border border-[#DDD] p-2 group">
                <img
                  src={img.dataUrl}
                  alt={`Chart ${idx + 1}`}
                  className="w-full h-24 object-cover border border-[#DDD]"
                />

                <button
                  onClick={() => removeImage(img.id)}
                  className="absolute top-1 right-1 p-1 bg-[#1A1A1A] text-white hover:bg-rose-700 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                <div className="mt-2">
                  <label className="text-[10px] text-[#666] uppercase font-bold block mb-0.5">Chart #{idx + 1} TF:</label>
                  <select
                    value={img.timeframe}
                    onChange={(e) => updateImageTimeframe(img.id, e.target.value as Timeframe)}
                    className="w-full bg-white text-[#1A1A1A] border border-[#1A1A1A] text-xs px-1.5 py-0.5 font-mono font-bold"
                  >
                    <option value="5m">5m</option>
                    <option value="15m">15m</option>
                    <option value="1h">1h</option>
                    <option value="4h">4h</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="p-3 bg-[#DC2626]/10 border border-[#DC2626] text-xs font-bold text-[#DC2626] mb-4">
            {error}
          </div>
        )}

        <button
          onClick={handleRunAnalysis}
          disabled={loading || images.length === 0}
          className="w-full py-3 bg-[#1A1A1A] text-white font-sans font-bold text-xs uppercase tracking-widest cursor-pointer hover:bg-black disabled:opacity-50 transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Analyzing Multi-Chart Confluence...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-400" /> Run AI Chart Vision Analysis
            </>
          )}
        </button>
      </div>

      {/* Analysis Results Display */}
      {result && (
        <div className="bg-white border border-[#1A1A1A] p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-[#DDD] pb-4">
            <div className="flex items-center gap-3">
              <span className={`text-3xl font-serif font-black italic ${
                result.direction === 'BUY' ? 'text-[#059669]' : result.direction === 'SELL' ? 'text-[#DC2626]' : 'text-[#1A1A1A]'
              }`}>
                AI VISION: {result.direction}
              </span>
              <span className="text-xs text-[#666]">
                ({result.analyzedImagesCount} chart view(s))
              </span>
            </div>

            <div className="text-right font-mono">
              <span className="text-[10px] uppercase text-[#666] font-bold block">Confidence</span>
              <span className="text-2xl font-bold text-[#1A1A1A]">{result.confidence}%</span>
            </div>
          </div>

          {/* Trade Plan Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#EFECE8] p-4 border border-[#DDD] font-mono">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#666] block">Entry Price</span>
              <p className="text-base font-bold text-[#1A1A1A] mt-1">${(result.entryPrice || 0).toFixed(2)}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#666] block">Stop Loss</span>
              <p className="text-base font-bold text-[#DC2626] mt-1">${(result.stopLoss || 0).toFixed(2)}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#666] block">Take Profit 1</span>
              <p className="text-base font-bold text-[#059669] mt-1">${(result.takeProfit1 || 0).toFixed(2)}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#666] block">Est. Pips Move</span>
              <p className="text-base font-bold text-[#1A1A1A] mt-1">~{result.estimatedPips} pips</p>
            </div>
          </div>

          {/* Timeframe Confluence */}
          <div className="bg-white border border-[#DDD] p-4">
            <h4 className="text-[10px] uppercase tracking-widest font-bold text-[#1A1A1A] mb-1">
              Timeframe Confluence Assessment
            </h4>
            <p className="text-xs text-[#444] font-sans">{result.timeframeConfluence}</p>
          </div>

          {/* Key Levels */}
          {result.keyLevels && result.keyLevels.length > 0 && (
            <div>
              <h4 className="text-[10px] uppercase tracking-widest font-bold text-[#666] mb-2">
                Key Levels Identified:
              </h4>
              <div className="flex flex-wrap gap-2 font-mono">
                {result.keyLevels.map((lvl, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 text-xs bg-[#EFECE8] text-[#1A1A1A] border border-[#DDD]"
                  >
                    <span className="font-bold">${(lvl.price || 0).toFixed(2)}</span> ({lvl.type}: {lvl.label})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Reasoning */}
          <div className="bg-[#1A1A1A] text-white p-5">
            <h4 className="text-[10px] uppercase tracking-[0.2em] font-sans font-bold opacity-60 mb-2">
              AI Technical Reasoning & Structure Analysis
            </h4>
            <ul className="space-y-1.5 text-xs font-sans opacity-90">
              {result.fullReasoning.map((r, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

