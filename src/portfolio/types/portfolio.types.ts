export interface Account {
  id: string;
  name: string;
  type: 'INDIVIDUAL' | 'CORPORATE';
  balance: number;
  cash: number;
  investedAmount: number;
  totalValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  lastUpdated: string;
}

export interface PortfolioAsset {
  symbol: string;
  name: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  weight: number;
  sector: string;
}

export interface Performance {
  period: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';
  return: number;
  returnPercent: number;
  benchmarkReturn: number;
  benchmarkReturnPercent: number;
  excessReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
}

export interface AssetAllocation {
  assetClass: string;
  amount: number;
  percentage: number;
  change: number;
  changePercent: number;
}

export interface Transaction {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  amount: number;
  date: string;
  fees: number;
}

export interface RiskMetrics {
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  beta: number;
}

export interface PortfolioSummary {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  totalReturn: number;
  totalReturnPercent: number;
  annualizedReturn: number;
  riskMetrics: RiskMetrics;
}

export interface PortfolioData {
  account: Account;
  assets: PortfolioAsset[];
  performance: Performance[];
  allocation: AssetAllocation[];
  recentTransactions: Transaction[];
  summary: PortfolioSummary;
  lastUpdated: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}
