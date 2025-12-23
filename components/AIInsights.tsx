
import React, { useState } from 'react';
import { Zap, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { Trade } from '../types';

interface AIInsightsProps {
  trades: Trade[];
}

const AIInsights: React.FC<AIInsightsProps> = ({ trades }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (trades.length < 3) {
      alert("Please log at least 3 trades for a meaningful analysis.");
      return;
    }
    
    setLoading(true);
    try {
      const result = await geminiService.analyzeJournal(trades);
      setAnalysis(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-600/30">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl">
            <Sparkles size={48} className="text-indigo-200" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-3xl font-bold mb-2">AI Trading Coach</h3>
            <p className="text-indigo-100 max-w-xl text-lg">
              Get institutional-grade insights into your trading performance. Gemini analyzes your data, notes, and behavior to help you scale your edge.
            </p>
          </div>
          <button 
            onClick={handleAnalyze}
            disabled={loading || trades.length === 0}
            className="whitespace-nowrap bg-white text-indigo-600 hover:bg-indigo-50 px-8 py-4 rounded-2xl font-bold transition-all shadow-xl flex items-center gap-3 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : <Zap size={24} />}
            {analysis ? 'Re-analyze Trades' : 'Generate Insights'}
          </button>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl"></div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="animate-spin text-indigo-500" size={48} />
          <p className="text-slate-400 font-medium">Gemini is processing your trading history...</p>
        </div>
      )}

      {analysis && !loading && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 animate-in slide-in-from-bottom-4 duration-500 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Zap size={18} />
            </div>
            <h4 className="text-xl font-bold">Analysis Report</h4>
          </div>
          
          <div className="prose prose-invert prose-indigo max-w-none">
            {analysis.split('\n').map((line, i) => (
              <p key={i} className="mb-2 text-slate-300 leading-relaxed">
                {line.startsWith('#') ? (
                  <span className="text-white font-bold text-lg block mt-6 mb-2">{line.replace(/#/g, '').trim()}</span>
                ) : line.startsWith('-') || line.startsWith('*') ? (
                  <span className="flex gap-2 items-start ml-2">
                    <span className="text-indigo-400 mt-1.5 w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                    {line.substring(1).trim()}
                  </span>
                ) : (
                  line
                )}
              </p>
            ))}
          </div>
          
          <div className="mt-8 pt-8 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <p>Powered by Google Gemini 3 Flash</p>
            <p>Analysis based on {trades.length} trades</p>
          </div>
        </div>
      )}

      {!analysis && !loading && trades.length < 3 && (
        <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-2xl p-12 text-center">
          <p className="text-slate-500">Log at least 3 trades to enable AI coaching insights.</p>
        </div>
      )}
    </div>
  );
};

export default AIInsights;
