// DeepSentinel Arbitrage Types

export interface PoolPrice {
  poolId: string;
  pair: string;
  baseAsset: string;
  quoteAsset: string;
  bestBid: number;
  bestAsk: number;
  spread: number;
  spreadPercent: number;
  liquidity: number;
  lastUpdate: number;
}

export interface ArbitrageLoop {
  id: string;
  path: string[];
  pathDisplay: string;
  entryPrice: number;
  exitPrice: number;
  grossProfitPercent: number;
  fees: number;
  slippage: number;
  netProfitPercent: number;
  profitabilityScore: number;
  confidence: 'low' | 'medium' | 'high';
  liquidityScore: number;
  riskFactors: string[];
  isViable: boolean;
}

export interface ArbitrageThreshold {
  minNetProfitPercent: number;
  minLiquidityScore: number;
  maxSlippagePercent: number;
  tradingFeePercent: number;
}

export interface PnLSimulation {
  initialCapital: number;
  finalCapital: number;
  netProfit: number;
  profitPercent: number;
  feesPaid: number;
  slippageLoss: number;
  loop: ArbitrageLoop | null;
}

export interface SystemStatus {
  status: 'scanning' | 'opportunity_found' | 'no_opportunity' | 'error';
  message: string;
  lastScan: number;
}
