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

// === AI Agent Types ===

export interface OpportunityScore {
    overall: number;  // 0-100
    spread: number;
    liquidity: number;
    profit: number;
    risk: number;
    confidence: number;  // 0-1
    features: OpportunityFeatures;
}

export interface OpportunityFeatures {
    spreadPercentage: number;
    estimatedProfit: number;
    liquidity: number;
    volatility: number;
    profitToGasRatio: number;
    age: number;
}

export interface RiskProfile {
    overall: number;  // 0-100
    liquidityRisk: number;
    slippageRisk: number;
    gasRisk: number;
    executionRisk: number;
    isAcceptable: boolean;
    warnings: string[];
}

export interface SimulationResult {
    success: boolean;
    estimatedProfit: number;
    estimatedGas: number;
    estimatedSlippage: number;
    warnings: string[];
    error?: string;
}

export interface SafetyCheck {
    passed: boolean;
    dailyLossLimit: boolean;
    positionSizeLimit: boolean;
    consecutiveFailures: boolean;
    circuitBreakerActive: boolean;
    warnings: string[];
}

export interface ExecutionResult {
    success: boolean;
    transactionHash?: string;
    profit?: number;
    gasCost?: number;
    slippage?: number;
    executionTimeMs?: number;
    error?: string;
}
