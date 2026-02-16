import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '~/contexts/AuthContext';
import { ProtectedRoute } from '~/components/ProtectedRoute';
import { Navbar } from '~/components/Navbar';
import {
    BarChart3,
    TrendingUp,
    Users,
    CheckSquare,
    Clock,
    FolderOpen,
    Download,
    Calendar,
    Filter,
} from 'lucide-react';
import { KPICard } from '~/components/KPICard';
import tokenStorage from '~/services/tokenStorage';

export function meta() {
    return [
        { title: 'Reports & Analytics - SynergyOS' },
        { name: 'description', content: 'View comprehensive analytics and reports' },
    ];
}

function ReportsContent() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('30'); // days

    useEffect(() => {
        fetchReportData();
    }, [dateRange]);

    const fetchReportData = async () => {
        try {
            const token = tokenStorage.getAccessToken();
            if (!token) return;

            // Calculate date range
            const dateTo = new Date();
            const dateFrom = new Date();
            dateFrom.setDate(dateTo.getDate() - parseInt(dateRange));

            const fromStr = dateFrom.toISOString().split('T')[0];
            const toStr = dateTo.toISOString().split('T')[0];

            // Fetch summary statistics from new reports API
            const summaryRes = await fetch(
                `http://localhost/api/reports/summary/?date_from=${fromStr}&date_to=${toStr}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (summaryRes.ok) {
                const summary = await summaryRes.json();
                
                setStats({
                    totalProjects: summary.projects.total,
                    completedProjects: summary.projects.completed,
                    totalTasks: summary.tasks.total,
                    completedTasks: summary.tasks.completed,
                    totalHours: summary.time.total_hours,
                    activeUsers: summary.team.size,
                });
            }
        } catch (error) {
            console.error('Failed to fetch report data:', error);
        } finally {
            setLoading(false);
        }
    };

    const exportReport = async (format: 'csv' | 'pdf', type: 'team' | 'time' = 'team') => {
        try {
            const token = tokenStorage.getAccessToken();
            if (!token) return;

            // Calculate date range
            const dateTo = new Date();
            const dateFrom = new Date();
            dateFrom.setDate(dateTo.getDate() - parseInt(dateRange));

            const fromStr = dateFrom.toISOString().split('T')[0];
            const toStr = dateTo.toISOString().split('T')[0];

            const endpoint = type === 'team' 
                ? `http://localhost/api/reports/team/?format=${format}&date_from=${fromStr}&date_to=${toStr}`
                : `http://localhost/api/reports/time_tracking/?format=${format}&date_from=${fromStr}&date_to=${toStr}`;

            // Fetch the report
            const response = await fetch(endpoint, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${type}_report_${fromStr}.${format}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                console.error('Failed to export report');
            }
        } catch (error) {
            console.error('Failed to export report:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-950 dark:to-black">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
                {/* Header */}
                <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-50 mb-2">
                            Reports & Analytics
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400">
                            Comprehensive insights into your workspace performance
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="7">Last 7 days</option>
                            <option value="30">Last 30 days</option>
                            <option value="90">Last 90 days</option>
                            <option value="365">Last year</option>
                        </select>
                        <button
                            onClick={() => exportReport('pdf', 'team')}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Team PDF
                        </button>
                        <button
                            onClick={() => exportReport('csv', 'time')}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Time CSV
                        </button>
                    </div>
                </div>

                {/* Key Metrics Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {loading ? (
                        <>
                            {[1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className="h-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl animate-pulse"
                                />
                            ))}
                        </>
                    ) : (
                        <>
                            <KPICard
                                title="Total Projects"
                                value={stats?.totalProjects || 0}
                                icon={<FolderOpen className="w-5 h-5" />}
                                color="blue"
                                subtitle={`${stats?.completedProjects || 0} completed`}
                                trend={{
                                    value: 15,
                                    direction: 'up',
                                }}
                            />
                            <KPICard
                                title="Total Tasks"
                                value={stats?.totalTasks || 0}
                                icon={<CheckSquare className="w-5 h-5" />}
                                color="green"
                                subtitle={`${stats?.completedTasks || 0} done`}
                            />
                            <KPICard
                                title="Hours Logged"
                                value={stats?.totalHours || 0}
                                icon={<Clock className="w-5 h-5" />}
                                color="purple"
                            />
                            <KPICard
                                title="Active Team Members"
                                value={stats?.activeUsers || 0}
                                icon={<Users className="w-5 h-5" />}
                                color="orange"
                            />
                        </>
                    )}
                </div>

                {/* Report Categories */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <ReportCard
                        title="Project Reports"
                        description="Completion rates, velocity trends, and budget tracking"
                        icon={<FolderOpen className="w-6 h-6" />}
                        color="blue"
                    />
                    <ReportCard
                        title="Team Performance"
                        description="Workload distribution, productivity metrics, and capacity"
                        icon={<Users className="w-6 h-6" />}
                        color="purple"
                    />
                    <ReportCard
                        title="Task Analytics"
                        description="Status distribution, priority analysis, and trends"
                        icon={<CheckSquare className="w-6 h-6" />}
                        color="green"
                    />
                    <ReportCard
                        title="Time Tracking"
                        description="Hours logged, utilization rates, and breakdowns"
                        icon={<Clock className="w-6 h-6" />}
                        color="orange"
                    />
                    <ReportCard
                        title="AI Insights"
                        description="Risk analysis trends and prediction accuracy"
                        icon={<TrendingUp className="w-6 h-6" />}
                        color="indigo"
                    />
                    <ReportCard
                        title="Custom Reports"
                        description="Build and save custom report configurations"
                        icon={<BarChart3 className="w-6 h-6" />}
                        color="red"
                    />
                </div>

                {/* Placeholder for Charts */}
                <div className="mt-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
                        Productivity Trends
                    </h3>
                    <div className="h-64 flex items-center justify-center text-slate-400 dark:text-slate-500">
                        <div className="text-center">
                            <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                            <p>Chart visualization coming soon</p>
                            <p className="text-sm">Integrate with Recharts or Chart.js</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

interface ReportCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo';
    onClick?: () => void;
}

function ReportCard({ title, description, icon, color, onClick }: ReportCardProps) {
    const colorClasses = {
        blue: 'bg-blue-50 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900 text-blue-600 dark:text-blue-300',
        green: 'bg-green-50 dark:bg-green-950/40 border-green-100 dark:border-green-900 text-green-600 dark:text-green-300',
        purple:
            'bg-purple-50 dark:bg-purple-950/40 border-purple-100 dark:border-purple-900 text-purple-600 dark:text-purple-300',
        orange:
            'bg-orange-50 dark:bg-orange-950/40 border-orange-100 dark:border-orange-900 text-orange-600 dark:text-orange-300',
        red: 'bg-red-50 dark:bg-red-950/40 border-red-100 dark:border-red-900 text-red-600 dark:text-red-300',
        indigo:
            'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900 text-indigo-600 dark:text-indigo-300',
    };

    return (
        <div
            onClick={onClick}
            className={`group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 hover:shadow-lg transition-all ${onClick ? 'cursor-pointer' : ''}`}
        >
            <div className={`inline-flex p-3 rounded-lg border mb-4 ${colorClasses[color]}`}>
                {icon}
            </div>
            <h3 className={`text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2 ${onClick ? 'group-hover:text-blue-600 dark:group-hover:text-blue-400' : ''} transition-colors`}>
                {title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
        </div>
    );
}

export default function Reports() {
    return (
        <ProtectedRoute>
            <ReportsContent />
        </ProtectedRoute>
    );
}
