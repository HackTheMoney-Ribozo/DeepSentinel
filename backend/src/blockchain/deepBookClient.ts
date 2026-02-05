import { suiClient } from './suiClient';
import { config } from '../config';

/**
 * DeepBook V3 Integration Layer
 * Queries real pool states, prices, and liquidity from DeepBook on SUI
 */

export interface DeepBookPoolState {
    poolId: string;
    baseAsset: string;
    quoteAsset: string;
    baseLiquidity: string;
    quoteLiquidity: string;
    currentPrice: string;
    lastUpdateEpoch: string;
}

export class DeepBookClient {
    // DeepBook V3 mainnet package
    private readonly DEEPBOOK_PACKAGE = '0x2c8d603bc51326b8c13cef9dd07031a408a48dddb541963357661df5d3204809';

    // Common trading pools on SUI
    private readonly KNOWN_POOLS = {
        'SUI_USDC': '0x...', // Will discover dynamically
        'SUI_USDT': '0x...',
        'WETH_USDC': '0x...',
    };

    /**
     * Query pool state from DeepBook
     */
    async getPoolState(poolId: string): Promise<DeepBookPoolState | null> {
        try {
            const poolObject = await suiClient.getObject(poolId);

            if (!poolObject.data?.content || poolObject.data.content.dataType !== 'moveObject') {
                console.warn(`Pool ${poolId} not found or invalid`);
                return null;
            }

            const fields = (poolObject.data.content as any).fields;

            return {
                poolId,
                baseAsset: fields.base_type || 'SUI',
                quoteAsset: fields.quote_type || 'USDC',
                baseLiquidity: fields.base_custodian?.fields?.available_balance || '0',
                quoteLiquidity: fields.quote_custodian?.fields?.available_balance || '0',
                currentPrice: this.calculatePrice(fields),
                lastUpdateEpoch: fields.epoch || '0',
            };
        } catch (error) {
            console.error(`Error fetching pool ${poolId}:`, error);
            return null;
        }
    }

    /**
     * Calculate current price from pool state
     */
    private calculatePrice(poolFields: any): string {
        try {
            const baseLiq = BigInt(poolFields.base_custodian?.fields?.available_balance || '1');
            const quoteLiq = BigInt(poolFields.quote_custodian?.fields?.available_balance || '1');

            // Price = quote / base (how much quote for 1 base)
            const price = Number(quoteLiq) / Number(baseLiq);
            return price.toString();
        } catch {
            return '0';
        }
    }

    /**
     * Discover DeepBook pools on the network
     * Scans for pool objects created by DeepBook package
     */
    async discoverPools(): Promise<string[]> {
        try {
            // Query all objects created by DeepBook package
            const client = suiClient.getClient();

            // This will be expanded to query actual pool registry
            // For now, return known pool IDs if configured
            const poolIds: string[] = [];

            if (config.deepbook.poolIds && config.deepbook.poolIds.length > 0) {
                return config.deepbook.poolIds;
            }

            console.log('⚠️  No pools configured. Add DEEPBOOK_POOL_IDS to .env');
            return poolIds;
        } catch (error) {
            console.error('Error discovering pools:', error);
            return [];
        }
    }

    /**
     * Query multiple pools concurrently
     */
    async getMultiplePoolStates(poolIds: string[]): Promise<Map<string, DeepBookPoolState>> {
        const poolStates = new Map<string, DeepBookPoolState>();

        const results = await Promise.allSettled(
            poolIds.map(id => this.getPoolState(id))
        );

        results.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value) {
                poolStates.set(poolIds[index], result.value);
            }
        });

        return poolStates;
    }

    /**
     * Get best bid/ask from orderbook (DeepBook CLOB)
     */
    async getOrderbookDepth(poolId: string, depth: number = 5) {
        try {
            const pool = await suiClient.getObject(poolId);

            if (!pool.data?.content) {
                return null;
            }

            // Access orderbook dynamic fields
            const fields = (pool.data.content as any).fields;
            const bids = fields.bids || [];
            const asks = fields.asks || [];

            return {
                bids: bids.slice(0, depth),
                asks: asks.slice(0, depth),
                spread: this.calculateSpread(bids[0], asks[0]),
            };
        } catch (error) {
            console.error(`Error getting orderbook for ${poolId}:`, error);
            return null;
        }
    }

    /**
     * Calculate spread between best bid and ask
     */
    private calculateSpread(bestBid: any, bestAsk: any): number {
        if (!bestBid || !bestAsk) return 0;

        const bid = Number(bestBid.price || 0);
        const ask = Number(bestAsk.price || 0);

        if (bid === 0 || ask === 0) return 0;

        return (ask - bid) / bid;
    }

    /**
     * Subscribe to pool events (price changes, swaps, etc.)
     */
    async subscribeToPoolEvents(poolId: string, callback: (event: any) => void) {
        // This would use SUI event subscription
        // For now, we'll poll in the poolMonitor
        console.log(`📡 Subscribed to events for pool ${poolId}`);
        // TODO: Implement WebSocket subscription to SUI events
    }

    /**
     * Estimate swap output for a given input
     * Uses constant product formula (x * y = k)
     */
    estimateSwapOutput(
        poolState: DeepBookPoolState,
        amountIn: bigint,
        isBaseToQuote: boolean
    ): bigint {
        const baseLiq = BigInt(poolState.baseLiquidity);
        const quoteLiq = BigInt(poolState.quoteLiquidity);

        if (baseLiq === 0n || quoteLiq === 0n) {
            return 0n;
        }

        // Constant product: x * y = k
        const k = baseLiq * quoteLiq;

        // Fee: 0.3% (30 basis points)
        const feeRate = 997n; // 1000 - 3 = 997
        const amountInWithFee = amountIn * feeRate / 1000n;

        if (isBaseToQuote) {
            // Selling base for quote
            const newBaseLiq = baseLiq + amountInWithFee;
            const newQuoteLiq = k / newBaseLiq;
            return quoteLiq - newQuoteLiq;
        } else {
            // Selling quote for base
            const newQuoteLiq = quoteLiq + amountInWithFee;
            const newBaseLiq = k / newQuoteLiq;
            return baseLiq - newBaseLiq;
        }
    }
}

// Export singleton instance
export const deepBookClient = new DeepBookClient();
