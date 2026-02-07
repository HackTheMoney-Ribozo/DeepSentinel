import { PoolPrice } from '@/types/arbitrage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface LivePricesPanelProps {
  prices: PoolPrice[];
  isLoading: boolean;
}

export const LivePricesPanel = ({ prices, isLoading }: LivePricesPanelProps) => {
  const formatPrice = (price: number): string => {
    return price.toFixed(price < 10 ? 4 : 2);
  };

  const formatLiquidity = (liquidity: number): string => {
    if (liquidity >= 1000000) return `$${(liquidity / 1000000).toFixed(2)}M`;
    return `$${(liquidity / 1000).toFixed(0)}K`;
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Live DeepBook Prices
          {isLoading && (
            <span className="ml-auto w-2 h-2 rounded-full bg-primary animate-pulse" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {prices.map((pool) => (
          <div
            key={pool.poolId}
            className="p-3 rounded-lg bg-muted/30 border border-border/30 hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-foreground">{pool.pair}</span>
              <span className="text-xs text-muted-foreground font-mono">
                {formatLiquidity(pool.liquidity)}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Best Bid</p>
                <p className="font-mono text-success font-medium flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {formatPrice(pool.bestBid)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Best Ask</p>
                <p className="font-mono text-destructive font-medium flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" />
                  {formatPrice(pool.bestAsk)}
                </p>
              </div>
            </div>
            
            <div className="mt-2 pt-2 border-t border-border/30">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Spread</span>
                <span className="font-mono text-foreground">
                  {pool.spreadPercent.toFixed(3)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
