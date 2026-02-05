import { ArbitrageOpportunity, PoolData, OpportunityScore, RiskProfile } from '../types';
import { config } from '../config';
import { dataCollector } from './dataCollector';

/**
 * AI Decision Engine
 * Intelligently evaluates arbitrage opportunities using ML-based scoring
 * Replaces hardcoded rules with adaptive decision-making
 */

export class DecisionEngine {
    private executionHistory: ExecutionRecord[] = [];
    private parameters: DynamicParameters;

    constructor() {
        // Initialize with reasonable defaults, will self-optimize
        this.parameters = {
            minSpreadThreshold: config.monitoring.minSpreadThreshold,
            minProfitThreshold: config.monitoring.minProfitThreshold,
            maxSlippage: config.arbitrage.maxSlippage,
            optimalTradeSize: config.arbitrage.defaultTradeAmount,
            riskTolerance: 0.5, // 0-1 scale
        };
    }

    /**
     * Score an arbitrage opportunity using multi-factor analysis
     * Returns score from 0-100 (higher = better opportunity)
     */
    scoreOpportunity(opportunity: ArbitrageOpportunity): OpportunityScore {
        const features = this.extractFeatures(opportunity);

        // Multi-factor scoring model
        const spreadScore = this.scoreSpread(features.spreadPercentage);
        const liquidityScore = this.scoreLiquidity(features.liquidity);
        const profitScore = this.scoreProfit(features.estimatedProfit);
        const volatilityScore = this.scoreVolatility(features.volatility);
        const gasEfficiencyScore = this.scoreGasEfficiency(features.profitToGasRatio);
        const historicalScore = this.scoreHistoricalSuccess(opportunity);

        // Weighted combination
        const weights = {
            spread: 0.20,
            liquidity: 0.20,
            profit: 0.25,
            volatility: 0.10,
            gasEfficiency: 0.15,
            historical: 0.10,
        };

        const totalScore =
            spreadScore * weights.spread +
            liquidityScore * weights.liquidity +
            profitScore * weights.profit +
            volatilityScore * weights.volatility +
            gasEfficiencyScore * weights.gasEfficiency +
            historicalScore * weights.historical;

        return {
            overall: Math.round(totalScore),
            spread: spreadScore,
            liquidity: liquidityScore,
            profit: profitScore,
            risk: 100 - totalScore, // Inverse
            confidence: this.calculateConfidence(features),
            features,
        };
    }

    /**
     * Assess risk for executing this opportunity
     */
    assessRisk(opportunity: ArbitrageOpportunity, score: OpportunityScore): RiskProfile {
        const liquidityRisk = this.assessLiquidityRisk(opportunity);
        const slippageRisk = this.assessSlippageRisk(opportunity);
        const gasRisk = this.assessGasRisk(opportunity);
        const executionRisk = this.assessExecutionRisk(opportunity);

        const overallRisk = (liquidityRisk + slippageRisk + gasRisk + executionRisk) / 4;

        return {
            overall: overallRisk,
            liquidityRisk,
            slippageRisk,
            gasRisk,
            executionRisk,
            isAcceptable: overallRisk <= (this.parameters.riskTolerance * 100),
            warnings: this.generateRiskWarnings(overallRisk, {
                liquidityRisk,
                slippageRisk,
                gasRisk,
                executionRisk,
            }),
        };
    }

    /**
     * Decide whether to execute this opportunity
     * Core AI decision logic
     */
    shouldExecute(score: OpportunityScore, risk: RiskProfile): boolean {
        // Minimum score threshold (adaptive)
        if (score.overall < 60) {
            return false;
        }

        // Risk must be acceptable
        if (!risk.isAcceptable) {
            return false;
        }

        // Confidence threshold
        if (score.confidence < 0.7) {
            return false;
        }

        // Profit must exceed dynamic threshold
        if (score.features.estimatedProfit < this.parameters.minProfitThreshold) {
            return false;
        }

        // All checks passed!
        return true;
    }

