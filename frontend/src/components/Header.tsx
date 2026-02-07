import { SystemStatus } from '@/types/arbitrage';
import { Activity, Shield, Zap } from 'lucide-react';

interface HeaderProps {
  status: SystemStatus;
}

export const Header = ({ status }: HeaderProps) => {
  const getStatusColor = () => {
    switch (status.status) {
      case 'opportunity_found':
        return 'text-success';
      case 'no_opportunity':
        return 'text-muted-foreground';
      case 'error':
        return 'text-destructive';
      default:
        return 'text-primary animate-pulse-glow';
    }
  };

  const getStatusIcon = () => {
    switch (status.status) {
      case 'opportunity_found':
        return <Zap className="w-4 h-4" />;
      case 'scanning':
        return <Activity className="w-4 h-4 animate-pulse" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  return (
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-success animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                Deep<span className="text-primary text-glow-primary">Sentinel</span>
              </h1>
              <p className="text-xs text-muted-foreground font-mono">
                AI-Powered Arbitrage Intelligence
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50">
              <span className="text-xs text-muted-foreground font-mono">DeepBook v3</span>
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            </div>
            
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50 ${getStatusColor()}`}>
              {getStatusIcon()}
              <span className="text-xs font-mono hidden md:inline">{status.message}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
