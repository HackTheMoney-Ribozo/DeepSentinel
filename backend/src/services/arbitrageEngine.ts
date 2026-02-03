import { ArbitrageOpportunity, PoolData } from '../types';
import { config } from '../config';

/**
 * Arbitrage Engine - Rule-based detection
 * Detects profitable arbitrage opportunities between pools
 */
export class ArbitrageEngine {
    private opportunities: Map<string, ArbitrageOpportunity> = new Map();

    /**
     * Detect arbitrage opportunities between pools
     */
    detectOpportunities(pools: PoolData[]): ArbitrageOpportunity[] {
        const newOpportunities: ArbitrageOpportunity[] = [];

        // Compare all pool pairs for same token pairs
        for (let i = 0; i < pools.length; i++) {
            for (let j = i + 1; j < pools.length; j++) {
                const poolA = pools[i];
                const poolB = pools[j];

                // Only compare pools with same token pair
                if (!this.isSameTokenPair(poolA, poolB)) {
                    continue;
                }

                const opportunity = this.analyzePoolPair(poolA, poolB);

                if (opportunity && opportunity.shouldExecute) {
                    newOpportunities.push(opportunity);
                    this.opportunities.set(opportunity.id, opportunity);
                }
            }
        }

        // Clean up old opportunities (older than 30 seconds)
        this.cleanupOldOpportunities();

        return newOpportunities;
    }

    /**
     * Analyze a pair of pools for arbitrage opportunity
     */
    private analyzePoolPair(poolA: PoolData, poolB: PoolData): ArbitrageOpportunity | null {
        // Calculate price spread
        const spread = Math.abs(poolA.priceA - poolB.priceA);
        const spreadPercentage = spread / Math.min(poolA.priceA, poolB.priceA);

        // Rule 1: Spread must be above minimum threshold
        if (spreadPercentage < config.monitoring.minSpreadThreshold) {
            return null;
        }

        // Calculate estimated profit
        const tradeAmount = config.arbitrage.defaultTradeAmount;
        const gasEstimate = 0.001; // Estimated gas cost in SUI
        const flashLoanFee = 0.0009; // 0.09% DeepBook flash loan fee

        // Buy at lower price, sell at higher price
        const buyPrice = Math.min(poolA.priceA, poolB.priceA);
        const sellPrice = Math.max(poolA.priceA, poolB.priceA);

        const grossProfit = tradeAmount * (sellPrice - buyPrice);
        const fees = gasEstimate + (tradeAmount * flashLoanFee);
        const estimatedProfit = grossProfit - fees;

        // Rule 2: Profit must be above minimum threshold
        if (estimatedProfit < config.monitoring.minProfitThreshold) {
            return null;
        }

        // Rule 3: Check liquidity (both pools must have enough)
        const minLiquidity = tradeAmount * 1.1; // 10% buffer
        if (poolA.liquidityA < minLiquidity || poolB.liquidityA < minLiquidity) {
            return null;
        }

        // Rule 4: Slippage check
        const estimatedSlippage = this.estimateSlippage(tradeAmount, poolA, poolB);
        if (estimatedSlippage > config.arbitrage.maxSlippage) {
            return null;
        }

        // Create opportunity object
        const opportunity: ArbitrageOpportunity = {
            id: `arb_${poolA.poolId}_${poolB.poolId}_${Date.now()}`,
            poolA,
            poolB,
            spread,
            spreadPercentage,
            estimatedProfit,
            tradeAmount,
            gasEstimate,
            shouldExecute: true,
            createdAt: Date.now(),
        };

        return opportunity;
    }

    /**
     * Estimate slippage for a trade
     */
    private estimateSlippage(amount: number, poolA: PoolData, poolB: PoolData): number {
        // Simplified slippage calculation
        // In production: Use more sophisticated constant product formula
        const impactA = amount / poolA.liquidityA;
        const impactB = amount / poolB.liquidityB;
        return Math.max(impactA, impactB);
    }

    /**
     * Check if two pools have the same token pair
     */
    private isSameTokenPair(poolA: PoolData, poolB: PoolData): boolean {
        return (
            (poolA.tokenA === poolB.tokenA && poolA.tokenB === poolB.tokenB) ||
            (poolA.tokenA === poolB.tokenB && poolA.tokenB === poolB.tokenA)
        );
    }

    /**
     * Clean up opportunities older than 30 seconds
     */
    private cleanupOldOpportunities() {
        const now = Date.now();
        const maxAge = 30_000; // 30 seconds

        for (const [id, opp] of this.opportunities.entries()) {
            if (now - opp.createdAt > maxAge) {
                this.opportunities.delete(id);
            }
        }
    }

    /**
     * Get all current opportunities
     */
    getOpportunities(): ArbitrageOpportunity[] {
        return Array.from(this.opportunities.values());
    }

    /**
     * Get specific opportunity by ID
     */
    getOpportunity(id: string): ArbitrageOpportunity | undefined {
        return this.opportunities.get(id);
    }

    /**
     * Get opportunity count
     */
    getOpportunityCount(): number {
        return this.opportunities.size;
    }
}

// Export singleton instance
export const arbitrageEngine = new ArbitrageEngine();
