// DeepBook v3 Mock Data Service
// In production, this would connect to DeepBook v3 SDK or Sui RPC

import { PoolPrice, ArbitrageLoop, ArbitrageThreshold, PnLSimulation, SystemStatus } from '@/types/arbitrage';

// Simulated DeepBook v3 pool addresses
const POOL_IDS = {
  SUI_USDC: '0x1234...sui_usdc',
  SUI_USDT: '0x5678...sui_usdt',
  USDC_USDT: '0x9abc...usdc_usdt',
};

// Default thresholds for arbitrage detection
export const DEFAULT_THRESHOLD: ArbitrageThreshold = {
  minNetProfitPercent: 0.40,
  minLiquidityScore: 50,
  maxSlippagePercent: 0.15,
  tradingFeePercent: 0.10,
};

// Generate realistic mock prices with some variance
const generateMockPrice = (basePrice: number, variance: number = 0.02): { bid: number; ask: number } => {
  const fluctuation = (Math.random() - 0.5) * 2 * variance * basePrice;
  const midPrice = basePrice + fluctuation;
  const spread = midPrice * (0.001 + Math.random() * 0.003); // 0.1% - 0.4% spread
  return {
    bid: midPrice - spread / 2,
    ask: midPrice + spread / 2,
  };
};

// Fetch simulated pool prices
export const fetchPoolPrices = (): PoolPrice[] => {
  const now = Date.now();
  
  const suiUsdcPrice = generateMockPrice(1.85); // SUI ~$1.85
  const suiUsdtPrice = generateMockPrice(1.852); // Slight variance
  const usdcUsdtPrice = generateMockPrice(1.0005); // USDC/USDT ~1:1

  return [
    {
      poolId: POOL_IDS.SUI_USDC,
      pair: 'SUI/USDC',
      baseAsset: 'SUI',
      quoteAsset: 'USDC',
      bestBid: suiUsdcPrice.bid,
      bestAsk: suiUsdcPrice.ask,
      spread: suiUsdcPrice.ask - suiUsdcPrice.bid,
      spreadPercent: ((suiUsdcPrice.ask - suiUsdcPrice.bid) / suiUsdcPrice.bid) * 100,
      liquidity: 500000 + Math.random() * 200000,
      lastUpdate: now,
    },
    {
      poolId: POOL_IDS.SUI_USDT,
      pair: 'SUI/USDT',
      baseAsset: 'SUI',
      quoteAsset: 'USDT',
      bestBid: suiUsdtPrice.bid,
      bestAsk: suiUsdtPrice.ask,
      spread: suiUsdtPrice.ask - suiUsdtPrice.bid,
      spreadPercent: ((suiUsdtPrice.ask - suiUsdtPrice.bid) / suiUsdtPrice.bid) * 100,
      liquidity: 450000 + Math.random() * 180000,
      lastUpdate: now,
    },
    {
      poolId: POOL_IDS.USDC_USDT,
      pair: 'USDC/USDT',
      baseAsset: 'USDC',
      quoteAsset: 'USDT',
      bestBid: usdcUsdtPrice.bid,
      bestAsk: usdcUsdtPrice.ask,
      spread: usdcUsdtPrice.ask - usdcUsdtPrice.bid,
      spreadPercent: ((usdcUsdtPrice.ask - usdcUsdtPrice.bid) / usdcUsdtPrice.bid) * 100,
      liquidity: 800000 + Math.random() * 300000,
      lastUpdate: now,
    },
  ];
};

// AI-style arbitrage scoring logic
const scoreArbitrageLoop = (
  loop: Omit<ArbitrageLoop, 'profitabilityScore' | 'confidence' | 'isViable'>,
  threshold: ArbitrageThreshold,
  avgLiquidity: number
): ArbitrageLoop => {
  // Calculate profitability score (0-100)
  let score = 0;
  
  // Net profit contributes up to 50 points
  score += Math.min(50, (loop.netProfitPercent / threshold.minNetProfitPercent) * 25);
  
  // Liquidity contributes up to 30 points
  const liquidityRatio = avgLiquidity / 500000;
  score += Math.min(30, liquidityRatio * 30);
  
  // Low slippage contributes up to 20 points
  const slippageScore = Math.max(0, 20 - (loop.slippage / threshold.maxSlippagePercent) * 20);
  score += slippageScore;

  // Determine confidence level
  let confidence: 'low' | 'medium' | 'high' = 'low';
  if (score >= 70) confidence = 'high';
  else if (score >= 45) confidence = 'medium';

  // Determine viability
  const isViable = 
    loop.netProfitPercent >= threshold.minNetProfitPercent &&
    loop.liquidityScore >= threshold.minLiquidityScore &&
    loop.slippage <= threshold.maxSlippagePercent;

  return {
    ...loop,
    profitabilityScore: Math.round(score),
    confidence,
    isViable,
  };
};

