import { EventEmitter } from 'events';
import { poolDiscovery } from './poolDiscovery';

/**
 * DeepBook-Compatible Pool Structure
 * Uses REAL market data in DeepBook CLOB format
 */

export interface DeepBookOrder {
    price: number;
    quantity: number;
    orderId: string;
}

export interface DeepBookOrderBook {
    bids: DeepBookOrder[];  // Buy orders (descending price)
    asks: DeepBookOrder[];  // Sell orders (ascending price)
    spread: number;
    midPrice: number;
}

export interface PoolData {
    poolId: string;
    tokenA: string;
    tokenB: string;
    priceA: number;
    priceB: number;
    liquidityA: number;
    liquidityB: number;
    volume24h: number;
    lastUpdate: number;
    isReal: boolean;

    // DeepBook CLOB specific
    orderBook: DeepBookOrderBook;
    tickSize: number;
    lotSize: number;
}

/**
 * DeepBook Order Book Simulator
 * Creates realistic bid/ask spreads based on real market prices
 */
class OrderBookSimulator {
    /**
     * Generate realistic order book from market price
     */
    static generateOrderBook(marketPrice: number, depth: number = 10): DeepBookOrderBook {
        const bids: DeepBookOrder[] = [];
        const asks: DeepBookOrder[] = [];

        // Typical spread: 0.1% - 0.5%
        const spreadBps = 20; // 0.2% = 20 basis points
        const halfSpread = (marketPrice * spreadBps) / 10000 / 2;

        const bidPrice = marketPrice - halfSpread;
        const askPrice = marketPrice + halfSpread;

        // Generate bid ladder (buy orders, descending)
        for (let i = 0; i < depth; i++) {
            const priceStep = (marketPrice * 0.001) * i; // 0.1% steps
            bids.push({
                price: bidPrice - priceStep,
                quantity: Math.random() * 10000 + 1000, // Random quantity
                orderId: `bid_${Date.now()}_${i}`
            });
        }

        // Generate ask ladder (sell orders, ascending)
        for (let i = 0; i < depth; i++) {
            const priceStep = (marketPrice * 0.001) * i;
            asks.push({
                price: askPrice + priceStep,
                quantity: Math.random() * 10000 + 1000,
                orderId: `ask_${Date.now()}_${i}`
            });
        }

        const spread = askPrice - bidPrice;
        const midPrice = (bidPrice + askPrice) / 2;

        return { bids, asks, spread, midPrice };
    }

    /**
     * Update order book with new market price (simulate market movement)
     */
    static updateOrderBook(
        currentBook: DeepBookOrderBook,
        newMarketPrice: number
    ): DeepBookOrderBook {
        // Shift the entire order book to new price level
        return this.generateOrderBook(newMarketPrice);
    }
}

/**
 * REAL DeepBook Pool Monitor
 * Uses DeepBook data structures with REAL market prices
 */
class PoolMonitor extends EventEmitter {
    private pools: PoolData[] = [];
    private monitorInterval: NodeJS.Timeout | null = null;
    private updateIntervalMs: number = 5000;
    private priceCache: Map<string, { price: number; timestamp: number }> = new Map();

    async start() {
        console.log(`🔍 Starting DeepBook-compatible pool monitor`);
        console.log('📊 Using CLOB structure with REAL market prices');

        await this.discoverPools();

        this.monitorInterval = setInterval(async () => {
            await this.updatePools();
        }, this.updateIntervalMs);

        await this.updatePools();
    }

    private async discoverPools() {
        const discoveredPools = await poolDiscovery.discoverPools();

        console.log(`✅ Creating ${discoveredPools.length} DeepBook-style pools`);

        this.pools = await Promise.all(
            discoveredPools.map(async (pool) => {
                const price = await poolDiscovery.getRealPrice(pool.baseAsset, pool.quoteAsset);
                const orderBook = OrderBookSimulator.generateOrderBook(price);

                return {
                    poolId: pool.poolId,
                    tokenA: pool.baseAsset,
                    tokenB: pool.quoteAsset,
                    priceA: orderBook.midPrice,
                    priceB: 1 / orderBook.midPrice,
                    liquidityA: 100000,
                    liquidityB: 100000,
                    volume24h: 0,
                    lastUpdate: Date.now(),
                    isReal: pool.verified,

                    // DeepBook CLOB data
                    orderBook: orderBook,
                    tickSize: 0.001,  // $0.001
                    lotSize: 1.0      // 1 token
                };
            })
        );

        console.log(`✅ DeepBook pools ready with order books`);
        this.pools.forEach(p => {
            console.log(`  📈 ${p.tokenA}/${p.tokenB}: Bid=${p.orderBook.bids[0].price.toFixed(4)} Ask=${p.orderBook.asks[0].price.toFixed(4)} Spread=${(p.orderBook.spread * 100).toFixed(3)}%`);
        });
    }

    private async updatePools() {
        const updatePromises = this.pools.map(async (pool) => {
            try {
                const price = await this.getCachedPrice(pool.tokenA, pool.tokenB);

                // Update order book with new price
                pool.orderBook = OrderBookSimulator.updateOrderBook(pool.orderBook, price);
                pool.priceA = pool.orderBook.midPrice;
                pool.priceB = 1 / pool.priceA;
                pool.lastUpdate = Date.now();

                const bestBid = pool.orderBook.bids[0].price;
                const bestAsk = pool.orderBook.asks[0].price;

                console.log(`💱 ${pool.tokenA}/${pool.tokenB}: ${bestBid.toFixed(4)}/${bestAsk.toFixed(4)} (DeepBook CLOB)`);
            } catch (error) {
                console.error(`Failed to update pool ${pool.poolId}:`, error);
            }
        });

        await Promise.all(updatePromises);
        this.emit('pools-updated', this.pools);
    }

    private async getCachedPrice(baseAsset: string, quoteAsset: string): Promise<number> {
        const cacheKey = `${baseAsset}_${quoteAsset}`;
        const cached = this.priceCache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < 10000) {
            return cached.price;
        }

        const price = await poolDiscovery.getRealPrice(baseAsset, quoteAsset);
        this.priceCache.set(cacheKey, { price, timestamp: Date.now() });

        return price;
    }

    getPools(): PoolData[] {
        return [...this.pools];
    }

    getPool(poolId: string): PoolData | undefined {
        return this.pools.find(p => p.poolId === poolId);
    }

    /**
     * Get best bid/ask for a pool (like DeepBook CLOB)
     */
    getOrderBook(poolId: string): DeepBookOrderBook | undefined {
        const pool = this.getPool(poolId);
        return pool?.orderBook;
    }

    /**
     * Estimate swap output (like DeepBook)
     */
    estimateSwapOutput(
        poolId: string,
        amountIn: number,
        isBuy: boolean
    ): number {
        const pool = this.getPool(poolId);
        if (!pool) return 0;

        const orders = isBuy ? pool.orderBook.asks : pool.orderBook.bids;
        let remaining = amountIn;
        let outputTotal = 0;

        // Match against order book (price-time priority)
        for (const order of orders) {
            const matchQty = Math.min(remaining, order.quantity);
            outputTotal += matchQty * order.price;
            remaining -= matchQty;

            if (remaining <= 0) break;
        }

        return outputTotal;
    }

    stop() {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            this.monitorInterval = null;
        }
        console.log('⏹️  Pool monitor stopped');
    }
}

export const poolMonitor = new PoolMonitor();
