import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '~/components/Navbar';
import { useAuth } from '~/contexts/AuthContext';
import teamMemberService, { type TeamMemberDashboard } from '~/services/team-member.service';
import authService from '~/services/auth.service';
import { 
    Briefcase, CheckCircle, Clock, MessageSquare, 
    AlertCircle, TrendingUp, Calendar, FileText, Upload, Eye, X, Download,
    Bell, LogOut, KeyRound, ShieldCheck
} from 'lucide-react';
import type { Route } from './+types/team-dashboard';

export function meta({}: Route.MetaArgs) {
    return [
        { title: 'Team Dashboard - SynergyOS' },
        { name: 'description', content: 'Team member dashboard' },
    ];
}

export default function TeamDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [dashboard, setDashboard] = useState<TeamMemberDashboard | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showProofModal, setShowProofModal] = useState(false);
    const [taskProofs, setTaskProofs] = useState<any[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationRef = useRef<HTMLDivElement | null>(null);
    const [passwordForm, setPasswordForm] = useState({
        current: '',
        next: '',
        confirm: '',
    });
    const [passwordState, setPasswordState] = useState<{ type: 'idle' | 'success' | 'error'; message?: string }>({ type: 'idle' });
    const [passwordLoading, setPasswordLoading] = useState(false);

    useEffect(() => {
        loadDashboard();
    }, []);

    useEffect(() => {
        const handleClickAway = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        };

        if (showNotifications) {
            window.addEventListener('click', handleClickAway);
        }

        return () => window.removeEventListener('click', handleClickAway);
    }, [showNotifications]);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            const data = await teamMemberService.getDashboard();
            setDashboard(data);
        } catch (err: any) {
            setError('Failed to load dashboard data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUploadProof = (task: any) => {
        setSelectedTask(task);
        setShowUploadModal(true);
    };

    const handleFileUpload = async (file: File, description: string) => {
        if (!selectedTask) return;

        try {
            const formData = new FormData();
            formData.append('files', file);
            formData.append('task_id', selectedTask.id.toString());
            formData.append('description', description);
            
            await teamMemberService.uploadProof(formData);
            setShowUploadModal(false);
            setSelectedTask(null);
            loadDashboard(); // Reload to show updated status
            alert('Proof uploaded successfully!');
        } catch (err) {
            console.error('Upload failed:', err);
            alert('Failed to upload proof');
        }
    };

    const handleViewProof = async (task: any) => {
        try {
            const attachments = await teamMemberService.getTaskAttachments(task.id);
            setTaskProofs(attachments);
            setSelectedTask(task);
            setShowProofModal(true);
        } catch (err) {
            console.error('Failed to load proofs:', err);
            alert('Failed to load proof files');
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handlePasswordFieldChange = (field: keyof typeof passwordForm, value: string) => {
        setPasswordForm((prev) => ({ ...prev, [field]: value }));
        if (passwordState.type !== 'idle') {
            setPasswordState({ type: 'idle' });
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!passwordForm.current || !passwordForm.next || !passwordForm.confirm) {
            setPasswordState({ type: 'error', message: 'All fields are required.' });
            return;
        }
        if (passwordForm.next !== passwordForm.confirm) {
            setPasswordState({ type: 'error', message: 'New passwords do not match.' });
            return;
        }

        try {
            setPasswordLoading(true);
            await authService.changePassword({
                old_password: passwordForm.current,
                new_password: passwordForm.next,
            });
            setPasswordState({ type: 'success', message: 'Password updated successfully.' });
            setPasswordForm({ current: '', next: '', confirm: '' });
        } catch (err: any) {
            const message = err?.response?.data?.detail || 'Unable to update password. Please verify your current password.';
            setPasswordState({ type: 'error', message });
        } finally {
            setPasswordLoading(false);
        }
    };

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Failed to Load Dashboard
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                    <button
                        onClick={loadDashboard}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const defaultStats = {
        total_projects: 0,
        total_tasks: 0,
        completed_tasks: 0,
        pending_tasks: 0,
        unread_messages: 0,
        completion_rate: 0,
    };

    const safeStats = dashboard?.stats ?? defaultStats;
    const projects = dashboard?.projects ?? [];
    const assigned_tasks = dashboard?.assigned_tasks ?? [];
    const recent_messages = dashboard?.recent_messages ?? [];
    const showSkeleton = loading || !dashboard;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Navbar />

            {/* Header */}
            <div className="bg-white dark:bg-gray-800 shadow pt-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 space-y-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                Team Member Dashboard
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                Welcome back, {user?.first_name || user?.username}!
                            </p>
                        </div>
                        <div className="flex items-center gap-3" ref={notificationRef}>
                            <button
                                type="button"
                                onClick={() => setShowNotifications((prev) => !prev)}
                                className="relative px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2 bg-white/70 dark:bg-gray-800/60"
                            >
                                <Bell className="w-5 h-5" />
                                Notifications
                                {safeStats.unread_messages > 0 && (
                                    <span className="absolute -top-2 -right-1 px-1.5 py-0.5 text-xs font-semibold bg-red-600 text-white rounded-full">
                                        {safeStats.unread_messages}
                                    </span>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
                            >
                                <LogOut className="w-5 h-5" />
                                Logout
                            </button>

                            {showNotifications && (
                                <div className="absolute right-4 top-24 w-full max-w-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-4 z-40">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Notifications</p>
                                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                                Latest updates
                                            </p>
                                        </div>
                                        <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                            {safeStats.unread_messages} new
                                        </span>
                                    </div>
                                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                                        {recent_messages.length === 0 && (
                                            <p className="text-sm text-gray-500 dark:text-gray-400">You're all caught up!</p>
                                        )}
                                        {recent_messages.slice(0, 5).map((message) => (
                                            <button
                                                key={message.id}
                                                onClick={() => {
                                                    setShowNotifications(false);
                                                    navigate(`/projects/${message.project}`);
                                                }}
                                                className={`w-full text-left p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition ${!message.is_read ? 'bg-blue-50 dark:bg-blue-900/10' : 'bg-white dark:bg-gray-800'}`}
                                            >
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                    {message.sender.first_name || message.sender.username}
                                                </p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                                                    {message.message}
                                                </p>
                                                <span className="text-[11px] text-gray-500 dark:text-gray-500">
                                                    {new Date(message.created_at).toLocaleTimeString()}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Account security</p>
                            <p className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-green-500" />
                                MFA protected, last login synced
                            </p>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-300">
                            Signed in as <span className="font-medium text-gray-900 dark:text-white">{user?.email || user?.username}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {showSkeleton ? (
                        <>
                            <SkeletonStat />
                            <SkeletonStat />
                            <SkeletonStat />
                            <SkeletonStat />
                        </>
                    ) : (
                        <>
                            <StatCard
                                icon={<Briefcase className="w-6 h-6" />}
                                title="Projects"
                                value={safeStats.total_projects}
                                color="blue"
                            />
                            <StatCard
                                icon={<FileText className="w-6 h-6" />}
                                title="Total Tasks"
                                value={safeStats.total_tasks}
                                color="purple"
                            />
                            <StatCard
                                icon={<CheckCircle className="w-6 h-6" />}
                                title="Completed"
                                value={safeStats.completed_tasks}
                                subtitle={`${safeStats.completion_rate}% completion rate`}
                                color="green"
                            />
                            <StatCard
                                icon={<MessageSquare className="w-6 h-6" />}
                                title="Unread Messages"
                                value={safeStats.unread_messages}
                                color="orange"
                                badge={safeStats.unread_messages > 0}
                            />
                        </>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* My Tasks */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Clock className="w-5 h-5" />
                                    My Tasks
                                </h2>
                            </div>
                            <div className="p-6">
                                {showSkeleton ? (
                                    <SkeletonTaskList />
                                ) : assigned_tasks.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                        No tasks assigned yet
                                    </div>
                                ) : (
                                <div className="space-y-4">
                                    {assigned_tasks.slice(0, 5).map((task) => (
                                        <TaskCard
                                            key={task.id}
                                            task={task}
                                            onUpload={() => handleUploadProof(task)}
                                            onView={() => navigate(`/team-dashboard/task/${task.id}`)}
                                            onViewProof={() => handleViewProof(task)}
                                        />
                                    ))}
                                </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div>
                        {/* My Projects */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Briefcase className="w-5 h-5" />
                                    My Projects
                                </h2>
                            </div>
                            <div className="p-6">
                                {showSkeleton ? (
                                    <SkeletonProjectList />
                                ) : projects.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                        No projects yet
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {projects.map((project) => (
                                            <ProjectCard
                                                key={project.id}
                                                project={project}
                                                onClick={() => navigate(`/team-dashboard/project/${project.id}`)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recent Messages */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5" />
                                    Recent Messages
                                </h2>
                            </div>
                            <div className="p-6">
                                {showSkeleton ? (
                                    <SkeletonMessageList />
                                ) : recent_messages.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                        No messages yet
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {recent_messages.slice(0, 5).map((message) => (
                                            <MessageCard
                                                key={message.id}
                                                message={message}
                                                onClick={() => navigate(`/projects/${message.project}`)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Change Password */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mt-6">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <KeyRound className="w-5 h-5" />
                                    Change Password
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Keep your account secure by updating your password regularly.
                                </p>
                            </div>
                            <div className="p-6">
                                <form className="space-y-4" onSubmit={handlePasswordSubmit}>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Current Password
                                        </label>
                                        <input
                                            type="password"
                                            value={passwordForm.current}
                                            onChange={(e) => handlePasswordFieldChange('current', e.target.value)}
                                            className="input-enhanced w-full"
                                            placeholder="Enter current password"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            New Password
                                        </label>
                                        <input
                                            type="password"
                                            value={passwordForm.next}
                                            onChange={(e) => handlePasswordFieldChange('next', e.target.value)}
                                            className="input-enhanced w-full"
                                            placeholder="Enter new password"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Confirm New Password
                                        </label>
                                        <input
                                            type="password"
                                            value={passwordForm.confirm}
                                            onChange={(e) => handlePasswordFieldChange('confirm', e.target.value)}
                                            className="input-enhanced w-full"
                                            placeholder="Re-enter new password"
                                        />
                                    </div>

                                    {passwordState.type !== 'idle' && passwordState.message && (
                                        <div className={`text-sm rounded-lg px-3 py-2 ${passwordState.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300'}`}>
                                            {passwordState.message}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        className="btn-primary w-full flex items-center justify-center gap-2"
                                        disabled={passwordLoading}
                                    >
                                        {passwordLoading ? 'Updating...' : 'Update Password'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
            </div>
        </div>

        {/* Upload Modal */}
        {showUploadModal && selectedTask && (
            <UploadModal
                task={selectedTask}
                onClose={() => {
                    setShowUploadModal(false);
                    setSelectedTask(null);
                }}
                onUpload={handleFileUpload}
            />
        )}

        {/* View Proof Modal */}
        {showProofModal && selectedTask && (
            <ViewProofModal
                task={selectedTask}
                proofs={taskProofs}
                onClose={() => {
                    setShowProofModal(false);
                    setSelectedTask(null);
                    setTaskProofs([]);
                }}
            />
        )}
    </div>
);
}

function StatCard({ icon, title, value, subtitle, color, badge }: any) {
    const colors = {
        blue: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
        purple: 'bg-indigo-50 text-indigo-700 dark:bg-purple-900/20 dark:text-purple-400',
        green: 'bg-emerald-50 text-emerald-700 dark:bg-green-900/20 dark:text-green-400',
        orange: 'bg-amber-50 text-amber-700 dark:bg-orange-900/20 dark:text-orange-400',
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 relative border border-gray-100 dark:border-gray-700/60">
            {badge && (
                <div className="absolute top-4 right-4">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                </div>
            )}
            <div className={`inline-flex p-3 rounded-lg ${colors[color as keyof typeof colors]} mb-4`}>
                {icon}
            </div>
            <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium">{title}</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
            {subtitle && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
            )}
        </div>
    );
}

function SkeletonStat() {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-6 animate-pulse">
            <div className="h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-700 mb-4" />
            <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
            <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
    );
}

function TaskCard({ task, onUpload, onView, onViewProof }: any) {
    const priorityColors = {
        low: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
        medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
        high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
        urgent: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    };

    const statusColors = {
        todo: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
        in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
        review: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
        done: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
    };

    return (
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{task.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                        {task.description}
                    </p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded ml-2 ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                    {task.priority}
                </span>
            </div>
            
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${statusColors[task.status as keyof typeof statusColors]}`}>
                        {task.status.replace('_', ' ')}
                    </span>
                    {task.due_date && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                        {new Date(task.due_date).toLocaleDateString()}
                    </span>
                )}
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={onView}
                    className="text-xs px-3 py-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                >
                    View
                </button>
                {task.status !== 'done' && (
                    <button
                        onClick={onUpload}
                        className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
                    >
                        <Upload className="w-3 h-3" />
                        Upload Proof
                    </button>
                )}
                {task.has_attachments && (
                    <button
                        onClick={onViewProof}
                        className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
                    >
                        <Eye className="w-3 h-3" />
                        View Proof
                    </button>
                )}
            </div>
        </div>
    </div>
);
}

function SkeletonTaskList() {
    return (
        <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((key) => (
                <div key={key} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
                    <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                    <div className="h-3 w-2/3 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                    <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
            ))}
        </div>
    );
}

function ProjectCard({ project, onClick }: any) {
    const priorityColors = {
        low: 'text-gray-600',
        medium: 'text-blue-600',
        high: 'text-orange-600',
        urgent: 'text-red-600',
    };

    return (
        <div
            onClick={onClick}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
        >
            <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">{project.name}</h3>
                <span className={`text-xs font-medium ${priorityColors[project.priority as keyof typeof priorityColors]}`}>
                    {project.priority}
                </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                {project.description}
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    {project.progress}%
                </span>
                <span>{project.task_count} tasks</span>
            </div>
        </div>
    );
}

function SkeletonProjectList() {
    return (
        <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((key) => (
                <div key={key} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                    <div className="flex items-center justify-between mb-3">
                        <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
                        <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
                    </div>
                    <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                    <div className="h-3 w-2/3 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
            ))}
        </div>
    );
}

function MessageCard({ message, onClick }: any) {
    return (
        <div 
            onClick={onClick}
            className={`p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${!message.is_read ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800' : ''}`}
        >
            <div className="flex items-start gap-2 mb-1">
                <div className="font-medium text-gray-900 dark:text-white text-sm">
                    {message.sender.first_name || message.sender.username}
                </div>
                {!message.is_read && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5"></div>
                )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {message.message}
            </p>
            <span className="text-xs text-gray-500 dark:text-gray-500 mt-1 block">
                {new Date(message.created_at).toLocaleString()}
            </span>
        </div>
    );
}

function SkeletonMessageList() {
    return (
        <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((key) => (
                <div key={key} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                    <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                    <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                    <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
            ))}
        </div>
    );
}

function UploadModal({ task, onClose, onUpload }: any) {
    const [file, setFile] = useState<File | null>(null);
    const [description, setDescription] = useState('');
    const [uploading, setUploading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setUploading(true);
        try {
            await onUpload(file, description);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Upload Proof of Completion
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Task: <span className="font-medium">{task.title}</span>
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Select File (Image, Video, or Document)
                        </label>
                        <input
                            type="file"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Description (Optional)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            placeholder="Add notes about this proof..."
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                            disabled={uploading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                            disabled={!file || uploading}
                        >
                            {uploading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4" />
                                    Upload
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function ViewProofModal({ task, proofs, onClose }: any) {
    const [previewFile, setPreviewFile] = useState<any>(null);

    const getFileIcon = (fileType: string) => {
        switch (fileType) {
            case 'image': return '🖼️';
            case 'video': return '🎥';
            case 'document': return '📄';
            default: return '📎';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const isImageFile = (fileName: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase();
        return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '');
    };

    const isPdfFile = (fileName: string) => {
        return fileName.toLowerCase().endsWith('.pdf');
    };

    const handleQuickView = (proof: any, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setPreviewFile(proof);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Proof of Completion
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    Task: <span className="font-medium text-gray-900 dark:text-white">{task.title}</span>
                </p>

                {proofs.length === 0 ? (
                    <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">
                            No proof files uploaded yet
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {proofs.map((proof: any) => (
                            <div
                                key={proof.id}
                                className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                <span className="text-2xl flex-shrink-0">
                                    {getFileIcon(proof.file_type)}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        {proof.file_name}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Uploaded {formatDate(proof.uploaded_at)}
                                    </p>
                                    {proof.description && (
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                            {proof.description}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {(isImageFile(proof.file_name) || isPdfFile(proof.file_name)) && (
                                        <button
                                            onClick={(e) => handleQuickView(proof, e)}
                                            className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-1.5"
                                            title="Quick preview"
                                        >
                                            <Eye className="w-4 h-4" />
                                            Quick View
                                        </button>
                                    )}
                                    <a
                                        href={proof.file}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1.5"
                                    >
                                        <Download className="w-4 h-4" />
                                        Open
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                        Close
                    </button>
                </div>
            </div>

            {/* Quick View Modal */}
            {previewFile && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60] p-4"
                    onClick={() => setPreviewFile(null)}
                >
                    <div className="relative max-w-6xl w-full max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between mb-4 px-4">
                            <h3 className="text-white font-semibold text-lg truncate">
                                {previewFile.file_name}
                            </h3>
                            <button
                                onClick={() => setPreviewFile(null)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="w-6 h-6 text-white" />
                            </button>
                        </div>
                        <div 
                            className="flex-1 flex items-center justify-center overflow-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {isImageFile(previewFile.file_name) ? (
                                <img
                                    src={previewFile.file}
                                    alt={previewFile.file_name}
                                    className="max-w-full max-h-full object-contain rounded-lg"
                                />
                            ) : isPdfFile(previewFile.file_name) ? (
                                <iframe
                                    src={previewFile.file}
                                    className="w-full h-full min-h-[600px] rounded-lg bg-white"
                                    title={previewFile.file_name}
                                />
                            ) : null}
                        </div>
                        <div className="mt-4 flex justify-center gap-3">
                            <a
                                href={previewFile.file}
                                download
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Download className="w-4 h-4" />
                                Download
                            </a>
                            <a
                                href={previewFile.file}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Eye className="w-4 h-4" />
                                Open in New Tab
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
