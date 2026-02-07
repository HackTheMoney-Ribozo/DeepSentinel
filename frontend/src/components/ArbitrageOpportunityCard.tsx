import { ArbitrageLoop } from '@/types/arbitrage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Zap, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface ArbitrageOpportunityCardProps {
  opportunity: ArbitrageLoop | null;
}

export const ArbitrageOpportunityCard = ({ opportunity }: ArbitrageOpportunityCardProps) => {
  if (!opportunity) {
    return (
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Zap className="w-4 h-4 text-muted-foreground" />
            Best Arbitrage Opportunity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">Scanning for opportunities...</p>
            <p className="text-xs text-muted-foreground mt-1">
              Analyzing DeepBook v3 price feeds
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getConfidenceBadge = () => {
    const colors = {
      high: 'bg-success/20 text-success border-success/30',
      medium: 'bg-warning/20 text-warning border-warning/30',
      low: 'bg-destructive/20 text-destructive border-destructive/30',
    };
    return colors[opportunity.confidence];
  };

  const getScoreColor = () => {
    if (opportunity.profitabilityScore >= 70) return 'text-success';
    if (opportunity.profitabilityScore >= 45) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <Card className={`border-border/50 bg-card/80 backdrop-blur-sm ${opportunity.isViable ? 'border-glow' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Zap className={`w-4 h-4 ${opportunity.isViable ? 'text-primary' : 'text-muted-foreground'}`} />
            Best Arbitrage Opportunity
          </CardTitle>
          <div className="flex items-center gap-2">
            {opportunity.isViable ? (
              <Badge variant="outline" className="bg-success/20 text-success border-success/30">
                <CheckCircle className="w-3 h-3 mr-1" />
                Viable
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-destructive/20 text-destructive border-destructive/30">
                <XCircle className="w-3 h-3 mr-1" />
                Below Threshold
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Loop Path */}
        <div className="p-4 rounded-lg bg-muted/30 border border-border/30">
          <p className="text-xs text-muted-foreground mb-2">Trading Path</p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {opportunity.path.map((asset, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-md bg-primary/10 text-primary font-mono font-semibold text-sm border border-primary/20">
                  {asset}
                </span>
                {index < opportunity.path.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-primary" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
            <p className="text-xs text-muted-foreground mb-1">Net Profit</p>
            <p className={`font-mono text-xl font-bold ${opportunity.netProfitPercent >= 0 ? 'text-success text-glow-success' : 'text-destructive'}`}>
              {opportunity.netProfitPercent >= 0 ? '+' : ''}{opportunity.netProfitPercent.toFixed(3)}%
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
            <p className="text-xs text-muted-foreground mb-1">AI Score</p>
            <p className={`font-mono text-xl font-bold ${getScoreColor()}`}>
              {opportunity.profitabilityScore}/100
            </p>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Gross Profit</span>
            <span className="font-mono text-foreground">{opportunity.grossProfitPercent.toFixed(3)}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Trading Fees (3x)</span>
            <span className="font-mono text-destructive">-{opportunity.fees.toFixed(3)}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Slippage Buffer</span>
            <span className="font-mono text-destructive">-{opportunity.slippage.toFixed(3)}%</span>
          </div>
          <div className="flex justify-between text-sm pt-2 border-t border-border/30">
            <span className="text-muted-foreground">Liquidity Score</span>
            <span className="font-mono text-foreground">{opportunity.liquidityScore.toFixed(0)}/100</span>
          </div>
        </div>

        {/* Confidence & Risk */}
        <div className="flex items-center justify-between pt-2">
          <Badge variant="outline" className={getConfidenceBadge()}>
            {opportunity.confidence.toUpperCase()} Confidence
          </Badge>
          {opportunity.riskFactors.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-warning">
              <AlertTriangle className="w-3 h-3" />
              {opportunity.riskFactors.length} risk factor{opportunity.riskFactors.length > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Risk Factors */}
        {opportunity.riskFactors.length > 0 && (
          <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
            <p className="text-xs text-warning font-medium mb-2">Risk Factors:</p>
            <ul className="space-y-1">
              {opportunity.riskFactors.map((risk, index) => (
                <li key={index} className="text-xs text-warning/80 flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-warning" />
                  {risk}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
