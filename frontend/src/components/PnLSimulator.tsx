import { useState, useMemo } from 'react';
import { ArbitrageLoop, PnLSimulation } from '@/types/arbitrage';
import { simulatePnL } from '@/services/deepbook';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calculator, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';

interface PnLSimulatorProps {
  opportunity: ArbitrageLoop | null;
}

export const PnLSimulator = ({ opportunity }: PnLSimulatorProps) => {
  const [capital, setCapital] = useState<string>('1000');

  const simulation = useMemo((): PnLSimulation | null => {
    if (!opportunity) return null;
    const capitalNum = parseFloat(capital) || 0;
    if (capitalNum <= 0) return null;
    return simulatePnL(opportunity, capitalNum);
  }, [opportunity, capital]);

  const presetAmounts = [100, 500, 1000, 5000];

  const isDisabled = !opportunity?.isViable;

  return (
    <Card className={`border-border/50 bg-card/80 backdrop-blur-sm ${isDisabled ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Calculator className="w-4 h-4 text-primary" />
          PnL Simulator
          {isDisabled && (
            <span className="ml-auto text-xs text-muted-foreground font-normal">
              No viable opportunity
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Capital Input */}
        <div>
          <label className="text-xs text-muted-foreground mb-2 block">
            Starting Capital (USDC)
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="number"
              value={capital}
              onChange={(e) => setCapital(e.target.value)}
              className="pl-9 font-mono bg-muted/30 border-border/50"
              placeholder="Enter amount"
              disabled={isDisabled}
            />
          </div>
          <div className="flex gap-2 mt-2">
            {presetAmounts.map((amount) => (
              <Button
                key={amount}
                variant="outline"
                size="sm"
                className="flex-1 text-xs font-mono"
                onClick={() => setCapital(amount.toString())}
                disabled={isDisabled}
              >
                ${amount}
              </Button>
            ))}
          </div>
        </div>

        {/* Simulation Results */}
        {simulation && opportunity?.isViable ? (
          <div className="space-y-3 pt-2">
            <div className="p-4 rounded-lg bg-success/10 border border-success/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Simulated Return</span>
                <TrendingUp className="w-4 h-4 text-success" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl font-bold text-success text-glow-success">
                  ${simulation.finalCapital.toFixed(2)}
                </span>
                <span className="text-sm text-success">
                  (+{simulation.profitPercent.toFixed(2)}%)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
                <p className="text-xs text-muted-foreground mb-1">Net Profit</p>
                <p className="font-mono text-lg font-semibold text-success">
                  +${simulation.netProfit.toFixed(2)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
                <p className="text-xs text-muted-foreground mb-1">Total Costs</p>
                <p className="font-mono text-lg font-semibold text-destructive">
                  -${(simulation.feesPaid + simulation.slippageLoss).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Initial Capital</span>
                <span className="font-mono">${simulation.initialCapital.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fees Paid</span>
                <span className="font-mono text-destructive">-${simulation.feesPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Slippage Loss</span>
                <span className="font-mono text-destructive">-${simulation.slippageLoss.toFixed(2)}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-xs text-primary flex items-center gap-2">
                <AlertCircle className="w-3 h-3" />
                Simulation only • No real trades executed
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <AlertCircle className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {isDisabled 
                ? 'No viable arbitrage opportunity available'
                : 'Enter capital amount to simulate'
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
