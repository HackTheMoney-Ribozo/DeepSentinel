import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import http from 'http';
import { poolMonitor } from './services/poolMonitor';
import { arbitrageEngine } from './services/arbitrageEngine';
import { executionEngine } from './services/executionEngine';
import { decisionEngine } from './services/decisionEngine';
import { dataCollector } from './services/dataCollector';
import { strategyAdvisor } from './services/strategyAdvisor';
import { config } from './config';

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: config.server.env === 'production'
            ? process.env.FRONTEND_URL
            : 'http://localhost:5173',
        methods: ['GET', 'POST']
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// === API ROUTES ===

app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        message: 'DeepSentinel AI Agent is running',
        mode: config.agent.autonomousMode ? 'AUTONOMOUS' : 'MANUAL',
        poolsMonitored: poolMonitor.getPools().length,
        opportunitiesFound: arbitrageEngine.getOpportunityCount(),
        executionStats: executionEngine.getStats(),
    });
});

app.get('/api/pools', (_req, res) => {
    const pools = poolMonitor.getPools();
    res.json({ pools });
});

app.get('/api/opportunities', (_req, res) => {
    const opportunities = arbitrageEngine.getOpportunities();
    res.json({ opportunities });
});

app.get('/api/stats', (_req, res) => {
    const tradeStats = dataCollector.getTradeStats(24);
    const executionStats = executionEngine.getStats();
    const aiParameters = arbitrageEngine.getAIParameters();

    res.json({
        trades: tradeStats,
        execution: executionStats,
        ai: aiParameters,
        bestPairs: dataCollector.getBestPoolPairs(5),
    });
});

app.get('/api/agent/status', (_req, res) => {
    res.json({
        autonomous: config.agent.autonomousMode,
        executionStats: executionEngine.getStats(),
        aiParameters: arbitrageEngine.getAIParameters(),
        strategy: strategyAdvisor.getCurrentStrategy(),
    });
});

// NEW: Get AI risk forecast
app.get('/api/ai/risk-forecast', (_req, res) => {
    const pools = poolMonitor.getPools();
    const opportunities = arbitrageEngine.getOpportunities();
    const forecast = strategyAdvisor.predictRisks(pools, opportunities);
    res.json(forecast);
});

// NEW: Get PnL forecast for specific opportunity
app.get('/api/ai/pnl-forecast/:opportunityId', (_req, res) => {
    const { opportunityId } = _req.params;
    const opportunity = arbitrageEngine.getOpportunity(opportunityId);

    if (!opportunity) {
        return res.status(404).json({ error: 'Opportunity not found' });
    }

    const pnlForecast = strategyAdvisor.forecastPnL(opportunity, opportunity.tradeAmount);
    res.json(pnlForecast);
});

// Manual execution endpoint (if autonomous mode disabled)
app.post('/api/execute/:opportunityId', async (req, res) => {
    if (config.agent.autonomousMode) {
        return res.status(400).json({ error: 'Cannot manually execute in autonomous mode' });
    }

    const { opportunityId } = req.params;
    const opportunity = arbitrageEngine.getOpportunity(opportunityId);

    if (!opportunity) {
        return res.status(404).json({ error: 'Opportunity not found' });
    }

    try {
        await arbitrageEngine.executeOpportunityIfAutonomous(opportunity);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// === WEBSOCKET ===

io.on('connection', (socket) => {
    console.log('✅ Client connected:', socket.id);

    // Send current state immediately
    socket.emit('pools', poolMonitor.getPools());
    socket.emit('opportunities', arbitrageEngine.getOpportunities());
    socket.emit('agent_stats', {
        execution: executionEngine.getStats(),
        ai: arbitrageEngine.getAIParameters(),
    });

    socket.on('disconnect', () => {
        console.log('❌ Client disconnected:', socket.id);
    });
});

// === AUTONOMOUS AI AGENT LOOP ===

/**
 * Main autonomous execution loop
 * This is the "brain" of the AI agent
 */
async function autonomousAgentLoop() {
    try {
        const pools = poolMonitor.getPools();

        // Step 1: AI predicts risks and adapts strategy
        const opportunities = arbitrageEngine.getOpportunities();
        const riskForecast = strategyAdvisor.predictRisks(pools, opportunities);
        const tradeStats = dataCollector.getTradeStats(24);
        const marketConditions = {
            volatility: riskForecast.predictedVolatility,
            successRate: tradeStats.successful_trades / Math.max(1, tradeStats.total_trades) || 0,
            avgProfit: tradeStats.avg_profit || 0,
        };
        const strategy = strategyAdvisor.adaptStrategy(marketConditions, riskForecast);

        // Log strategy changes
        if (strategy.mode !== 'balanced') {
            console.log(`🎯 Strategy adapted: ${strategy.mode.toUpperCase()} - ${strategy.reasoning}`);
        }

        // Step 2: AI detects opportunities (with scoring)
        const newOpportunities = arbitrageEngine.detectOpportunities(pools);

        if (newOpportunities.length > 0) {
            console.log(`🧠 AI found ${newOpportunities.length} opportunities`);
            io.emit('opportunities', newOpportunities);

            // Step 3: AI decides and executes autonomously (if enabled)
            if (config.agent.autonomousMode) {
                for (const opportunity of newOpportunities) {
                    // Execute asynchronously (don't wait)
                    arbitrageEngine.executeOpportunityIfAutonomous(opportunity)
                        .catch(err => console.error('Execution error:', err));
                }
            }
        }

        // Always emit updated pools and forecasts
        io.emit('pools', pools);
        io.emit('risk_forecast', riskForecast);
        io.emit('agent_stats', {
            execution: executionEngine.getStats(),
            ai: arbitrageEngine.getAIParameters(),
            strategy: strategy,
        });

    } catch (error) {
        console.error('❌ Agent loop error:', error);
    }
}

// === STARTUP ===

const PORT = config.server.port;

server.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║       🤖 DEEPSENTINEL AI AGENT STARTED                ║
╠═══════════════════════════════════════════════════════╣
║  🌐 Server:         http://localhost:${PORT}            ║
║  📡 WebSocket:      Ready                              ║
║  🔍 Pool Monitor:   Starting...                        ║
║  🧠 AI Engine:      Active                             ║ 
║  ⚙️  Mode:           ${config.agent.autonomousMode ? 'AUTONOMOUS ✨' : 'MANUAL      '}        ║
║  🗄️  Data:           ${config.agent.useRealPools ? 'REAL DEEPBOOK' : 'MOCK (TESTMODE)'}   ║
╚═══════════════════════════════════════════════════════╝
    `);

    // Start pool monitoring
    poolMonitor.start(config.monitoring.pollIntervalMs);

    // Start autonomous agent loop
    setInterval(autonomousAgentLoop, config.agent.executionIntervalMs);

    // Initial execution
    setTimeout(autonomousAgentLoop, 2000); // Start after 2 seconds

    console.log(`\n🚀 AI Agent is ${config.agent.autonomousMode ? 'AUTONOMOUSLY TRADING' : 'monitoring for opportunities'}`);
    console.log(`⏱️  Execution interval: ${config.agent.executionIntervalMs / 1000}s`);
    console.log(`💰  Max daily loss: $${config.agent.maxDailyLoss}`);
    console.log(`📊  Max position: $${config.agent.maxPositionSize}\n`);
});

export { app, io };
