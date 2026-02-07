import { useEffect, useState } from 'react';
import axios from 'axios';

interface PnLData {
    cumulativePnL: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    avgProfit: number;
    largestWin: number;
    largestLoss: number;
}

interface Trade {
    id: string;
    timestamp: number;
    tokenA: string;
    tokenB: string;
    amountIn: number;
    amountOut: number;
    profit: number;
    profitPercent: number;
}

export function PnLDashboard() {
    const [pnl, setPnl] = useState<PnLData | null>(null);
    const [trades, setTrades] = useState<Trade[]>([]);

    useEffect(() => {
        fetchPnL();
        const interval = setInterval(fetchPnL, 5000); // Update every 5s
        return () => clearInterval(interval);
    }, []);

    const fetchPnL = async () => {
        try {
            const response = await axios.get('http://localhost:3000/api/pnl');
            setPnl(response.data.current);
            setTrades(response.data.history || []);
        } catch (error) {
            console.error('Failed to fetch PnL:', error);
        }
    };

    if (!pnl) {
        return (
            <div className="bg-gray-800 rounded-lg p-6">
                <div className="animate-pulse">Loading P&L...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Main PnL Card */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700">
                <h2 className="text-2xl font-bold mb-6 text-white flex items-center">
                    💰 Profit & Loss
                    <span className="ml-3 text-sm font-normal text-gray-400">
                        ({pnl.totalTrades} trades)
                    </span>
                </h2>

                {/* Cumulative PnL - Big Display */}
                <div className="mb-8 text-center">
                    <div className="text-sm text-gray-400 uppercase mb-2">Cumulative P&L</div>
                    <div className={`text-6xl font-bold ${pnl.cumulativePnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {pnl.cumulativePnL >= 0 ? '+' : ''}${pnl.cumulativePnL.toFixed(2)}
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-700/50 rounded-lg p-4">
                        <div className="text-gray-400 text-sm mb-1">Win Rate</div>
                        <div className="text-2xl font-bold text-blue-400">
                            {pnl.winRate.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            {pnl.winningTrades}W / {pnl.losingTrades}L
                        </div>
                    </div>

                    <div className="bg-gray-700/50 rounded-lg p-4">
                        <div className="text-gray-400 text-sm mb-1">Avg Profit</div>
                        <div className={`text-2xl font-bold ${pnl.avgProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {pnl.avgProfit >= 0 ? '+' : ''}${pnl.avgProfit.toFixed(2)}
                        </div>
                    </div>

                    <div className="bg-gray-700/50 rounded-lg p-4">
                        <div className="text-gray-400 text-sm mb-1">Largest Win</div>
                        <div className="text-2xl font-bold text-green-400">
                            +${pnl.largestWin.toFixed(2)}
                        </div>
                    </div>

                    <div className="bg-gray-700/50 rounded-lg p-4">
                        <div className="text-gray-400 text-sm mb-1">Largest Loss</div>
                        <div className="text-2xl font-bold text-red-400">
                            ${pnl.largestLoss.toFixed(2)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Trade History */}
            {trades.length > 0 && (
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <h3 className="text-xl font-bold mb-4 text-white">Recent Trades</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-gray-400 border-b border-gray-700">
                                    <th className="text-left py-2">Time</th>
                                    <th className="text-left py-2">Pair</th>
                                    <th className="text-right py-2">Amount</th>
                                    <th className="text-right py-2">Profit</th>
                                    <th className="text-right py-2">%</th>
                                </tr>
                            </thead>
                            <tbody>
                                {trades.map((trade) => (
                                    <tr key={trade.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                                        <td className="py-2 text-gray-400">
                                            {new Date(trade.timestamp).toLocaleTimeString()}
                                        </td>
                                        <td className="py-2 text-white">
                                            {trade.tokenA}/{trade.tokenB}
                                        </td>
                                        <td className="text-right py-2 text-gray-300">
                                            ${trade.amountIn}
                                        </td>
                                        <td className={`text-right py-2 font-semibold ${trade.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {trade.profit >= 0 ? '+' : ''}${trade.profit.toFixed(2)}
                                        </td>
                                        <td className={`text-right py-2 ${trade.profitPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {trade.profitPercent >= 0 ? '+' : ''}{trade.profitPercent.toFixed(2)}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* No Trades Yet */}
            {trades.length === 0 && (
                <div className="bg-gray-800 rounded-lg p-12 border border-gray-700 text-center">
                    <div className="text-gray-500 text-lg mb-2">No trades executed yet</div>
                    <div className="text-gray-600 text-sm">
                        Waiting for arbitrage opportunities...
                    </div>
                </div>
            )}
        </div>
    );
}
