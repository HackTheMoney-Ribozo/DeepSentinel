import { useEffect, useState } from 'react';
import { useStore } from './store';
import { PnLDashboard } from './components/PnLDashboard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Stats {
  trades: {
    total_trades: number;
    successful_trades: number;
    avg_profit: number;
    total_profit: number;
  };
  execution: {
    consecutiveFailures: number;
    dailyLoss: number;
    circuitBreakerActive: boolean;
  };
}

interface AgentStatus {
  autonomous: boolean;
  strategy: {
    mode: string;
    reasoning: string;
    positionSizing: number;
    riskLimit: number;
  };
}

function App() {
  const { initWebSocket, disconnectWebSocket, isConnected, pools, opportunities } = useStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [autonomousMode, setAutonomousMode] = useState(true);

  useEffect(() => {
    initWebSocket();
    fetchStats();
    fetchBalance();
    fetchAgentStatus();

    const interval = setInterval(() => {
      fetchStats();
      fetchBalance();
      fetchAgentStatus();
    }, 5000);

    return () => {
      disconnectWebSocket();
      clearInterval(interval);
    };
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/stats`);
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchBalance = async () => {
    try {
      const res = await fetch(
        `https://fullnode.testnet.sui.io:443`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'suix_getBalance',
            params: ['0xa40c1fa3743bb51f90370ec05bc3fc7229cc8df657655468a204d42f1deeb76f', '0x2::sui::SUI']
          })
        }
      );
      const data = await res.json();
      setBalance(parseInt(data.result.totalBalance) / 1_000_000_000);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  const fetchAgentStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/api/agent/status`);
      const data = await res.json();
      setAgentStatus(data);
      setAutonomousMode(data.autonomous);
    } catch (error) {
      console.error('Failed to fetch agent status:', error);
    }
  };

  const toggleMode = async () => {
    // In production, this would call an API to toggle mode
    alert('Mode toggle would update .env and restart backend');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-xl font-bold">🎯</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  DeepSentinel AI
                </h1>
                <p className="text-xs text-gray-400">Autonomous Arbitrage Trading</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Mode Toggle */}
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg">
                <span className="text-xs text-gray-400">Mode:</span>
                <button
                  onClick={toggleMode}
                  className={`px-3 py-1 rounded text-xs font-medium ${autonomousMode
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-600 text-gray-300'
                    }`}
                >
                  {autonomousMode ? '🤖 AUTONOMOUS' : '👤 MANUAL'}
                </button>
              </div>

              {/* Connection Status */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-xs text-gray-400">
                  {isConnected ? 'Live' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Top Stats Row - Balance & PnL */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 backdrop-blur-sm border border-blue-700/50 rounded-lg p-6">
            <div className="text-blue-400 text-sm mb-1">Wallet Balance</div>
            <div className="text-3xl font-bold">{balance.toFixed(2)} SUI</div>
            <div className="text-xs text-gray-400 mt-1">${balance.toFixed(2)} USD</div>
          </div>

          <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 backdrop-blur-sm border border-green-700/50 rounded-lg p-6">
            <div className="text-green-400 text-sm mb-1">Total PnL</div>
            <div className="text-3xl font-bold text-green-400">
              {stats?.trades?.total_profit ? `$${stats.trades.total_profit.toFixed(2)}` : '$0.00'}
            </div>
            <div className="text-xs text-gray-400 mt-1">All-time profit/loss</div>
          </div>

          <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 backdrop-blur-sm border border-purple-700/50 rounded-lg p-6">
            <div className="text-purple-400 text-sm mb-1">Trades</div>
            <div className="text-3xl font-bold">
              {stats?.trades ? `${stats.trades.successful_trades || 0}/${stats.trades.total_trades || 0}` : '0/0'}
            </div>
            <div className="text-xs text-gray-400 mt-1">Successful / Total</div>
          </div>

          <div className="bg-gradient-to-br from-orange-900/30 to-orange-800/20 backdrop-blur-sm border border-orange-700/50 rounded-lg p-6">
            <div className="text-orange-400 text-sm mb-1">AI Strategy</div>
            <div className="text-xl font-bold">{agentStatus?.strategy?.mode || 'BALANCED'}</div>
            <div className="text-xs text-gray-400 mt-1 truncate">
              {agentStatus?.strategy?.reasoning?.slice(0, 30) || 'Active'}...
            </div>
          </div>
        </div>

        {/* Pools & Opportunities Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Monitored Pools */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Monitored Pools</h2>
              <div className="text-sm text-gray-">Updates every 5s</div>
            </div>

            <div className="space-y-3">
              {pools.slice(0, 4).map((pool) => (
                <div key={pool.poolId} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-blue-400">
                        {pool.tokenA}/{pool.tokenB}
                      </div>
                      <div className="text-xs text-gray-500">#{pool.poolId.slice(-6)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{pool.priceA.toFixed(4)}</div>
                      <div className="text-xs text-gray-400">Current Price</div>
                    </div>
                  </div>
                </div>
              ))}

              {pools.length === 0 && (
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8 text-center text-gray-400">
                  <div className="text-4xl mb-2">⏳</div>
                  <div>Loading pools...</div>
                </div>
              )}
            </div>
          </div>

          {/* Active Opportunities */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">AI Opportunities</h2>
              {opportunities.length > 0 && (
                <div className="text-sm text-green-400 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  {opportunities.length} active
                </div>
              )}
            </div>

            <div className="space-y-3">
              {opportunities.slice(0, 3).map((opp) => (
                <div key={opp.id} className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold">{opp.poolA.tokenA}/{opp.poolA.tokenB}</div>
                    <div className="text-lg font-bold text-green-400">
                      +{opp.estimatedProfit.toFixed(2)} SUI
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <div>Spread: {(opp.spreadPercentage * 100).toFixed(2)}%</div>
                    <div className="px-2 py-1 bg-green-900/30 rounded text-green-400">
                      {autonomousMode ? '🤖 AUTO' : '👤 MANUAL'}
                    </div>
                  </div>
                </div>
              ))}

              {opportunities.length === 0 && (
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8 text-center text-gray-400">
                  <div className="text-4xl mb-2">🔍</div>
                  <div className="text-sm">Scanning...</div>
                  <div className="text-xs text-gray-500 mt-1">Monitoring {pools.length} pools</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PnL Dashboard */}
        <div className="mb-8">
          <PnLDashboard />
        </div>

        {/* Info Banner */}
        <div className="p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="text-2xl">{autonomousMode ? '🤖' : '👤'}</div>
            <div className="text-sm">
              <div className="font-medium text-blue-300 mb-1">
                {autonomousMode ? 'Autonomous Trading Active' : 'Manual Mode Active'}
              </div>
              <div className="text-gray-400">
                {autonomousMode
                  ? 'AI is monitoring markets and executing profitable trades automatically with your configured private key.'
                  : 'AI detects opportunities but requires manual approval before execution.'}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
