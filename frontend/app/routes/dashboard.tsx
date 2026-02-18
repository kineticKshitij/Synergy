import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '~/contexts/AuthContext';
import { ProtectedRoute } from '~/components/ProtectedRoute';
import { Navbar } from '~/components/Navbar';
import { AITaskSuggestionsCard } from '~/components/AITaskSuggestionsCard';
import { AIRiskAnalysisCard } from '~/components/AIRiskAnalysisCard';
import { AIAssistant } from '~/components/AIAssistant';
import { ActivityTimeline } from '~/components/ActivityTimeline';
import { UpcomingMilestones } from '~/components/UpcomingMilestones';
import authService from '~/services/auth.service';
import type { DashboardStats } from '~/services/auth.service';
import { projectService, type Project } from '~/services/project.service';
import {
    LayoutDashboard,
    Users,
    CheckSquare,
    FolderKanban,
    AlertCircle,
    TrendingUp,
    TrendingDown,
    Shield,
    Brain,
    Plus,
    UserPlus,
    Target,
    Activity,
    BarChart3,
    Clock,
    Zap,
    Sparkles,
    ArrowRight,
    Calendar,
    ListChecks,
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
    const [loadingStats, setLoadingStats] = useState(true);
    const [loadingProjects, setLoadingProjects] = useState(true);

    useEffect(() => {
        if (user && user.role !== 'manager' && user.role !== 'admin') {
            navigate('/team-dashboard', { replace: true });
            return;
        }

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
                setOngoingProjects(projectsData.slice(0, 6));
            } catch (error) {
                console.error('Failed to fetch projects:', error);
            } finally {
                setLoadingProjects(false);
            }
        };

        fetchStats();
        fetchProjects();
    }, [user, navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-950 dark:via-blue-950/20 dark:to-purple-950/20">
            <Navbar />

            {/* Hero Section - Welcome */}
            <div className="pt-20 pb-8 md:pb-12 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-900 dark:via-indigo-900 dark:to-purple-900 shadow-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6">
                        <div className="flex-1">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-xs font-medium mb-3">
                                <Sparkles className="w-3 h-3" />
                                Powered by AI
                            </div>
                            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 md:mb-3">
                                Welcome back, {user?.username || 'User'} 👋
                            </h1>
                            <p className="text-blue-100 text-sm sm:text-base md:text-lg max-w-2xl">
                                Your workspace is performing excellently today. Here's what needs your attention.
                            </p>
                        </div>

                        {/* Quick Action Buttons */}
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => navigate('/projects/new')}
                                className="flex items-center gap-2 px-5 py-3 bg-white text-blue-700 rounded-xl hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl font-semibold"
                            >
                                <Plus className="w-5 h-5" />
                                New Project
                            </button>
                            <button
                                onClick={() => navigate('/projects')}
                                className="flex items-center gap-2 px-5 py-3 bg-white/10 backdrop-blur-md text-white border-2 border-white/30 rounded-xl hover:bg-white/20 transition-all font-semibold"
                            >
                                <FolderKanban className="w-5 h-5" />
                                View All
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 pb-8 md:pb-12">
                {/* Main Stats Cards - Prominent */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
                    <StatsCard
                        title="Active Projects"
                        value={stats?.stats.total_projects || 0}
                        icon={<FolderKanban className="w-6 h-6" />}
                        trend={{ value: 12, direction: 'up' }}
                        color="blue"
                        onClick={() => navigate('/projects')}
                    />
                    <StatsCard
                        title="Pending Tasks"
                        value={stats?.stats.active_tasks || 0}
                        icon={<CheckSquare className="w-6 h-6" />}
                        subtitle={`${stats?.stats.overdue_tasks || 0} overdue`}
                        color="emerald"
                        onClick={() => navigate('/team-dashboard')}
                    />
                    <StatsCard
                        title="Team Members"
                        value={stats?.stats.team_members || 0}
                        icon={<Users className="w-6 h-6" />}
                        trend={{ value: 5, direction: 'up' }}
                        color="purple"
                        onClick={() => navigate('/team')}
                    />
                    <StatsCard
                        title="AI Insights Score"
                        value={`${stats?.ai_insights.productivity_score || 0}%`}
                        icon={<Brain className="w-6 h-6" />}
                        trend={{
                            value: stats?.ai_insights.trend === 'improving' ? 8 : stats?.ai_insights.trend === 'declining' ? -5 : 0,
                            direction:
                                stats?.ai_insights.trend === 'improving'
                                    ? 'up'
                                    : stats?.ai_insights.trend === 'declining'
                                    ? 'down'
                                    : 'neutral',
                        }}
                        color="indigo"
                    />
                </div>

                {/* Quick Actions Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
                    <QuickActionCard
                        title="Add Task"
                        icon={<Plus className="w-5 h-5" />}
                        color="blue"
                        onClick={() => navigate('/team-dashboard')}
                    />
                    <QuickActionCard
                        title="View Kanban"
                        icon={<LayoutDashboard className="w-5 h-5" />}
                        color="purple"
                        onClick={() => navigate('/kanban')}
                    />
                    <QuickActionCard
                        title="Team"
                        icon={<UserPlus className="w-5 h-5" />}
                        color="emerald"
                        onClick={() => navigate('/team')}
                    />
                    <QuickActionCard
                        title="Reports"
                        icon={<BarChart3 className="w-5 h-5" />}
                        color="orange"
                        onClick={() => navigate('/reports')}
                    />
                </div>

                {/* AI Insights Section - Prominent */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg">
                            <Brain className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">AI-Powered Insights</h2>
                            <p className="text-slate-600 dark:text-slate-400 text-sm">Intelligent recommendations to optimize your workflow</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <AITaskSuggestionsCard />
                        <AIRiskAnalysisCard />
                    </div>
                </div>

                {/* Projects Overview */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                                <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Active Projects</h2>
                        </div>
                        <button
                            onClick={() => navigate('/projects')}
                            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:gap-3 transition-all font-semibold"
                        >
                            View all
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loadingProjects ? (
                            [...Array(6)].map((_, i) => (
                                <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-800 animate-pulse">
                                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4 mb-4"></div>
                                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full mb-2"></div>
                                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-2/3"></div>
                                </div>
                            ))
                        ) : (
                            ongoingProjects.map((project) => (
                                <ProjectCard key={project.id} project={project} onClick={() => navigate(`/projects/${project.id}`)} />
                            ))
                        )}
                    </div>
                </div>

                {/* Activity & Milestones */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Activity Timeline */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                                <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Recent Activity</h3>
                        </div>
                        <ActivityTimeline limit={8} />
                    </div>

                    {/* Upcoming Milestones */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                                <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Upcoming Milestones</h3>
                        </div>
                        <UpcomingMilestones limit={5} />
                    </div>
                </div>
            </main>

            {/* AI Assistant */}
            <AIAssistant />
        </div>
    );
}

// Stats Card Component
function StatsCard({
    title,
    value,
    icon,
    trend,
    subtitle,
    color,
    onClick,
}: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: { value: number; direction: 'up' | 'down' | 'neutral' };
    subtitle?: string;
    color: 'blue' | 'emerald' | 'purple' | 'indigo' | 'orange';
    onClick?: () => void;
}) {
    const colorClasses = {
        blue: 'from-blue-500 to-blue-600 shadow-blue-500/30',
        emerald: 'from-emerald-500 to-emerald-600 shadow-emerald-500/30',
        purple: 'from-purple-500 to-purple-600 shadow-purple-500/30',
        indigo: 'from-indigo-500 to-indigo-600 shadow-indigo-500/30',
        orange: 'from-orange-500 to-orange-600 shadow-orange-500/30',
    };

    return (
        <div
            onClick={onClick}
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-slate-200 dark:border-slate-800 cursor-pointer group relative overflow-hidden"
        >
            {/* Background gradient effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-slate-50 dark:to-slate-800/30 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 bg-gradient-to-br ${colorClasses[color]} rounded-xl shadow-lg`}>
                        <div className="text-white">{icon}</div>
                    </div>
                    {trend && trend.direction !== 'neutral' && (
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${trend.direction === 'up' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                            {trend.direction === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {Math.abs(trend.value)}%
                        </div>
                    )}
                </div>
                <h3 className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-2">{title}</h3>
                <div className="flex items-baseline gap-3">
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
                    {subtitle && <span className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</span>}
                </div>
            </div>
        </div>
    );
}

// Quick Action Card
function QuickActionCard({
    title,
    icon,
    color,
    onClick,
}: {
    title: string;
    icon: React.ReactNode;
    color: 'blue' | 'purple' | 'emerald' | 'orange';
    onClick?: () => void;
}) {
    const colorClasses = {
        blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
        purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
        emerald: 'from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700',
        orange: 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
    };

    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-3 p-4 bg-gradient-to-br ${colorClasses[color]} rounded-xl shadow-lg hover:shadow-xl transition-all text-white font-semibold group`}
        >
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg group-hover:bg-white/30 transition-all">
                {icon}
            </div>
            <span>{title}</span>
            <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-all" />
        </button>
    );
}

// Project Card Component
function ProjectCard({ project, onClick }: { project: Project; onClick?: () => void }) {
    const priorityColors = {
        low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
        urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };

    return (
        <div
            onClick={onClick}
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-slate-200 dark:border-slate-800 cursor-pointer group"
        >
            <div className="flex items-start justify-between mb-4">
                <h4 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                    {project.name}
                </h4>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${priorityColors[project.priority as keyof typeof priorityColors] || priorityColors.medium}`}>
                    {project.priority}
                </span>
            </div>
            
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2 min-h-[2.5rem]">
                {project.description || 'No description provided'}
            </p>

            {/* Progress Bar */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Progress</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{project.progress}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${project.progress}%` }}
                    />
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'No deadline'}
                </div>
                <div className="flex items-center gap-1">
                    <ListChecks className="w-3 h-3" />
                    {project.task_count || 0} tasks
                </div>
            </div>
        </div>
    );
}

export default function Dashboard() {
    return (
        <ProtectedRoute>
            <DashboardContent />
        </ProtectedRoute>
    );
}
