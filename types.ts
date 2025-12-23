
export type TradeSide = 'LONG' | 'SHORT';
export type TradeStatus = 'OPEN' | 'CLOSED';

export interface Trade {
  id: string;
  symbol: string;
  side: TradeSide;
  status: TradeStatus;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  entryDate: string;
  exitDate?: string;
  fees: number;
  strategy: string;
  notes: string;
  pnl?: number;
  pnlPercentage?: number;
  screenshot?: string;
}

export interface DashboardStats {
  totalPnl: number;
  winRate: number;
  totalTrades: number;
  avgProfit: number;
  avgLoss: number;
  profitFactor: number;
  maxDrawdown: number;
}
