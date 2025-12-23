
import React, { useState, useEffect } from 'react';
import { X, Save, Upload, Image as ImageIcon } from 'lucide-react';
import { Trade, TradeSide, TradeStatus } from '../types';

interface TradeFormProps {
  onSubmit: (trade: Trade) => void;
  onClose: () => void;
  initialData: Trade | null;
}

const TradeForm: React.FC<TradeFormProps> = ({ onSubmit, onClose, initialData }) => {
  const [formData, setFormData] = useState<Partial<Trade>>({
    id: crypto.randomUUID(),
    symbol: '',
    side: 'LONG',
    status: 'CLOSED',
    entryPrice: 0,
    exitPrice: 0,
    quantity: 0,
    entryDate: new Date().toISOString().split('T')[0],
    exitDate: new Date().toISOString().split('T')[0],
    fees: 0,
    strategy: '',
    notes: '',
    screenshot: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, screenshot: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let pnl = 0;
    let pnlPercentage = 0;
    
    if (formData.status === 'CLOSED' && formData.entryPrice && formData.exitPrice && formData.quantity) {
      const multiplier = formData.side === 'LONG' ? 1 : -1;
      pnl = (formData.exitPrice - formData.entryPrice) * formData.quantity * multiplier - (formData.fees || 0);
      pnlPercentage = ((pnl / (formData.entryPrice * formData.quantity)) * 100);
    }

    onSubmit({
      ...formData as Trade,
      pnl,
      pnlPercentage
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xl font-bold">{initialData ? 'Edit Trade' : 'New Trade Entry'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[80vh] space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Symbol</label>
              <input 
                required
                name="symbol"
                value={formData.symbol}
                onChange={handleChange}
                placeholder="e.g. BTCUSDT, TSLA" 
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Side</label>
              <select 
                name="side"
                value={formData.side}
                onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="LONG">Long</option>
                <option value="SHORT">Short</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Entry Price</label>
              <input 
                required
                type="number"
                step="0.00000001"
                name="entryPrice"
                value={formData.entryPrice}
                onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Exit Price</label>
              <input 
                type="number"
                step="0.00000001"
                name="exitPrice"
                value={formData.exitPrice}
                onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Quantity</label>
              <input 
                required
                type="number"
                step="0.00000001"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Entry Date</label>
              <input 
                type="date"
                name="entryDate"
                value={formData.entryDate}
                onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Exit Date</label>
              <input 
                type="date"
                name="exitDate"
                value={formData.exitDate}
                onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Strategy</label>
            <input 
              name="strategy"
              value={formData.strategy}
              onChange={handleChange}
              placeholder="e.g. Mean Reversion, Breakout" 
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Notes</label>
            <textarea 
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="How were you feeling? Why did you enter?" 
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Screenshot / Chart</label>
            <div className="flex items-center gap-4">
              <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-xl p-6 hover:border-indigo-500 hover:bg-slate-800/50 cursor-pointer transition-all">
                <Upload className="text-slate-500 mb-2" size={24} />
                <span className="text-sm text-slate-400">Click to upload chart</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>
              {formData.screenshot && (
                <div className="w-32 h-32 rounded-lg overflow-hidden border border-slate-700 relative group">
                  <img src={formData.screenshot} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, screenshot: '' }))}
                    className="absolute inset-0 bg-slate-950/60 items-center justify-center hidden group-hover:flex text-white"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl border border-slate-700 hover:bg-slate-800 font-semibold transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
            >
              <Save size={20} />
              Save Trade
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TradeForm;
