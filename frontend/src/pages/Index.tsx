import { useArbitrage } from '@/hooks/useArbitrage';
import { Header } from '@/components/Header';
import { LivePricesPanel } from '@/components/LivePricesPanel';
import { ArbitrageOpportunityCard } from '@/components/ArbitrageOpportunityCard';
import { PnLSimulator } from '@/components/PnLSimulator';
import { ThresholdSettings } from '@/components/ThresholdSettings';
import { StatCard } from '@/components/StatCard';
import { Wallet, TrendingUp, BarChart3, Brain, Target, Activity, Wifi, WifiOff, RefreshCw, Cpu, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const {
    prices,
    bestOpportunity,
    systemStatus,
    threshold,
    setThreshold,
    isLoading,
    refresh,
  } = useArbitrage(3000);

  return (
    <div className="min-h-screen bg-background gradient-mesh">
      <Header status={systemStatus} />

      <main className="container mx-auto px-4 py-6">
        {/* Hero Section */}
        <div className="mb-8 text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-2 font-serif italic">
            AI-Filtered Arbitrage Intelligence
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Real-time DeepBook v3 price monitoring with intelligent threshold-based filtering.
            Only the single best opportunity is displayed.
          </p>
        </div>

        {/* Stats Bar - Enhanced with StatCard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Pools Monitored"
            value={prices.length}
            icon={Activity}
            variant="blue"
          />

          <StatCard
            label="AI Score"
            value={`${bestOpportunity?.profitabilityScore ?? '--'}/100`}
            icon={Cpu}
            variant="purple"
          />

          <StatCard
            label="Min Threshold"
            value={`${threshold.minNetProfitPercent}%`}
            icon={Shield}
            variant="orange"
          />

          <div className="glass hover-lift bg-gradient-to-br from-green-900/30 to-green-800/20 backdrop-blur-sm border border-green-700/50 rounded-lg p-6">
            <div className="flex items-center gap-2 text-green-400 mb-1">
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="text-xs font-medium">Refresh</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="font-mono text-sm p-0 h-auto text-green-400 hover:text-green-300"
              onClick={refresh}
            >
              Every 3s
            </Button>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Prices */}
          <div className="space-y-6">
            <LivePricesPanel prices={prices} isLoading={isLoading} />
            <ThresholdSettings
              threshold={threshold}
              onThresholdChange={setThreshold}
            />
          </div>

          {/* Center Column - Main Opportunity */}
          <div className="lg:col-span-2 space-y-6">
            <ArbitrageOpportunityCard opportunity={bestOpportunity} />
            <PnLSimulator opportunity={bestOpportunity} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
