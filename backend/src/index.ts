import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import http from 'http';
import { poolMonitor } from './services/poolMonitor';
import { arbitrageEngine } from './services/arbitrageEngine';
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

// Basic routes
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        message: 'DeepSentinel backend is running',
        poolsMonitored: poolMonitor.getPools().length,
        opportunitiesFound: arbitrageEngine.getOpportunityCount()
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

// WebSocket connection
io.on('connection', (socket) => {
    console.log('✅ Client connected:', socket.id);

    // Send current state immediately
    socket.emit('pools', poolMonitor.getPools());
    socket.emit('opportunities', arbitrageEngine.getOpportunities());

    socket.on('disconnect', () => {
        console.log('❌ Client disconnected:', socket.id);
    });
});

// Start pool monitoring
poolMonitor.start(config.monitoring.pollIntervalMs);

// Periodically detect arbitrage opportunities and emit to clients
setInterval(() => {
    const pools = poolMonitor.getPools();
    const opportunities = arbitrageEngine.detectOpportunities(pools);

    if (opportunities.length > 0) {
        console.log(`🎯 Found ${opportunities.length} arbitrage opportunities`);
        io.emit('opportunities', opportunities);
    }

    // Always emit updated pools
    io.emit('pools', pools);
}, config.monitoring.pollIntervalMs);

const PORT = config.server.port;

server.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    console.log(`📡 WebSocket server ready`);
    console.log(`🔍 Monitoring pools for arbitrage`);
    console.log(`⚙️  Environment: ${config.server.env}`);
});

export { app, io };
