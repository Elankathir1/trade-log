
import React from 'react';
import { 
  DollarSign, 
  Percent, 
  BarChart3, 
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { DashboardStats, Trade } from '../types';

interface DashboardProps {
  stats: DashboardStats;
  trades: Trade[];
}

const Dashboard: React.FC<DashboardProps> = ({ stats, trades }) => {
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Net P&L" 
          value={formatCurrency(stats.totalPnl)} 
          icon={DollarSign}
          trend={stats.totalPnl >= 0 ? 'up' : 'down'}
          color={stats.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}
        />
        <StatCard 
          title="Win Rate" 
          value={`${stats.winRate.toFixed(1)}%`} 
          icon={Percent}
          color="text-indigo-400"
        />
        <StatCard 
          title="Profit Factor" 
          value={stats.profitFactor.toFixed(2)} 
          icon={Activity}
          color="text-amber-400"
        />
        <StatCard 
          title="Total Trades" 
          value={stats.totalTrades.toString()} 
          icon={BarChart3}
          color="text-sky-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-bold">Recent Trades</h4>
            <button className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">View All</button>
          </div>
          <div className="space-y-4">
            {trades.slice(-5).reverse().map(trade => (
              <div key={trade.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${trade.side === 'LONG' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                    {trade.side === 'LONG' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                  </div>
                  <div>
                    <p className="font-bold">{trade.symbol}</p>
                    <p className="text-xs text-slate-500">{trade.entryDate}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${ (trade.pnl || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    { (trade.pnl || 0) >= 0 ? '+' : '' }{formatCurrency(trade.pnl || 0)}
                  </p>
                  <p className="text-xs text-slate-500">{trade.strategy}</p>
                </div>
              </div>
            ))}
            {trades.length === 0 && (
              <div className="py-12 text-center text-slate-500">
                No trades logged yet. Start your journey today!
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h4 className="text-lg font-bold mb-4">Win/Loss Distribution</h4>
            <div className="flex h-4 w-full rounded-full overflow-hidden bg-slate-800 mb-6">
              <div 
                className="bg-emerald-500 transition-all duration-1000" 
                style={{ width: `${stats.winRate}%` }}
              ></div>
              <div 
                className="bg-rose-500 transition-all duration-1000" 
                style={{ width: `${100 - stats.winRate}%` }}
              ></div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Winners</p>
                <p className="text-xl font-bold text-emerald-400">{trades.filter(t => (t.pnl || 0) > 0).length}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Losses</p>
                <p className="text-xl font-bold text-rose-400">{trades.filter(t => (t.pnl || 0) <= 0 && t.status === 'CLOSED').length}</p>
              </div>
            </div>
          </div>

          <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-6">
            <h4 className="text-lg font-bold text-indigo-400 mb-2">Pro Tip</h4>
            <p className="text-sm text-slate-300">
              "Successful traders focus on the process, not the outcome. Review your journal weekly to identify behavioral patterns that lead to mistakes."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  icon: any;
  trend?: 'up' | 'down';
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, color }) => (
  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl bg-slate-800 ${color}`}>
        <Icon size={20} />
      </div>
      {trend && (
        <span className={`flex items-center text-xs font-bold ${trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
          {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          Active
        </span>
      )}
    </div>
    <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
    <p className={`text-2xl font-bold tracking-tight ${color}`}>{value}</p>
  </div>
);

export default Dashboard;
