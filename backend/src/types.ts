export interface PoolData {
    poolId: string;
    tokenA: string;
    tokenB: string;
    priceA: number;
    priceB: number;
    liquidityA: number;
    liquidityB: number;
    lastUpdate: number;
}

export interface ArbitrageOpportunity {
    id: string;
    poolA: PoolData;
    poolB: PoolData;
    spread: number;
    spreadPercentage: number;
    estimatedProfit: number;
    tradeAmount: number;
    gasEstimate: number;
    shouldExecute: boolean;
    createdAt: number;
}

export interface TradeResult {
    success: boolean;
    transactionHash?: string;
    profit?: number;
    error?: string;
}

export interface VaultStats {
    balance: number;
    totalProfit: number;
    tradeCount: number;
}
