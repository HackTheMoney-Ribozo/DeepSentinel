import { ArbitrageThreshold } from '@/types/arbitrage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Settings2 } from 'lucide-react';

interface ThresholdSettingsProps {
  threshold: ArbitrageThreshold;
  onThresholdChange: (threshold: ArbitrageThreshold) => void;
}

export const ThresholdSettings = ({ threshold, onThresholdChange }: ThresholdSettingsProps) => {
  const handleChange = (key: keyof ArbitrageThreshold, value: string) => {
    const numValue = parseFloat(value) || 0;
    onThresholdChange({
      ...threshold,
      [key]: numValue,
    });
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-primary" />
          Threshold Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">
            Min Net Profit %
          </label>
          <Input
            type="number"
            step="0.01"
            value={threshold.minNetProfitPercent}
            onChange={(e) => handleChange('minNetProfitPercent', e.target.value)}
            className="font-mono text-sm bg-muted/30 border-border/50"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">
            Trading Fee % (per trade)
          </label>
          <Input
            type="number"
            step="0.01"
            value={threshold.tradingFeePercent}
            onChange={(e) => handleChange('tradingFeePercent', e.target.value)}
            className="font-mono text-sm bg-muted/30 border-border/50"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">
            Max Slippage %
          </label>
          <Input
            type="number"
            step="0.01"
            value={threshold.maxSlippagePercent}
            onChange={(e) => handleChange('maxSlippagePercent', e.target.value)}
            className="font-mono text-sm bg-muted/30 border-border/50"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">
            Min Liquidity Score
          </label>
          <Input
            type="number"
            step="1"
            value={threshold.minLiquidityScore}
            onChange={(e) => handleChange('minLiquidityScore', e.target.value)}
            className="font-mono text-sm bg-muted/30 border-border/50"
          />
        </div>
      </CardContent>
    </Card>
  );
};
