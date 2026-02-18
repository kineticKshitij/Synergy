import { useState, useMemo, useEffect } from 'react';
import { 
    Plus, 
    Calendar, 
    TrendingDown, 
    CheckCircle2, 
    Clock, 
    Target,
    Users,
    Play,
    Pause,
    Flag,
    Edit2,
    Trash2,
    ChevronDown,
    ChevronUp,
    Loader2
} from 'lucide-react';

interface Task {
    id: number;
    title: string;
    status: string;
    priority: string;
    story_points?: number;
    assigned_to?: { id: number; username: string };
    sprint?: number;
}

interface Sprint {
    id: number;
    project: number;
    name: string;
    goal: string;
    start_date: string;
    end_date: string;
    status: 'planning' | 'active' | 'completed';
    total_points: number;
    completed_points: number;
    completion_percentage: number;
    task_count: number;
    completed_task_count: number;
    created_at: string;
    updated_at: string;
    completed_at?: string;
}

interface SprintPlanningBoardProps {
    projectId: number;
    tasks: Task[];
    onTaskUpdate: (taskId: number, updates: any) => Promise<void>;
    onOpenTask: (task: Task) => void;
}

export default function SprintPlanningBoard({ 
    projectId, 
    tasks, 
    onTaskUpdate,
    onOpenTask 
}: SprintPlanningBoardProps) {
    const [sprints, setSprints] = useState<Sprint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateSprint, setShowCreateSprint] = useState(false);
    const [selectedSprintId, setSelectedSprintId] = useState<number | null>(null);
    const [expandedSprints, setExpandedSprints] = useState<Set<number>>(new Set());
    const [newSprint, setNewSprint] = useState({
        name: '',
        goal: '',
        start_date: '',
        end_date: '',
    });

    // Fetch sprints on mount
    useEffect(() => {
        fetchSprints();
    }, [projectId]);

    // Set active sprint as selected by default
    useEffect(() => {
        const activeSprint = sprints.find(s => s.status === 'active');
        if (activeSprint && !selectedSprintId) {
            setSelectedSprintId(activeSprint.id);
            setExpandedSprints(new Set([activeSprint.id]));
        }
    }, [sprints]);

    const fetchSprints = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`http://localhost/api/sprints/?project=${projectId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setSprints(data);
            } else {
                setError('Failed to load sprints');
            }
        } catch (err) {
            console.error('Error fetching sprints:', err);
            setError('Failed to load sprints');
        } finally {
            setLoading(false);
        }
    };

    const activeSprint = sprints.find(s => s.status === 'active');
    const backlogTasks = tasks.filter(t => !t.sprint);

    const getSprintTasks = (sprintId: number) => {
        return tasks.filter(t => t.sprint === sprintId);
    };

    const getSprintStats = (sprintId: number) => {
        const sprint = sprints.find(s => s.id === sprintId);
        if (sprint) {
            return {
                totalPoints: sprint.total_points,
                completedPoints: sprint.completed_points,
                totalTasks: sprint.task_count,
                completedTasks: sprint.completed_task_count,
                velocity: sprint.completed_points,
                completion: sprint.completion_percentage,
            };
        }
        
        // Fallback to calculating from tasks
        const sprintTasks = getSprintTasks(sprintId);
        const totalPoints = sprintTasks.reduce((sum, t) => sum + (t.story_points || 0), 0);
        const completedPoints = sprintTasks
            .filter(t => t.status === 'done')
            .reduce((sum, t) => sum + (t.story_points || 0), 0);
        const totalTasks = sprintTasks.length;
        const completedTasks = sprintTasks.filter(t => t.status === 'done').length;

        return {
            totalPoints,
            completedPoints,
            totalTasks,
            completedTasks,
            velocity: completedPoints,
            completion: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        };
    };

    const handleCreateSprint = async () => {
        if (!newSprint.name || !newSprint.start_date || !newSprint.end_date) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch('http://localhost/api/sprints/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    project: projectId,
                    ...newSprint,
                }),
            });

            if (response.ok) {
                const sprint = await response.json();
                setSprints([...sprints, sprint]);
                setNewSprint({ name: '', goal: '', start_date: '', end_date: '' });
                setShowCreateSprint(false);
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Failed to create sprint');
            }
        } catch (err) {
            console.error('Error creating sprint:', err);
            alert('Failed to create sprint');
        }
    };

    const handleStartSprint = async (sprintId: number) => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`http://localhost/api/sprints/${sprintId}/start_sprint/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const updatedSprint = await response.json();
                setSprints(sprints.map(s => 
                    s.id === sprintId ? updatedSprint : s
                ));
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Failed to start sprint');
            }
        } catch (err) {
            console.error('Error starting sprint:', err);
            alert('Failed to start sprint');
        }
    };

    const handleCompleteSprint = async (sprintId: number) => {
        if (!confirm('Complete this sprint? Incomplete tasks will be moved to backlog.')) {
            return;
        }

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`http://localhost/api/sprints/${sprintId}/complete_sprint/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const updatedSprint = await response.json();
                setSprints(sprints.map(s => 
                    s.id === sprintId ? updatedSprint : s
                ));
                // Refresh tasks to reflect backlog changes
                window.location.reload();
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Failed to complete sprint');
            }
        } catch (err) {
            console.error('Error completing sprint:', err);
            alert('Failed to complete sprint');
        }
    };

    const handleDeleteSprint = async (sprintId: number) => {
        if (!confirm('Are you sure you want to delete this sprint? Tasks will be moved to backlog.')) {
            return;
        }

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`http://localhost/api/sprints/${sprintId}/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                setSprints(sprints.filter(s => s.id !== sprintId));
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Failed to delete sprint');
            }
        } catch (err) {
            console.error('Error deleting sprint:', err);
            alert('Failed to delete sprint');
        }
    };

    const toggleSprintExpand = (sprintId: number) => {
        const newExpanded = new Set(expandedSprints);
        if (newExpanded.has(sprintId)) {
            newExpanded.delete(sprintId);
        } else {
            newExpanded.add(sprintId);
        }
        setExpandedSprints(newExpanded);
    };

    const handleAddTaskToSprint = async (taskId: number, sprintId: number) => {
        await onTaskUpdate(taskId, { sprint: sprintId });
        await fetchSprints(); // Refresh to update stats
    };

    const handleRemoveTaskFromSprint = async (taskId: number) => {
        await onTaskUpdate(taskId, { sprint: null });
        await fetchSprints(); // Refresh to update stats
    };

    const getStatusColor = (status: string) => {
        const colors = {
            todo: 'bg-gray-500',
            in_progress: 'bg-blue-500',
            review: 'bg-yellow-500',
            done: 'bg-green-500',
        };
        return colors[status as keyof typeof colors] || 'bg-gray-500';
    };

    const getPriorityColor = (priority: string) => {
        const colors = {
            low: 'text-green-400',
            medium: 'text-yellow-400',
            high: 'text-orange-400',
            urgent: 'text-red-400',
        };
        return colors[priority as keyof typeof colors] || 'text-gray-400';
    };

    const getSprintStatusBadge = (status: Sprint['status']) => {
        const badges = {
            planning: { label: 'Planning', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
            active: { label: 'Active', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
            completed: { label: 'Completed', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
        };
        const badge = badges[status];
        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
                {badge.label}
            </span>
        );
    };

    const renderTaskCard = (task: Task, inSprint: boolean = false) => (
        <div
            key={task.id}
            onClick={() => onOpenTask(task)}
            className="bg-gray-800 border border-gray-700 rounded-lg p-3 hover:border-blue-500/50 transition-colors cursor-pointer group"
        >
            <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-medium text-white text-sm flex-1 group-hover:text-blue-400 transition-colors">
                    {task.title}
                </h4>
                {task.story_points !== undefined && (
                    <span className="bg-blue-600/20 text-blue-400 text-xs font-bold px-2 py-1 rounded border border-blue-600/30">
                        {task.story_points} SP
                    </span>
                )}
            </div>
            <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${getStatusColor(task.status)}`} />
                    <span className="text-gray-400 capitalize">{task.status.replace('_', ' ')}</span>
                    <span className={getPriorityColor(task.priority)}>{task.priority.toUpperCase()}</span>
                </div>
                {task.assigned_to && (
                    <span className="text-gray-400">👤 {task.assigned_to.username}</span>
                )}
            </div>
        </div>
    );

    const renderBurndownChart = (sprintId: number) => {
        const sprint = sprints.find(s => s.id === sprintId);
        if (!sprint) return null;

        const stats = getSprintStats(sprintId);
        const startDate = new Date(sprint.start_date);
        const endDate = new Date(sprint.end_date);
        const today = new Date();
        
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const daysElapsed = Math.max(0, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
        const daysRemaining = Math.max(0, totalDays - daysElapsed);

        // Ideal burndown line
        const idealPoints = Array.from({ length: totalDays + 1 }, (_, i) => {
            return stats.totalPoints * (1 - i / totalDays);
        });

        // Actual burndown (simplified - in production, track daily)
        const actualPoints = Array.from({ length: totalDays + 1 }, (_, i) => {
            if (i <= daysElapsed) {
                return stats.totalPoints - (stats.completedPoints * (i / Math.max(daysElapsed, 1)));
            }
            return null;
        });

        const maxPoints = stats.totalPoints;
        const chartHeight = 150;

        return (
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <TrendingDown className="w-4 h-4" />
                    Burndown Chart
                </h4>
                <div className="relative" style={{ height: chartHeight }}>
                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-400">
                        <span>{maxPoints} SP</span>
                        <span>{Math.round(maxPoints / 2)} SP</span>
                        <span>0 SP</span>
                    </div>
                    
                    {/* Chart area */}
                    <div className="ml-12 h-full border-l border-b border-gray-700 relative">
                        {/* Grid lines */}
                        <div className="absolute inset-0">
                            <div className="absolute top-0 w-full border-t border-gray-800" />
                            <div className="absolute top-1/2 w-full border-t border-gray-800" />
                            <div className="absolute bottom-0 w-full border-t border-gray-800" />
                        </div>

                        {/* Ideal line */}
                        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                            <polyline
                                points={idealPoints.map((p, i) => 
                                    `${(i / totalDays) * 100}%,${((maxPoints - p) / maxPoints) * 100}%`
                                ).join(' ')}
                                fill="none"
                                stroke="#6b7280"
                                strokeWidth="2"
                                strokeDasharray="5,5"
                                vectorEffect="non-scaling-stroke"
                            />
                        </svg>

                        {/* Actual line */}
                        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                            <polyline
                                points={actualPoints
                                    .map((p, i) => 
                                        p !== null ? `${(i / totalDays) * 100}%,${((maxPoints - p) / maxPoints) * 100}%` : null
                                    )
                                    .filter(p => p !== null)
                                    .join(' ')}
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="3"
                                vectorEffect="non-scaling-stroke"
                            />
                        </svg>

                        {/* X-axis labels */}
                        <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-xs text-gray-400">
                            <span>Day 0</span>
                            <span>Day {Math.floor(totalDays / 2)}</span>
                            <span>Day {totalDays}</span>
                        </div>
                    </div>
                </div>
                <div className="mt-6 flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-0.5 bg-gray-500 border-dashed border-t-2" />
                        <span className="text-gray-400">Ideal</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-0.5 bg-blue-500" />
                        <span className="text-gray-400">Actual</span>
                    </div>
                    <div className="ml-auto text-gray-400">
                        {daysRemaining} days remaining
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-red-600 dark:text-red-400 mb-4">
                    {error}
                </p>
                <button
                    onClick={fetchSprints}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Sprint Planning</h2>
                    <p className="text-gray-400 text-sm mt-1">
                        Organize your work into sprints and track velocity
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateSprint(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    New Sprint
                </button>
            </div>

            {/* Active Sprint Overview */}
            {activeSprint && (
                <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-500/30 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <Play className="w-5 h-5 text-green-400" />
                                <h3 className="text-xl font-bold text-white">{activeSprint.name}</h3>
                                {getSprintStatusBadge(activeSprint.status)}
                            </div>
                            <p className="text-gray-300 mb-3">{activeSprint.goal}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(activeSprint.start_date).toLocaleDateString()} - {new Date(activeSprint.end_date).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => handleCompleteSprint(activeSprint.id)}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                            <Flag className="w-4 h-4" />
                            Complete Sprint
                        </button>
                    </div>

                    {/* Sprint Stats */}
                    {(() => {
                        const stats = getSprintStats(activeSprint.id);
                        return (
                            <div className="grid grid-cols-4 gap-4">
                                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-3">
                                    <div className="text-gray-400 text-xs mb-1">Total Points</div>
                                    <div className="text-2xl font-bold text-white">{stats.totalPoints}</div>
                                </div>
                                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-3">
                                    <div className="text-gray-400 text-xs mb-1">Completed</div>
                                    <div className="text-2xl font-bold text-green-400">{stats.completedPoints}</div>
                                </div>
                                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-3">
                                    <div className="text-gray-400 text-xs mb-1">Tasks</div>
                                    <div className="text-2xl font-bold text-white">{stats.completedTasks}/{stats.totalTasks}</div>
                                </div>
                                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-3">
                                    <div className="text-gray-400 text-xs mb-1">Completion</div>
                                    <div className="text-2xl font-bold text-blue-400">{stats.completion.toFixed(0)}%</div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Burndown Chart */}
                    <div className="mt-4">
                        {renderBurndownChart(activeSprint.id)}
                    </div>
                </div>
            )}

            {/* Sprints List */}
            <div className="space-y-4">
                {sprints
                    .filter(s => s.status !== 'active')
                    .sort((a, b) => {
                        if (a.status === 'planning' && b.status !== 'planning') return -1;
                        if (a.status !== 'planning' && b.status === 'planning') return 1;
                        return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
                    })
                    .map(sprint => {
                        const isExpanded = expandedSprints.has(sprint.id);
                        const stats = getSprintStats(sprint.id);
                        const sprintTasks = getSprintTasks(sprint.id);

                        return (
                            <div key={sprint.id} className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
                                <div className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <button
                                                    onClick={() => toggleSprintExpand(sprint.id)}
                                                    className="text-gray-400 hover:text-white transition-colors"
                                                >
                                                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                                </button>
                                                <h3 className="text-lg font-bold text-white">{sprint.name}</h3>
                                                {getSprintStatusBadge(sprint.status)}
                                                <span className="text-sm text-gray-400">
                                                    {stats.totalPoints} SP • {stats.totalTasks} tasks
                                                </span>
                                            </div>
                                            <p className="text-gray-400 text-sm ml-11">{sprint.goal}</p>
                                            <div className="flex items-center gap-4 text-sm text-gray-400 ml-11 mt-2">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    {new Date(sprint.start_date).toLocaleDateString()} - {new Date(sprint.end_date).toLocaleDateString()}
                                                </span>
                                                {sprint.status === 'completed' && (
                                                    <span className="text-green-400">Velocity: {stats.completedPoints} SP</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {sprint.status === 'planning' && (
                                                <button
                                                    onClick={() => handleStartSprint(sprint.id)}
                                                    className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm transition-colors flex items-center gap-1"
                                                >
                                                    <Play className="w-3 h-3" />
                                                    Start Sprint
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDeleteSprint(sprint.id)}
                                                className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                                                title="Delete sprint"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    {stats.totalPoints > 0 && (
                                        <div className="ml-11 mt-3">
                                            <div className="bg-gray-700 rounded-full h-2">
                                                <div
                                                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                                                    style={{ width: `${(stats.completedPoints / stats.totalPoints) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Sprint Tasks (Expanded) */}
                                {isExpanded && (
                                    <div className="border-t border-gray-700 p-4 bg-gray-900/30">
                                        {sprintTasks.length === 0 ? (
                                            <p className="text-gray-500 text-sm text-center py-8">
                                                No tasks in this sprint. Drag tasks from the backlog.
                                            </p>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {sprintTasks.map(task => renderTaskCard(task, true))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
            </div>

            {/* Backlog */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
                <div className="p-4 bg-gray-900/50 border-b border-gray-700">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        Product Backlog
                        <span className="text-sm text-gray-400 font-normal ml-2">
                            {backlogTasks.length} tasks
                        </span>
                    </h3>
                </div>
                <div className="p-4">
                    {backlogTasks.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-8">
                            All tasks are assigned to sprints!
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {backlogTasks.map(task => renderTaskCard(task, false))}
                        </div>
                    )}
                </div>
            </div>

            {/* Create Sprint Modal */}
            {showCreateSprint && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-white mb-4">Create New Sprint</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Sprint Name *
                                </label>
                                <input
                                    type="text"
                                    value={newSprint.name}
                                    onChange={(e) => setNewSprint({ ...newSprint, name: e.target.value })}
                                    placeholder="Sprint 3"
                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Sprint Goal
                                </label>
                                <textarea
                                    value={newSprint.goal}
                                    onChange={(e) => setNewSprint({ ...newSprint, goal: e.target.value })}
                                    placeholder="What do you want to achieve?"
                                    rows={3}
                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 resize-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Start Date *
                                    </label>
                                    <input
                                        type="date"
                                        value={newSprint.start_date}
                                        onChange={(e) => setNewSprint({ ...newSprint, start_date: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        End Date *
                                    </label>
                                    <input
                                        type="date"
                                        value={newSprint.end_date}
                                        onChange={(e) => setNewSprint({ ...newSprint, end_date: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowCreateSprint(false)}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateSprint}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white"
                            >
                                Create Sprint
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
