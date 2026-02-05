import Database from 'better-sqlite3';
import path from 'path';

/**
 * Data Collector
 * Persists historical data for learning and optimization
 */

export class DataCollector {
    private db: Database.Database;

    constructor() {
        const dbPath = path.join(__dirname, '../../data/deepsentinel.db');
        this.db = new Database(dbPath);
        this.initializeTables();
    }

    /**
     * Initialize database tables
     */
    private initializeTables() {
        // Trades table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS trades (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp INTEGER NOT NULL,
                opportunity_id TEXT NOT NULL,
                pool_a TEXT NOT NULL,
                pool_b TEXT NOT NULL,
                token_a TEXT NOT NULL,
                token_b TEXT NOT NULL,
                score INTEGER NOT NULL,
                predicted_profit REAL NOT NULL,
                actual_profit REAL NOT NULL,
                trade_size REAL NOT NULL,
                gas_cost REAL NOT NULL,
                success INTEGER NOT NULL,
                error TEXT,
                spread_percentage REAL,
                liquidity REAL,
                slippage REAL,
                execution_time_ms INTEGER
            )
        `);

        // Market conditions table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS market_conditions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp INTEGER NOT NULL,
                pool_id TEXT NOT NULL,
                token_a TEXT NOT NULL,
                token_b TEXT NOT NULL,
                price REAL NOT NULL,
                liquidity_a REAL NOT NULL,
                liquidity_b REAL NOT NULL,
                volume_24h REAL DEFAULT 0
            )
        `);

        // Parameters history table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS parameters_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp INTEGER NOT NULL,
                min_spread_threshold REAL NOT NULL,
                min_profit_threshold REAL NOT NULL,
                max_slippage REAL NOT NULL,
                optimal_trade_size REAL NOT NULL,
                risk_tolerance REAL NOT NULL,
                success_rate REAL,
                avg_profit REAL
            )
        `);

        console.log('📊 Database initialized');
    }

    /**
     * Record a trade execution
     */
    recordTrade(record: any) {
        const stmt = this.db.prepare(`
            INSERT INTO trades (
                timestamp, opportunity_id, pool_a, pool_b, token_a, token_b,
                score, predicted_profit, actual_profit, trade_size, gas_cost,
                success, error, spread_percentage, liquidity, slippage, execution_time_ms
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            record.timestamp,
            record.opportunityId,
            record.poolA || '',
            record.poolB || '',
            record.tokenA || '',
            record.tokenB || '',
            record.score,
            record.predictedProfit,
            record.actualProfit,
            record.tradeSize || 0,
            record.gasCost || 0,
            record.success ? 1 : 0,
            record.error || null,
            record.features?.spreadPercentage || 0,
            record.features?.liquidity || 0,
            record.slippage || 0,
            record.executionTimeMs || 0
        );
    }

    /**
     * Record market conditions snapshot
     */
    recordMarketConditions(poolId: string, data: any) {
        const stmt = this.db.prepare(`
            INSERT INTO market_conditions (
                timestamp, pool_id, token_a, token_b, price, liquidity_a, liquidity_b,  volume_24h
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            Date.now(),
            poolId,
            data.tokenA,
            data.tokenB,
            data.priceA,
            data.liquidityA,
            data.liquidityB,
            data.volume24h || 0
        );
    }

    /**
     * Record parameter optimization
     */
    recordParameterUpdate(params: any, stats: any) {
        const stmt = this.db.prepare(`
            INSERT INTO parameters_history (
                timestamp, min_spread_threshold, min_profit_threshold, max_slippage,
                optimal_trade_size, risk_tolerance, success_rate, avg_profit
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            Date.now(),
            params.minSpreadThreshold,
            params.minProfitThreshold,
            params.maxSlippage,
            params.optimalTradeSize,
            params.riskTolerance,
            stats.successRate || 0,
            stats.avgProfit || 0
        );
    }

    /**
     * Get trade statistics
     */
    getTradeStats(hours: number = 24): any {
        const since = Date.now() - (hours * 60 * 60 * 1000);

        const stmt = this.db.prepare(`
            SELECT 
                COUNT(*) as total_trades,
                SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_trades,
                AVG(CASE WHEN success = 1 THEN actual_profit ELSE 0 END) as avg_profit,
                SUM(actual_profit) as total_profit,
                AVG(score) as avg_score,
                AVG(execution_time_ms) as avg_execution_time
            FROM trades
            WHERE timestamp > ?
        `);

        return stmt.get(since);
    }

    /**
     * Get best performing pool pairs
     */
    getBestPoolPairs(limit: number = 10): any[] {
        const stmt = this.db.prepare(`
            SELECT 
                pool_a, pool_b, token_a, token_b,
                COUNT(*) as trade_count,
                AVG(actual_profit) as avg_profit,
                SUM(actual_profit) as total_profit,
                AVG(CASE WHEN success = 1 THEN 100.0 ELSE 0.0 END) as success_rate
            FROM trades
            WHERE success = 1
            GROUP BY pool_a, pool_b
            ORDER BY total_profit DESC
            LIMIT ?
        `);

        return stmt.all(limit);
    }

    /**
     * Get recent price history for a pool
     */
    getPriceHistory(poolId: string, hours: number = 24): any[] {
        const since = Date.now() - (hours * 60 * 60 * 1000);

        const stmt = this.db.prepare(`
            SELECT timestamp, price, liquidity_a, liquidity_b
            FROM market_conditions
            WHERE pool_id = ? AND timestamp > ?
            ORDER BY timestamp ASC
        `);

        return stmt.all(poolId, since);
    }

    /**
     * Close database connection
     */
    close() {
        this.db.close();
    }
}

// Export singleton
export const dataCollector = new DataCollector();
