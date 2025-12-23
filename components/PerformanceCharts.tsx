
import React, { useMemo } from 'react';
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
import { Trade } from '../types';

interface PerformanceChartsProps {
  trades: Trade[];
}

const PerformanceCharts: React.FC<PerformanceChartsProps> = ({ trades }) => {
  const closedTrades = useMemo(() => trades.filter(t => t.status === 'CLOSED').sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()), [trades]);

  const equityData = useMemo(() => {
    let runningBalance = 0;
    return closedTrades.map((t, index) => {
      runningBalance += t.pnl || 0;
      return {
        trade: index + 1,
        symbol: t.symbol,
        pnl: runningBalance,
        date: t.entryDate
      };
    });
  }, [closedTrades]);

  const strategyData = useMemo(() => {
    const stats: Record<string, { name: string, value: number, count: number }> = {};
    closedTrades.forEach(t => {
      const s = t.strategy || 'Unknown';
      if (!stats[s]) stats[s] = { name: s, value: 0, count: 0 };
      stats[s].value += t.pnl || 0;
      stats[s].count += 1;
    });
    return Object.values(stats);
  }, [closedTrades]);

  if (trades.length === 0) {
    return (
      <div className="h-96 flex flex-col items-center justify-center bg-slate-900 border border-slate-800 rounded-2xl">
        <p className="text-slate-500">Add some trades to see your performance charts!</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <h4 className="text-lg font-bold mb-6">Equity Curve (Cumulative P&L)</h4>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={equityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="trade" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                itemStyle={{ color: '#818cf8' }}
              />
              <Line 
                type="monotone" 
                dataKey="pnl" 
                stroke="#6366f1" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <h4 className="text-lg font-bold mb-6">Performance by Strategy</h4>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={strategyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#475569" fontSize={12} tickLine={false} />
                <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {strategyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.value >= 0 ? '#10b981' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <h4 className="text-lg font-bold mb-6">Win Rate Breakdown</h4>
          <div className="h-72 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Wins', value: closedTrades.filter(t => (t.pnl || 0) > 0).length },
                    { name: 'Losses', value: closedTrades.filter(t => (t.pnl || 0) <= 0).length }
                  ]}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#f43f5e" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-bold">
                {((closedTrades.filter(t => (t.pnl || 0) > 0).length / closedTrades.length) * 100).toFixed(0)}%
              </span>
              <span className="text-xs text-slate-500 font-medium">WIN RATE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceCharts;
