import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { projectService } from '~/services/project.service';
import { ProtectedRoute } from '~/components/ProtectedRoute';
import { TaskModal } from '~/components/TaskModal';
import { Navbar } from '~/components/Navbar';
import InviteTeamMemberModal from '~/components/InviteTeamMemberModal';

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
}

function ProjectDetailsContent() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'team' | 'activity'>('overview');
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

    useEffect(() => {
        loadProject();
        loadTasks();
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
                        {['overview', 'tasks', 'team', 'activity'].map((tab) => (
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
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'activity' && (
                    <div>
                        <h2 className="text-2xl font-bold mb-6">Activity Timeline</h2>
                        <div className="text-center py-12 bg-gray-800/50 border border-gray-700 rounded-lg">
                            <div className="text-6xl mb-4">📊</div>
                            <h3 className="text-xl font-semibold mb-2">Activity timeline coming soon</h3>
                            <p className="text-gray-400">Track all project activities and changes here</p>
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
