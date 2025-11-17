import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '~/contexts/AuthContext';
import { ProtectedRoute } from '~/components/ProtectedRoute';
import { Navbar } from '~/components/Navbar';
import { LoadingScreen } from '~/components/LoadingScreen';
import authService from '~/services/auth.service';
import type { DashboardStats } from '~/services/auth.service';
import { projectService, type Project } from '~/services/project.service';
import type { TaskAttachment } from '~/services/attachment.service';
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
    FileCheck,
    Clock,
    Menu,
    X,
    Plus,
    UserPlus,
    FileText,
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
    const [ongoingProjects, setOngoingProjects] = useState<Project[]>([]);
    const [recentProofs, setRecentProofs] = useState<TaskAttachment[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [lastFetch, setLastFetch] = useState<number>(0);

    useEffect(() => {
        // Check if user has access to this dashboard
        if (user && user.role !== 'manager' && user.role !== 'admin') {
            // Redirect team members to their dashboard
            navigate('/team-dashboard', { replace: true });
            return;
        }

        const fetchDashboard = async () => {
            // Cache for 1 hour - don't refetch if data is fresh
            const now = Date.now();
            const cacheTime = 3600000; // 1 hour in milliseconds
            
            if (stats && (now - lastFetch) < cacheTime) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const data = await authService.getDashboardStats();
                setStats(data);
                
                // Fetch ongoing projects (status: active or in_progress)
                const projectsData = await projectService.getProjects({ status: 'active' });
                setOngoingProjects(projectsData.slice(0, 4)); // Show max 4 projects
                
                // Fetch recent proof uploads
                const response = await fetch('/api/attachments/?is_proof_of_completion=true', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                        'Content-Type': 'application/json',
                    },
                });
                if (response.ok) {
                    const proofsData = await response.json();
                    // Get recent proofs from last 7 days
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    const recent = proofsData.filter((p: TaskAttachment) => 
                        new Date(p.created_at) > weekAgo
                    ).slice(0, 3);
                    setRecentProofs(recent);
                }
                
                setLastFetch(Date.now());
            } catch (error) {
                console.error('Failed to fetch dashboard:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboard();
    }, [user, navigate]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    if (isLoading && !stats) {
        return <LoadingScreen message="Loading your dashboard" />;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 page-transition">
            <Navbar />

            {/* Mobile Sidebar Toggle */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="fixed bottom-6 right-6 z-50 lg:hidden bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110"
            >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Quick Actions Sidebar */}
            <aside className={`
                fixed top-0 right-0 h-full w-80 bg-white dark:bg-gray-800 shadow-2xl z-40 pt-20 transform transition-transform duration-300
                ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
                lg:translate-x-0
            `}>
                <div className="p-6 h-full overflow-y-auto">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            Quick Actions
                        </h3>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="space-y-3">
                        <SidebarActionButton
                            label="New Project"
                            icon={<Plus className="w-5 h-5" />}
                            onClick={() => {
                                navigate('/projects/new');
                                setSidebarOpen(false);
                            }}
                            color="blue"
                        />
                        <SidebarActionButton
                            label="Add Task"
                            icon={<CheckSquare className="w-5 h-5" />}
                            onClick={() => {
                                navigate('/projects');
                                setSidebarOpen(false);
                            }}
                            color="green"
                        />
                        <SidebarActionButton
                            label="Invite Team Member"
                            icon={<UserPlus className="w-5 h-5" />}
                            onClick={() => {
                                navigate('/profile');
                                setSidebarOpen(false);
                            }}
                            color="purple"
                        />
                        <SidebarActionButton
                            label="View Security Log"
                            icon={<Shield className="w-5 h-5" />}
                            onClick={() => {
                                navigate('/security');
                                setSidebarOpen(false);
                            }}
                            color="orange"
                        />
                        <SidebarActionButton
                            label="All Projects"
                            icon={<FolderKanban className="w-5 h-5" />}
                            onClick={() => {
                                navigate('/projects');
                                setSidebarOpen(false);
                            }}
                            color="indigo"
                        />
                    </div>

                    {/* Stats Summary in Sidebar */}
                    <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider">
                            Quick Stats
                        </h4>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Projects</span>
                                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                    {stats?.stats.total_projects || 0}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Active Tasks</span>
                                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                    {stats?.stats.active_tasks || 0}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Team Members</span>
                                <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                                    {stats?.stats.team_members || 0}
                                </span>
                            </div>
                            {(stats?.stats.overdue_tasks || 0) > 0 && (
                                <div className="flex items-center justify-between bg-red-50 dark:bg-red-900/20 p-2 rounded">
                                    <span className="text-sm text-red-700 dark:text-red-400">Overdue</span>
                                    <span className="text-lg font-bold text-red-600 dark:text-red-400">
                                        {stats?.stats.overdue_tasks}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="lg:mr-80 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
                {/* Welcome Section */}
                <div className="mb-8 animate-slideInDown">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 gradient-text">
                        Welcome back, {user?.username || 'User'}! 👋
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                        Here's what's happening with your business today.
                    </p>
                </div>

                {/* Proof Upload Alerts */}
                {recentProofs.length > 0 && (
                    <div className="mb-6 animate-slideInDown" style={{ animationDelay: '0.1s' }}>
                        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <FileCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                                <div className="flex-1">
                                    <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                                        Recent Proof of Completion Uploads
                                    </h3>
                                    <div className="space-y-1">
                                        {recentProofs.map((proof) => (
                                            <div key={proof.id} className="text-sm text-blue-800 dark:text-blue-200">
                                                <span className="font-medium">{proof.user.username}</span> uploaded proof: {proof.file_name}
                                                <span className="text-xs text-blue-600 dark:text-blue-400 ml-2">
                                                    {new Date(proof.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Ongoing Projects */}
                {ongoingProjects.length > 0 && (
                    <div className="mb-8 animate-slideInDown" style={{ animationDelay: '0.2s' }}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                Ongoing Projects
                            </h3>
                            <button
                                onClick={() => navigate('/projects')}
                                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                View All →
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {ongoingProjects.map((project) => (
                                <div
                                    key={project.id}
                                    onClick={() => navigate(`/projects/${project.id}`)}
                                    className="card-hover-enhanced cursor-pointer group"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                {project.name}
                                            </h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                                {project.description || 'No description'}
                                            </p>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ml-2 ${
                                            project.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                                            project.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                                            'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                        }`}>
                                            {project.priority}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs text-gray-600 dark:text-gray-400">Progress</span>
                                                <span className="text-xs font-semibold text-gray-900 dark:text-white">{project.progress}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full transition-all"
                                                    style={{ width: `${project.progress}%` }}
                                                />
                                            </div>
                                        </div>
                                        {project.end_date && (
                                            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                                <Clock className="w-4 h-4" />
                                                <span className="text-xs">
                                                    {new Date(project.end_date).toLocaleDateString()}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

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

                {/* AI Insights */}
                <div className="mb-8">
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
                </div>

                {/* Security Status - Moved to Bottom */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Security Status
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col">
                            <span className="text-sm text-gray-600 dark:text-gray-400 mb-2">MFA Status</span>
                            <span className={`px-3 py-2 rounded-lg text-sm font-medium text-center ${stats?.security.mfa_enabled
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                }`}>
                                {stats?.security.mfa_enabled ? 'Enabled' : 'Disabled'}
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                Failed Login Attempts
                            </span>
                            <span className="text-2xl font-bold text-gray-900 dark:text-white text-center">
                                {stats?.security.failed_login_attempts || 0}
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm text-gray-600 dark:text-gray-400 mb-2">Last Login</span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white text-center">
                                {stats?.security.last_login
                                    ? new Date(stats.security.last_login).toLocaleString()
                                    : 'Never'}
                            </span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

// Sidebar Action Button Component
function SidebarActionButton({
    label,
    icon,
    onClick,
    color = 'blue',
}: {
    label: string;
    icon: React.ReactNode;
    onClick?: () => void;
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'indigo';
}) {
    const colorClasses = {
        blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30',
        green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30',
        purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30',
        orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30',
        indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30',
    };

    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 p-4 rounded-lg transition-all transform hover:scale-105 hover:shadow-md ${colorClasses[color]}`}
        >
            <div className="flex-shrink-0">{icon}</div>
            <span className="font-medium text-left">{label}</span>
        </button>
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
