import { poolMonitor } from './poolMonitor';
import { arbitrageEngine } from './arbitrageEngine';
import { EventEmitter } from 'events';

/**
 * PnL Tracking Service
 * Works with existing poolMonitor (CoinGecko prices + simulated order books)
 * Tracks simulated trade profit/loss
 */

export interface SimulatedTrade {
    id: string;
    timestamp: number;
    poolAId: string;
    poolBId: string;
    tokenA: string;
    tokenB: string;
    amountIn: number;
    amountOut: number;
    profit: number;
    profitPercent: number;
}

export interface PnLSnapshot {
    timestamp: number;
    cumulativePnL: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    avgProfit: number;
    largestWin: number;
    largestLoss: number;
}

export class PnLTracker extends EventEmitter {
    private trades: SimulatedTrade[] = [];
    private cumulativePnL: number = 0;
    private isRunning: boolean = false;
    private pollInterval: number = 30000; // 30 seconds

    constructor() {
        super();
    }

    /**
     * Start monitoring for arbitrage opportunities
     */
    async start() {
        if (this.isRunning) return;

        console.log('💰 Starting PnL tracker (Simulated trades with REAL prices)');
        this.isRunning = true;

        await this.monitorLoop();
    }

    /**
     * Stop monitoring
     */
    stop() {
        console.log('⏸️  Stopping PnL tracker');
        this.isRunning = false;
    }

    /**
     * Main monitoring loop
     */
    private async monitorLoop() {
        while (this.isRunning) {
            try {
                await this.checkOpportunities();

                // Wait for next poll
                await new Promise(resolve => setTimeout(resolve, this.pollInterval));
            } catch (error) {
                console.error('PnL monitor error:', error);
            }
        }
    }

    /**
     * Check for arbitrage opportunities and simulate execution
     */
    private async checkOpportunities() {
        const opportunities = arbitrageEngine.getOpportunities();

        // Execute high-profit opportunities (auto-trading simulation)
        for (const opp of opportunities) {
            if (opp.spreadPercentage > 0.5) { // Min 0.5% spread
                await this.simulateTradeExecution(opp);
            }
        }
    }

    /**
     * Simulate trade execution and track PnL
     */
    private async simulateTradeExecution(opportunity: any) {
        const tradeAmount = 1000; // $1000 per trade

        // Calculate expected profit
        const expectedProfit = tradeAmount * (opportunity.spreadPercentage / 100);

        // Add some randomness to simulate slippage/execution variance
        const slippage = (Math.random() - 0.5) * 0.02; // +/- 1%
        const actualProfit = expectedProfit * (1 + slippage);

        const trade: SimulatedTrade = {
            id: `sim_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            timestamp: Date.now(),
            poolAId: opportunity.poolA || 'pool_a',
            poolBId: opportunity.poolB || 'pool_b',
            tokenA: opportunity.tokenA || 'SUI',
            tokenB: opportunity.tokenB || 'USDC',
            amountIn: tradeAmount,
            amountOut: tradeAmount + actualProfit,
            profit: actualProfit,
            profitPercent: (actualProfit / tradeAmount) * 100,
        };

        this.trades.push(trade);
        this.cumulativePnL += actualProfit;

        console.log(`✅ [SIMULATED] Trade executed:`);
        console.log(`   ${trade.tokenA}/${trade.tokenB}: $${trade.amountIn} → $${trade.amountOut.toFixed(2)}`);
        console.log(`   Profit: ${actualProfit > 0 ? '+' : ''}$${actualProfit.toFixed(2)} (${trade.profitPercent.toFixed(3)}%)`);
        console.log(`   Cumulative P&L: $${this.cumulativePnL.toFixed(2)}`);

        this.emit('trade-executed', trade);
        this.emit('pnl-update', this.getCurrentPnL());
    }

    /**
     * Get current PnL snapshot
     */
    getCurrentPnL(): PnLSnapshot {
        const winningTrades = this.trades.filter(t => t.profit > 0).length;
        const losingTrades = this.trades.filter(t => t.profit < 0).length;
        const winRate = this.trades.length > 0 ? (winningTrades / this.trades.length) * 100 : 0;

        const profits = this.trades.map(t => t.profit);
        const avgProfit = profits.length > 0
            ? profits.reduce((a, b) => a + b, 0) / profits.length
            : 0;

        return {
            timestamp: Date.now(),
            cumulativePnL: this.cumulativePnL,
            totalTrades: this.trades.length,
            winningTrades,
            losingTrades,
            winRate,
            avgProfit,
            largestWin: profits.length > 0 ? Math.max(...profits) : 0,
            largestLoss: profits.length > 0 ? Math.min(...profits) : 0,
        };
    }

    /**
     * Get trade history
     */
    getTradeHistory(): SimulatedTrade[] {
        return this.trades;
    }
}

export const pnlTracker = new PnLTracker();
