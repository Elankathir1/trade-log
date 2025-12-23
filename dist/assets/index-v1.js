import React, { useState, useEffect, useMemo } from 'https://esm.sh/react@19.2.3';
import { createRoot } from 'https://esm.sh/react-dom@19.2.3/client';
import { GoogleGenAI } from "https://esm.sh/@google/genai@1.34.0";
// Note: In a real Vite build, these would be local chunks.
// Here they are bundled as ESM imports for the simulation.

const App = () => {
  // Hash Routing Logic
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace('#/', '');
    return hash || 'dashboard';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '');
      setActiveTab(hash || 'dashboard');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (tab) => {
    window.location.hash = `#/${tab}`;
  };

  const [trades, setTrades] = useState(() => {
    const saved = localStorage.getItem('tradelog_trades');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('tradelog_trades', JSON.stringify(trades));
  }, [trades]);

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Simulation of Sidebar */}
      <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col p-6">
        <h1 className="text-xl font-black uppercase mb-10">Trade<span className="text-indigo-500">Log</span></h1>
        <nav className="space-y-2">
          {['dashboard', 'journal', 'analytics', 'ai'].map(tab => (
            <button 
              key={tab}
              onClick={() => navigate(tab)}
              style={{
                width: '100%', textAlign: 'left', padding: '12px 20px', borderRadius: '12px',
                background: activeTab === tab ? '#4f46e5' : 'transparent',
                color: activeTab === tab ? 'white' : '#94a3b8',
                fontWeight: 'bold', border: 'none', cursor: 'pointer', transition: '0.2s'
              }}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Container */}
      <main className="flex-1 p-10 overflow-y-auto custom-scroll animate-in">
        <div className="max-w-6xl mx-auto">
          <header className="flex justify-between items-center mb-10">
            <h2 className="text-2xl font-black uppercase tracking-widest">{activeTab}</h2>
            <button className="bg-indigo-600 px-6 py-3 rounded-xl font-bold">New Trade</button>
          </header>

          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="glass-card p-8 rounded-2xl">
                <p className="text-xs font-bold text-slate-500 mb-2">EQUITY</p>
                <p className="text-3xl font-black">$100,000.00</p>
              </div>
              <div className="glass-card p-8 rounded-2xl">
                <p className="text-xs font-bold text-slate-500 mb-2">WIN RATE</p>
                <p className="text-3xl font-black text-indigo-500">0.0%</p>
              </div>
              <div className="glass-card p-8 rounded-2xl">
                <p className="text-xs font-bold text-slate-500 mb-2">TOTAL P&L</p>
                <p className="text-3xl font-black text-emerald-400">+$0.00</p>
              </div>
              <div className="glass-card p-8 rounded-2xl">
                <p className="text-xs font-bold text-slate-500 mb-2">TRADES</p>
                <p className="text-3xl font-black text-sky-400">0</p>
              </div>
            </div>
          )}

          {activeTab === 'journal' && (
             <div className="glass-card rounded-2xl p-6 text-center py-20">
               <p className="text-slate-500 italic">No executions found in local archive.</p>
             </div>
          )}
          
          {activeTab === 'ai' && (
             <div className="glass-card rounded-3xl p-16 text-center bg-indigo-600/10 border-indigo-500/20">
               <h3 className="text-3xl font-black mb-4">AI AUDITOR</h3>
               <p className="text-slate-400 mb-8 max-w-lg mx-auto">Run a quantitative audit on your trading psychology and performance drift using Gemini.</p>
               <button className="bg-white text-indigo-900 px-10 py-4 rounded-xl font-black">START AUDIT</button>
             </div>
          )}
        </div>
      </main>
    </div>
  );
};

createRoot(document.getElementById('root')).render(React.createElement(App));