import React, { useState, useEffect, useMemo } from 'https://esm.sh/react@19.2.3';
import { createRoot } from 'https://esm.sh/react-dom@19.2.3/client';
import { GoogleGenAI } from "https://esm.sh/@google/genai@1.34.0";
import { 
  LayoutDashboard, History, BarChart3, Zap, ShieldAlert, Plus, 
  TrendingUp, ArrowUpRight, ArrowDownRight, Trash2, Edit3, X, Search, Menu 
} from 'https://esm.sh/lucide-react@0.475.0';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Cell 
} from 'https://esm.sh/recharts@2.15.1';

const App = () => {
  // --- Hash Routing ---
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace('#/', '');
    return hash || 'dashboard';
  });

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#/', '');
      setActiveTab(hash || 'dashboard');
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const navigate = (tab) => {
    window.location.hash = `#/${tab}`;
  };

  // --- State & Storage ---
  const [trades, setTrades] = useState(() => {
    const saved = localStorage.getItem('tradelog_trades');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('tradelog_trades', JSON.stringify(trades));
  }, [trades]);

  const [showModal, setShowModal] = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // --- Calculations ---
  const stats = useMemo(() => {
    const closed = trades.filter(t => t.exitPrice !== null);
    let totalPnl = 0;
    let wins = 0;
    closed.forEach(t => {
      const pnl = (t.exitPrice - t.entryPrice) * t.qty * (t.side === 'LONG' ? 1 : -1);
      totalPnl += pnl;
      if (pnl > 0) wins++;
    });
    return {
      totalPnl,
      winRate: closed.length > 0 ? (wins / closed.length) * 100 : 0,
      totalTrades: trades.length,
      balance: 100000 + totalPnl
    };
  }, [trades]);

  // --- Handlers ---
  const saveTrade = (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const trade = {
      id: editingTrade?.id || Math.random().toString(36).substr(2, 9),
      symbol: fd.get('symbol').toUpperCase(),
      side: fd.get('side'),
      entryPrice: parseFloat(fd.get('entryPrice')),
      exitPrice: fd.get('exitPrice') ? parseFloat(fd.get('exitPrice')) : null,
      qty: parseFloat(fd.get('qty')),
      date: fd.get('date'),
      strategy: fd.get('strategy'),
      notes: fd.get('notes')
    };
    if (editingTrade) {
      setTrades(prev => prev.map(t => t.id === editingTrade.id ? trade : t));
    } else {
      setTrades(prev => [...prev, trade]);
    }
    setShowModal(false);
    setEditingTrade(null);
  };

  const runAudit = async () => {
    if (trades.length < 3) return alert("Log 3 trades first.");
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze trade behavior: ${JSON.stringify(trades.slice(-5))}. Focus on edge and risk.`,
      });
      setAiAnalysis(res.text);
    } catch (e) {
      setAiAnalysis("Audit failed. System connection error.");
    } finally { setIsAiLoading(false); }
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col p-8 lg:translate-x-0 -translate-x-full fixed lg:static transition-all z-50">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg"><TrendingUp size={20} /></div>
          <h1 className="text-xl font-black uppercase">Trade<span className="text-indigo-400">Log</span></h1>
        </div>
        <nav className="flex-1 space-y-2">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'journal', icon: History, label: 'Journal' },
            { id: 'ai', icon: Zap, label: 'AI Coach' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              <item.icon size={20} /> {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto custom-scroll p-10 animate-fade">
        <header className="flex justify-between items-center mb-12">
          <h2 className="text-2xl font-black uppercase tracking-widest">{activeTab}</h2>
          <button onClick={() => { setEditingTrade(null); setShowModal(true); }} className="bg-indigo-600 px-8 py-3.5 rounded-2xl font-black shadow-lg hover:bg-indigo-500 active:scale-95 transition-all">NEW TRADE</button>
        </header>

        {activeTab === 'dashboard' && (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { l: 'Balance', v: `$${stats.balance.toLocaleString()}`, c: 'text-white' },
                { l: 'Win Rate', v: `${stats.winRate.toFixed(1)}%`, c: 'text-indigo-400' },
                { l: 'Net P&L', v: `${stats.totalPnl >= 0 ? '+' : ''}$${stats.totalPnl.toLocaleString()}`, c: stats.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400' },
                { l: 'Trades', v: stats.totalTrades, c: 'text-slate-400' }
              ].map((k, i) => (
                <div key={i} className="glass-card p-8 rounded-3xl">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{k.l}</p>
                  <p className={`text-3xl font-black ${k.c}`}>{k.v}</p>
                </div>
              ))}
            </div>

            <div className="glass-card rounded-[2.5rem] p-10">
              <h4 className="text-xs font-black text-slate-500 uppercase mb-8">Equity Growth</h4>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trades.filter(t => t.exitPrice).map((t, i) => ({ t: i + 1, p: (t.exitPrice - t.entryPrice) * t.qty }))}>
                    <CartesianGrid stroke="#1e293b" strokeDasharray="5 5" vertical={false} />
                    <XAxis dataKey="t" hide />
                    <YAxis stroke="#475569" fontSize={12} tickFormatter={v => `$${v}`} />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} />
                    <Line type="monotone" dataKey="p" stroke="#6366f1" strokeWidth={4} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'journal' && (
          <div className="glass-card rounded-[2.5rem] overflow-hidden">
            <div className="p-10 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-black">ORDER HISTORY</h3>
              <div className="w-64 bg-slate-900 rounded-xl px-4 py-2 border border-slate-800 flex items-center gap-3">
                <Search size={18} className="text-slate-500" />
                <input placeholder="Search..." className="bg-transparent border-none outline-none text-sm w-full" />
              </div>
            </div>
            <table className="w-full text-left">
              <thead className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-800/20">
                <tr><th className="px-10 py-6">Asset</th><th className="px-10 py-6">Side</th><th className="px-10 py-6">Entry</th><th className="px-10 py-6 text-right">P&L</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {trades.map(t => (
                  <tr key={t.id} className="hover:bg-slate-800/10 cursor-pointer" onClick={() => { setEditingTrade(t); setShowModal(true); }}>
                    <td className="px-10 py-6 font-bold">{t.symbol}</td>
                    <td className="px-10 py-6"><span className={`px-3 py-1 rounded-lg text-[9px] font-black ${t.side === 'LONG' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>{t.side}</span></td>
                    <td className="px-10 py-6 text-sm text-slate-400">${t.entryPrice.toLocaleString()}</td>
                    <td className="px-10 py-6 text-right font-black">$...</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-12">
            <div className="bg-indigo-600 rounded-[3rem] p-16 text-center shadow-2xl relative overflow-hidden">
              <Zap size={64} className="mx-auto mb-8 text-indigo-100" />
              <h3 className="text-4xl font-black mb-4">AI TERMINAL AUDIT</h3>
              <p className="text-indigo-100 opacity-80 mb-12 max-w-xl mx-auto font-medium">Quantify your edge and identify behavioral risk leakage using Gemini.</p>
              <button onClick={runAudit} disabled={isAiLoading} className="bg-white text-indigo-600 px-12 py-5 rounded-3xl font-black text-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
                {isAiLoading ? 'PROCESSING...' : 'RUN AUDIT'}
              </button>
            </div>
            {aiAnalysis && (
              <div className="glass-card rounded-[3rem] p-16 animate-fade">
                <p className="whitespace-pre-wrap leading-relaxed text-slate-300 font-medium">{aiAnalysis}</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Entry Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden p-10 animate-fade">
            <header className="flex justify-between items-center mb-10">
              <h3 className="text-xl font-black uppercase">Execution Commit</h3>
              <button onClick={() => setShowModal(false)}><X size={32} className="text-slate-500" /></button>
            </header>
            <form onSubmit={saveTrade} className="space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <input name="symbol" defaultValue={editingTrade?.symbol} placeholder="SYMBOL" required className="bg-slate-800 border-none rounded-2xl px-6 py-4 font-bold outline-none ring-2 ring-transparent focus:ring-indigo-500" />
                <select name="side" defaultValue={editingTrade?.side || 'LONG'} className="bg-slate-800 border-none rounded-2xl px-6 py-4 font-bold outline-none">
                  <option value="LONG">LONG</option><option value="SHORT">SHORT</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <input type="number" step="any" name="entryPrice" defaultValue={editingTrade?.entryPrice} placeholder="ENTRY" required className="bg-slate-800 border-none rounded-2xl px-6 py-4 font-bold outline-none" />
                <input type="number" step="any" name="qty" defaultValue={editingTrade?.qty} placeholder="QTY" required className="bg-slate-800 border-none rounded-2xl px-6 py-4 font-bold outline-none" />
              </div>
              <input type="date" name="date" defaultValue={editingTrade?.date || new Date().toISOString().split('T')[0]} className="w-full bg-slate-800 border-none rounded-2xl px-6 py-4 font-bold outline-none" />
              <button type="submit" className="w-full bg-indigo-600 py-5 rounded-2xl font-black text-lg">SAVE RECORD</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

createRoot(document.getElementById('root')).render(<App />);