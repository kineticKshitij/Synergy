import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { projectService } from '~/services/project.service';
import { removeTeamMember } from '~/services/team.service';
import { ProtectedRoute } from '~/components/ProtectedRoute';
import { TaskModal } from '~/components/TaskModal';
import { Navbar } from '~/components/Navbar';
import InviteTeamMemberModal from '~/components/InviteTeamMemberModal';
import { Eye, X, FileText, Send, MessageSquare, Activity } from 'lucide-react';

interface Project {
    id: number;
    name: string;
    description: string;
    status: string;
    priority: string;
    owner: {
        id: number;
        username: string;
        email: string;
    };
    team_members: any[];
    start_date: string | null;
    end_date: string | null;
    budget: string | null;
    progress: number;
    created_at: string;
    updated_at: string;
    task_count: number;
}

interface Task {
    id: number;
    title: string;
    description: string;
    status: string;
    priority: string;
    assigned_to: {
        id: number;
        username: string;
    } | null;
    due_date: string | null;
    created_at: string;
    has_attachments?: boolean;
}

function ProjectDetailsContent() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'team' | 'activity' | 'messages'>('overview');
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [showProofModal, setShowProofModal] = useState(false);
    const [selectedTaskForProof, setSelectedTaskForProof] = useState<Task | null>(null);
    const [taskProofs, setTaskProofs] = useState<any[]>([]);
    const [activities, setActivities] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');

    useEffect(() => {
        loadProject();
        loadTasks();
        loadActivities();
        loadMessages();
    }, [id]);

    const loadProject = async () => {
        try {
            const data = await projectService.getProject(Number(id));
            setProject(data);
        } catch (error) {
            console.error('Failed to load project:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadTasks = async () => {
        try {
            const data = await projectService.getTasks({ project: id });
            setTasks(data);
        } catch (error) {
            console.error('Failed to load tasks:', error);
        }
    };

    const loadActivities = async () => {
        try {
            const data = await projectService.getActivities({ project: id });
            setActivities(data);
        } catch (error) {
            console.error('Failed to load activities:', error);
        }
    };

    const loadMessages = async () => {
        try {
            const data = await projectService.getMessages({ project: id });
            setMessages(data);
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;
        
        try {
            await projectService.sendMessage(Number(id), newMessage);
            setNewMessage('');
            await loadMessages();
        } catch (error) {
            console.error('Failed to send message:', error);
            alert('Failed to send message');
        }
    };

    const handleCreateTask = async (taskData: any) => {
        try {
            await projectService.createTask(taskData);
            await loadTasks();
            await loadProject(); // Refresh project to update task count
            setIsTaskModalOpen(false);
        } catch (error) {
            console.error('Failed to create task:', error);
            throw error;
        }
    };

    const handleEditTask = async (taskData: any) => {
        if (!editingTask) return;
        try {
            await projectService.updateTask(editingTask.id, taskData);
            await loadTasks();
            await loadProject(); // Refresh project to update stats
            setEditingTask(null);
            setIsTaskModalOpen(false);
        } catch (error) {
            console.error('Failed to update task:', error);
            throw error;
        }
    };

    const handleDeleteTask = async (taskId: number) => {
        try {
            await projectService.deleteTask(taskId);
            await loadTasks();
            await loadProject(); // Refresh project to update task count
            setEditingTask(null);
            setIsTaskModalOpen(false);
        } catch (error) {
            console.error('Failed to delete task:', error);
            throw error;
        }
    };

    const handleMarkTaskComplete = async (taskId: number, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent opening the modal
        try {
            await projectService.updateTask(taskId, { 
                status: 'done'
            });
            await loadTasks();
            await loadProject();
        } catch (error) {
            console.error('Failed to mark task as complete:', error);
        }
    };

    const handleViewProof = async (task: Task, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent opening the task modal
        try {
            const attachments = await projectService.getTaskAttachments(task.id);
            setTaskProofs(attachments);
            setSelectedTaskForProof(task);
            setShowProofModal(true);
        } catch (error) {
            console.error('Failed to load proofs:', error);
            alert('Failed to load proof files');
        }
    };

    const handleRemoveMember = async (userId: number) => {
        if (!project) return;
        
        if (!confirm('Are you sure you want to remove this team member from the project?')) {
            return;
        }

        try {
            await removeTeamMember(project.id, userId);
            await loadProject(); // Refresh project to update team members
        } catch (error) {
            console.error('Failed to remove team member:', error);
            alert('Failed to remove team member. Please try again.');
        }
    };

    const handleMarkProjectComplete = async () => {
        if (!project) return;
        try {
            await projectService.updateProject(project.id, { 
                status: 'completed', 
                progress: 100
            });
            await loadProject();
        } catch (error) {
            console.error('Failed to mark project as complete:', error);
        }
    };

    const openTaskModal = (task?: Task) => {
        setEditingTask(task || null);
        setIsTaskModalOpen(true);
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            planning: { icon: '📋', label: 'Planning', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
            active: { icon: '🚀', label: 'Active', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
            on_hold: { icon: '⏸️', label: 'On Hold', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
            completed: { icon: '✅', label: 'Completed', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
            cancelled: { icon: '❌', label: 'Cancelled', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
            todo: { icon: '📝', label: 'To Do', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
            in_progress: { icon: '🔄', label: 'In Progress', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
            review: { icon: '👀', label: 'In Review', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
            done: { icon: '✅', label: 'Done', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
        };
        const badge = badges[status as keyof typeof badges] || badges.planning;
        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
                <span>{badge.icon}</span>
                {badge.label}
            </span>
        );
    };

    const getPriorityColor = (priority: string) => {
        const colors = {
            low: 'text-green-400',
            medium: 'text-yellow-400',
            high: 'text-orange-400',
            urgent: 'text-red-400',
        };
        return colors[priority as keyof typeof colors] || colors.medium;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 text-white">
                <Navbar />
                <div className="flex items-center justify-center pt-32">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-700 border-t-blue-500"></div>
                        <p className="mt-4 text-gray-400">Loading project...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="min-h-screen bg-gray-900 text-white">
                <Navbar />
                <div className="flex items-center justify-center pt-32">
                    <div className="text-center">
                        <div className="text-6xl mb-4">😕</div>
                        <h2 className="text-2xl font-bold mb-2">Project Not Found</h2>
                        <p className="text-gray-400 mb-6">The project you're looking for doesn't exist.</p>
                        <Link
                            to="/projects"
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors inline-block"
                        >
                            Back to Projects
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <Navbar />

            {/* Header */}
            <div className="border-b border-gray-800 pt-20">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between mb-4">
                        <Link
                            to="/projects"
                            className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                        >
                            ← Back to Projects
                        </Link>
                        <div className="flex gap-3">
                            {project.status !== 'completed' && (
                                <button
                                    onClick={handleMarkProjectComplete}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                                >
                                    ✅ Mark as Completed
                                </button>
                            )}
                            <button
                                onClick={() => navigate(`/projects/${id}/edit`)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                            >
                                ✏️ Edit
                            </button>
                            <button className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors">
                                🗑️ Delete
                            </button>
                        </div>
                    </div>

                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h1 className="text-4xl font-bold mb-3">{project.name}</h1>
                            <p className="text-gray-400 text-lg mb-4">{project.description}</p>
                            <div className="flex items-center gap-4">
                                {getStatusBadge(project.status)}
                                <span className={`font-medium ${getPriorityColor(project.priority)}`}>
                                    Priority: {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}
                                </span>
                                {project.budget && (
                                    <span className="text-green-400 font-medium">
                                        💰 ${parseFloat(project.budget).toLocaleString()}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-6">
                        <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-gray-400">Overall Progress</span>
                            <span className="text-blue-400 font-semibold">{project.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-3">
                            <div
                                className="bg-blue-500 h-3 rounded-full transition-all"
                                style={{ width: `${project.progress}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex gap-8">
                        {['overview', 'tasks', 'team', 'activity', 'messages'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`py-4 px-2 border-b-2 transition-colors ${activeTab === tab
                                    ? 'border-blue-500 text-white'
                                    : 'border-transparent text-gray-400 hover:text-white'
                                    }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Project Info */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                                <h3 className="text-xl font-semibold mb-4">Project Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-gray-400 text-sm mb-1">Owner</p>
                                        <p className="font-medium">{project.owner.username}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-sm mb-1">Team Members</p>
                                        <p className="font-medium">{project.team_members.length + 1}</p>
                                    </div>
                                    {project.start_date && (
                                        <div>
                                            <p className="text-gray-400 text-sm mb-1">Start Date</p>
                                            <p className="font-medium">{new Date(project.start_date).toLocaleDateString()}</p>
                                        </div>
                                    )}
                                    {project.end_date && (
                                        <div>
                                            <p className="text-gray-400 text-sm mb-1">End Date</p>
                                            <p className="font-medium">{new Date(project.end_date).toLocaleDateString()}</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-gray-400 text-sm mb-1">Created</p>
                                        <p className="font-medium">{new Date(project.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-sm mb-1">Last Updated</p>
                                        <p className="font-medium">{new Date(project.updated_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="space-y-6">
                            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                                <h3 className="text-xl font-semibold mb-4">Statistics</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Total Tasks</span>
                                        <span className="text-2xl font-bold">{tasks.length}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Completed</span>
                                        <span className="text-2xl font-bold text-green-400">
                                            {tasks.filter(t => t.status === 'done').length}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">In Progress</span>
                                        <span className="text-2xl font-bold text-blue-400">
                                            {tasks.filter(t => t.status === 'in_progress').length}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">To Do</span>
                                        <span className="text-2xl font-bold text-gray-400">
                                            {tasks.filter(t => t.status === 'todo').length}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'tasks' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Tasks</h2>
                            <button
                                onClick={() => openTaskModal()}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
                            >
                                ➕ New Task
                            </button>
                        </div>

                        {tasks.length === 0 ? (
                            <div className="text-center py-12 bg-gray-800/50 border border-gray-700 rounded-lg">
                                <div className="text-6xl mb-4">📋</div>
                                <h3 className="text-xl font-semibold mb-2">No tasks yet</h3>
                                <p className="text-gray-400 mb-6">Get started by creating your first task</p>
                                <button
                                    onClick={() => openTaskModal()}
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
                                >
                                    Create Task
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {tasks.map((task) => (
                                    <div
                                        key={task.id}
                                        onClick={() => openTaskModal(task)}
                                        className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-blue-500/50 transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h4 className="text-lg font-semibold">{task.title}</h4>
                                                    {getStatusBadge(task.status)}
                                                </div>
                                                {task.description && (
                                                    <p className="text-gray-400 text-sm mb-3">{task.description}</p>
                                                )}
                                                <div className="flex items-center gap-4 text-sm">
                                                    {task.assigned_to && (
                                                        <span className="text-gray-400">
                                                            👤 {task.assigned_to.username}
                                                        </span>
                                                    )}
                                                    {task.due_date && (
                                                        <span className="text-gray-400">
                                                            📅 {new Date(task.due_date).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                    <span className={`${getPriorityColor(task.priority)}`}>
                                                        {task.priority.toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="ml-4 flex items-center gap-2">
                                                {task.has_attachments && (
                                                    <button
                                                        onClick={(e) => handleViewProof(task, e)}
                                                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors flex items-center gap-1"
                                                        title="View proof files"
                                                    >
                                                        <Eye className="w-3 h-3" />
                                                        View Proof
                                                    </button>
                                                )}
                                                {task.status !== 'done' && (
                                                    <button
                                                        onClick={(e) => handleMarkTaskComplete(task.id, e)}
                                                        className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm transition-colors"
                                                        title="Mark as done"
                                                    >
                                                        ✓ Done
                                                    </button>
                                                )}
                                                <button
                                                    className="text-gray-400 hover:text-white transition-colors"
                                                    title="Edit task"
                                                >
                                                    ✏️
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'team' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Team Members</h2>
                            <button 
                                onClick={() => setIsInviteModalOpen(true)}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
                            >
                                ➕ Add Member
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Owner */}
                            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-xl font-bold">
                                        {project.owner.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-semibold">{project.owner.username}</p>
                                        <p className="text-sm text-gray-400">{project.owner.email}</p>
                                        <span className="inline-block mt-1 px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                                            Owner
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Team Members */}
                            {project.team_members.map((member: any) => (
                                <div key={member.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-xl font-bold">
                                                {member.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold">{member.username}</p>
                                                <p className="text-sm text-gray-400">{member.email}</p>
                                                <span className="inline-block mt-1 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                                                    Member
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveMember(member.id)}
                                            className="ml-2 p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                                            title="Remove member"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'activity' && (
                    <div>
                        <h2 className="text-2xl font-bold mb-6">Activity Timeline</h2>
                        {activities.length === 0 ? (
                            <div className="text-center py-12 bg-gray-800/50 border border-gray-700 rounded-lg">
                                <Activity className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold mb-2">No activities yet</h3>
                                <p className="text-gray-400">Project activities will appear here</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {activities.map((activity) => (
                                    <div key={activity.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                                        <div className="flex items-start gap-4">
                                            <div className="p-2 bg-blue-600/20 rounded-lg">
                                                <Activity className="w-5 h-5 text-blue-400" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium text-white">
                                                        {activity.user?.username || 'System'}
                                                    </span>
                                                    <span className="text-sm text-gray-500">
                                                        {new Date(activity.created_at).toLocaleString()}
                                                    </span>
                                                </div>
                                                <p className="text-gray-300 mb-1">{activity.action}</p>
                                                <p className="text-gray-400 text-sm">{activity.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'messages' && (
                    <div>
                        <h2 className="text-2xl font-bold mb-6">Team Communication</h2>
                        <div className="bg-gray-800/50 border border-gray-700 rounded-lg">
                            {/* Messages List */}
                            <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
                                {messages.length === 0 ? (
                                    <div className="text-center py-12">
                                        <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                        <h3 className="text-xl font-semibold mb-2">No messages yet</h3>
                                        <p className="text-gray-400">Start the conversation with your team</p>
                                    </div>
                                ) : (
                                    messages.map((msg) => (
                                        <div key={msg.id} className="flex gap-3">
                                            <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                                                {msg.sender.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium text-white">{msg.sender.username}</span>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(msg.created_at).toLocaleString()}
                                                    </span>
                                                </div>
                                                <p className="text-gray-300">{msg.message}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            
                            {/* Message Input */}
                            <div className="border-t border-gray-700 p-4">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder="Type your message..."
                                        className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!newMessage.trim()}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        <Send className="w-4 h-4" />
                                        Send
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Task Modal */}
            <TaskModal
                isOpen={isTaskModalOpen}
                onClose={() => {
                    setIsTaskModalOpen(false);
                    setEditingTask(null);
                }}
                onSubmit={editingTask ? handleEditTask : handleCreateTask}
                onDelete={editingTask ? handleDeleteTask : undefined}
                projectId={Number(id)}
                task={editingTask}
                teamMembers={project?.team_members || []}
            />

            {/* Invite Team Member Modal */}
            {project && (
                <InviteTeamMemberModal
                    projectId={project.id}
                    projectName={project.name}
                    isOpen={isInviteModalOpen}
                    onClose={() => setIsInviteModalOpen(false)}
                    onSuccess={() => {
                        loadProject(); // Refresh project data to show new team member
                        setIsInviteModalOpen(false);
                    }}
                />
            )}

            {/* View Proof Modal */}
            {showProofModal && selectedTaskForProof && (
                <ViewProofModal
                    task={selectedTaskForProof}
                    proofs={taskProofs}
                    onClose={() => {
                        setShowProofModal(false);
                        setSelectedTaskForProof(null);
                        setTaskProofs([]);
                    }}
                />
            )}
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
            <div className="bg-gray-800 rounded-lg max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-white">
                        Proof of Completion
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <p className="text-sm text-gray-400 mb-6">
                    Task: <span className="font-medium text-white">{task.title}</span>
                </p>

                {proofs.length === 0 ? (
                    <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500">
                            No proof files uploaded yet
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {proofs.map((proof: any) => (
                            <div
                                key={proof.id}
                                className="flex items-center gap-3 p-4 border border-gray-700 rounded-lg hover:bg-gray-700/50 transition-colors"
                            >
                                <span className="text-2xl flex-shrink-0">
                                    {getFileIcon(proof.file_type)}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">
                                        {proof.file_name}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        Uploaded {formatDate(proof.uploaded_at)}
                                    </p>
                                    {proof.description && (
                                        <p className="text-xs text-gray-500 mt-1">
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
                        className="px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ProjectDetails() {
    return (
        <ProtectedRoute>
            <ProjectDetailsContent />
        </ProtectedRoute>
    );
}
