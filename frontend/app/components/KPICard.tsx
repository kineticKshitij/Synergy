import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
    title: string;
    value: string | number;
    icon: ReactNode;
    trend?: {
        value: number;
        direction: 'up' | 'down' | 'neutral';
    };
    subtitle?: string;
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo';
    onClick?: () => void;
}

const colorClasses = {
    blue: {
        bg: 'bg-blue-50 dark:bg-blue-950/40',
        icon: 'text-blue-600 dark:text-blue-300',
        border: 'border-blue-100/70 dark:border-blue-900',
        trend: 'text-blue-600 dark:text-blue-400',
    },
    green: {
        bg: 'bg-emerald-50 dark:bg-emerald-950/40',
        icon: 'text-emerald-600 dark:text-emerald-300',
        border: 'border-emerald-100/70 dark:border-emerald-900',
        trend: 'text-emerald-600 dark:text-emerald-400',
    },
    purple: {
        bg: 'bg-purple-50 dark:bg-purple-950/40',
        icon: 'text-purple-600 dark:text-purple-300',
        border: 'border-purple-100/70 dark:border-purple-900',
        trend: 'text-purple-600 dark:text-purple-400',
    },
    orange: {
        bg: 'bg-orange-50 dark:bg-orange-950/40',
        icon: 'text-orange-600 dark:text-orange-300',
        border: 'border-orange-100/70 dark:border-orange-900',
        trend: 'text-orange-600 dark:text-orange-400',
    },
    red: {
        bg: 'bg-red-50 dark:bg-red-950/40',
        icon: 'text-red-600 dark:text-red-300',
        border: 'border-red-100/70 dark:border-red-900',
        trend: 'text-red-600 dark:text-red-400',
    },
    indigo: {
        bg: 'bg-indigo-50 dark:bg-indigo-950/40',
        icon: 'text-indigo-600 dark:text-indigo-300',
        border: 'border-indigo-100/70 dark:border-indigo-900',
        trend: 'text-indigo-600 dark:text-indigo-400',
    },
};

export function KPICard({
    title,
    value,
    icon,
    trend,
    subtitle,
    color = 'blue',
    onClick,
}: KPICardProps) {
    const classes = colorClasses[color];

    return (
        <div
            className={`
                rounded-xl bg-white/90 dark:bg-slate-900/90 
                border border-slate-200/70 dark:border-slate-800 
                px-5 py-4 shadow-sm hover:shadow-md transition-all
                ${onClick ? 'cursor-pointer hover:scale-105' : ''}
            `}
            onClick={onClick}
        >
            <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 ${classes.bg} border ${classes.border} rounded-lg`}>
                    <div className={classes.icon}>{icon}</div>
                </div>
                {trend && (
                    <div className="flex items-center gap-1">
                        {trend.direction === 'up' && (
                            <TrendingUp className={`w-4 h-4 ${classes.trend}`} />
                        )}
                        {trend.direction === 'down' && (
                            <TrendingDown className="w-4 h-4 text-red-500 dark:text-red-400" />
                        )}
                        {trend.direction === 'neutral' && (
                            <Minus className="w-4 h-4 text-slate-400" />
                        )}
                        <span
                            className={`text-xs font-semibold ${
                                trend.direction === 'up'
                                    ? classes.trend
                                    : trend.direction === 'down'
                                    ? 'text-red-500 dark:text-red-400'
                                    : 'text-slate-400'
                            }`}
                        >
                            {trend.value > 0 ? '+' : ''}
                            {trend.value}%
                        </span>
                    </div>
                )}
            </div>
            <div>
                <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    {title}
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                    {value}
                </p>
                {subtitle && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
    );
}
