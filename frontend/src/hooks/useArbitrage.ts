import { useState, useEffect, useCallback } from 'react';
import { PoolPrice, ArbitrageLoop, ArbitrageThreshold, SystemStatus } from '@/types/arbitrage';
import { 
  fetchPoolPrices, 
  detectArbitrageOpportunities, 
  getSystemStatus,
  DEFAULT_THRESHOLD 
} from '@/services/deepbook';

interface UseArbitrageReturn {
  prices: PoolPrice[];
  bestOpportunity: ArbitrageLoop | null;
  systemStatus: SystemStatus;
  threshold: ArbitrageThreshold;
  setThreshold: (threshold: ArbitrageThreshold) => void;
  isLoading: boolean;
  refresh: () => void;
}

export const useArbitrage = (refreshInterval: number = 3000): UseArbitrageReturn => {
  const [prices, setPrices] = useState<PoolPrice[]>([]);
  const [bestOpportunity, setBestOpportunity] = useState<ArbitrageLoop | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    status: 'scanning',
    message: 'Initializing DeepSentinel...',
    lastScan: Date.now(),
  });
  const [threshold, setThreshold] = useState<ArbitrageThreshold>(DEFAULT_THRESHOLD);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(() => {
    setIsLoading(true);
    
    // Fetch latest prices
    const newPrices = fetchPoolPrices();
    setPrices(newPrices);
    
    // Detect arbitrage opportunities
    const opportunity = detectArbitrageOpportunities(newPrices, threshold);
    setBestOpportunity(opportunity);
    
    // Update system status
    const status = getSystemStatus(opportunity);
    setSystemStatus(status);
    
    setIsLoading(false);
  }, [threshold]);

  useEffect(() => {
    // Initial fetch
    refresh();

    // Set up polling interval
    const interval = setInterval(refresh, refreshInterval);

    return () => clearInterval(interval);
  }, [refresh, refreshInterval]);

  return {
    prices,
    bestOpportunity,
    systemStatus,
    threshold,
    setThreshold,
    isLoading,
    refresh,
  };
};
