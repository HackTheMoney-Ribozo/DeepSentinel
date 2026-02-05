import { ArbitrageOpportunity, PoolData } from '../types';

/**
 * AI Strategy Advisor
 * Predicts risks, forecasts PnL, and adapts trading strategies
 */

export interface RiskForecast {
    timeHorizon: string; // '5min', '30min', '1hr'
    predictedVolatility: number; // 0-100
    marketTrend: 'bullish' | 'bearish' | 'neutral' | 'volatile';
    upcomingRisks: {
        type: string;
        probability: number; // 0-1
        impact: string; // 'low' | 'medium' | 'high'
        description: string;
    }[];
    recommendation: string;
}

export interface PnLForecast {
    expectedProfit: number;
    bestCase: number;
    worstCase: number;
    confidence: number; // 0-1
    breakEvenProbability: number; // 0-1
    riskRewardRatio: number;
    factors: {
        slippage: { expected: number; worstCase: number };
        gas: { expected: number; worstCase: number };
        priceMovement: { favorable: number; unfavorable: number };
    };
}

export interface TradingStrategy {
    mode: 'aggressive' | 'balanced' | 'conservative' | 'defensive';
    positionSizing: number; // multiplier 0-1
    executionSpeed: 'immediate' | 'patient' | 'wait';
    riskLimit: number; // max acceptable risk 0-100
    reasoning: string;
}

export class StrategyAdvisor {
    private marketHistory: {
        timestamp: number;
        volatility: number;
        spread: number;
        successRate: number;
    }[] = [];

    private currentStrategy: TradingStrategy = {
        mode: 'balanced',
        positionSizing: 1.0,
        executionSpeed: 'immediate',
        riskLimit: 50,
        reasoning: 'Default strategy - no historical data yet',
    };

    /**
     * Predict upcoming market risks
     */
    predictRisks(pools: PoolData[], recentOpportunities: ArbitrageOpportunity[]): RiskForecast {
        // Analyze market volatility trend
        const volatility = this.calculateMarketVolatility(pools);
        const trend = this.detectMarketTrend(pools);

        // Identify specific risks
        const upcomingRisks = [];

        // Risk 1: High volatility
        if (volatility > 70) {
            upcomingRisks.push({
                type: 'Market Volatility',
                probability: volatility / 100,
                impact: 'high',
                description: `Market showing ${volatility.toFixed(0)}% volatility. Spreads may close quickly.`,
            });
        }

        // Risk 2: Low liquidity
        const avgLiquidity = pools.reduce((sum, p) => sum + p.liquidityA, 0) / pools.length;
        if (avgLiquidity < 50000) {
            upcomingRisks.push({
                type: 'Liquidity Drain',
                probability: 0.6,
                impact: 'high',
                description: `Average pool liquidity dropping. Slippage risk increasing.`,
            });
        }

        // Risk 3: Spread compression
        const recentSpreads = recentOpportunities.map(o => o.spreadPercentage);
        if (recentSpreads.length > 3) {
            const avgSpread = recentSpreads.reduce((a, b) => a + b, 0) / recentSpreads.length;
            if (avgSpread < 0.003) {
                upcomingRisks.push({
                    type: 'Spread Compression',
                    probability: 0.75,
                    impact: 'medium',
                    description: `Spreads narrowing. Profit margins decreasing.`,
                });
            }
        }

        // Risk 4: Gas price spike detection
        if (Math.random() < 0.2) { // Simplified - in production, query real gas prices
            upcomingRisks.push({
                type: 'Gas Cost Spike',
                probability: 0.4,
                impact: 'medium',
                description: `Network congestion detected. Gas costs may spike.`,
            });
        }

        // Generate recommendation
        let recommendation = '';
        if (upcomingRisks.length === 0) {
            recommendation = '✅ Market conditions favorable. Normal trading recommended.';
        } else if (upcomingRisks.filter(r => r.impact === 'high').length > 0) {
            recommendation = '⚠️ High-impact risks detected. Reduce position sizes by 50% and increase profit threshold.';
        } else {
            recommendation = '⚡ Moderate risks present. Monitor closely and be ready to pause trading.';
        }

        return {
            timeHorizon: '30min',
            predictedVolatility: volatility,
            marketTrend: trend,
            upcomingRisks,
            recommendation,
        };
    }

    /**
     * Forecast PnL with confidence intervals
     */
    forecastPnL(opportunity: ArbitrageOpportunity, tradeSize: number): PnLForecast {
        // Base profit calculation
        const baseProfit = opportunity.estimatedProfit;

        // Factor 1: Slippage impact
        const liquidityRatio = tradeSize / Math.min(
            opportunity.poolA.liquidityA,
            opportunity.poolB.liquidityA
        );
        const expectedSlippage = liquidityRatio * 0.01; // 1% per 100% of liquidity used
        const worstCaseSlippage = expectedSlippage * 2;

        // Factor 2: Gas cost variance
        const expectedGas = opportunity.gasEstimate;
        const worstCaseGas = expectedGas * 1.5; // Gas can spike 50%

        // Factor 3: Price movement while executing
        const volatility = this.calculateCurrentVolatility();
        const favorablePriceMove = baseProfit * 0.1; // 10% better if timing perfect
        const unfavorablePriceMove = baseProfit * 0.3; // 30% worse if spread closes

        // Calculate scenarios
        const bestCase = baseProfit
            + favorablePriceMove
            - (expectedGas * 0.8) // Low gas
            - (tradeSize * expectedSlippage * 0.5); // Low slippage

        const worstCase = baseProfit
            - unfavorablePriceMove
            - worstCaseGas
            - (tradeSize * worstCaseSlippage);

        const expectedProfit = baseProfit
            - expectedGas
            - (tradeSize * expectedSlippage);

        // Calculate probabilities
        const confidence = this.calculateForecastConfidence(opportunity);
        const breakEvenProbability = expectedProfit > 0 ? 0.85 : 0.15;
        const riskRewardRatio = bestCase / Math.abs(worstCase);

        return {
            expectedProfit,
            bestCase,
            worstCase,
            confidence,
            breakEvenProbability,
            riskRewardRatio,
            factors: {
                slippage: {
                    expected: expectedSlippage,
                    worstCase: worstCaseSlippage
                },
                gas: {
                    expected: expectedGas,
                    worstCase: worstCaseGas
                },
                priceMovement: {
                    favorable: favorablePriceMove,
                    unfavorable: unfavorablePriceMove
                },
            },
        };
    }

