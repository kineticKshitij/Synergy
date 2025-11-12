import { useState, useEffect } from 'react';

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (taskData: any) => void;
    onDelete?: (taskId: number) => void;
    projectId: number;
    task?: any; // For editing existing tasks
    teamMembers?: any[]; // Available team members for assignment
}

export function TaskModal({ isOpen, onClose, onSubmit, onDelete, projectId, task, teamMembers = [] }: TaskModalProps) {
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
    });
    const [loading, setLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
            });
        } else {
            setFormData({
                title: '',
                description: '',
                status: 'todo',
                priority: 'medium',
                due_date: '',
                estimated_hours: '',
                impact: '',
                assigned_to_id: '',
                assigned_to_multiple_ids: [],
            });
        }
    }, [task, isOpen]);

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
            };
            await onSubmit(taskData);
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-gray-800 border border-gray-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-700">
                    <h2 className="text-2xl font-bold text-white">
                        {task ? '✏️ Edit Task' : '✨ Create New Task'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Task Title *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white"
                            placeholder="Enter task title..."
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={4}
                            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-white"
                            placeholder="Describe the task..."
                        />
                    </div>

                    {/* Assign To Team Members (Multiple) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            � Assign To Team Members
                        </label>
                        <div className="space-y-2 max-h-48 overflow-y-auto bg-gray-900 border border-gray-700 rounded-lg p-3">
                            {(!teamMembers || teamMembers.length === 0) ? (
                                <p className="text-gray-500 text-sm">No team members - Invite team members first</p>
                            ) : (
                                teamMembers.map((member) => {
                                    const memberId = member.id.toString();
                                    const isSelected = formData.assigned_to_multiple_ids?.includes(memberId) || false;
                                    
                                    return (
                                        <label
                                            key={member.id}
                                            className="flex items-center gap-3 p-2 hover:bg-gray-800 rounded cursor-pointer transition-colors"
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
                                                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                                            />
                                            <span className="text-white text-sm">
                                                {member.first_name && member.last_name 
                                                    ? `${member.first_name} ${member.last_name} (${member.username})`
                                                    : member.username}
                                                {member.email && (
                                                    <span className="text-gray-400 text-xs ml-2">{member.email}</span>
                                                )}
                                            </span>
                                        </label>
                                    );
                                })
                            )}
                        </div>
                        <p className="mt-2 text-sm text-gray-400">
                            {teamMembers && teamMembers.length > 0 
                                ? '💡 Select one or more team members to assign this task'
                                : '⚠️ Add team members to this project first by clicking "Add Team Member" button'}
                        </p>
                    </div>

                    {/* Status and Priority */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Status
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white"
                            >
                                <option value="todo">📝 To Do</option>
                                <option value="in_progress">🔄 In Progress</option>
                                <option value="review">👀 In Review</option>
                                <option value="done">✅ Done</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Priority
                            </label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white"
                            >
                                <option value="low">🟢 Low</option>
                                <option value="medium">🟡 Medium</option>
                                <option value="high">🟠 High</option>
                                <option value="urgent">🔴 Urgent</option>
                            </select>
                        </div>
                    </div>

                    {/* Due Date and Estimated Hours */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Due Date
                            </label>
                            <input
                                type="date"
                                value={formData.due_date}
                                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Estimated Hours
                            </label>
                            <input
                                type="number"
                                step="0.5"
                                min="0"
                                value={formData.estimated_hours}
                                onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white"
                                placeholder="0.0"
                            />
                        </div>
                    </div>

                    {/* Impact on Project Progress */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            📊 Impact on Project Progress (%)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={formData.impact}
                            onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white"
                            placeholder="Enter impact percentage (0-100)"
                        />
                        <p className="mt-2 text-sm text-gray-400">
                            💡 This task will contribute {formData.impact || '0'}% to the project progress when completed
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                        <div>
                            {task && onDelete && (
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors text-white"
                                >
                                    🗑️ Delete Task
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors text-white"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed rounded-lg font-medium transition-colors text-white"
                            >
                                {loading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Delete Confirmation Dialog */}
            {showDeleteConfirm && (
                <div className="absolute inset-0 flex items-center justify-center p-4 bg-black/70">
                    <div className="bg-gray-900 border border-red-500/50 rounded-lg max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-white mb-3">⚠️ Delete Task?</h3>
                        <p className="text-gray-400 mb-6">
                            Are you sure you want to delete "{task?.title}"? This action cannot be undone.
                        </p>
                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={loading}
                                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={loading}
                                className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed rounded-lg font-medium transition-colors text-white"
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
