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
    X,
    CheckCircle,
    AlertCircle,
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
    const [productivityData, setProductivityData] = useState<any[]>([]);
    const [activeReport, setActiveReport] = useState<string | null>(null);
    const [reportData, setReportData] = useState<any>(null);
    const [loadingReport, setLoadingReport] = useState(false);

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

            // Fetch productivity trend data (tasks completed per day/week)
            fetchProductivityTrend(parseInt(dateRange), token);
        } catch (error) {
            console.error('Failed to fetch report data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProductivityTrend = async (days: number, token: string) => {
        try {
            // Fetch all tasks to calculate daily completion trend
            const tasksRes = await fetch('http://localhost/api/tasks/', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (tasksRes.ok) {
                const tasks = await tasksRes.json();
                
                // Generate trend data based on date range
                const numPoints = days <= 7 ? 7 : days <= 30 ? 14 : 30;
                const interval = Math.ceil(days / numPoints);
                
                const trendData = Array.from({ length: numPoints }, (_, i) => {
                    const endDate = new Date();
                    endDate.setDate(endDate.getDate() - (numPoints - 1 - i) * interval);
                    endDate.setHours(23, 59, 59, 999);
                    
                    const startDate = new Date(endDate);
                    startDate.setDate(endDate.getDate() - interval + 1);
                    startDate.setHours(0, 0, 0, 0);
                    
                    const completed = tasks.filter((t: any) => {
                        if (t.status !== 'done' || !t.completed_at) return false;
                        const completedDate = new Date(t.completed_at);
                        return completedDate >= startDate && completedDate <= endDate;
                    }).length;
                    
                    const created = tasks.filter((t: any) => {
                        const createdDate = new Date(t.created_at);
                        return createdDate >= startDate && createdDate <= endDate;
                    }).length;
                    
                    return {
                        date: interval === 1 
                            ? endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            : `${startDate.getMonth() + 1}/${startDate.getDate()}-${endDate.getMonth() + 1}/${endDate.getDate()}`,
                        completed,
                        created,
                        productivity: created > 0 ? Math.round((completed / created) * 100) : 0,
                    };
                });
                
                setProductivityData(trendData);
            }
        } catch (error) {
            console.error('Failed to fetch productivity trend:', error);
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

    const viewDetailedReport = async (reportType: string) => {
        setActiveReport(reportType);
        setLoadingReport(true);
        
        try {
            const token = tokenStorage.getAccessToken();
            if (!token) return;

            const dateTo = new Date();
            const dateFrom = new Date();
            dateFrom.setDate(dateTo.getDate() - parseInt(dateRange));
            const fromStr = dateFrom.toISOString().split('T')[0];
            const toStr = dateTo.toISOString().split('T')[0];

            let data;
            
            if (reportType === 'team') {
                const response = await fetch(
                    `http://localhost/api/reports/team/?date_from=${fromStr}&date_to=${toStr}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                data = response.ok ? await response.json() : null;
            } else if (reportType === 'time') {
                const response = await fetch(
                    `http://localhost/api/reports/time_tracking/?date_from=${fromStr}&date_to=${toStr}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                data = response.ok ? await response.json() : null;
            } else if (reportType === 'ai') {
                // Fetch AI insights from tasks
                const response = await fetch('http://localhost/api/tasks/', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.ok) {
                    const tasks = await response.json();
                    const highRisk = tasks.filter((t: any) => t.priority === 'urgent' || t.priority === 'high');
                    const overdue = tasks.filter((t: any) => 
                        t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done'
                    );
                    data = {
                        high_risk_tasks: highRisk.length,
                        overdue_tasks: overdue.length,
                        total_tasks: tasks.length,
                        risk_score: Math.round((highRisk.length / Math.max(tasks.length, 1)) * 100),
                        tasks: tasks,
                    };
                }
            }
            
            setReportData(data);
        } catch (error) {
            console.error('Failed to fetch report data:', error);
        } finally {
            setLoadingReport(false);
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

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="w-full sm:w-auto px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="7">Last 7 days</option>
                            <option value="30">Last 30 days</option>
                            <option value="90">Last 90 days</option>
                            <option value="365">Last year</option>
                        </select>
                        <button
                            onClick={() => exportReport('pdf', 'team')}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors w-full sm:w-auto"
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Team PDF</span>
                            <span className="sm:hidden">PDF</span>
                        </button>
                        <button
                            onClick={() => exportReport('csv', 'time')}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors w-full sm:w-auto"
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Time CSV</span>
                            <span className="sm:hidden">CSV</span>
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
                        onClick={() => viewDetailedReport('project')}
                    />
                    <ReportCard
                        title="Team Performance"
                        description="Workload distribution, productivity metrics, and capacity"
                        icon={<Users className="w-6 h-6" />}
                        color="purple"
                        onClick={() => viewDetailedReport('team')}
                    />
                    <ReportCard
                        title="Task Analytics"
                        description="Status distribution, priority analysis, and trends"
                        icon={<CheckSquare className="w-6 h-6" />}
                        color="green"
                        onClick={() => viewDetailedReport('task')}
                    />
                    <ReportCard
                        title="Time Tracking"
                        description="Hours logged, utilization rates, and breakdowns"
                        icon={<Clock className="w-6 h-6" />}
                        color="orange"
                        onClick={() => viewDetailedReport('time')}
                    />
                    <ReportCard
                        title="AI Insights"
                        description="Risk analysis trends and prediction accuracy"
                        icon={<TrendingUp className="w-6 h-6" />}
                        color="indigo"
                        onClick={() => viewDetailedReport('ai')}
                    />
                    <ReportCard
                        title="Custom Reports"
                        description="Build and save custom report configurations"
                        icon={<BarChart3 className="w-6 h-6" />}
                        color="red"
                        onClick={() => viewDetailedReport('custom')}
                    />
                </div>

                {/* Detailed Report Modal */}
                {activeReport && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-slate-900 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl">
                            {/* Modal Header */}
                            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-6 flex items-center justify-between z-10">
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                                    {activeReport === 'team' && 'Team Performance'}
                                    {activeReport === 'time' && 'Time Tracking'}
                                    {activeReport === 'ai' && 'AI Insights'}
                                    {activeReport === 'project' && 'Project Reports'}
                                    {activeReport === 'task' && 'Task Analytics'}
                                    {activeReport === 'custom' && 'Custom Report Builder'}
                                </h2>
                                <button
                                    onClick={() => setActiveReport(null)}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6">
                                {loadingReport ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : (
                                    <>
                                        {activeReport === 'team' && reportData && (
                                            <TeamPerformanceReport data={reportData} onExport={() => exportReport('pdf', 'team')} />
                                        )}
                                        {activeReport === 'time' && reportData && (
                                            <TimeTrackingReport data={reportData} onExport={() => exportReport('csv', 'time')} />
                                        )}
                                        {activeReport === 'ai' && reportData && (
                                            <AIInsightsReport data={reportData} />
                                        )}
                                        {activeReport === 'project' && (
                                            <div className="text-center py-12 text-slate-600 dark:text-slate-400">
                                                <FolderOpen className="w-16 h-16 mx-auto mb-4" />
                                                <p>Project Reports view coming soon</p>
                                            </div>
                                        )}
                                        {activeReport === 'task' && (
                                            <div className="text-center py-12 text-slate-600 dark:text-slate-400">
                                                <CheckSquare className="w-16 h-16 mx-auto mb-4" />
                                                <p>Task Analytics view coming soon</p>
                                            </div>
                                        )}
                                        {activeReport === 'custom' && (
                                            <div className="text-center py-12 text-slate-600 dark:text-slate-400">
                                                <BarChart3 className="w-16 h-16 mx-auto mb-4" />
                                                <p>Custom Report Builder coming soon</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Productivity Trends Chart */}
                <div className="mt-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Productivity Trends
                    </h3>
                    
                    {loading ? (
                        <div className="h-64 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : productivityData.length === 0 ? (
                        <div className="h-64 flex items-center justify-center text-slate-400 dark:text-slate-500">
                            <div className="text-center">
                                <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                                <p>No data available for selected period</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Legend */}
                            <div className="flex items-center justify-end gap-6 text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-500 to-blue-600"></div>
                                    <span className="text-slate-600 dark:text-slate-400">Tasks Completed</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded bg-gradient-to-br from-green-500 to-green-600"></div>
                                    <span className="text-slate-600 dark:text-slate-400">Tasks Created</span>
                                </div>
                            </div>
                            
                            {/* Chart */}
                            <div className="h-64 flex items-end gap-2">
                                {productivityData.map((point, index) => {
                                    const maxValue = Math.max(
                                        ...productivityData.map(p => Math.max(p.completed, p.created)),
                                        1
                                    );
                                    const completedHeight = (point.completed / maxValue) * 100;
                                    const createdHeight = (point.created / maxValue) * 100;
                                    
                                    return (
                                        <div key={index} className="flex-1 flex flex-col gap-2">
                                            <div className="flex-1 flex items-end gap-1 justify-center">
                                                {/* Completed bar */}
                                                <div 
                                                    className="w-full max-w-[80px] bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all duration-500 hover:from-blue-700 hover:to-blue-500 cursor-pointer group relative"
                                                    style={{ height: `${completedHeight}%`, minHeight: point.completed > 0 ? '8px' : '0' }}
                                                >
                                                    <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-slate-900 dark:bg-slate-700 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg">
                                                        <div className="font-semibold mb-1">{point.date}</div>
                                                        <div className="text-blue-300">✓ {point.completed} completed</div>
                                                        <div className="text-green-300">+ {point.created} created</div>
                                                        {point.productivity > 0 && (
                                                            <div className="text-amber-300 mt-1">
                                                                📈 {point.productivity}% rate
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                {/* Created bar */}
                                                <div 
                                                    className="w-full max-w-[80px] bg-gradient-to-t from-green-600 to-green-400 rounded-t-lg transition-all duration-500 hover:from-green-700 hover:to-green-500 cursor-pointer group relative"
                                                    style={{ height: `${createdHeight}%`, minHeight: point.created > 0 ? '8px' : '0' }}
                                                >
                                                    <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-slate-900 dark:bg-slate-700 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg">
                                                        <div className="font-semibold mb-1">{point.date}</div>
                                                        <div className="text-blue-300">✓ {point.completed} completed</div>
                                                        <div className="text-green-300">+ {point.created} created</div>
                                                        {point.productivity > 0 && (
                                                            <div className="text-amber-300 mt-1">
                                                                📈 {point.productivity}% rate
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Date label */}
                                            <div className="text-xs text-slate-600 dark:text-slate-400 text-center font-medium truncate px-1">
                                                {point.date}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            
                            {/* Summary Stats */}
                            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                        {productivityData.reduce((sum, p) => sum + p.completed, 0)}
                                    </div>
                                    <div className="text-sm text-slate-600 dark:text-slate-400">Total Completed</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                        {productivityData.reduce((sum, p) => sum + p.created, 0)}
                                    </div>
                                    <div className="text-sm text-slate-600 dark:text-slate-400">Total Created</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                        {(() => {
                                            const total = productivityData.reduce((sum, p) => sum + p.created, 0);
                                            const completed = productivityData.reduce((sum, p) => sum + p.completed, 0);
                                            return total > 0 ? Math.round((completed / total) * 100) : 0;
                                        })()}%
                                    </div>
                                    <div className="text-sm text-slate-600 dark:text-slate-400">Completion Rate</div>
                                </div>
                            </div>
                        </div>
                    )}
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

// Team Performance Report Component
function TeamPerformanceReport({ data, onExport }: { data: any; onExport: () => void }) {
    return (
        <div className="space-y-6">
            {/* Export Button */}
            <div className="flex justify-end">
                <button
                    onClick={onExport}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                    <Download className="w-4 h-4" />
                    Export PDF
                </button>
            </div>

            {/* Team Members Table */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Team Member Performance
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700">
                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 dark:text-slate-50">Member</th>
                                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-900 dark:text-slate-50">Tasks Assigned</th>
                                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-900 dark:text-slate-50">Completed</th>
                                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-900 dark:text-slate-50">In Progress</th>
                                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-900 dark:text-slate-50">Completion Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.team_members && data.team_members.map((member: any, index: number) => (
                                <tr key={index} className="border-b border-slate-100 dark:border-slate-700/50">
                                    <td className="py-3 px-4 text-sm text-slate-900 dark:text-slate-50">{member.name}</td>
                                    <td className="text-center py-3 px-4 text-sm text-slate-600 dark:text-slate-400">{member.assigned_tasks}</td>
                                    <td className="text-center py-3 px-4 text-sm text-green-600 dark:text-green-400">{member.completed_tasks}</td>
                                    <td className="text-center py-3 px-4 text-sm text-blue-600 dark:text-blue-400">{member.in_progress_tasks}</td>
                                    <td className="text-center py-3 px-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                            member.completion_rate >= 80 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                                            member.completion_rate >= 60 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                                            'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                                        }`}>
                                            {member.completion_rate}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Workload Distribution Chart */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Workload Distribution
                </h3>
                <div className="space-y-4">
                    {data.team_members && data.team_members.map((member: any, index: number) => {
                        const maxTasks = Math.max(...data.team_members.map((m: any) => m.assigned_tasks));
                        const widthPercent = maxTasks > 0 ? (member.assigned_tasks / maxTasks) * 100 : 0;
                        
                        return (
                            <div key={index} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-900 dark:text-slate-50 font-medium">{member.name}</span>
                                    <span className="text-slate-600 dark:text-slate-400">{member.assigned_tasks} tasks</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                                    <div 
                                        className="bg-gradient-to-r from-purple-600 to-purple-400 h-3 rounded-full transition-all duration-500"
                                        style={{ width: `${widthPercent}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// Time Tracking Report Component
function TimeTrackingReport({ data, onExport }: { data: any; onExport: () => void }) {
    return (
        <div className="space-y-6">
            {/* Export Button */}
            <div className="flex justify-end">
                <button
                    onClick={onExport}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                >
                    <Download className="w-4 h-4" />
                    Export CSV
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                            <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Hours</h4>
                    </div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                        {data.total_hours || 0}
                    </div>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400">Billable Hours</h4>
                    </div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                        {data.billable_hours || 0}
                    </div>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400">Utilization Rate</h4>
                    </div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                        {data.utilization_rate || 0}%
                    </div>
                </div>
            </div>

            {/* Hours by User Table */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Hours by Team Member
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700">
                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 dark:text-slate-50">Member</th>
                                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-900 dark:text-slate-50">Total Hours</th>
                                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-900 dark:text-slate-50">This Week</th>
                                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-900 dark:text-slate-50">Avg/Day</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.time_entries && data.time_entries.map((entry: any, index: number) => (
                                <tr key={index} className="border-b border-slate-100 dark:border-slate-700/50">
                                    <td className="py-3 px-4 text-sm text-slate-900 dark:text-slate-50">{entry.user}</td>
                                    <td className="text-center py-3 px-4 text-sm text-slate-600 dark:text-slate-400">{entry.total_hours}h</td>
                                    <td className="text-center py-3 px-4 text-sm text-blue-600 dark:text-blue-400">{entry.weekly_hours}h</td>
                                    <td className="text-center py-3 px-4 text-sm text-slate-600 dark:text-slate-400">{entry.avg_daily_hours}h</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// AI Insights Report Component
function AIInsightsReport({ data }: { data: any }) {
    return (
        <div className="space-y-6">
            {/* Risk Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400">High Risk Tasks</h4>
                    </div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                        {data.high_risk_tasks || 0}
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400">Overdue Tasks</h4>
                    </div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                        {data.overdue_tasks || 0}
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Tasks</h4>
                    </div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                        {data.total_tasks || 0}
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400">Risk Score</h4>
                    </div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                        {data.risk_score || 0}%
                    </div>
                </div>
            </div>

            {/* High-Risk Tasks List */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    High-Risk & Critical Tasks
                </h3>
                <div className="space-y-3">
                    {data.tasks && data.tasks
                        .filter((task: any) => task.priority === 'urgent' || task.priority === 'high')
                        .slice(0, 10)
                        .map((task: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                                <div className="flex-1">
                                    <h4 className="font-medium text-slate-900 dark:text-slate-50 mb-1">{task.title}</h4>
                                    <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                            task.priority === 'urgent' 
                                                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' 
                                                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                                        }`}>
                                            {task.priority}
                                        </span>
                                        <span>{task.status}</span>
                                        {task.due_date && <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                </div>
            </div>

            {/* AI Recommendations */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-500" />
                    AI-Generated Recommendations
                </h3>
                <div className="space-y-3">
                    {data.high_risk_tasks > 5 && (
                        <div className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-slate-900 dark:text-slate-50 mb-1">High Task Risk Detected</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    You have {data.high_risk_tasks} high-priority tasks. Consider redistributing workload or extending deadlines.
                                </p>
                            </div>
                        </div>
                    )}
                    
                    {data.overdue_tasks > 0 && (
                        <div className="flex gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-slate-900 dark:text-slate-50 mb-1">Overdue Tasks Require Attention</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    {data.overdue_tasks} task(s) are overdue. Review and update task priorities or deadlines.
                                </p>
                            </div>
                        </div>
                    )}

                    {data.risk_score < 30 && (
                        <div className="flex gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-slate-900 dark:text-slate-50 mb-1">Project Health Good</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Your project risk score is low ({data.risk_score}%). Continue current workflow practices.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
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
