
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  TrendingUp, 
  Zap, 
  LogOut,
  Settings,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  Edit2
} from 'lucide-react';
import { storageService } from './services/storageService';
import { Trade, DashboardStats } from './types';
import TradeForm from './components/TradeForm';
import TradeTable from './components/TradeTable';
import Dashboard from './components/Dashboard';
import PerformanceCharts from './components/PerformanceCharts';
import AIInsights from './components/AIInsights';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'journal' | 'charts' | 'ai'>('dashboard');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

  useEffect(() => {
    setTrades(storageService.getTrades());
  }, []);

  const handleAddTrade = (trade: Trade) => {
    storageService.saveTrade(trade);
    setTrades(storageService.getTrades());
    setShowForm(false);
    setEditingTrade(null);
  };

  const handleDeleteTrade = (id: string) => {
    if (window.confirm('Are you sure you want to delete this trade?')) {
      storageService.deleteTrade(id);
      setTrades(storageService.getTrades());
    }
  };

  const handleEditTrade = (trade: Trade) => {
    setEditingTrade(trade);
    setShowForm(true);
  };

  const stats = useMemo<DashboardStats>(() => {
    const closedTrades = trades.filter(t => t.status === 'CLOSED');
    const totalPnl = closedTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);
    const winners = closedTrades.filter(t => (t.pnl || 0) > 0);
    const winRate = closedTrades.length > 0 ? (winners.length / closedTrades.length) * 100 : 0;
    
    const profits = winners.map(t => t.pnl || 0);
    const losses = closedTrades.filter(t => (t.pnl || 0) <= 0).map(t => Math.abs(t.pnl || 0));
    
    const avgProfit = profits.length > 0 ? profits.reduce((a, b) => a + b, 0) / profits.length : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : 0;
    
    const totalProfit = profits.reduce((a, b) => a + b, 0);
    const totalLoss = losses.reduce((a, b) => a + b, 0);
    const profitFactor = totalLoss !== 0 ? totalProfit / totalLoss : totalProfit > 0 ? 100 : 0;

    return {
      totalPnl,
      winRate,
      totalTrades: trades.length,
      avgProfit,
      avgLoss,
      profitFactor,
      maxDrawdown: 0 // Simplification for MVP
    };
  }, [trades]);

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'journal', icon: History, label: 'Trade Journal' },
    { id: 'charts', icon: TrendingUp, label: 'Analytics' },
    { id: 'ai', icon: Zap, label: 'AI Coach' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900 flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
            <TrendingUp className="text-white" size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">TradeLog AI</h1>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 transition-all">
            <Settings size={20} />
            <span className="font-medium">Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-20 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-semibold capitalize">{activeTab}</h2>
            <p className="text-xs text-slate-500">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                setEditingTrade(null);
                setShowForm(true);
              }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg font-semibold transition-all shadow-lg shadow-indigo-600/20"
            >
              <PlusCircle size={20} />
              New Trade
            </button>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-950/50">
          <div className="max-w-7xl mx-auto space-y-8">
            {activeTab === 'dashboard' && (
              <Dashboard stats={stats} trades={trades} />
            )}
            {activeTab === 'journal' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold">Trading Log</h3>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input 
                        type="text" 
                        placeholder="Search assets..." 
                        className="bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
                      />
                    </div>
                    <button className="p-2 bg-slate-900 border border-slate-700 rounded-lg hover:bg-slate-800">
                      <Filter size={18} />
                    </button>
                  </div>
                </div>
                <TradeTable 
                  trades={trades} 
                  onDelete={handleDeleteTrade} 
                  onEdit={handleEditTrade} 
                />
              </div>
            )}
            {activeTab === 'charts' && (
              <PerformanceCharts trades={trades} />
            )}
            {activeTab === 'ai' && (
              <AIInsights trades={trades} />
            )}
          </div>
        </div>
      </main>

      {/* Modal for Trade Form */}
      {showForm && (
        <TradeForm 
          onSubmit={handleAddTrade} 
          onClose={() => {
            setShowForm(false);
            setEditingTrade(null);
          }}
          initialData={editingTrade}
        />
      )}
    </div>
  );
};

export default App;
