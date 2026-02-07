import { motion } from 'framer-motion';
import { TrendingUp, Zap, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedOpportunityCardProps {
    tokenA: string;
    tokenB: string;
    estimatedProfit: number;
    spreadPercentage: number;
    aiScore?: number;
    isNew?: boolean;
    onClick?: () => void;
    className?: string;
}

export function EnhancedOpportunityCard({
    tokenA,
    tokenB,
    estimatedProfit,
    spreadPercentage,
    aiScore,
    isNew = false,
    onClick,
    className
}: EnhancedOpportunityCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            whileHover={{ scale: 1.02 }}
            onClick={onClick}
            className={cn(
                'gradient-border-success hover-lift cursor-pointer p-4 relative overflow-hidden',
                isNew && 'animate-pulse-border',
                className
            )}
        >
            {/* Glow effect for new opportunities */}
            {isNew && (
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-blue-500/10 animate-pulse" />
            )}

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm font-semibold text-foreground">
                            {tokenA}/{tokenB}
                        </span>
                    </div>

                    {aiScore !== undefined && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-purple-900/30 border border-purple-700/50 rounded-md">
                            <Brain className="w-3 h-3 text-purple-400" />
                            <span className="text-xs font-medium text-purple-400">
                                {aiScore.toFixed(1)}/10
                            </span>
                        </div>
                    )}
                </div>

                {/* Profit Display */}
                <div className="mb-3">
                    <div className="flex items-baseline gap-2">
                        <TrendingUp className="w-5 h-5 text-green-400" />
                        <span className="text-2xl font-bold text-green-400">
                            +{estimatedProfit.toFixed(2)} SUI
                        </span>
                    </div>
                </div>

                {/* Details */}
                <div className="flex items-center justify-between text-xs">
                    <div className="text-muted-foreground">
                        Spread: <span className="text-foreground font-medium">{(spreadPercentage * 100).toFixed(2)}%</span>
                    </div>

                    {isNew && (
                        <div className="px-2 py-1 bg-green-900/30 border border-green-700/50 rounded text-green-400 font-medium">
                            NEW
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
