import { PoolData } from '../types';
import { suiClient } from '../blockchain/suiClient';

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
     * For MVP: We'll simulate pool data
     * In production: Query actual DeepBook pools
     */
    private async fetchPools() {
        try {
            // TODO: Replace with actual DeepBook pool queries
            // For MVP, we'll create simulated pools with random price fluctuations

            const mockPools = this.generateMockPools();

            mockPools.forEach(pool => {
                const existing = this.pools.get(pool.poolId);

                if (existing) {
                    // Check if price changed significantly
                    const priceChange = Math.abs(pool.priceA - existing.priceA) / existing.priceA;
                    if (priceChange > 0.001) {
                        console.log(`💱 Price update: ${pool.tokenA}/${pool.tokenB} - ${pool.priceA.toFixed(4)}`);
                    }
                }

                this.pools.set(pool.poolId, pool);
            });

        } catch (error) {
            console.error('Error fetching pools:', error);
        }
    }

    /**
     * Generate mock pool data for MVP testing
     */
    private generateMockPools(): PoolData[] {
        const basePrice1 = 1.0 + (Math.random() - 0.5) * 0.02; // SUI/USDC
        const basePrice2 = 1.0 + (Math.random() - 0.5) * 0.02; // SUI/USDT
        const basePrice3 = 1.0 + (Math.random() - 0.5) * 0.03; // SUI/DAI

        return [
            {
                poolId: 'pool_sui_usdc_1',
                tokenA: 'SUI',
                tokenB: 'USDC',
                priceA: basePrice1,
                priceB: 1 / basePrice1,
                liquidityA: 100000 + Math.random() * 50000,
                liquidityB: 100000 + Math.random() * 50000,
                lastUpdate: Date.now(),
            },
            {
                poolId: 'pool_sui_usdc_2',
                tokenA: 'SUI',
                tokenB: 'USDC',
                priceA: basePrice1 + (Math.random() - 0.5) * 0.01, // Slightly different price
                priceB: 1 / (basePrice1 + (Math.random() - 0.5) * 0.01),
                liquidityA: 80000 + Math.random() * 40000,
                liquidityB: 80000 + Math.random() * 40000,
                lastUpdate: Date.now(),
            },
            {
                poolId: 'pool_sui_usdt',
                tokenA: 'SUI',
                tokenB: 'USDT',
                priceA: basePrice2,
                priceB: 1 / basePrice2,
                liquidityA: 120000 + Math.random() * 60000,
                liquidityB: 120000 + Math.random() * 60000,
                lastUpdate: Date.now(),
            },
            {
                poolId: 'pool_sui_dai',
                tokenA: 'SUI',
                tokenB: 'DAI',
                priceA: basePrice3,
                priceB: 1 / basePrice3,
                liquidityA: 90000 + Math.random() * 45000,
                liquidityB: 90000 + Math.random() * 45000,
                lastUpdate: Date.now(),
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