    /**
     * Adapt trading strategy based on market conditions
     */
    adaptStrategy(
        marketConditions: { volatility: number; successRate: number; avgProfit: number },
        riskForecast: RiskForecast
    ): TradingStrategy {
        let mode: TradingStrategy['mode'] = 'balanced';
        let positionSizing = 1.0;
        let executionSpeed: TradingStrategy['executionSpeed'] = 'immediate';
        let riskLimit = 50;
        let reasoning = '';

        // Rule 1: High volatility → defensive
        if (riskForecast.predictedVolatility > 70) {
            mode = 'defensive';
            positionSizing = 0.3;
            executionSpeed = 'wait';
            riskLimit = 30;
            reasoning = 'Market highly volatile - reducing exposure significantly';
        }
        // Rule 2: Favorable conditions → aggressive
        else if (
            marketConditions.successRate > 0.8 &&
            riskForecast.upcomingRisks.length === 0 &&
            riskForecast.predictedVolatility < 40
        ) {
            mode = 'aggressive';
            positionSizing = 1.5;
            executionSpeed = 'immediate';
            riskLimit = 65;
            reasoning = 'Excellent conditions - high success rate, low volatility, no risks';
        }
        // Rule 3: Poor performance → conservative
        else if (marketConditions.successRate < 0.5) {
            mode = 'conservative';
            positionSizing = 0.5;
            executionSpeed = 'patient';
            riskLimit = 35;
            reasoning = 'Recent poor performance - reducing risk and waiting for better opportunities';
        }
        // Rule 4: High-impact risks → conservative
        else if (riskForecast.upcomingRisks.some(r => r.impact === 'high')) {
            mode = 'conservative';
            positionSizing = 0.6;
            executionSpeed = 'patient';
            riskLimit = 40;
            reasoning = 'High-impact risks detected - tightening criteria';
        }
        // Rule 5: Normal conditions
        else {
            mode = 'balanced';
            positionSizing = 1.0;
            executionSpeed = 'immediate';
            riskLimit = 50;
            reasoning = 'Normal market conditions - standard strategy';
        }

        this.currentStrategy = { mode, positionSizing, executionSpeed, riskLimit, reasoning };
        return this.currentStrategy;
    }

    /**
     * Get current strategy
     */
    getCurrentStrategy(): TradingStrategy {
        return { ...this.currentStrategy };
    }

    // === Helper Methods ===

    private calculateMarketVolatility(pools: PoolData[]): number {
        // Simplified volatility calculation
        // In production: use standard deviation of price changes
        const priceVariances = pools.map(pool => {
            const midPrice = pool.priceA;
            return Math.abs(midPrice - 1.0); // Deviation from 1.0
        });

        const avgVariance = priceVariances.reduce((a, b) => a + b, 0) / priceVariances.length;
        return Math.min(100, avgVariance * 5000); // Scale to 0-100
    }

    private detectMarketTrend(pools: PoolData[]): 'bullish' | 'bearish' | 'neutral' | 'volatile' {
        const volatility = this.calculateMarketVolatility(pools);

        if (volatility > 60) return 'volatile';

        // Simplified trend detection
        const avgPrice = pools.reduce((sum, p) => sum + p.priceA, 0) / pools.length;
        if (avgPrice > 1.01) return 'bullish';
        if (avgPrice < 0.99) return 'bearish';
        return 'neutral';
    }

    private calculateCurrentVolatility(): number {
        // Return recent volatility measurement
        if (this.marketHistory.length === 0) return 50;

        const recent = this.marketHistory.slice(-10);
        const avgVol = recent.reduce((sum, h) => sum + h.volatility, 0) / recent.length;
        return avgVol;
    }

    private calculateForecastConfidence(opportunity: ArbitrageOpportunity): number {
        // Higher confidence for:
        // - Larger spreads (more room for error)
        // - Higher liquidity (less slippage risk)
        // - Recent successful trades

        let confidence = 0.5; // Base 50%

        if (opportunity.spreadPercentage > 0.01) confidence += 0.2;
        if (opportunity.poolA.liquidityA > 100000) confidence += 0.15;
        if (opportunity.estimatedProfit > 1) confidence += 0.15;

        return Math.min(0.95, confidence);
    }

    /**
     * Record market snapshot for trend analysis
     */
    recordMarketSnapshot(volatility: number, spread: number, successRate: number) {
        this.marketHistory.push({
            timestamp: Date.now(),
            volatility,
            spread,
            successRate,
        });

        // Keep only last 100 snapshots
        if (this.marketHistory.length > 100) {
            this.marketHistory = this.marketHistory.slice(-100);
        }
    }
}

// Export singleton
export const strategyAdvisor = new StrategyAdvisor();
