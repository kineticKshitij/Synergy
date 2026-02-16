import { useState, useEffect } from 'react';
import { X, Save, Calendar, Target, CheckSquare, Loader2, Plus, Trash2 } from 'lucide-react';
import tokenStorage from '~/services/tokenStorage';

interface MilestoneModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: number;
    milestone?: any;
    onSuccess: () => void;
}

export function MilestoneModal({
    isOpen,
    onClose,
    projectId,
    milestone,
    onSuccess,
}: MilestoneModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        due_date: '',
        status: 'pending',
        task_ids: [] as number[],
    });
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingTasks, setLoadingTasks] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadTasks();
            if (milestone) {
                setFormData({
                    name: milestone.name || '',
                    description: milestone.description || '',
                    due_date: milestone.due_date || '',
                    status: milestone.status || 'pending',
                    task_ids: milestone.tasks?.map((t: any) => t.id) || [],
                });
            } else {
                setFormData({
                    name: '',
                    description: '',
                    due_date: '',
                    status: 'pending',
                    task_ids: [],
                });
            }
        }
    }, [isOpen, milestone]);

    const loadTasks = async () => {
        try {
            setLoadingTasks(true);
            const token = tokenStorage.getAccessToken();
            if (!token) return;

            const response = await fetch(`/api/tasks/?project=${projectId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setTasks(data);
            }
        } catch (error) {
            console.error('Failed to load tasks:', error);
        } finally {
            setLoadingTasks(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = tokenStorage.getAccessToken();
            if (!token) return;

            const url = milestone
                ? `/api/milestones/${milestone.id}/`
                : '/api/milestones/';

            const method = milestone ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    project: projectId,
                    tasks: formData.task_ids,
                }),
            });

            if (response.ok) {
                onSuccess();
                onClose();
            }
        } catch (error) {
            console.error('Failed to save milestone:', error);
            alert('Failed to save milestone');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleTask = (taskId: number) => {
        setFormData((prev) => ({
            ...prev,
            task_ids: prev.task_ids.includes(taskId)
                ? prev.task_ids.filter((id) => id !== taskId)
                : [...prev.task_ids, taskId],
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-950/40 rounded-lg">
                            <Target className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                            {milestone ? 'Edit Milestone' : 'Create Milestone'}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Milestone Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                            }
                            className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-50"
                            placeholder="Enter milestone name..."
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                            rows={3}
                            className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-slate-900 dark:text-slate-50"
                            placeholder="Describe the milestone..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Due Date */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Due Date *
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="date"
                                    required
                                    value={formData.due_date}
                                    onChange={(e) =>
                                        setFormData({ ...formData, due_date: e.target.value })
                                    }
                                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-50"
                                />
                            </div>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Status
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) =>
                                    setFormData({ ...formData, status: e.target.value })
                                }
                                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-50"
                            >
                                <option value="pending">Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="missed">Missed</option>
                            </select>
                        </div>
                    </div>

                    {/* Associated Tasks */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Associated Tasks
                        </label>
                        {loadingTasks ? (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                            </div>
                        ) : tasks.length === 0 ? (
                            <div className="text-center py-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                <CheckSquare className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    No tasks available
                                </p>
                            </div>
                        ) : (
                            <div className="max-h-48 overflow-y-auto bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-3 space-y-2">
                                {tasks.map((task) => (
                                    <label
                                        key={task.id}
                                        className="flex items-center gap-3 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={formData.task_ids.includes(task.id)}
                                            onChange={() => handleToggleTask(task.id)}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">
                                                {task.title}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                                                {task.status.replace('_', ' ')} • {task.priority}
                                            </p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                            {formData.task_ids.length} task(s) selected
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    {milestone ? 'Update' : 'Create'} Milestone
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
