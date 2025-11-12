import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '~/contexts/AuthContext';
import teamMemberService, { type TeamMemberDashboard } from '~/services/team-member.service';
import { 
    Briefcase, CheckCircle, Clock, MessageSquare, 
    AlertCircle, TrendingUp, Calendar, FileText, Upload, Eye, X 
} from 'lucide-react';
import type { Route } from './+types/team-dashboard';

export function meta({}: Route.MetaArgs) {
    return [
        { title: 'Team Dashboard - SynergyOS' },
        { name: 'description', content: 'Team member dashboard' },
    ];
}

export default function TeamDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [dashboard, setDashboard] = useState<TeamMemberDashboard | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showProofModal, setShowProofModal] = useState(false);
    const [taskProofs, setTaskProofs] = useState<any[]>([]);

    useEffect(() => {
        loadDashboard();
    }, []);

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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !dashboard) {
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

    const { stats, projects, assigned_tasks, recent_messages } = dashboard;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Team Member Dashboard
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Welcome back, {user?.first_name || user?.username}!
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        icon={<Briefcase className="w-6 h-6" />}
                        title="Projects"
                        value={stats.total_projects}
                        color="blue"
                    />
                    <StatCard
                        icon={<FileText className="w-6 h-6" />}
                        title="Total Tasks"
                        value={stats.total_tasks}
                        color="purple"
                    />
                    <StatCard
                        icon={<CheckCircle className="w-6 h-6" />}
                        title="Completed"
                        value={stats.completed_tasks}
                        subtitle={`${stats.completion_rate}% completion rate`}
                        color="green"
                    />
                    <StatCard
                        icon={<MessageSquare className="w-6 h-6" />}
                        title="Unread Messages"
                        value={stats.unread_messages}
                        color="orange"
                        badge={stats.unread_messages > 0}
                    />
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
                                {assigned_tasks.length === 0 ? (
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
                                {projects.length === 0 ? (
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
                                {recent_messages.length === 0 ? (
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
        blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
        purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
        green: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
        orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 relative">
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
                                <a
                                    href={proof.file}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1.5 flex-shrink-0"
                                >
                                    <Eye className="w-4 h-4" />
                                    View
                                </a>
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
        </div>
    );
}
