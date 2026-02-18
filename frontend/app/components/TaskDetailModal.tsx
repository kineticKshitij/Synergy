import { useState, useEffect } from 'react';
import { X, Clock, Paperclip, Link as LinkIcon, CheckSquare, Save, Trash2 } from 'lucide-react';
import { AIDueDateSuggestion } from './AIDueDateSuggestion';
import SubtaskList from './SubtaskList';
import TimeTracker from './TimeTracker';
import FileUpload from './FileUpload';

interface TaskDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (taskData: any) => void;
    onUpdate?: (taskId: number, taskData: any) => Promise<void>;
    onDelete?: (taskId: number) => void;
    projectId: number;
    task?: any;
    teamMembers?: any[];
    availableTasks?: any[]; // For dependencies
}

export default function TaskDetailModal({
    isOpen,
    onClose,
    onSubmit,
    onUpdate,
    onDelete,
    projectId,
    task,
    teamMembers = [],
    availableTasks = []
}: TaskDetailModalProps) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        due_date: '',
        estimated_hours: '',
        impact: '',
        assigned_to_id: '',
        assigned_to_multiple_ids: [] as string[],
        depends_on: [] as number[],
    });
    const [loading, setLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'checklist' | 'time' | 'files' | 'dependencies'>('details');
    
    // Subtasks state
    const [subtasks, setSubtasks] = useState(task?.subtasks || []);
    const [subtaskProgress, setSubtaskProgress] = useState(task?.subtask_progress || { total: 0, completed: 0, percentage: 0 });
    
    // Time tracking state
    const [timeLogs, setTimeLogs] = useState(task?.time_logs || []);
    const [activeTimer, setActiveTimer] = useState(task?.active_timer || null);

    // File attachments state
    const [attachments, setAttachments] = useState([]);

    const API_BASE_URL = 'http://localhost/api';

    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title || '',
                description: task.description || '',
                status: task.status || 'todo',
                priority: task.priority || 'medium',
                due_date: task.due_date || '',
                estimated_hours: task.estimated_hours || '',
                impact: task.impact || '',
                assigned_to_id: task.assigned_to?.id || '',
                assigned_to_multiple_ids: task.assigned_to_multiple?.map((m: any) => m.id.toString()) || [],
                depends_on: task.depends_on || [],
            });
            setSubtasks(task.subtasks || []);
            setSubtaskProgress(task.subtask_progress || { total: 0, completed:0, percentage: 0 });
            setTimeLogs(task.time_logs || []);
            setActiveTimer(task.active_timer || null);
            
            // Fetch attachments if task exists
            if (task.id) {
                fetchAttachments(task.id);
            }
        }
    }, [task, isOpen]);

    const fetchAttachments = async (taskId: number) => {
        try {
            const token = sessionStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/attachments/?task=${taskId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setAttachments(data);
            }
        } catch (error) {
            console.error('Failed to fetch attachments:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const taskData = {
                ...formData,
                project: projectId,
                estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
                impact: formData.impact ? parseFloat(formData.impact) : 0,
                assigned_to_id: formData.assigned_to_id ? parseInt(formData.assigned_to_id) : null,
                assigned_to_multiple_ids: formData.assigned_to_multiple_ids.map(id => parseInt(id)),
                depends_on: formData.depends_on,
            };
            
            if (task && onUpdate) {
                await onUpdate(task.id, taskData);
            } else {
                await onSubmit(taskData);
            }
            onClose();
        } catch (error) {
            console.error('Failed to save task:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!task || !onDelete) return;
        setLoading(true);
        try {
            await onDelete(task.id);
            setShowDeleteConfirm(false);
            onClose();
        } catch (error) {
            console.error('Failed to delete task:', error);
        } finally {
            setLoading(false);
        }
    };

    // Subtask operations
    const handleCreateSubtask = async (title: string) => {
        if (!task) return;
        try {
            const token = sessionStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/subtasks/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    task: task.id,
                    title,
                    order: subtasks.length,
                }),
            });
            if (response.ok) {
                const newSubtask = await response.json();
                setSubtasks([...subtasks, newSubtask]);
                setSubtaskProgress({
                    ...subtaskProgress,
                    total: subtaskProgress.total + 1,
                });
            }
        } catch (error) {
            console.error('Failed to create subtask:', error);
        }
    };

    const handleToggleSubtask = async (subtaskId: number) => {
        try {
            const token = sessionStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/subtasks/${subtaskId}/toggle_complete/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const updatedSubtask = await response.json();
                setSubtasks(subtasks.map(s => s.id === subtaskId ? updatedSubtask : s));
                
                // Recalculate progress
                const completed = subtasks.filter(s => 
                    s.id === subtaskId ? updatedSubtask.is_completed : s.is_completed
                ).length;
                setSubtaskProgress({
                    total: subtasks.length,
                    completed,
                    percentage: Math.round((completed / subtasks.length) * 100),
                });
            }
        } catch (error) {
            console.error('Failed to toggle subtask:', error);
        }
    };

    const handleDeleteSubtask = async (subtaskId: number) => {
        try {
            const token = sessionStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/subtasks/${subtaskId}/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const updatedSubtasks = subtasks.filter(s => s.id !== subtaskId);
                setSubtasks(updatedSubtasks);
                const completed = updatedSubtasks.filter(s => s.is_completed).length;
                setSubtaskProgress({
                    total: updatedSubtasks.length,
                    completed,
                    percentage: updatedSubtasks.length > 0 ? Math.round((completed / updatedSubtasks.length) * 100) : 0,
                });
            }
        } catch (error) {
            console.error('Failed to delete subtask:', error);
        }
    };

    const handleReorderSubtasks = async (reorderedSubtasks: any[]) => {
        try {
            const token = sessionStorage.getItem('access_token');
            await fetch(`${API_BASE_URL}/subtasks/reorder/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    orders: reorderedSubtasks.map(s => ({ id: s.id, order: s.order })),
                }),
            });
            setSubtasks(reorderedSubtasks);
        } catch (error) {
            console.error('Failed to reorder subtasks:', error);
        }
    };

    // Time tracking operations
    const handleStartTimer = async () => {
        if (!task) return;
        try {
            const token = sessionStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/time-tracking/start_timer/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ task_id: task.id }),
            });
            if (response.ok) {
                const data = await response.json();
                setActiveTimer(data.active_timer);
            }
        } catch (error) {
            console.error('Failed to start timer:', error);
        }
    };

    const handleStopTimer = async (note: string) => {
        if (!task) return;
        try {
            const token = sessionStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/time-tracking/stop_timer/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ task_id: task.id, note }),
            });
            if (response.ok) {
                const data = await response.json();
                setActiveTimer(null);
                setTimeLogs(data.time_logs);
            }
        } catch (error) {
            console.error('Failed to stop timer:', error);
        }
    };

    const handleLogTime = async (hours: number, note: string) => {
        if (!task) return;
        try {
            const token = sessionStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/time-tracking/log_time/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ task_id: task.id, hours, note }),
            });
            if (response.ok) {
                const data = await response.json();
                setTimeLogs(data.time_logs);
            }
        } catch (error) {
            console.error('Failed to log time:', error);
        }
    };

    if (!isOpen) return null;

    const isEditMode = !!task;
    const dependentTasks = availableTasks.filter(t => formData.depends_on.includes(t.id));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-5xl w-full max-h-[90vh] mx-4 overflow-hidden shadow-2xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {isEditMode ? 'Task Details' : 'Create New Task'}
                        </h2>
                        {task && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {task.project?.name} • #{task.id}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                {/* Tabs - Only show when editing existing task */}
                {isEditMode && (
                    <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-6">
                        <button
                            onClick={() => setActiveTab('details')}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === 'details'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                            }`}
                        >
                            Details
                        </button>
                        <button
                            onClick={() => setActiveTab('checklist')}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                                activeTab === 'checklist'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                            }`}
                        >
                            <CheckSquare className="w-4 h-4" />
                            Checklist
                            {subtaskProgress.total > 0 && (
                                <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                                    {subtaskProgress.completed}/{subtaskProgress.total}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('time')}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                                activeTab === 'time'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                            }`}
                        >
                            <Clock className="w-4 h-4" />
                            Time Tracking
                        </button>
                        <button
                            onClick={() => setActiveTab('files')}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                                activeTab === 'files'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                            }`}
                        >
                            <Paperclip className="w-4 h-4" />
                            Files
                            {attachments.length > 0 && (
                                <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                                    {attachments.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('dependencies')}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                                activeTab === 'dependencies'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                            }`}
                        >
                            <LinkIcon className="w-4 h-4" />
                            Dependencies
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'details' && (
                        <form onSubmit={handleSubmit} className="space-y-6" id="task-form">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Task Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 dark:text-white"
                                    placeholder="Enter task title..."
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={4}
                                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-gray-900 dark:text-white"
                                    placeholder="Describe the task..."
                                />
                            </div>

                            {/* Team Members Assignment */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Assign To Team Members
                                </label>
                                <div className="space-y-2 max-h-48 overflow-y-auto bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3">
                                    {teamMembers.length === 0 ? (
                                        <p className="text-gray-500 dark:text-gray-400 text-sm">No team members available</p>
                                    ) : (
                                        teamMembers.map((member) => {
                                            const memberId = member.id.toString();
                                            const isSelected = formData.assigned_to_multiple_ids?.includes(memberId) || false;
                                            
                                            return (
                                                <label
                                                    key={member.id}
                                                    className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer transition-colors"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={(e) => {
                                                            const currentIds = formData.assigned_to_multiple_ids || [];
                                                            let newIds;
                                                            
                                                            if (e.target.checked) {
                                                                newIds = [...currentIds, memberId];
                                                            } else {
                                                                newIds = currentIds.filter(id => id !== memberId);
                                                            }
                                                            
                                                            setFormData({ 
                                                                ...formData, 
                                                                assigned_to_multiple_ids: newIds 
                                                            });
                                                        }}
                                                        className="w-4 h-4 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                                                    />
                                                    <span className="text-gray-900 dark:text-white text-sm">
                                                        {member.first_name && member.last_name 
                                                            ? `${member.first_name} ${member.last_name} (${member.username})`
                                                            : member.username}
                                                        {member.email && (
                                                            <span className="text-gray-500 dark:text-gray-400 text-xs ml-2">{member.email}</span>
                                                        )}
                                                    </span>
                                                </label>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Status and Priority */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Status
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 dark:text-white"
                                    >
                                        <option value="todo">To Do</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="review">In Review</option>
                                        <option value="done">Done</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Priority
                                    </label>
                                    <select
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 dark:text-white"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                            </div>

                            {/* Due Date and Estimated Hours */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Due Date
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.due_date}
                                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Estimated Hours
                                    </label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        min="0"
                                        value={formData.estimated_hours}
                                        onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 dark:text-white"
                                        placeholder="0.0"
                                    />
                                </div>
                            </div>

                            {/* AI Due Date Suggestion */}
                            {formData.title && (
                                <AIDueDateSuggestion
                                    taskTitle={formData.title}
                                    taskDescription={formData.description}
                                    priority={formData.priority}
                                    estimatedHours={formData.estimated_hours ? parseFloat(formData.estimated_hours) : undefined}
                                    currentDueDate={formData.due_date}
                                    onSelectDate={(date) => setFormData({ ...formData, due_date: date })}
                                />
                            )}

                            {/* Impact on Project Progress */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Impact on Project Progress (%)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={formData.impact}
                                    onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
                                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 dark:text-white"
                                    placeholder="0-100"
                                />
                            </div>
                        </form>
                    )}

                    {activeTab === 'checklist' && isEditMode && (
                        <SubtaskList
                            taskId={task.id}
                            subtasks={subtasks}
                            progress={subtaskProgress}
                            onToggle={handleToggleSubtask}
                            onCreate={handleCreateSubtask}
                            onDelete={handleDeleteSubtask}
                            onReorder={handleReorderSubtasks}
                        />
                    )}

                    {activeTab === 'time' && isEditMode && (
                        <TimeTracker
                            taskId={task.id}
                            taskTitle={task.title}
                            timeLogs={timeLogs}
                            activeTimer={activeTimer}
                            onStartTimer={handleStartTimer}
                            onStopTimer={handleStopTimer}
                            onLogTime={handleLogTime}
                        />
                    )}

                    {activeTab === 'files' && isEditMode && (
                        <FileUpload
                            taskId={task.id}
                            attachments={attachments}
                            onUploadComplete={() => fetchAttachments(task.id)}
                        />
                    )}

                    {activeTab === 'dependencies' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Task Dependencies
                                </label>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    Select tasks that must be completed before this task can start
                                </p>
                                <div className="space-y-2 max-h-64 overflow-y-auto bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3">
                                    {availableTasks.filter(t => t.id !== task?.id).length === 0 ? (
                                        <p className="text-gray-500 dark:text-gray-400 text-sm">No other tasks available</p>
                                    ) : (
                                        availableTasks
                                            .filter(t => t.id !== task?.id)
                                            .map((depTask) => {
                                                const isSelected = formData.depends_on.includes(depTask.id);
                                                
                                                return (
                                                    <label
                                                        key={depTask.id}
                                                        className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer transition-colors"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={(e) => {
                                                                const currentDeps = formData.depends_on || [];
                                                                let newDeps;
                                                                
                                                                if (e.target.checked) {
                                                                    newDeps = [...currentDeps, depTask.id];
                                                                } else {
                                                                    newDeps = currentDeps.filter(id => id !== depTask.id);
                                                                }
                                                                
                                                                setFormData({ 
                                                                    ...formData, 
                                                                    depends_on: newDeps 
                                                                });
                                                            }}
                                                            className="w-4 h-4 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                                                        />
                                                        <div className="flex-1">
                                                            <p className="text-gray-900 dark:text-white text-sm font-medium">
                                                                {depTask.title}
                                                            </p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                Status: {depTask.status} • Priority: {depTask.priority}
                                                            </p>
                                                        </div>
                                                        {depTask.status === 'done' && (
                                                            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded">
                                                                Completed
                                                            </span>
                                                        )}
                                                    </label>
                                                );
                                            })
                                    )}
                                </div>
                            </div>

                            {/* Show blocked by */}
                            {task?.blocked_by && task.blocked_by.length > 0 && (
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                                    <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                                        ⚠️ Blocked By
                                    </h4>
                                    <ul className="space-y-1">
                                        {task.blocked_by.map((blocker: any) => (
                                            <li key={blocker.id} className="text-sm text-yellow-700 dark:text-yellow-400">
                                                • {blocker.title} ({blocker.status})
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <div>
                        {task && onDelete && (
                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(true)}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors text-white flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Task
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors text-gray-900 dark:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="task-form"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed rounded-lg font-medium transition-colors text-white flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {loading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            {showDeleteConfirm && (
                <div className="absolute inset-0 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 border border-red-500/50 rounded-lg max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Delete Task?</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Are you sure you want to delete "{task?.title}"? This action cannot be undone.
                        </p>
                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={loading}
                                className="px-6 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors text-gray-900 dark:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={loading}
                                className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed rounded-lg font-medium transition-colors text-white"
                            >
                                {loading ? 'Deleting...' : 'Delete Task'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
