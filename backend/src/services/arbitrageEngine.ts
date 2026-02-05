import { ArbitrageOpportunity, PoolData } from '../types';
import { config } from '../config';
import { decisionEngine } from './decisionEngine';
import { executionEngine } from './executionEngine';
import { dataCollector } from './dataCollector';

/**
 * IMPROVED Arbitrage Engine with AI Decision Making
 * No longer uses hardcoded rules - delegates to AI decision engine
 */
export class ArbitrageEngine {
    private opportunities: Map<string, ArbitrageOpportunity> = new Map();
    private executingIds: Set<string> = new Set();

    /**
     * Detect arbitrage opportunities between pools
     * Now uses AI scoring to evaluate opportunities
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

                if (opportunity) {
                    // Score using AI decision engine
                    const score = decisionEngine.scoreOpportunity(opportunity);
                    const risk = decisionEngine.assessRisk(opportunity, score);

                    // AI decides whether to mark as executable
                    const shouldExecute = decisionEngine.shouldExecute(score, risk);

                    if (shouldExecute) {
                        // Optimize trade size using AI
                        const optimizedSize = decisionEngine.optimizeTradeSize(opportunity);
                        opportunity.tradeAmount = optimizedSize;
                        opportunity.shouldExecute = true;

                        newOpportunities.push(opportunity);
                        this.opportunities.set(opportunity.id, opportunity);

                        console.log(`🎯 AI-detected opportunity: ${opportunity.id}`);
                        console.log(`   Score: ${score.overall}/100 | Risk: ${risk.overall.toFixed(1)} | Confidence: ${(score.confidence * 100).toFixed(1)}%`);
                        console.log(`   Profit: $${opportunity.estimatedProfit.toFixed(4)} | Size: $${optimizedSize}`);
                    } else {
                        console.log(`⏭️  AI rejected: ${opportunity.id} (Score: ${score.overall}, Risk: ${risk.overall.toFixed(1)})`);
                    }
                }
            }
        }

        // Clean up old opportunities
        this.cleanupOldOpportunities();

        return newOpportunities;
    }

    /**
     * Analyze a pair of pools for arbitrage opportunity
     * Creates opportunity object - AI will score it later
     */
    private analyzePoolPair(poolA: PoolData, poolB: PoolData): ArbitrageOpportunity | null {
        // Calculate price spread
        const spread = Math.abs(poolA.priceA - poolB.priceA);
        const spreadPercentage = spread / Math.min(poolA.priceA, poolB.priceA);

        // Basic threshold check (AI will do deeper analysis)
        if (spreadPercentage < config.monitoring.minSpreadThreshold * 0.5) {
            return null; // Too small to even consider
        }

        // Calculate estimated profit (approximate)
        const tradeAmount = config.arbitrage.defaultTradeAmount;
        const gasEstimate = 0.001; // Estimated gas cost in SUI
        const flashLoanFee = 0.0009; // 0.09% DeepBook flash loan fee

        // Buy at lower price, sell at higher price
        const buyPrice = Math.min(poolA.priceA, poolB.priceA);
        const sellPrice = Math.max(poolA.priceA, poolB.priceA);

        const grossProfit = tradeAmount * (sellPrice - buyPrice);
        const fees = gasEstimate + (tradeAmount * flashLoanFee);
        const estimatedProfit = grossProfit - fees;

        // Basic profit check
        if (estimatedProfit < 0) {
            return null;
        }

        // Create opportunity object (AI will score it)
        const opportunity: ArbitrageOpportunity = {
            id: `arb_${poolA.poolId}_${poolB.poolId}_${Date.now()}`,
            poolA,
            poolB,
            spread,
            spreadPercentage,
            estimatedProfit,
            tradeAmount,
            gasEstimate,
            shouldExecute: false, // AI will decide
            createdAt: Date.now(),
        };

        return opportunity;
    }

    /**
     * Execute an opportunity autonomously (if autonomous mode enabled)
     */
    async executeOpportunityIfAutonomous(opportunity: ArbitrageOpportunity) {
        if (!config.agent.autonomousMode) {
            console.log('⏸️  Autonomous mode disabled, skipping execution');
            return;
        }

        if (this.executingIds.has(opportunity.id)) {
            console.log('⏭️  Already executing this opportunity');
            return;
        }

        this.executingIds.add(opportunity.id);

        try {
            console.log(`🚀 Executing ${opportunity.id} autonomously...`);

            // Score one more time to ensure it's still valid
            const score = decisionEngine.scoreOpportunity(opportunity);
            const risk = decisionEngine.assessRisk(opportunity, score);

            if (!decisionEngine.shouldExecute(score, risk)) {
                console.log('⏭️  Opportunity no longer valid, skipping');
                return;
            }

            // Execute via execution engine
            const result = await executionEngine.executeArbitrage(
                opportunity,
                opportunity.tradeAmount
            );

            // Record result for learning
            decisionEngine.recordExecution(opportunity, score, result);

            if (result.success) {
                console.log(`✅ Execution successful! Profit: $${result.profit}`);
            } else {
                console.log(`❌ Execution failed: ${result.error}`);
            }

        } catch (error: any) {
            console.error(`💥 Execution error for ${opportunity.id}:`, error);
        } finally {
            this.executingIds.delete(opportunity.id);
        }
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

    /**
     * Get AI decision engine parameters (for monitoring)
     */
    getAIParameters() {
        return decisionEngine.getParameters();
    }

    /**
     * Get execution engine stats
     */
    getExecutionStats() {
        return executionEngine.getStats();
    }
}

// Export singleton instance
export const arbitrageEngine = new ArbitrageEngine();
