import fs from 'fs';
import path from 'path';

/**
 * Transaction Logger
 * Logs all transactions with detailed PnL information to a file
 */

export interface TransactionLogEntry {
    timestamp: number;
    datetime: string;
    transactionHash?: string;
    opportunityId: string;
    poolA: string;
    poolB: string;
    tradeAmount: number;
    estimatedProfit: number;
    actualProfit: number;
    gasCost: number;
    slippage: number;
    success: boolean;
    error?: string;
    aiScore: number;
    spread: number;
    strategy: string;
    pnl: {
        grossProfit: number;
        netProfit: number;
        profitPercentage: number;
        cumulativePnL: number;
    };
}

class TransactionLogger {
    private logFilePath: string;
    private cumulativePnL: number = 0;

    constructor() {
        const logsDir = path.join(process.cwd(), 'logs');

        // Create logs directory if it doesn't exist
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }

        this.logFilePath = path.join(logsDir, 'transactions.jsonl');

        // Load cumulative PnL from existing logs
        this.loadCumulativePnL();

        console.log(`📝 Transaction logger initialized: ${this.logFilePath}`);
    }

    /**
     * Load cumulative PnL from existing transaction logs
     */
    private loadCumulativePnL() {
        if (!fs.existsSync(this.logFilePath)) {
            return;
        }

        try {
            const content = fs.readFileSync(this.logFilePath, 'utf-8');
            const lines = content.trim().split('\n').filter(l => l.length > 0);

            if (lines.length > 0) {
                const lastEntry = JSON.parse(lines[lines.length - 1]) as TransactionLogEntry;
                this.cumulativePnL = lastEntry.pnl.cumulativePnL;
                console.log(`📊 Loaded cumulative PnL: $${this.cumulativePnL.toFixed(2)}`);
            }
        } catch (error) {
            console.error('Failed to load cumulative PnL:', error);
        }
    }

    /**
     * Log a transaction
     */
    logTransaction(entry: Omit<TransactionLogEntry, 'datetime' | 'pnl'>): void {
        const grossProfit = entry.actualProfit;
        const netProfit = grossProfit - entry.gasCost;
        const profitPercentage = entry.tradeAmount > 0
            ? (netProfit / entry.tradeAmount) * 100
            : 0;

        // Update cumulative PnL
        if (entry.success) {
            this.cumulativePnL += netProfit;
        }

        const logEntry: TransactionLogEntry = {
            ...entry,
            datetime: new Date(entry.timestamp).toISOString(),
            pnl: {
                grossProfit,
                netProfit,
                profitPercentage,
                cumulativePnL: this.cumulativePnL
            }
        };

        // Append to log file (JSONL format - one JSON object per line)
        const logLine = JSON.stringify(logEntry) + '\n';

        try {
            fs.appendFileSync(this.logFilePath, logLine, 'utf-8');

            if (entry.success) {
                console.log(`💰 Transaction logged: ${entry.transactionHash?.slice(0, 8)}... | Net PnL: $${netProfit.toFixed(4)} | Cumulative: $${this.cumulativePnL.toFixed(2)}`);
            } else {
                console.log(`❌ Failed transaction logged: ${entry.error} | Cumulative PnL: $${this.cumulativePnL.toFixed(2)}`);
            }
        } catch (error) {
            console.error('Failed to write transaction log:', error);
        }
    }

    /**
     * Get all transaction logs
     */
    getAllLogs(): TransactionLogEntry[] {
        if (!fs.existsSync(this.logFilePath)) {
            return [];
        }

        try {
            const content = fs.readFileSync(this.logFilePath, 'utf-8');
            const lines = content.trim().split('\n').filter(l => l.length > 0);
            return lines.map(line => JSON.parse(line) as TransactionLogEntry);
        } catch (error) {
            console.error('Failed to read transaction logs:', error);
            return [];
        }
    }

    /**
     * Get recent transaction logs
     */
    getRecentLogs(limit: number = 50): TransactionLogEntry[] {
        const allLogs = this.getAllLogs();
        return allLogs.slice(-limit).reverse(); // Most recent first
    }

    /**
     * Get transaction statistics
     */
    getStatistics() {
        const logs = this.getAllLogs();

        if (logs.length === 0) {
            return {
                totalTransactions: 0,
                successfulTransactions: 0,
                failedTransactions: 0,
                successRate: 0,
                totalGrossProfit: 0,
                totalNetProfit: 0,
                totalGasCost: 0,
                averageProfit: 0,
                averageGas: 0,
                bestTrade: null,
                worstTrade: null,
                cumulativePnL: 0
            };
        }

        const successful = logs.filter(l => l.success);
        const failed = logs.filter(l => !l.success);

        const totalGrossProfit = successful.reduce((sum, l) => sum + l.pnl.grossProfit, 0);
        const totalNetProfit = successful.reduce((sum, l) => sum + l.pnl.netProfit, 0);
        const totalGasCost = logs.reduce((sum, l) => sum + l.gasCost, 0);

        const sortedByProfit = [...successful].sort((a, b) => b.pnl.netProfit - a.pnl.netProfit);

        return {
            totalTransactions: logs.length,
            successfulTransactions: successful.length,
            failedTransactions: failed.length,
            successRate: (successful.length / logs.length) * 100,
            totalGrossProfit,
            totalNetProfit,
            totalGasCost,
            averageProfit: successful.length > 0 ? totalNetProfit / successful.length : 0,
            averageGas: logs.length > 0 ? totalGasCost / logs.length : 0,
            bestTrade: sortedByProfit[0] || null,
            worstTrade: sortedByProfit[sortedByProfit.length - 1] || null,
            cumulativePnL: this.cumulativePnL
        };
    }

    /**
     * Get PnL summary
     */
    getPnLSummary() {
        const logs = this.getAllLogs();
        const successful = logs.filter(l => l.success);

        // Calculate daily, weekly, monthly PnL
        const now = Date.now();
        const day = 24 * 60 * 60 * 1000;

        const last24h = successful.filter(l => now - l.timestamp < day);
        const last7d = successful.filter(l => now - l.timestamp < 7 * day);
        const last30d = successful.filter(l => now - l.timestamp < 30 * day);

        return {
            allTime: this.cumulativePnL,
            last24h: last24h.reduce((sum, l) => sum + l.pnl.netProfit, 0),
            last7d: last7d.reduce((sum, l) => sum + l.pnl.netProfit, 0),
            last30d: last30d.reduce((sum, l) => sum + l.pnl.netProfit, 0),
            tradesLast24h: last24h.length,
            tradesLast7d: last7d.length,
            tradesLast30d: last30d.length
        };
    }
}

// Export singleton
export const transactionLogger = new TransactionLogger();
