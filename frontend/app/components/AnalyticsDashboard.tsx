import { useState, useEffect, useMemo } from 'react';
import { 
    TrendingUp, 
    TrendingDown, 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    Users,
    Target,
    Activity,
    Calendar,
    BarChart3
} from 'lucide-react';

interface Task {
    id: number;
    title: string;
    status: string;
    priority: string;
    assigned_to?: { id: number; username: string };
    due_date?: string;
    created_at: string;
    estimated_hours?: number;
    time_logs?: { hours: number }[];
}

interface AnalyticsDashboardProps {
    projectId: number;
    tasks: Task[];
    teamMembers: any[];
}

export default function AnalyticsDashboard({ projectId, tasks, teamMembers }: AnalyticsDashboardProps) {
    const [timeRange, setTimeRange] = useState<'7' | '30' | '90' | 'all'>('30');

    // Calculate analytics
    const analytics = useMemo(() => {
        const now = new Date();
        const filterDate = new Date();
        
        if (timeRange !== 'all') {
            filterDate.setDate(now.getDate() - parseInt(timeRange));
        }

        const filteredTasks = timeRange === 'all' 
            ? tasks 
            : tasks.filter(t => new Date(t.created_at) >= filterDate);

        // Status distribution
        const statusCounts = {
            todo: filteredTasks.filter(t => t.status === 'todo').length,
            in_progress: filteredTasks.filter(t => t.status === 'in_progress').length,
            review: filteredTasks.filter(t => t.status === 'review').length,
            done: filteredTasks.filter(t => t.status === 'done').length,
        };

        // Priority distribution
        const priorityCounts = {
            low: filteredTasks.filter(t => t.priority === 'low').length,
            medium: filteredTasks.filter(t => t.priority === 'medium').length,
            high: filteredTasks.filter(t => t.priority === 'high').length,
            urgent: filteredTasks.filter(t => t.priority === 'urgent').length,
        };

        // Completion rate
        const completedCount = statusCounts.done;
        const totalCount = filteredTasks.length;
        const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

        // Overdue tasks
        const overdueTasks = filteredTasks.filter(t => 
            t.due_date && 
            new Date(t.due_date) < now && 
            t.status !== 'done'
        ).length;

        // Team performance
        const teamStats = teamMembers.map(member => {
            const memberTasks = filteredTasks.filter(t => t.assigned_to?.id === member.id);
            const completed = memberTasks.filter(t => t.status === 'done').length;
            return {
                member,
                assigned: memberTasks.length,
                completed,
                completionRate: memberTasks.length > 0 ? (completed / memberTasks.length) * 100 : 0,
            };
        }).sort((a, b) => b.completed - a.completed);

        // Time tracking
        const totalEstimated = filteredTasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
        const totalLogged = filteredTasks.reduce((sum, t) => {
            const taskTime = t.time_logs?.reduce((s, log) => s + log.hours, 0) || 0;
            return sum + taskTime;
        }, 0);

        // Velocity (tasks completed per week)
        const weeksInRange = timeRange === 'all' ? 4 : Math.ceil(parseInt(timeRange) / 7);
        const velocity = completedCount / weeksInRange;

        // Tasks due this week
        const weekFromNow = new Date();
        weekFromNow.setDate(now.getDate() + 7);
        const dueThisWeek = filteredTasks.filter(t => 
            t.due_date && 
            new Date(t.due_date) >= now && 
            new Date(t.due_date) <= weekFromNow &&
            t.status !== 'done'
        ).length;

        // Daily completion trend (last 7 days)
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(now.getDate() - (6 - i));
            date.setHours(0, 0, 0, 0);
            return date;
        });

        const completionTrend = last7Days.map(date => {
            const nextDay = new Date(date);
            nextDay.setDate(date.getDate() + 1);
            
            const completed = tasks.filter(t => {
                const created = new Date(t.created_at);
                return t.status === 'done' && created >= date && created < nextDay;
            }).length;

            return {
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                count: completed,
            };
        });

        const maxTrendCount = Math.max(...completionTrend.map(d => d.count), 1);

        return {
            statusCounts,
            priorityCounts,
            completionRate,
            overdueTasks,
            teamStats,
            totalEstimated,
            totalLogged,
            velocity,
            dueThisWeek,
            completionTrend,
            maxTrendCount,
            totalTasks: totalCount,
            completedTasks: completedCount,
        };
    }, [tasks, teamMembers, timeRange]);

    const getStatusColor = (status: string) => {
        const colors = {
            todo: 'bg-gray-500',
            in_progress: 'bg-blue-500',
            review: 'bg-yellow-500',
            done: 'bg-green-500',
        };
        return colors[status as keyof typeof colors] || 'bg-gray-500';
    };

    const getPriorityColor = (priority: string) => {
        const colors = {
            low: 'bg-green-500',
            medium: 'bg-yellow-500',
            high: 'bg-orange-500',
            urgent: 'bg-red-500',
        };
        return colors[priority as keyof typeof colors] || 'bg-gray-500';
    };

    return (
        <div className="space-y-6">
            {/* Header with Time Range Selector */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h2>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                        Project insights and team performance metrics
                    </p>
                </div>
                <div className="flex bg-gray-200 dark:bg-gray-800 rounded-lg p-1">
                    {(['7', '30', '90', 'all'] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                timeRange === range
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            {range === 'all' ? 'All Time' : `${range} Days`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Completion Rate */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">Completion Rate</span>
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">
                            {analytics.completionRate.toFixed(1)}%
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                            {analytics.completedTasks}/{analytics.totalTasks}
                        </span>
                    </div>
                    <div className="mt-3 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${analytics.completionRate}%` }}
                        />
                    </div>
                </div>

                {/* Overdue Tasks */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">Overdue Tasks</span>
                        <AlertCircle className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">
                            {analytics.overdueTasks}
                        </span>
                        {analytics.overdueTasks > 0 && (
                            <span className="text-sm text-red-500 mb-1 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                Attention needed
                            </span>
                        )}
                    </div>
                </div>

                {/* Velocity */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">Velocity</span>
                        <Activity className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">
                            {analytics.velocity.toFixed(1)}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                            tasks/week
                        </span>
                    </div>
                </div>

                {/* Due This Week */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">Due This Week</span>
                        <Calendar className="w-5 h-5 text-purple-500" />
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">
                            {analytics.dueThisWeek}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                            upcoming
                        </span>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Status Distribution */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Task Status Distribution
                    </h3>
                    <div className="space-y-3">
                        {Object.entries(analytics.statusCounts).map(([status, count]) => {
                            const percentage = analytics.totalTasks > 0 ? (count / analytics.totalTasks) * 100 : 0;
                            return (
                                <div key={status}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                                            {status.replace('_', ' ')}
                                        </span>
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            {count} ({percentage.toFixed(0)}%)
                                        </span>
                                    </div>
                                    <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                        <div
                                            className={`${getStatusColor(status)} h-2 rounded-full transition-all duration-500`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Priority Distribution */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        Task Priority Distribution
                    </h3>
                    <div className="space-y-3">
                        {Object.entries(analytics.priorityCounts).map(([priority, count]) => {
                            const percentage = analytics.totalTasks > 0 ? (count / analytics.totalTasks) * 100 : 0;
                            return (
                                <div key={priority}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                                            {priority}
                                        </span>
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            {count} ({percentage.toFixed(0)}%)
                                        </span>
                                    </div>
                                    <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                        <div
                                            className={`${getPriorityColor(priority)} h-2 rounded-full transition-all duration-500`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Completion Trend */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Task Completion Trend (Last 7 Days)
                </h3>
                <div className="flex items-end justify-between gap-2 h-48">
                    {analytics.completionTrend.map((day, index) => {
                        const height = analytics.maxTrendCount > 0 
                            ? (day.count / analytics.maxTrendCount) * 100 
                            : 0;
                        return (
                            <div key={index} className="flex-1 flex flex-col items-center gap-2">
                                <div className="relative w-full flex-1 flex items-end">
                                    <div 
                                        className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all duration-500 hover:from-blue-700 hover:to-blue-500 cursor-pointer group relative"
                                        style={{ height: `${height}%`, minHeight: day.count > 0 ? '8px' : '0' }}
                                    >
                                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                            {day.count} tasks
                                        </div>
                                    </div>
                                </div>
                                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                                    {day.date}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Team Performance */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Team Performance
                </h3>
                {analytics.teamStats.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                        No team members assigned to tasks yet
                    </p>
                ) : (
                    <div className="space-y-4">
                        {analytics.teamStats.slice(0, 5).map((stat, index) => (
                            <div key={stat.member.id} className="flex items-center gap-4">
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                        {stat.member.username?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {stat.member.username}
                                            </span>
                                            {index === 0 && stat.completed > 0 && (
                                                <span className="text-xs bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded-full">
                                                    🏆 Top Performer
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                            <span>{stat.assigned} assigned</span>
                                            <span>•</span>
                                            <span className="text-green-600 dark:text-green-400">
                                                {stat.completed} completed
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right min-w-[60px]">
                                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                                        {stat.completionRate.toFixed(0)}%
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        completion
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Time Tracking Summary */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Time Tracking Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Estimated Hours</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {analytics.totalEstimated.toFixed(1)}h
                        </div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Logged Hours</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {analytics.totalLogged.toFixed(1)}h
                        </div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Variance</div>
                        <div className={`text-2xl font-bold ${
                            analytics.totalLogged > analytics.totalEstimated 
                                ? 'text-red-500' 
                                : 'text-green-500'
                        }`}>
                            {analytics.totalEstimated > 0 
                                ? `${((analytics.totalLogged / analytics.totalEstimated - 1) * 100).toFixed(1)}%`
                                : 'N/A'
                            }
                        </div>
                    </div>
                </div>
                {analytics.totalEstimated > 0 && (
                    <div className="mt-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-gray-600 dark:text-gray-400">Progress vs Estimate</span>
                            <span className="text-gray-600 dark:text-gray-400">
                                {analytics.totalLogged.toFixed(1)}h / {analytics.totalEstimated.toFixed(1)}h
                            </span>
                        </div>
                        <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                            <div
                                className={`h-3 rounded-full transition-all duration-500 ${
                                    analytics.totalLogged > analytics.totalEstimated 
                                        ? 'bg-red-500' 
                                        : 'bg-blue-500'
                                }`}
                                style={{ 
                                    width: `${Math.min((analytics.totalLogged / analytics.totalEstimated) * 100, 100)}%` 
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
