import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

interface PnLChartProps {
    data: Array<{
        timestamp: number;
        profit: number;
        cumulativePnL: number;
    }>;
}

export function PnLChart({ data }: PnLChartProps) {
    const [chartData, setChartData] = useState<Array<{ time: string; value: number }>>([]);
    const [totalPnL, setTotalPnL] = useState(0);
    const [todayGain, setTodayGain] = useState(0);

    useEffect(() => {
        if (data.length === 0) return;

        // Transform data for chart
        const transformed = data.map((item) => ({
            time: new Date(item.timestamp).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            }),
            value: item.cumulativePnL,
        }));

        setChartData(transformed);

        // Calculate total PnL
        const latest = data[data.length - 1];
        setTotalPnL(latest?.cumulativePnL || 0);

        // Calculate today's gain (difference from start)
        if (data.length > 1) {
            const first = data[0].cumulativePnL;
            const last = latest.cumulativePnL;
            setTodayGain(last - first);
        }
    }, [data]);

    const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { time: string }; value: number }> }) => {
        if (active && payload && payload.length) {
            return (
                <div className="glass-strong rounded-lg p-3 border border-border">
                    <p className="text-sm text-muted-foreground">{payload[0].payload.time}</p>
                    <p className={`text-lg font-bold ${payload[0].value >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${payload[0].value.toFixed(2)}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="glass hover-lift bg-gradient-to-br from-card/50 to-background/50 backdrop-blur-sm border border-border rounded-xl p-6"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-green-400" />
                        Profit & Loss
                    </h2>
                </div>

                <div className="flex gap-6">
                    <div className="text-right">
                        <div className="text-xs text-muted-foreground mb-1">Total PnL</div>
                        <div className={`text-xl font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
                        </div>
                    </div>

                    <div className="text-right">
                        <div className="text-xs text-muted-foreground mb-1">Today's Gain</div>
                        <div className={`text-xl font-bold ${todayGain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {todayGain >= 0 ? '+' : ''}{((todayGain / Math.max(1, Math.abs(totalPnL - todayGain))) * 100).toFixed(1)}%
                        </div>
                    </div>
                </div>
            </div>

            {/* Chart */}
            {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(150, 70%, 50%)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(150, 70%, 50%)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis
                            dataKey="time"
                            stroke="hsl(var(--muted-foreground))"
                            style={{ fontSize: '12px' }}
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <YAxis
                            stroke="hsl(var(--muted-foreground))"
                            style={{ fontSize: '12px' }}
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                            tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="hsl(150, 70%, 50%)"
                            strokeWidth={2}
                            fill="url(#colorPnL)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-[300px] flex items-center justify-center">
                    <div className="text-center">
                        <DollarSign className="w-12 h-12 text-muted mx-auto mb-3" />
                        <p className="text-muted-foreground">No PnL data yet</p>
                        <p className="text-sm text-muted-foreground mt-1">Start trading to see your performance</p>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
