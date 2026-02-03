import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

interface PoolData {
    poolId: string;
    tokenA: string;
    tokenB: string;
    priceA: number;
    priceB: number;
    liquidityA: number;
    liquidityB: number;
    lastUpdate: number;
}

interface ArbitrageOpportunity {
    id: string;
    poolA: PoolData;
    poolB: PoolData;
    spread: number;
    spreadPercentage: number;
    estimatedProfit: number;
    tradeAmount: number;
    gasEstimate: number;
    shouldExecute: boolean;
    createdAt: number;
}

interface AppState {
    // WebSocket
    socket: Socket | null;
    isConnected: boolean;

    // Data
    pools: PoolData[];
    opportunities: ArbitrageOpportunity[];

    // Actions
    initWebSocket: () => void;
    disconnectWebSocket: () => void;
}

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

export const useStore = create<AppState>((set, get) => ({
    socket: null,
    isConnected: false,
    pools: [],
    opportunities: [],

    initWebSocket: () => {
        const socket = io(WS_URL);

        socket.on('connect', () => {
            console.log('✅ Connected to WebSocket');
            set({ isConnected: true, socket });
        });

        socket.on('disconnect', () => {
            console.log('❌ Disconnected from WebSocket');
            set({ isConnected: false });
        });

        socket.on('pools', (pools: PoolData[]) => {
            set({ pools });
        });

        socket.on('opportunities', (opportunities: ArbitrageOpportunity[]) => {
            console.log(`🎯 Received ${opportunities.length} opportunities`);
            set({ opportunities });
        });

        set({ socket });
    },

    disconnectWebSocket: () => {
        const { socket } = get();
        if (socket) {
            socket.disconnect();
            set({ socket: null, isConnected: false });
        }
    },
}));