// Detect and evaluate arbitrage loops
export const detectArbitrageOpportunities = (
  prices: PoolPrice[],
  threshold: ArbitrageThreshold = DEFAULT_THRESHOLD
): ArbitrageLoop | null => {
  const suiUsdc = prices.find(p => p.pair === 'SUI/USDC');
  const suiUsdt = prices.find(p => p.pair === 'SUI/USDT');
  const usdcUsdt = prices.find(p => p.pair === 'USDC/USDT');

  if (!suiUsdc || !suiUsdt || !usdcUsdt) return null;

  const loops: ArbitrageLoop[] = [];

  // Loop 1: SUI → USDC → USDT → SUI
  // Buy SUI with USDC, sell USDC for USDT, buy SUI with USDT
  const loop1Entry = 1; // Start with 1 unit
  const loop1Step1 = loop1Entry / suiUsdc.bestAsk; // Buy SUI with USDC
  const loop1Step2 = loop1Step1 * suiUsdt.bestBid; // Sell SUI for USDT
  const loop1Step3 = loop1Step2 / usdcUsdt.bestAsk; // Convert USDT to USDC
  const loop1Gross = ((loop1Step3 - loop1Entry) / loop1Entry) * 100;
  const loop1Fees = threshold.tradingFeePercent * 3; // 3 trades
  const loop1Slippage = 0.05 + Math.random() * 0.1;
  const loop1Net = loop1Gross - loop1Fees - loop1Slippage;
  const loop1Liquidity = (suiUsdc.liquidity + suiUsdt.liquidity + usdcUsdt.liquidity) / 3;

  const riskFactors1: string[] = [];
  if (loop1Net < threshold.minNetProfitPercent) riskFactors1.push('Below profit threshold');
  if (loop1Liquidity < 400000) riskFactors1.push('Low liquidity');
  if (loop1Slippage > threshold.maxSlippagePercent) riskFactors1.push('High slippage risk');

  loops.push(scoreArbitrageLoop({
    id: 'loop-1',
    path: ['SUI', 'USDC', 'USDT', 'SUI'],
    pathDisplay: 'SUI → USDC → USDT → SUI',
    entryPrice: loop1Entry,
    exitPrice: loop1Step3,
    grossProfitPercent: loop1Gross,
    fees: loop1Fees,
    slippage: loop1Slippage,
    netProfitPercent: loop1Net,
    liquidityScore: Math.min(100, (loop1Liquidity / 500000) * 100),
    riskFactors: riskFactors1,
  }, threshold, loop1Liquidity));

  // Loop 2: SUI → USDT → USDC → SUI (reverse)
  const loop2Entry = 1;
  const loop2Step1 = loop2Entry / suiUsdt.bestAsk; // Buy SUI with USDT
  const loop2Step2 = loop2Step1 * suiUsdc.bestBid; // Sell SUI for USDC
  const loop2Step3 = loop2Step2 * usdcUsdt.bestBid; // Convert USDC to USDT
  const loop2Gross = ((loop2Step3 - loop2Entry) / loop2Entry) * 100;
  const loop2Fees = threshold.tradingFeePercent * 3;
  const loop2Slippage = 0.05 + Math.random() * 0.1;
  const loop2Net = loop2Gross - loop2Fees - loop2Slippage;
  const loop2Liquidity = (suiUsdc.liquidity + suiUsdt.liquidity + usdcUsdt.liquidity) / 3;

  const riskFactors2: string[] = [];
  if (loop2Net < threshold.minNetProfitPercent) riskFactors2.push('Below profit threshold');
  if (loop2Liquidity < 400000) riskFactors2.push('Low liquidity');
  if (loop2Slippage > threshold.maxSlippagePercent) riskFactors2.push('High slippage risk');

  loops.push(scoreArbitrageLoop({
    id: 'loop-2',
    path: ['SUI', 'USDT', 'USDC', 'SUI'],
    pathDisplay: 'SUI → USDT → USDC → SUI',
    entryPrice: loop2Entry,
    exitPrice: loop2Step3,
    grossProfitPercent: loop2Gross,
    fees: loop2Fees,
    slippage: loop2Slippage,
    netProfitPercent: loop2Net,
    liquidityScore: Math.min(100, (loop2Liquidity / 500000) * 100),
    riskFactors: riskFactors2,
  }, threshold, loop2Liquidity));

  // Filter viable loops and select the best one
  const viableLoops = loops.filter(l => l.isViable);
  
  if (viableLoops.length === 0) {
    // Return the best non-viable loop for display purposes (but marked as not viable)
    return loops.sort((a, b) => b.profitabilityScore - a.profitabilityScore)[0] || null;
  }

  // Return the single best opportunity
  return viableLoops.sort((a, b) => b.profitabilityScore - a.profitabilityScore)[0];
};

// Simulate PnL for a given capital amount
export const simulatePnL = (
  loop: ArbitrageLoop,
  capital: number
): PnLSimulation => {
  if (!loop.isViable) {
    return {
      initialCapital: capital,
      finalCapital: capital,
      netProfit: 0,
      profitPercent: 0,
      feesPaid: 0,
      slippageLoss: 0,
      loop: null,
    };
  }

  const grossProfit = capital * (loop.grossProfitPercent / 100);
  const feesPaid = capital * (loop.fees / 100);
  const slippageLoss = capital * (loop.slippage / 100);
  const netProfit = grossProfit - feesPaid - slippageLoss;
  const finalCapital = capital + netProfit;

  return {
    initialCapital: capital,
    finalCapital,
    netProfit,
    profitPercent: loop.netProfitPercent,
    feesPaid,
    slippageLoss,
    loop,
  };
};

// Get system status based on current state
export const getSystemStatus = (loop: ArbitrageLoop | null): SystemStatus => {
  const now = Date.now();

  if (!loop) {
    return {
      status: 'scanning',
      message: 'Scanning DeepBook v3 pools...',
      lastScan: now,
    };
  }

  if (loop.isViable) {
    return {
      status: 'opportunity_found',
      message: `Arbitrage detected: ${loop.netProfitPercent.toFixed(2)}% net profit`,
      lastScan: now,
    };
  }

  return {
    status: 'no_opportunity',
    message: 'No viable arbitrage meets threshold criteria',
    lastScan: now,
  };
};
