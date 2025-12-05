import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '~/contexts/AuthContext';
import { ProtectedRoute } from '~/components/ProtectedRoute';
import { Navbar } from '~/components/Navbar';
import authService from '~/services/auth.service';
import type { DashboardStats } from '~/services/auth.service';
import { projectService, type Project } from '~/services/project.service';
import type { TaskAttachment } from '~/services/attachment.service';
import tokenStorage from '~/services/tokenStorage';
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
    const [ongoingProjects, setOngoingProjects] = useState<Project[]>([]);
    const [recentProofs, setRecentProofs] = useState<TaskAttachment[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [loadingStats, setLoadingStats] = useState(true);
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [loadingProofs, setLoadingProofs] = useState(true);

    useEffect(() => {
        if (user && user.role !== 'manager' && user.role !== 'admin') {
            navigate('/team-dashboard', { replace: true });
            return;
        }

        // Fetch all data in parallel for faster load
        const fetchStats = async () => {
            try {
                const data = await authService.getDashboardStats();
                setStats(data);
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            } finally {
                setLoadingStats(false);
            }
        };

        const fetchProjects = async () => {
            try {
                const projectsData = await projectService.getProjects({ status: 'active' });
                setOngoingProjects(projectsData.slice(0, 4));
            } catch (error) {
                console.error('Failed to fetch projects:', error);
            } finally {
                setLoadingProjects(false);
            }
        };

        const fetchProofs = async () => {
            try {
                const token = tokenStorage.getAccessToken();
                if (token) {
                    const response = await fetch(
                        '/api/attachments/?is_proof_of_completion=true',
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                'Content-Type': 'application/json',
                            },
                        }
                    );
                    if (response.ok) {
                        const proofsData = await response.json();
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        const recent = proofsData
                            .filter((p: TaskAttachment) => new Date(p.created_at) > weekAgo)
                            .slice(0, 3);
                        setRecentProofs(recent);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch proofs:', error);
            } finally {
                setLoadingProofs(false);
            }
        };

        // Execute all fetches in parallel
        Promise.all([fetchStats(), fetchProjects(), fetchProofs()]);
    }, [user, navigate]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-950 dark:to-black page-transition">
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
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Quick Actions Sidebar */}
            <aside
                className={`
                fixed top-0 right-0 h-full w-80 bg-white/90 dark:bg-slate-900/95 shadow-2xl z-40 pt-20
                border-l border-slate-200/70 dark:border-slate-800
                backdrop-blur-md
                transform transition-transform duration-300
                ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
                lg:translate-x-0
            `}
            >
                <div className="p-6 h-full overflow-y-auto">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                                SynergyOS
                            </p>
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                                Quick Actions
                            </h3>
                        </div>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full p-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
                    <div className="mt-8 pt-6 border-t border-slate-200/70 dark:border-slate-800">
                        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-[0.2em]">
                            Quick Stats
                        </h4>
                        <div className="space-y-3 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-600 dark:text-slate-400">
                                    Projects
                                </span>
                                <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                                    {stats?.stats.total_projects || 0}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-600 dark:text-slate-400">
                                    Active Tasks
                                </span>
                                <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                                    {stats?.stats.active_tasks || 0}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-600 dark:text-slate-400">
                                    Team Members
                                </span>
                                <span className="text-lg font-semibold text-violet-600 dark:text-violet-400">
                                    {stats?.stats.team_members || 0}
                                </span>
                            </div>
                            {(stats?.stats.overdue_tasks || 0) > 0 && (
                                <div className="flex items-center justify-between bg-rose-50 dark:bg-rose-950/40 px-3 py-2 rounded-lg">
                                    <span className="text-xs font-medium text-rose-700 dark:text-rose-300">
                                        Overdue
                                    </span>
                                    <span className="text-lg font-semibold text-rose-600 dark:text-rose-300">
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
                    <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 dark:text-slate-50 mb-2 gradient-text">
                        Welcome back, {user?.username || 'User'} 👋
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 text-base md:text-lg">
                        Here’s a snapshot of how your workspace is performing today.
                    </p>
                </div>

                {/* Proof Upload Alerts */}
                {recentProofs.length > 0 && (
                    <div
                        className="mb-6 animate-slideInDown"
                        style={{ animationDelay: '0.1s' }}
                    >
                        <div className="bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 rounded-xl px-4 py-3 shadow-sm">
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/60">
                                    <FileCheck className="w-4 h-4 text-blue-700 dark:text-blue-200" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1.5">
                                        Recent Proof of Completion uploads
                                    </h3>
                                    <div className="space-y-1">
                                        {recentProofs.map((proof) => (
                                            <div
                                                key={proof.id}
                                                className="text-[13px] text-blue-900/90 dark:text-blue-100/90"
                                            >
                                                <span className="font-medium">
                                                    {proof.user.username}
                                                </span>{' '}
                                                uploaded{' '}
                                                <span className="font-mono text-xs">
                                                    {proof.file_name}
                                                </span>
                                                <span className="ml-2 text-[11px] text-blue-700/80 dark:text-blue-300/80">
                                                    {new Date(
                                                        proof.created_at
                                                    ).toLocaleDateString()}
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
                {loadingProjects ? (
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <div className="h-7 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                            <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[1, 2].map((i) => (
                                <div key={i} className="rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 p-4">
                                    <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-800 rounded mb-2 animate-pulse" />
                                    <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded mb-3 animate-pulse" />
                                    <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : ongoingProjects.length > 0 ? (
                    <div
                        className="mb-8 animate-slideInDown"
                        style={{ animationDelay: '0.2s' }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg md:text-xl font-semibold text-slate-900 dark:text-slate-50">
                                Ongoing Projects
                            </h3>
                            <button
                                onClick={() => navigate('/projects')}
                                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline decoration-blue-400/70"
                            >
                                View all
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {ongoingProjects.map((project) => (
                                <div
                                    key={project.id}
                                    onClick={() =>
                                        navigate(`/projects/${project.id}`)
                                    }
                                    className="card-hover-enhanced cursor-pointer group rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 px-4 py-4 shadow-sm hover:shadow-md transition-all"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1 pr-2">
                                            <h4 className="font-semibold text-slate-900 dark:text-slate-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                {project.name}
                                            </h4>
                                            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                                                {project.description || 'No description'}
                                            </p>
                                        </div>
                                        <span
                                            className={`px-2.5 py-1 rounded-full text-[11px] font-medium capitalize ml-2
                                            ${
                                                project.priority === 'high'
                                                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-100/70 dark:border-rose-900'
                                                    : project.priority ===
                                                      'medium'
                                                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-100/70 dark:border-amber-900'
                                                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-100/70 dark:border-emerald-900'
                                            }`}
                                        >
                                            {project.priority}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs md:text-sm">
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                                                    Progress
                                                </span>
                                                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                                                    {project.progress}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className="bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 h-2 rounded-full transition-all"
                                                    style={{
                                                        width: `${project.progress}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        {project.end_date && (
                                            <div className="flex flex-col items-start justify-center gap-1 text-slate-500 dark:text-slate-400">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-4 h-4" />
                                                    <span className="text-[11px] uppercase tracking-[0.16em]">
                                                        Due
                                                    </span>
                                                </div>
                                                <span className="text-xs font-medium text-slate-800 dark:text-slate-100">
                                                    {new Date(
                                                        project.end_date
                                                    ).toLocaleDateString()}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                    {loadingStats ? (
                        <>
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/70 dark:border-slate-800 px-4 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
                                        <div className="flex-1">
                                            <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded mb-2 animate-pulse" />
                                            <div className="h-6 w-12 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : (
                        <>
                            <div className="animate-slideInUp" style={{ animationDelay: '0.1s' }}>
                                <StatCard
                                    title="Total Projects"
                                    value={stats?.stats.total_projects || 0}
                                    icon={<FolderKanban className="w-5 h-5" />}
                                    color="blue"
                                />
                            </div>
                            <div className="animate-slideInUp" style={{ animationDelay: '0.2s' }}>
                                <StatCard
                                    title="Active Tasks"
                                    value={stats?.stats.active_tasks || 0}
                                    icon={<CheckSquare className="w-5 h-5" />}
                                    color="green"
                                />
                            </div>
                            <div className="animate-slideInUp" style={{ animationDelay: '0.3s' }}>
                                <StatCard
                                    title="Team Members"
                                    value={stats?.stats.team_members || 0}
                                    icon={<Users className="w-5 h-5" />}
                                    color="purple"
                                />
                            </div>
                            <div className="animate-slideInUp" style={{ animationDelay: '0.4s' }}>
                                <StatCard
                                    title="Pending Approvals"
                                    value={stats?.stats.pending_approvals || 0}
                                    icon={<AlertCircle className="w-5 h-5" />}
                                    color="orange"
                                />
                            </div>
                        </>
                    )}
                </div>

                {/* AI Insights */}
                <div className="mb-8">
                    <div className="bg-white/90 dark:bg-slate-900/90 rounded-2xl shadow-sm border border-slate-200/70 dark:border-slate-800 px-5 py-6 backdrop-blur-md">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-100/70 dark:border-indigo-900">
                                    <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
                                </div>
                                <div>
                                    <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-50">
                                        AI Insights
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        High-level trends and recommendations curated by SynergyOS AI.
                                    </p>
                                </div>
                            </div>
                            <span
                                className={`px-3 py-1.5 rounded-full text-[11px] font-medium border ${
                                    stats?.ai_insights.enabled
                                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-100/70 dark:border-emerald-900'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/70 dark:border-slate-700'
                                }`}
                            >
                                {stats?.ai_insights.enabled ? 'Active' : 'Inactive'}
                            </span>
                        </div>

                        {stats?.ai_insights.enabled ? (
                            <div className="space-y-5">
                                {/* Productivity Score */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-medium text-slate-500 uppercase tracking-[0.16em]">
                                            Productivity score
                                        </span>
                                        <span className="text-2xl font-semibold text-indigo-600 dark:text-indigo-300">
                                            {stats.ai_insights.productivity_score || 0}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-500 h-2 rounded-full transition-all"
                                            style={{
                                                width: `${
                                                    stats.ai_insights
                                                        .productivity_score || 0
                                                }%`,
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Trend */}
                                {stats.ai_insights.trend && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <TrendingUp
                                            className={`w-4 h-4 ${
                                                stats.ai_insights.trend ===
                                                'improving'
                                                    ? 'text-emerald-500'
                                                    : stats.ai_insights.trend ===
                                                      'declining'
                                                    ? 'text-rose-500'
                                                    : 'text-slate-500'
                                            }`}
                                        />
                                        <span className="text-slate-600 dark:text-slate-300">
                                            Trend:{' '}
                                            <span className="font-semibold capitalize">
                                                {stats.ai_insights.trend}
                                            </span>
                                        </span>
                                    </div>
                                )}

                                {/* Key Insights */}
                                {stats.ai_insights.key_insights &&
                                    stats.ai_insights.key_insights.length > 0 && (
                                        <div className="pt-3 border-t border-slate-200/70 dark:border-slate-800">
                                            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2 tracking-[0.16em] uppercase">
                                                Key insights
                                            </p>
                                            <ul className="space-y-1.5">
                                                {stats.ai_insights.key_insights
                                                    .slice(0, 3)
                                                    .map((insight, idx) => (
                                                        <li
                                                            key={idx}
                                                            className="text-sm text-slate-700 dark:text-slate-200 flex items-start gap-2"
                                                        >
                                                            <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                                            <span>{insight}</span>
                                                        </li>
                                                    ))}
                                            </ul>
                                        </div>
                                    )}

                                {/* Focus Areas */}
                                {stats.ai_insights.focus_areas &&
                                    stats.ai_insights.focus_areas.length > 0 && (
                                        <div className="pt-3 border-t border-slate-200/70 dark:border-slate-800">
                                            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2 tracking-[0.16em] uppercase">
                                                Focus areas
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {stats.ai_insights.focus_areas
                                                    .slice(0, 3)
                                                    .map((area, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="px-2.5 py-1 rounded-full text-xs bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-200 border border-indigo-100/70 dark:border-indigo-900"
                                                        >
                                                            {area}
                                                        </span>
                                                    ))}
                                            </div>
                                        </div>
                                    )}
                            </div>
                        ) : (
                            <div className="text-center py-7">
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                                    AI insights are currently unavailable.
                                </p>
                                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                    Configure <span className="font-mono">GEMINI_API_KEY</span> in
                                    your environment to enable AI-powered analytics.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Security Status */}
                <div className="bg-white/90 dark:bg-slate-900/90 rounded-2xl shadow-sm border border-slate-200/70 dark:border-slate-800 px-5 py-6 backdrop-blur-md">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-100/70 dark:border-emerald-900">
                            <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
                        </div>
                        <div>
                            <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-50">
                                Security status
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Account-level security posture and recent activity.
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col">
                            <span className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-[0.16em]">
                                MFA status
                            </span>
                            <span
                                className={`px-3 py-2 rounded-xl text-sm font-medium text-center border ${
                                    stats?.security.mfa_enabled
                                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-100/70 dark:border-emerald-900'
                                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-100/70 dark:border-rose-900'
                                }`}
                            >
                                {stats?.security.mfa_enabled ? 'Enabled' : 'Disabled'}
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-[0.16em]">
                                Failed login attempts
                            </span>
                            <span className="text-2xl font-semibold text-slate-900 dark:text-slate-50 text-center">
                                {stats?.security.failed_login_attempts || 0}
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-[0.16em]">
                                Last login
                            </span>
                            <span className="text-sm font-medium text-slate-900 dark:text-slate-50 text-center">
                                {stats?.security.last_login
                                    ? new Date(
                                          stats.security.last_login
                                      ).toLocaleString()
                                    : 'Never'}
                            </span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

type SidebarColor =
    | 'blue'
    | 'green'
    | 'purple'
    | 'orange'
    | 'indigo';

function getSidebarColorClasses(color?: SidebarColor) {
    switch (color) {
        case 'blue':
            return 'border-blue-100/70 dark:border-blue-900 hover:border-blue-300 dark:hover:border-blue-700';
        case 'green':
            return 'border-emerald-100/70 dark:border-emerald-900 hover:border-emerald-300 dark:hover:border-emerald-700';
        case 'purple':
            return 'border-violet-100/70 dark:border-violet-900 hover:border-violet-300 dark:hover:border-violet-700';
        case 'orange':
            return 'border-amber-100/70 dark:border-amber-900 hover:border-amber-300 dark:hover:border-amber-700';
        case 'indigo':
            return 'border-indigo-100/70 dark:border-indigo-900 hover:border-indigo-300 dark:hover:border-indigo-700';
        default:
            return 'border-slate-200/70 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600';
    }
}

// Sidebar Action Button Component
function SidebarActionButton({
    label,
    icon,
    onClick,
    color,
}: {
    label: string;
    icon: React.ReactNode;
    onClick?: () => void;
    color?: SidebarColor;
}) {
    const colorClasses = getSidebarColorClasses(color);

    return (
        <button
            onClick={onClick}
            className={`
                w-full flex items-center gap-3 px-3.5 py-3 rounded-xl
                bg-white/90 dark:bg-slate-900/80
                text-slate-800 dark:text-slate-100
                border ${colorClasses}
                shadow-sm hover:shadow-md
                transition-all duration-150
                hover:bg-slate-50/90 dark:hover:bg-slate-800/90
                group
            `}
        >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:scale-105 transition-transform">
                {icon}
            </div>
            <span className="font-medium text-sm text-left leading-snug">
                {label}
            </span>
        </button>
    );
}

type StatCardColor = 'blue' | 'green' | 'purple' | 'orange';

function getStatColorClasses(color?: StatCardColor) {
    switch (color) {
        case 'blue':
            return {
                iconBg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-100/70 dark:border-blue-900',
                iconText: 'text-blue-600 dark:text-blue-300',
            };
        case 'green':
            return {
                iconBg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100/70 dark:border-emerald-900',
                iconText: 'text-emerald-600 dark:text-emerald-300',
            };
        case 'purple':
            return {
                iconBg: 'bg-violet-50 dark:bg-violet-950/40 border-violet-100/70 dark:border-violet-900',
                iconText: 'text-violet-600 dark:text-violet-300',
            };
        case 'orange':
            return {
                iconBg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-100/70 dark:border-amber-900',
                iconText: 'text-amber-600 dark:text-amber-300',
            };
        default:
            return {
                iconBg: 'bg-slate-50 dark:bg-slate-800 border-slate-200/70 dark:border-slate-700',
                iconText: 'text-slate-700 dark:text-slate-200',
            };
    }
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
    color?: StatCardColor;
}) {
    const { iconBg, iconText } = getStatColorClasses(color);

    return (
        <div className="card-hover-enhanced group rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/70 dark:border-slate-800 px-4 py-4 shadow-sm hover:shadow-md transition-all backdrop-blur-md">
            <div className="flex items-center gap-3">
                <div
                    className={`
                        p-2.5 rounded-xl border flex items-center justify-center
                        group-hover:scale-105 transition-transform ${iconBg}
                    `}
                >
                    <div className={iconText}>{icon}</div>
                </div>
                <div className="flex-1">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-[0.16em]">
                        {title}
                    </p>
                    <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
                        {value}
                    </p>
                </div>
            </div>
        </div>
    );
}


// Quick Action Button Component (if you use it elsewhere)
function QuickActionButton({
    label,
    icon,
    onClick,
}: {
    label: string;
    icon: React.ReactNode;
    onClick?: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/70 dark:border-slate-800 shadow-sm hover:shadow-md hover:bg-slate-50/90 dark:hover:bg-slate-800/90 transition-all group"
        >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:scale-105 transition-transform">
                {icon}
            </div>
            <span className="text-xs font-medium text-slate-800 dark:text-slate-100 text-center">
                {label}
            </span>
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
