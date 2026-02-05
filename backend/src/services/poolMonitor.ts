import { PoolData } from '../types';
import { suiClient } from '../blockchain/suiClient';
import { deepBookClient } from '../blockchain/deepBookClient';
import { dataCollector } from './dataCollector';
import { config } from '../config';

/**
 * Pool Monitor Service
 * Monitors DeepBook pools and detects price changes
 */
export class PoolMonitorService {
    private pools: Map<string, PoolData> = new Map();
    private monitoringInterval: NodeJS.Timeout | null = null;
    private isMonitoring = false;

    /**
     * Start monitoring pools
     */
    start(intervalMs: number = 5000) {
        if (this.isMonitoring) {
            console.log('Pool monitoring already running');
            return;
        }

        console.log(`🔍 Starting pool monitor (interval: ${intervalMs}ms)`);
        this.isMonitoring = true;

        // Initial fetch
        this.fetchPools();

        // Set up periodic fetching
        this.monitoringInterval = setInterval(() => {
            this.fetchPools();
        }, intervalMs);
    }

    /**
     * Stop monitoring
     */
    stop() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        this.isMonitoring = false;
        console.log('⏹️  Pool monitoring stopped');
    }

    /**
     * Fetch pool data from blockchain
     * Uses real DeepBook queries or mock data based on configuration
     */
    private async fetchPools() {
        try {
            const useRealData = process.env.USE_REAL_POOLS === 'true';

            let poolsData: PoolData[];

            if (useRealData) {
                poolsData = await this.fetchRealPools();
            } else {
                console.log('⚠️  Using mock pools (set USE_REAL_POOLS=true for real data)');
                poolsData = this.generateMockPools();
            }

            poolsData.forEach(pool => {
                const existing = this.pools.get(pool.poolId);

                if (existing) {
                    // Check if price changed significantly
                    const priceChange = Math.abs(pool.priceA - existing.priceA) / existing.priceA;
                    if (priceChange > 0.001) {
                        console.log(`💱 Price update: ${pool.tokenA}/${pool.tokenB} - ${pool.priceA.toFixed(4)}`);
                    }
                }

                this.pools.set(pool.poolId, pool);

                // Record market conditions for learning
                if (useRealData) {
                    dataCollector.recordMarketConditions(pool.poolId, pool);
                }
            });

        } catch (error) {
            console.error('Error fetching pools:', error);
        }
    }

    /**
     * Fetch real pool data from DeepBook
     */
    private async fetchRealPools(): Promise<PoolData[]> {
        // Get configured pool IDs from environment
        const poolIdsStr = process.env.DEEPBOOK_POOL_IDS || '';
        const poolIds = poolIdsStr.split(',').filter(id => id.trim());

        if (poolIds.length === 0) {
            console.warn('⚠️  No pool IDs configured. Set DEEPBOOK_POOL_IDS in .env');
            // Try to discover pools
            const discovered = await deepBookClient.discoverPools();
            poolIds.push(...discovered);
        }

        if (poolIds.length === 0) {
            console.log('Using mock pools as fallback');
            return this.generateMockPools();
        }

        console.log(`📡 Querying ${poolIds.length} DeepBook pools...`);

        const poolStates = await deepBookClient.getMultiplePoolStates(poolIds);
        const pools: PoolData[] = [];

        for (const [poolId, state] of poolStates) {
            const price = parseFloat(state.currentPrice);
            const baseLiq = parseFloat(state.baseLiquidity) / 1e9; // Convert from MIST
            const quoteLiq = parseFloat(state.quoteLiquidity) / 1e9;

            pools.push({
                poolId: state.poolId,
                tokenA: state.baseAsset,
                tokenB: state.quoteAsset,
                priceA: price,
                priceB: price > 0 ? 1 / price : 0,
                liquidityA: baseLiq,
                liquidityB: quoteLiq,
                lastUpdate: Date.now(),
            });
        }

        return pools;
    }

    /**
   * Generate mock pool data for MVP testing
   * Occasionally creates larger spreads to demonstrate arbitrage opportunities
   */
    private generateMockPools(): PoolData[] {
        const now = Date.now();
        const shouldCreateOpportunity = Math.random() < 0.15; // 15% chance each update

        const basePrice1 = 1.0 + (Math.random() - 0.5) * 0.02; // SUI/USDC
        const basePrice2 = 1.0 + (Math.random() - 0.5) * 0.02; // SUI/USDT
        const basePrice3 = 1.0 + (Math.random() - 0.5) * 0.03; // SUI/DAI

        // For demo: occasionally create a larger spread between pool 1 and 2
        const spreadMultiplier = shouldCreateOpportunity ? (0.005 + Math.random() * 0.01) : 0;

        return [
            {
                poolId: 'pool_sui_usdc_1',
                tokenA: 'SUI',
                tokenB: 'USDC',
                priceA: basePrice1,
                priceB: 1 / basePrice1,
                liquidityA: 100000 + Math.random() * 50000,
                liquidityB: 100000 + Math.random() * 50000,
                lastUpdate: now,
            },
            {
                poolId: 'pool_sui_usdc_2',
                tokenA: 'SUI',
                tokenB: 'USDC',
                priceA: basePrice1 + spreadMultiplier + (Math.random() - 0.5) * 0.002,
                priceB: 1 / (basePrice1 + spreadMultiplier + (Math.random() - 0.5) * 0.002),
                liquidityA: 80000 + Math.random() * 40000,
                liquidityB: 80000 + Math.random() * 40000,
                lastUpdate: now,
            },
            {
                poolId: 'pool_sui_usdt',
                tokenA: 'SUI',
                tokenB: 'USDT',
                priceA: basePrice2,
                priceB: 1 / basePrice2,
                liquidityA: 120000 + Math.random() * 60000,
                liquidityB: 120000 + Math.random() * 60000,
                lastUpdate: now,
            },
            {
                poolId: 'pool_sui_dai',
                tokenA: 'SUI',
                tokenB: 'DAI',
                priceA: basePrice3,
                priceB: 1 / basePrice3,
                liquidityA: 90000 + Math.random() * 45000,
                liquidityB: 90000 + Math.random() * 45000,
                lastUpdate: now,
            },
        ];
    }

    /**
     * Get all monitored pools
     */
    getPools(): PoolData[] {
        return Array.from(this.pools.values());
    }

    /**
     * Get specific pool by ID
     */
    getPool(poolId: string): PoolData | undefined {
        return this.pools.get(poolId);
    }

    /**
     * Get pools for a specific token pair
     */
    getPoolsByPair(tokenA: string, tokenB: string): PoolData[] {
        return Array.from(this.pools.values()).filter(
            pool =>
                (pool.tokenA === tokenA && pool.tokenB === tokenB) ||
                (pool.tokenA === tokenB && pool.tokenB === tokenA)
        );
    }
}

// Export singleton instance
export const poolMonitor = new PoolMonitorService();
