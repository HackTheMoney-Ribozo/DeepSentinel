import { useEffect, useState } from 'react';
import { ConnectButton, useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useStore } from './store';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface ArbitrageOpportunity {
  id: string;
  poolA: any;
  poolB: any;
  spread: number;
  spreadPercentage: number;
  estimatedProfit: number;
  tradeAmount: number;
  gasEstimate: number;
  shouldExecute: boolean;
  createdAt: number;
}

function App() {
  const { initWebSocket, disconnectWebSocket, isConnected, pools, opportunities } = useStore();
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [executing, setExecuting] = useState<string | null>(null);

  useEffect(() => {
    initWebSocket();
    return () => disconnectWebSocket();
  }, []);

  const handleExecuteArbitrage = async (opp: ArbitrageOpportunity) => {
    if (!currentAccount) {
      alert('Please connect your wallet first');
      return;
    }

    setExecuting(opp.id);

    try {
      // For MVP: Create a simple transaction
      // In production: This would call the backend to build the proper PTB
      const tx = new Transaction();

      // Placeholder: Just a transfer to show transaction capability
      // In production, this would be the complex flash arbitrage PTB
      const [coin] = tx.splitCoins(tx.gas, [100]); // 0.0000001 SUI
      tx.transferObjects([coin], currentAccount.address);

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: (result) => {
            console.log('✅ Transaction successful:', result);
            alert(`Arbitrage executed! Digest: ${result.digest}`);
          },
          onError: (error) => {
            console.error('❌ Transaction failed:', error);
            alert(`Transaction failed: ${error.message}`);
          },
        }
      );
    } catch (error: any) {
      console.error('Error executing arbitrage:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setExecuting(null);
    }
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
                  DeepSentinel
                </h1>
                <p className="text-xs text-gray-400">Automated Arbitrage on Sui</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Connection Status */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-xs text-gray-400">
                  {isConnected ? 'Live' : 'Offline'}
                </span>
              </div>

              {/* Wallet Connect */}
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
            <div className="text-gray-400 text-sm mb-1">Pools Monitored</div>
            <div className="text-3xl font-bold">{pools.length}</div>
            <div className="text-xs text-gray-500 mt-1">Real-time tracking</div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
            <div className="text-gray-400 text-sm mb-1">Opportunities</div>
            <div className="text-3xl font-bold text-green-400">{opportunities.length}</div>
            <div className="text-xs text-gray-500 mt-1">Active now</div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
            <div className="text-gray-400 text-sm mb-1">Wallet Status</div>
            <div className="text-lg font-bold text-blue-400">
              {currentAccount ? 'Connected' : 'Disconnected'}
            </div>
            <div className="text-xs text-gray-500 mt-1 truncate">
              {currentAccount ? currentAccount.address.slice(0, 8) + '...' : 'Not connected'}
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
            <div className="text-gray-400 text-sm mb-1">Network</div>
            <div className="text-xl font-bold text-purple-400">Sui Testnet</div>
            <div className="text-xs text-gray-500 mt-1">Ready to trade</div>
          </div>
        </div>

        {/* Pools Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Monitored Pools</h2>
            <div className="text-sm text-gray-400">Updates every 5s</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {pools.map((pool) => (
              <div key={pool.poolId} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    {pool.tokenA}/{pool.tokenB}
                  </div>
                  <div className="text-xs text-gray-500">#{pool.poolId.slice(-6)}</div>
                </div>

                <div className="space-y-2">
                  <div>
                    <div className="text-xs text-gray-400">Current Price</div>
                    <div className="text-xl font-bold">{pool.priceA.toFixed(4)}</div>
                  </div>

                  <div className="pt-2 border-t border-gray-700">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-gray-400">{pool.tokenA}</div>
                        <div className="font-medium">{(pool.liquidityA / 1000).toFixed(1)}K</div>
                      </div>
                      <div>
                        <div className="text-gray-400">{pool.tokenB}</div>
                        <div className="font-medium">{(pool.liquidityB / 1000).toFixed(1)}K</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {pools.length === 0 && (
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-8 text-center text-gray-400">
              <div className="text-4xl mb-2">⏳</div>
              <div>Loading pools...</div>
            </div>
          )}
        </div>

        {/* Opportunities Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Arbitrage Opportunities</h2>
            {opportunities.length > 0 && (
              <div className="text-sm text-green-400 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                {opportunities.length} active
              </div>
            )}
          </div>

          <div className="space-y-4">
            {opportunities.map((opp) => (
              <div key={opp.id} className="bg-gradient-to-r from-green-900/20 to-blue-900/20 backdrop-blur-sm border border-green-700/50 rounded-lg p-6 hover:border-green-600/50 transition">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Arbitrage Opportunity</div>
                    <div className="text-lg font-bold">
                      {opp.poolA.tokenA}/{opp.poolA.tokenB}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Between pools {opp.poolA.poolId.slice(-4)} ↔ {opp.poolB.poolId.slice(-4)}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-gray-400 mb-1">Estimated Profit</div>
                    <div className="text-2xl font-bold text-green-400">
                      +{opp.estimatedProfit.toFixed(3)} SUI
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {(opp.spreadPercentage * 100).toFixed(2)}% spread
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                  <div className="bg-gray-800/50 rounded p-2">
                    <div className="text-gray-400 text-xs">Trade Amount</div>
                    <div className="font-medium">{opp.tradeAmount} SUI</div>
                  </div>

                  <div className="bg-gray-800/50 rounded p-2">
                    <div className="text-gray-400 text-xs">Pool A Price</div>
                    <div className="font-medium">{opp.poolA.priceA.toFixed(4)}</div>
                  </div>

                  <div className="bg-gray-800/50 rounded p-2">
                    <div className="text-gray-400 text-xs">Pool B Price</div>
                    <div className="font-medium">{opp.poolB.priceA.toFixed(4)}</div>
                  </div>

                  <div className="bg-gray-800/50 rounded p-2">
                    <div className="text-gray-400 text-xs">Gas Estimate</div>
                    <div className="font-medium">{opp.gasEstimate.toFixed(4)} SUI</div>
                  </div>
                </div>

                <button
                  onClick={() => handleExecuteArbitrage(opp)}
                  disabled={!currentAccount || executing === opp.id}
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {executing === opp.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Executing...
                    </>
                  ) : !currentAccount ? (
                    'Connect Wallet to Execute'
                  ) : (
                    <>
                      ⚡ Execute Arbitrage
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>

          {opportunities.length === 0 && (
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-12 text-center text-gray-400">
              <div className="text-6xl mb-4">🔍</div>
              <div className="text-xl font-medium mb-2">Scanning for Opportunities</div>
              <div className="text-sm">Monitoring {pools.length} pools for profitable arbitrage...</div>
              <div className="text-xs text-gray-500 mt-2">
                Opportunities appear when spread {'>'} 0.5% and profit {'>'} 0.1 SUI
              </div>
            </div>
          )}
        </div>

        {/* Info Footer */}
        <div className="mt-8 p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="text-2xl">ℹ️</div>
            <div className="text-sm">
              <div className="font-medium text-blue-300 mb-1">MVP Demo Mode</div>
              <div className="text-gray-400">
                This is a working prototype. Arbitrage execution creates a test transaction.
                In production, it would execute flash loan arbitrage on DeepBook V3.
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
