
import { Trade } from '../types';

const STORAGE_KEY = 'tradelog_ai_trades';

export const storageService = {
  getTrades: (): Trade[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveTrade: (trade: Trade): void => {
    const trades = storageService.getTrades();
    const existingIndex = trades.findIndex(t => t.id === trade.id);
    
    if (existingIndex > -1) {
      trades[existingIndex] = trade;
    } else {
      trades.push(trade);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
  },

  deleteTrade: (id: string): void => {
    const trades = storageService.getTrades();
    const filtered = trades.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }
};
