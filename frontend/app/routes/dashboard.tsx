import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '~/contexts/AuthContext';
import { ProtectedRoute } from '~/components/ProtectedRoute';
import { Navbar } from '~/components/Navbar';
import authService from '~/services/auth.service';
import type { DashboardStats } from '~/services/auth.service';
import {
    LayoutDashboard,
    Users,
    CheckSquare,
    FolderKanban,
    AlertCircle,
    TrendingUp,
    Shield,
    Brain,
    LogOut,
    Settings,
    Bell,
} from 'lucide-react';

export function meta() {
    return [
        { title: 'Dashboard - SynergyOS' },
        { name: 'description', content: 'Your SynergyOS Dashboard' },
    ];
}

function DashboardContent() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const data = await authService.getDashboardStats();
                setStats(data);
            } catch (error) {
                console.error('Failed to fetch dashboard:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 page-transition">
            <Navbar />

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
                {/* Welcome Section */}
                <div className="mb-8 animate-slideInDown">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 gradient-text">
                        Welcome back, {user?.username || 'User'}! 👋
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                        Here's what's happening with your business today.
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="animate-slideInUp" style={{ animationDelay: '0.1s' }}>
                        <StatCard
                            title="Total Projects"
                            value={stats?.stats.total_projects || 0}
                            icon={<FolderKanban className="w-6 h-6" />}
                            color="blue"
                        />
                    </div>
                    <div className="animate-slideInUp" style={{ animationDelay: '0.2s' }}>
                        <StatCard
                            title="Active Tasks"
                            value={stats?.stats.active_tasks || 0}
                            icon={<CheckSquare className="w-6 h-6" />}
                            color="green"
                        />
                    </div>
                    <div className="animate-slideInUp" style={{ animationDelay: '0.3s' }}>
                        <StatCard
                            title="Team Members"
                            value={stats?.stats.team_members || 0}
                            icon={<Users className="w-6 h-6" />}
                            color="purple"
                        />
                    </div>
                    <div className="animate-slideInUp" style={{ animationDelay: '0.4s' }}>
                        <StatCard
                            title="Pending Approvals"
                            value={stats?.stats.pending_approvals || 0}
                            icon={<AlertCircle className="w-6 h-6" />}
                            color="orange"
                        />
                    </div>
                </div>

                {/* AI Insights & Security */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* AI Insights */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                    <Brain className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    AI Insights
                                </h3>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${stats?.ai_insights.enabled
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                }`}>
                                {stats?.ai_insights.enabled ? 'Active' : 'Inactive'}
                            </span>
                        </div>

                        {stats?.ai_insights.enabled ? (
                            <div className="space-y-4">
                                {/* Productivity Score */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            Productivity Score
                                        </span>
                                        <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                            {stats.ai_insights.productivity_score || 0}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                        <div
                                            className="bg-indigo-600 h-2 rounded-full transition-all"
                                            style={{ width: `${stats.ai_insights.productivity_score || 0}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Trend */}
                                {stats.ai_insights.trend && (
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className={`w-4 h-4 ${stats.ai_insights.trend === 'improving'
                                            ? 'text-green-600'
                                            : stats.ai_insights.trend === 'declining'
                                                ? 'text-red-600'
                                                : 'text-gray-600'
                                            }`} />
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            Trend: <span className="font-semibold capitalize">{stats.ai_insights.trend}</span>
                                        </span>
                                    </div>
                                )}

                                {/* Key Insights */}
                                {stats.ai_insights.key_insights && stats.ai_insights.key_insights.length > 0 && (
                                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                                            KEY INSIGHTS
                                        </p>
                                        <ul className="space-y-1">
                                            {stats.ai_insights.key_insights.slice(0, 3).map((insight, idx) => (
                                                <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                                                    <span className="text-indigo-600 dark:text-indigo-400 mt-1">•</span>
                                                    <span>{insight}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Focus Areas */}
                                {stats.ai_insights.focus_areas && stats.ai_insights.focus_areas.length > 0 && (
                                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                                            FOCUS AREAS
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {stats.ai_insights.focus_areas.slice(0, 3).map((area, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded text-xs"
                                                >
                                                    {area}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                                    AI insights are currently unavailable
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                    Configure GEMINI_API_KEY to enable AI features
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Security Status */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Security Status
                            </h3>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-400">MFA Status</span>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${stats?.security.mfa_enabled
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                    }`}>
                                    {stats?.security.mfa_enabled ? 'Enabled' : 'Disabled'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-400">
                                    Failed Login Attempts
                                </span>
                                <span className="text-gray-900 dark:text-white font-semibold">
                                    {stats?.security.failed_login_attempts || 0}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-400">Last Login</span>
                                <span className="text-gray-900 dark:text-white font-semibold text-sm">
                                    {stats?.security.last_login
                                        ? new Date(stats.security.last_login).toLocaleDateString()
                                        : 'Never'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Quick Actions
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <QuickActionButton
                            label="New Project"
                            icon={<FolderKanban className="w-5 h-5" />}
                            onClick={() => navigate('/projects/new')}
                        />
                        <QuickActionButton
                            label="Add Task"
                            icon={<CheckSquare className="w-5 h-5" />}
                            onClick={() => navigate('/projects')}
                        />
                        <QuickActionButton
                            label="Invite Team"
                            icon={<Users className="w-5 h-5" />}
                            onClick={() => navigate('/profile')}
                        />
                        <QuickActionButton
                            label="Security Log"
                            icon={<Shield className="w-5 h-5" />}
                            onClick={() => navigate('/security')}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}

// Stat Card Component
function StatCard({
    title,
    value,
    icon,
    color,
}: {
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
}) {
    const colorClasses = {
        blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
        green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
        purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
        orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    };

    return (
        <div className="card-hover-enhanced group">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg transition-transform group-hover:scale-110 ${colorClasses[color as keyof typeof colorClasses]}`}>
                    {icon}
                </div>
                <div className="flex-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white transition-colors group-hover:text-blue-400">{value}</p>
                </div>
            </div>
        </div>
    );
}

// Quick Action Button Component
function QuickActionButton({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-all transform hover:scale-105 hover:shadow-lg group focus-ring"
        >
            <div className="text-gray-600 dark:text-gray-400 transition-transform group-hover:scale-110 group-hover:text-blue-500">{icon}</div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{label}</span>
        </button>
    );
}

// Export wrapped in ProtectedRoute
export default function Dashboard() {
    return (
        <ProtectedRoute>
            <DashboardContent />
        </ProtectedRoute>
    );
}
