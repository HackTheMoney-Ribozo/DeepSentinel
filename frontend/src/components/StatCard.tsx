import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { LucideProps } from 'lucide-react';

interface StatCardProps {
    label: string;
    value: string | number;
    subtext?: string;
    icon: React.ComponentType<LucideProps>;
    variant: 'blue' | 'green' | 'purple' | 'orange' | 'red';
    trend?: 'up' | 'down' | 'neutral';
    className?: string;
}

const variantStyles = {
    blue: {
        bg: 'from-blue-900/30 to-blue-800/20',
        border: 'border-blue-700/50',
        text: 'text-blue-400',
        icon: 'text-blue-400',
    },
    green: {
        bg: 'from-green-900/30 to-green-800/20',
        border: 'border-green-700/50',
        text: 'text-green-400',
        icon: 'text-green-400',
    },
    purple: {
        bg: 'from-purple-900/30 to-purple-800/20',
        border: 'border-purple-700/50',
        text: 'text-purple-400',
        icon: 'text-purple-400',
    },
    orange: {
        bg: 'from-orange-900/30 to-orange-800/20',
        border: 'border-orange-700/50',
        text: 'text-orange-400',
        icon: 'text-orange-400',
    },
    red: {
        bg: 'from-red-900/30 to-red-800/20',
        border: 'border-red-700/50',
        text: 'text-red-400',
        icon: 'text-red-400',
    },
};

export function StatCard({
    label,
    value,
    subtext,
    icon: Icon,
    variant,
    trend,
    className
}: StatCardProps) {
    const styles = variantStyles[variant];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
                'glass hover-lift bg-gradient-to-br backdrop-blur-sm border rounded-lg p-6 cursor-pointer',
                styles.bg,
                styles.border,
                className
            )}
        >
            <div className="flex items-start justify-between mb-3">
                <div className={cn('text-sm font-medium', styles.text)}>{label}</div>
                <Icon className={cn('w-5 h-5', styles.icon)} />
            </div>

            <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-foreground counter">
                    {value}
                </div>
                {trend && (
                    <div className={cn(
                        'text-sm',
                        trend === 'up' ? 'text-green-400' :
                            trend === 'down' ? 'text-red-400' :
                                'text-muted-foreground'
                    )}>
                        {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
                    </div>
                )}
            </div>

            {subtext && (
                <div className="text-xs text-muted-foreground mt-2">{subtext}</div>
            )}
        </motion.div>
    );
}