    /**
     * Optimize trade size based on liquidity and risk
     */
    optimizeTradeSize(opportunity: ArbitrageOpportunity): number {
        const avgLiquidity = (opportunity.poolA.liquidityA + opportunity.poolB.liquidityA) / 2;

        // Start with configured default
        let optimalSize = this.parameters.optimalTradeSize;

        // Limit to 5% of smallest pool liquidity (safety)
        const maxSafeSize = Math.min(
            opportunity.poolA.liquidityA * 0.05,
            opportunity.poolB.liquidityA * 0.05
        );

        optimalSize = Math.min(optimalSize, maxSafeSize);

        // Further optimize based on historical performance
        const historicalOptimal = this.getHistoricalOptimalSize(
            opportunity.poolA.tokenA,
            opportunity.poolB.tokenB
        );

        if (historicalOptimal > 0) {
            optimalSize = (optimalSize + historicalOptimal) / 2;
        }

        return Math.floor(optimalSize);
    }

    /**
     * Record execution outcome for learning
     */
    recordExecution(
        opportunity: ArbitrageOpportunity,
        score: OpportunityScore,
        result: { success: boolean; profit?: number; error?: string }
    ) {
        const record: ExecutionRecord = {
            timestamp: Date.now(),
            opportunityId: opportunity.id,
            score: score.overall,
            predictedProfit: opportunity.estimatedProfit,
            actualProfit: result.profit || 0,
            success: result.success,
            error: result.error,
            features: score.features,
        };

        this.executionHistory.push(record);
        dataCollector.recordTrade(record);

        // Trigger parameter optimization periodically
        if (this.executionHistory.length % 10 === 0) {
            this.optimizeParameters();
        }
    }

    /**
     * Self-optimize parameters based on historical performance
     */
    private optimizeParameters() {
        if (this.executionHistory.length < 10) {
            return; // Need more data
        }

        const recentHistory = this.executionHistory.slice(-50);

        // Calculate success rate
        const successRate = recentHistory.filter(r => r.success).length / recentHistory.length;

        // Calculate average profit on successful trades
        const successfulTrades = recentHistory.filter(r => r.success && r.actualProfit > 0);
        const avgProfit = successfulTrades.length > 0
            ? successfulTrades.reduce((sum, r) => sum + r.actualProfit, 0) / successfulTrades.length
            : 0;

        // Adjust risk tolerance based on success rate
        if (successRate > 0.8) {
            // Very successful - can be slightly more aggressive
            this.parameters.riskTolerance = Math.min(0.7, this.parameters.riskTolerance + 0.05);
        } else if (successRate < 0.5) {
            // Too many failures - be more conservative
            this.parameters.riskTolerance = Math.max(0.3, this.parameters.riskTolerance - 0.05);
        }

        // Adjust profit threshold based on actual profits
        if (avgProfit > this.parameters.minProfitThreshold * 2) {
            // Can afford to be pickier
            this.parameters.minProfitThreshold *= 1.1;
        } else if (avgProfit < this.parameters.minProfitThreshold * 0.5) {
            // Lower threshold to get more opportunities
            this.parameters.minProfitThreshold *= 0.9;
        }

        console.log(`🔧 Parameters optimized: Success rate ${(successRate * 100).toFixed(1)}%, Avg profit $${avgProfit.toFixed(2)}`);
    }

    // === Scoring Functions ===

    private scoreSpread(spreadPercentage: number): number {
        // Higher spread = better opportunity
        // 0.5% = 50 score, 1% = 75, 2% = 90, 3%+ = 100
        return Math.min(100, (spreadPercentage / 0.03) * 100);
    }

    private scoreLiquidity(liquidity: number): number {
        // Penalize low liquidity
        const optimalLiquidity = this.parameters.optimalTradeSize * 20;
        const ratio = liquidity / optimalLiquidity;
        return Math.min(100, ratio * 100);
    }

    private scoreProfit(profit: number): number {
        // Score based on multiple of threshold
        const multiple = profit / this.parameters.minProfitThreshold;
        return Math.min(100, multiple * 25);
    }

    private scoreVolatility(volatility: number): number {
        // Lower volatility = better (more stable)
        return Math.max(0, 100 - (volatility * 1000));
    }

    private scoreGasEfficiency(ratio: number): number {
        // Profit to gas ratio - higher is better
        return Math.min(100, ratio * 10);
    }

    private scoreHistoricalSuccess(opportunity: ArbitrageOpportunity): number {
        const poolPair = `${opportunity.poolA.poolId}_${opportunity.poolB.poolId}`;
        const history = this.executionHistory.filter(r =>
            r.opportunityId.includes(opportunity.poolA.poolId) &&
            r.opportunityId.includes(opportunity.poolB.poolId)
        );

        if (history.length === 0) return 50; // Neutral for unknown

        const successRate = history.filter(r => r.success).length / history.length;
        return successRate * 100;
    }

