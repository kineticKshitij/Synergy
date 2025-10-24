import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '~/contexts/AuthContext';
import { ProtectedRoute } from '~/components/ProtectedRoute';
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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3">
                            <LayoutDashboard className="w-8 h-8 text-blue-600" />
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                SynergyOS
                            </h1>
                        </div>

                        <div className="flex items-center gap-4">
                            <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                <Bell className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => navigate('/profile')}
                                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                title="Settings"
                            >
                                <Settings className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-700">
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {user?.first_name} {user?.last_name}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {user?.email}
                                    </p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    title="Logout"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Welcome back, {user?.first_name}!
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Here's what's happening with your business today.
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Total Projects"
                        value={stats?.stats.total_projects || 0}
                        icon={<FolderKanban className="w-6 h-6" />}
                        color="blue"
                    />
                    <StatCard
                        title="Active Tasks"
                        value={stats?.stats.active_tasks || 0}
                        icon={<CheckSquare className="w-6 h-6" />}
                        color="green"
                    />
                    <StatCard
                        title="Team Members"
                        value={stats?.stats.team_members || 0}
                        icon={<Users className="w-6 h-6" />}
                        color="purple"
                    />
                    <StatCard
                        title="Pending Approvals"
                        value={stats?.stats.pending_approvals || 0}
                        icon={<AlertCircle className="w-6 h-6" />}
                        color="orange"
                    />
                </div>

                {/* AI Insights & Security */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* AI Insights */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                <Brain className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                AI Insights
                            </h3>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-400">Status</span>
                                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                                    {stats?.ai_insights.enabled ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-400">
                                    Predictions Today
                                </span>
                                <span className="text-gray-900 dark:text-white font-semibold">
                                    {stats?.ai_insights.predictions_today || 0}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-400">
                                    Automation Runs
                                </span>
                                <span className="text-gray-900 dark:text-white font-semibold">
                                    {stats?.ai_insights.automation_runs || 0}
                                </span>
                            </div>
                        </div>
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
                        />
                        <QuickActionButton
                            label="Add Task"
                            icon={<CheckSquare className="w-5 h-5" />}
                        />
                        <QuickActionButton
                            label="Invite Team"
                            icon={<Users className="w-5 h-5" />}
                        />
                        <a href="/security" className="block">
                            <QuickActionButton
                                label="Security Log"
                                icon={<Shield className="w-5 h-5" />}
                            />
                        </a>
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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
                    {icon}
                </div>
                <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                </div>
            </div>
        </div>
    );
}

// Quick Action Button Component
function QuickActionButton({ label, icon }: { label: string; icon: React.ReactNode }) {
    return (
        <button className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors">
            <div className="text-gray-600 dark:text-gray-400">{icon}</div>
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
