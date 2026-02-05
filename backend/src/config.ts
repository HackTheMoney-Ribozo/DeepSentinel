import dotenv from 'dotenv';

dotenv.config();

export const config = {
    // Sui Network
    sui: {
        network: process.env.SUI_NETWORK || 'testnet',
        rpcUrl: process.env.SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443',
        privateKey: process.env.SUI_PRIVATE_KEY || '',
    },

    // Server
    server: {
        port: parseInt(process.env.PORT || '3000'),
        websocketPort: parseInt(process.env.WEBSOCKET_PORT || '3001'),
        env: process.env.NODE_ENV || 'development',
    },

    // DeepBook
    deepbook: {
        packageId: process.env.DEEPBOOK_PACKAGE_ID || '',
        poolIds: (process.env.DEEPBOOK_POOL_IDS || '').split(',').filter(id => id.trim()),
    },

    // Monitoring
    monitoring: {
        pollIntervalMs: parseInt(process.env.POLL_INTERVAL_MS || '5000'),
        minProfitThreshold: parseFloat(process.env.MIN_PROFIT_THRESHOLD || '0.1'),
        minSpreadThreshold: parseFloat(process.env.MIN_SPREAD_THRESHOLD || '0.005'),
    },

    // Arbitrage
    arbitrage: {
        defaultTradeAmount: parseInt(process.env.DEFAULT_TRADE_AMOUNT || '1000'),
        maxSlippage: parseFloat(process.env.MAX_SLIPPAGE || '0.01'),
    },

    // AI Agent Settings
    agent: {
        autonomousMode: process.env.AUTONOMOUS_MODE === 'true',
        maxDailyLoss: parseFloat(process.env.MAX_DAILY_LOSS || '10'),
        maxPositionSize: parseFloat(process.env.MAX_POSITION_SIZE || '1000'),
        useRealPools: process.env.USE_REAL_POOLS === 'true',
        executionIntervalMs: parseInt(process.env.EXECUTION_INTERVAL_MS || '30000'), // 30 seconds
    },
};