    // === Feature Extraction ===

    private extractFeatures(opportunity: ArbitrageOpportunity): OpportunityFeatures {
        return {
            spreadPercentage: opportunity.spreadPercentage,
            estimatedProfit: opportunity.estimatedProfit,
            liquidity: Math.min(opportunity.poolA.liquidityA, opportunity.poolB.liquidityA),
            volatility: this.calculateVolatility(opportunity),
            profitToGasRatio: opportunity.estimatedProfit / opportunity.gasEstimate,
            age: Date.now() - opportunity.createdAt,
        };
    }

    private calculateVolatility(opportunity: ArbitrageOpportunity): number {
        // Simplified volatility measure
        // In production: use historical price variance
        return Math.abs(opportunity.poolA.priceA - opportunity.poolB.priceA) / opportunity.poolA.priceA;
    }

    private calculateConfidence(features: OpportunityFeatures): number {
        // Confidence based on data quality and completeness
        let confidence = 1.0;

        if (features.liquidity < this.parameters.optimalTradeSize) {
            confidence *= 0.8;
        }

        if (features.age > 10000) { // More than 10 seconds old
            confidence *= 0.9;
        }

        return confidence;
    }

    // === Risk Assessment Functions ===

    private assessLiquidityRisk(opportunity: ArbitrageOpportunity): number {
        const tradeSize = this.optimizeTradeSize(opportunity);
        const minLiquidity = Math.min(opportunity.poolA.liquidityA, opportunity.poolB.liquidityA);

        const utilizationRatio = tradeSize / minLiquidity;

        // Higher utilization = higher risk
        return Math.min(100, utilizationRatio * 200);
    }

    private assessSlippageRisk(opportunity: ArbitrageOpportunity): number {
        // Estimate slippage based on trade size vs liquidity
        const impact = opportunity.tradeAmount / Math.min(
            opportunity.poolA.liquidityA,
            opportunity.poolB.liquidityA
        );

        return Math.min(100, impact * 100);
    }

    private assessGasRisk(opportunity: ArbitrageOpportunity): number {
        // Risk that gas cost eats into profits
        const gasToProfit = opportunity.gasEstimate / opportunity.estimatedProfit;
        return Math.min(100, gasToProfit * 100);
    }

    private assessExecutionRisk(opportunity: ArbitrageOpportunity): number {
        // Risk of execution failure based on complexity
        const baseRisk = 20; // Base 20% execution risk
        const ageRisk = Math.min(30, (Date.now() - opportunity.createdAt) / 1000); // Older = riskier
        return Math.min(100, baseRisk + ageRisk);
    }

    private generateRiskWarnings(overall: number, risks: any): string[] {
        const warnings: string[] = [];

        if (overall > 70) {
            warnings.push('High overall risk');
        }
        if (risks.liquidityRisk > 50) {
            warnings.push('Insufficient liquidity');
        }
        if (risks.slippageRisk > 50) {
            warnings.push('High slippage expected');
        }
        if (risks.gasRisk > 50) {
            warnings.push('Gas costs may exceed profits');
        }

        return warnings;
    }

    private getHistoricalOptimalSize(tokenA: string, tokenB: string): number {
        const relevantTrades = this.executionHistory.filter(r => r.success);

        if (relevantTrades.length === 0) return 0;

        // Return average successful trade size
        // This is simplified - in production, use more sophisticated analysis
        return this.parameters.optimalTradeSize;
    }

    /**
     * Get current parameters (for monitoring/debugging)
     */
    getParameters(): DynamicParameters {
        return { ...this.parameters };
    }
}

// === Types ===

interface ExecutionRecord {
    timestamp: number;
    opportunityId: string;
    score: number;
    predictedProfit: number;
    actualProfit: number;
    success: boolean;
    error?: string;
    features: OpportunityFeatures;
}

interface OpportunityFeatures {
    spreadPercentage: number;
    estimatedProfit: number;
    liquidity: number;
    volatility: number;
    profitToGasRatio: number;
    age: number;
}

export interface DynamicParameters {
    minSpreadThreshold: number;
    minProfitThreshold: number;
    maxSlippage: number;
    optimalTradeSize: number;
    riskTolerance: number;
}

// Export singleton
export const decisionEngine = new DecisionEngine();
