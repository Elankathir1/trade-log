import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  LayoutDashboard, 
  History, 
  BarChart3, 
  Zap, 
  ShieldAlert, 
  Plus, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Trash2, 
  Edit3, 
  X,
  Search,
  Filter,
  Download,
  RefreshCcw,
  Menu
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell,
  PieChart, 
  Pie 
} from 'recharts';
import { GoogleGenAI } from "@google/genai";

// --- Types ---
type Side = 'LONG' | 'SHORT';

interface Trade {
  id: string;
  symbol: string;
  side: Side;
  entryPrice: number;
  exitPrice: number | null;
  qty: number;
  date: string;
  strategy: string;
  notes: string;
}

// --- App Component ---
const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  // --- Initialize ---
  useEffect(() => {
    const saved = localStorage.getItem('tradelog_trades');
    if (saved) {
      try {
        setTrades(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load trades", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('tradelog_trades', JSON.stringify(trades));
  }, [trades]);

  // --- KPI Calculations ---
  const stats = useMemo(() => {
    const closed = trades.filter(t => t.exitPrice !== null);
    let totalPnl = 0;
    let wins = 0;
    
    closed.forEach(t => {
      const pnl = (t.exitPrice! - t.entryPrice) * t.qty * (t.side === 'LONG' ? 1 : -1);
      totalPnl += pnl;
      if (pnl > 0) wins++;
    });

    return {
      totalPnl,
      winRate: closed.length > 0 ? (wins / closed.length) * 100 : 0,
      totalTrades: trades.length,
      profitFactor: 0, // Simplified
      balance: 100000 + totalPnl
    };
  }, [trades]);

  // --- Handlers ---
  const saveTrade = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newTrade: Trade = {
      id: editingTrade?.id || Math.random().toString(36).substring(2, 11),
      symbol: formData.get('symbol') as string,
      side: formData.get('side') as Side,
      entryPrice: parseFloat(formData.get('entryPrice') as string),
      exitPrice: formData.get('exitPrice') ? parseFloat(formData.get('exitPrice') as string) : null,
      qty: parseFloat(formData.get('qty') as string),
      date: formData.get('date') as string,
      strategy: formData.get('strategy') as string,
      notes: formData.get('notes') as string,
    };

    if (editingTrade) {
      setTrades(prev => prev.map(t => t.id === editingTrade.id ? newTrade : t));
    } else {
      setTrades(prev => [...prev, newTrade]);
    }
    setShowTradeModal(false);
    setEditingTrade(null);
  };

  const deleteTrade = (id: string) => {
    if (confirm("Delete execution permanently?")) {
      setTrades(prev => prev.filter(t => t.id !== id));
    }
  };

  const runAiAnalysis = async () => {
    if (trades.length < 3) return alert("Need at least 3 trades for analysis.");
    setIsAiLoading(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze these trades: ${JSON.stringify(trades.slice(-10))}. Provide institutional feedback on risk and strategy. Use Markdown.`,
      });
      setAiAnalysis(response.text || "No insights found.");
    } catch (e) {
      console.error(e);
      setAiAnalysis("Analysis failed. Check your API configuration.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(trades)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tradelog_backup_${Date.now()}.json`;
    a.click();
  };

  // --- Chart Data ---
  const equityData = useMemo(() => {
    let bal = 0;
    return trades.filter(t => t.exitPrice).map((t, i) => {
      bal += (t.exitPrice! - t.entryPrice) * t.qty * (t.side === 'LONG' ? 1 : -1);
      return { trade: i + 1, pnl: bal };
    });
  }, [trades]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#020617]">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-[#0b1120] border-r border-slate-800 flex flex-col transition-transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <TrendingUp size={22} className="text-white" />
          </div>
          <h1 className="text-xl font-extrabold uppercase tracking-tighter">Trade<span className="text-indigo-500">Log</span></h1>
        </div>

        <nav className="flex-1 px-6 py-2 space-y-1 overflow-y-auto custom-scroll">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 ml-4">Terminal</p>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'journal', label: 'Journal', icon: History },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'ai', label: 'AI Coach', icon: Zap },
            { id: 'admin', label: 'Admin', icon: ShieldAlert },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all font-bold ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'}`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 border-b border-slate-800/50 flex items-center justify-between px-8 bg-[#020617]/80 backdrop-blur-xl sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-slate-400"><Menu /></button>
            <h2 className="text-xl font-black uppercase tracking-widest hidden md:block">{activeTab}</h2>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => { setEditingTrade(null); setShowTradeModal(true); }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
            >
              <Plus size={18} /> New Trade
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 custom-scroll">
          <div className="max-w-[1400px] mx-auto space-y-8">
            {activeTab === 'dashboard' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Equity', value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats.balance), color: 'text-white' },
                    { label: 'Win Rate', value: `${stats.winRate.toFixed(1)}%`, color: 'text-indigo-400' },
                    { label: 'Net P&L', value: (stats.totalPnl >= 0 ? '+' : '') + new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats.totalPnl), color: stats.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400' },
                    { label: 'Executions', value: stats.totalTrades, color: 'text-sky-400' },
                  ].map((kpi, idx) => (
                    <div key={idx} className="glass-card p-8 rounded-[2rem]">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">{kpi.label}</p>
                      <p className={`text-3xl font-black tracking-tighter ${kpi.color}`}>{kpi.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 glass-card rounded-[2.5rem] p-10">
                    <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-8">Performance Curve</h4>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={equityData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                          <XAxis dataKey="trade" hide />
                          <YAxis stroke="#475569" fontSize={10} tickFormatter={v => `$${v}`} />
                          <Tooltip 
                            contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                            itemStyle={{ color: '#6366f1' }}
                          />
                          <Line type="monotone" dataKey="pnl" stroke="#6366f1" strokeWidth={3} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="glass-card rounded-[2.5rem] p-10 flex flex-col">
                    <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-8">Recent Feed</h4>
                    <div className="space-y-4 flex-1 overflow-y-auto custom-scroll pr-2">
                      {trades.slice(-5).reverse().map(t => {
                         const pnl = t.exitPrice ? (t.exitPrice - t.entryPrice) * t.qty * (t.side === 'LONG' ? 1 : -1) : null;
                         return (
                           <div key={t.id} className="p-5 bg-slate-800/20 rounded-2xl border border-slate-800/50 flex justify-between items-center">
                             <div>
                               <p className="font-bold text-sm uppercase">{t.symbol}</p>
                               <p className="text-[9px] text-slate-500 font-bold uppercase">{t.date}</p>
                             </div>
                             <p className={`font-black text-sm ${pnl === null ? 'text-slate-400' : (pnl >= 0 ? 'text-emerald-400' : 'text-rose-400')}`}>
                               {pnl !== null ? (pnl >= 0 ? '+' : '') + new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(pnl) : 'OPEN'}
                             </p>
                           </div>
                         );
                      })}
                      {trades.length === 0 && <p className="text-slate-500 text-center italic py-20">Empty.</p>}
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'journal' && (
              <div className="glass-card rounded-[2.5rem] overflow-hidden">
                <div className="p-10 border-b border-slate-800/50 flex flex-col md:flex-row gap-6 justify-between items-center">
                  <h3 className="text-2xl font-black uppercase tracking-tight">Order Archive</h3>
                  <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input type="text" placeholder="Ticker..." className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-1 focus:ring-indigo-500" />
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-800/30 text-[10px] uppercase font-black tracking-widest text-slate-500">
                      <tr>
                        <th className="px-10 py-6">Asset</th>
                        <th className="px-10 py-6">Bias</th>
                        <th className="px-10 py-6">Entry</th>
                        <th className="px-10 py-6">Exit</th>
                        <th className="px-10 py-6 text-right">P&L</th>
                        <th className="px-10 py-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {trades.map(t => {
                        const pnl = t.exitPrice ? (t.exitPrice - t.entryPrice) * t.qty * (t.side === 'LONG' ? 1 : -1) : null;
                        return (
                          <tr key={t.id} className="hover:bg-slate-800/10 transition-colors group">
                            <td className="px-10 py-6 font-bold uppercase tracking-tighter">{t.symbol}</td>
                            <td className="px-10 py-6">
                              <span className={`px-3 py-1 rounded-lg text-[9px] font-black tracking-widest ${t.side === 'LONG' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>{t.side}</span>
                            </td>
                            <td className="px-10 py-6 text-sm font-medium text-slate-400">${t.entryPrice.toLocaleString()}</td>
                            <td className="px-10 py-6 text-sm font-medium text-slate-400">{t.exitPrice ? `$${t.exitPrice.toLocaleString()}` : 'OPEN'}</td>
                            <td className={`px-10 py-6 text-right font-black ${pnl === null ? 'text-slate-500' : (pnl >= 0 ? 'text-emerald-400' : 'text-rose-400')}`}>
                              {pnl !== null ? (pnl >= 0 ? '+' : '') + pnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : '---'}
                            </td>
                            <td className="px-10 py-6 text-right">
                              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setEditingTrade(t); setShowTradeModal(true); }} className="p-2 text-slate-500 hover:text-indigo-400"><Edit3 size={18} /></button>
                                <button onClick={() => deleteTrade(t.id)} className="p-2 text-slate-500 hover:text-rose-500"><Trash2 size={18} /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="space-y-8">
                <div className="bg-gradient-to-br from-indigo-700 via-indigo-800 to-indigo-950 rounded-[3rem] p-16 relative overflow-hidden shadow-2xl">
                  <div className="relative z-10 flex flex-col md:flex-row items-center gap-12 text-center md:text-left">
                    <div className="p-8 bg-white/10 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 shadow-inner">
                      <Zap size={60} className="text-indigo-100" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-4xl font-black mb-4 tracking-tighter uppercase text-white">Institutional Coach</h3>
                      <p className="text-indigo-100 max-w-2xl text-xl font-medium opacity-80 leading-relaxed">Gemini processes your local executions to identify behavioral drift and risk leakage.</p>
                    </div>
                    <button 
                      onClick={runAiAnalysis} 
                      disabled={isAiLoading}
                      className="bg-white text-indigo-900 hover:bg-slate-100 px-12 py-5 rounded-2xl font-black text-lg transition-all shadow-2xl active:scale-95 disabled:opacity-50"
                    >
                      {isAiLoading ? "AUDITING..." : "RUN AUDIT"}
                    </button>
                  </div>
                </div>

                {aiAnalysis && (
                  <div className="glass-card rounded-[3rem] p-16 animate-fade shadow-2xl border-l-8 border-indigo-600">
                    <div className="prose prose-invert prose-indigo max-w-none text-slate-300">
                      <h3 className="text-2xl font-black uppercase mb-8">Performance Report</h3>
                      <div className="whitespace-pre-wrap leading-relaxed">{aiAnalysis}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'admin' && (
              <div className="max-w-xl mx-auto space-y-8">
                {!adminUnlocked ? (
                  <div className="glass-card rounded-[3rem] p-16 text-center shadow-2xl mt-16">
                    <h3 className="text-3xl font-black mb-8 uppercase">System Lock</h3>
                    <input 
                      type="password" 
                      placeholder="Token (pass: 123)"
                      value={passwordInput}
                      onChange={e => setPasswordInput(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-8 py-5 mb-6 text-center outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xl tracking-[0.5em]"
                    />
                    <button 
                      onClick={() => passwordInput === '123' ? setAdminUnlocked(true) : alert("Denied")}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 py-5 rounded-2xl font-black text-lg transition-all active:scale-95 uppercase"
                    >
                      Unlock Portal
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="glass-card p-12 rounded-[2.5rem] shadow-2xl group hover:border-rose-500/30 transition-all">
                      <h4 className="text-xl font-black mb-4 text-rose-500 uppercase">Wipe System</h4>
                      <p className="text-slate-400 mb-10">Permanently clear all local trades.</p>
                      <button onClick={() => { if(confirm("Wipe everything?")) { setTrades([]); setAdminUnlocked(false); } }} className="w-full border border-rose-500/20 py-4 rounded-xl text-rose-500 hover:bg-rose-600 hover:text-white transition-all font-bold uppercase text-xs">Confirm Purge</button>
                    </div>
                    <div className="glass-card p-12 rounded-[2.5rem] shadow-2xl group hover:border-indigo-500/30 transition-all">
                      <h4 className="text-xl font-black mb-4 text-indigo-500 uppercase">Export Archive</h4>
                      <p className="text-slate-400 mb-10">Download localized JSON backup.</p>
                      <button onClick={exportData} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-bold uppercase text-xs transition-all">Generate Backup</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal */}
      {showTradeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-2xl">
          <div className="bg-[#0b1120] border border-slate-800 w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-zoom">
            <div className="p-10 border-b border-slate-800/50 flex items-center justify-between">
              <h3 className="text-2xl font-black uppercase tracking-tight">{editingTrade ? 'Update Order' : 'Commit Order'}</h3>
              <button onClick={() => setShowTradeModal(false)} className="text-slate-500 hover:text-white"><X size={28} /></button>
            </div>
            <form onSubmit={saveTrade} className="p-10 space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Symbol</label>
                  <input name="symbol" defaultValue={editingTrade?.symbol} required className="w-full bg-slate-800 border border-slate-700 rounded-xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500 font-bold uppercase" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Bias</label>
                  <select name="side" defaultValue={editingTrade?.side} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-6 py-4 outline-none font-bold">
                    <option value="LONG">Long</option>
                    <option value="SHORT">Short</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Entry Price</label>
                  <input type="number" step="any" name="entryPrice" defaultValue={editingTrade?.entryPrice} required className="w-full bg-slate-800 border border-slate-700 rounded-xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Exit Price</label>
                  <input type="number" step="any" name="exitPrice" defaultValue={editingTrade?.exitPrice || ''} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Qty</label>
                  <input type="number" step="any" name="qty" defaultValue={editingTrade?.qty} required className="w-full bg-slate-800 border border-slate-700 rounded-xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Date</label>
                  <input type="date" name="date" defaultValue={editingTrade?.date || new Date().toISOString().split('T')[0]} required className="w-full bg-slate-800 border border-slate-700 rounded-xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />
                </div>
              </div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 py-5 rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/30 transition-all uppercase tracking-widest text-white">Commit execution</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<App />);