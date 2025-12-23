
import React from 'react';
/* Added History to the import list to resolve JSX component resolution error */
import { Edit2, Trash2, ExternalLink, History } from 'lucide-react';
import { Trade } from '../types';

interface TradeTableProps {
  trades: Trade[];
  onDelete: (id: string) => void;
  onEdit: (trade: Trade) => void;
}

const TradeTable: React.FC<TradeTableProps> = ({ trades, onDelete, onEdit }) => {
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-800/50 border-b border-slate-800 text-slate-400 text-xs uppercase font-bold tracking-wider">
              <th className="px-6 py-4">Symbol</th>
              <th className="px-6 py-4">Side</th>
              <th className="px-6 py-4">Entry</th>
              <th className="px-6 py-4">Exit</th>
              <th className="px-6 py-4">Quantity</th>
              <th className="px-6 py-4">P&L</th>
              <th className="px-6 py-4">Strategy</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {trades.slice().reverse().map(trade => (
              <tr key={trade.id} className="hover:bg-slate-800/30 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="font-bold">{trade.symbol}</span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded uppercase">
                      {trade.status}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${trade.side === 'LONG' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                    {trade.side}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm">
                    <p className="font-medium">{formatCurrency(trade.entryPrice)}</p>
                    <p className="text-xs text-slate-500">{trade.entryDate}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm">
                    <p className="font-medium">{trade.exitPrice ? formatCurrency(trade.exitPrice) : '-'}</p>
                    <p className="text-xs text-slate-500">{trade.exitDate || '-'}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-300">
                  {trade.quantity}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm">
                    <p className={`font-bold ${ (trade.pnl || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      { (trade.pnl || 0) >= 0 ? '+' : '' }{formatCurrency(trade.pnl || 0)}
                    </p>
                    <p className={`text-xs ${ (trade.pnlPercentage || 0) >= 0 ? 'text-emerald-500/60' : 'text-rose-500/60'}`}>
                      { (trade.pnlPercentage || 0).toFixed(2) }%
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-400 truncate max-w-[120px] inline-block">
                    {trade.strategy || 'Unspecified'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => onEdit(trade)}
                      className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => onDelete(trade.id)}
                      className="p-2 hover:bg-rose-500/10 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {trades.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-20 text-center text-slate-500">
                  <div className="flex flex-col items-center">
                    <History size={48} className="mb-4 text-slate-700" />
                    <p className="text-lg font-medium">No trade history yet</p>
                    <p className="text-sm">Logged trades will appear here.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TradeTable;
