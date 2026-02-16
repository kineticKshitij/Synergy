import { useState } from 'react';
import { CheckCircle2, Circle, Plus, Trash2, GripVertical, User } from 'lucide-react';

interface Subtask {
    id: number;
    title: string;
    is_completed: boolean;
    order: number;
    assigned_to?: {
        id: number;
        username: string;
        full_name: string;
    };
    completed_by?: {
        username: string;
    };
    completed_at?: string;
}

interface SubtaskProgress {
    total: number;
    completed: number;
    percentage: number;
}

interface SubtaskListProps {
    taskId: number;
    subtasks: Subtask[];
    progress: SubtaskProgress;
    onToggle: (subtaskId: number) => Promise<void>;
    onCreate: (title: string) => Promise<void>;
    onDelete: (subtaskId: number) => Promise<void>;
    onReorder?: (subtasks: Subtask[]) => Promise<void>;
    readOnly?: boolean;
}

export default function SubtaskList({
    taskId,
    subtasks,
    progress,
    onToggle,
    onCreate,
    onDelete,
    onReorder,
    readOnly = false
}: SubtaskListProps) {
    const [newSubtask, setNewSubtask] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [draggedItem, setDraggedItem] = useState<number | null>(null);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubtask.trim()) return;

        try {
            await onCreate(newSubtask.trim());
            setNewSubtask('');
            setIsAdding(false);
        } catch (error) {
            console.error('Failed to create subtask:', error);
        }
    };

    const handleToggle = async (subtaskId: number) => {
        if (readOnly) return;
        try {
            await onToggle(subtaskId);
        } catch (error) {
            console.error('Failed to toggle subtask:', error);
        }
    };

    const handleDelete = async (subtaskId: number) => {
        if (readOnly) return;
        if (!confirm('Delete this subtask?')) return;
        
        try {
            await onDelete(subtaskId);
        } catch (error) {
            console.error('Failed to delete subtask:', error);
        }
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedItem(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        if (draggedItem === null || draggedItem === dropIndex) {
            setDraggedItem(null);
            return;
        }

        const reorderedSubtasks = [...subtasks];
        const [removed] = reorderedSubtasks.splice(draggedItem, 1);
        reorderedSubtasks.splice(dropIndex, 0, removed);

        // Update order values
        const updatedSubtasks = reorderedSubtasks.map((sub, idx) => ({
            ...sub,
            order: idx
        }));

        if (onReorder) {
            try {
                await onReorder(updatedSubtasks);
            } catch (error) {
                console.error('Failed to reorder subtasks:', error);
            }
        }

        setDraggedItem(null);
    };

    return (
        <div className="space-y-4">
            {/* Header with Progress */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Checklist
                    </h4>
                    {progress.total > 0 && (
                        <span className="text-xs text-gray-500">
                            {progress.completed}/{progress.total}
                        </span>
                    )}
                </div>
                {!readOnly && !isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center gap-1"
                    >
                        <Plus className="w-3 h-3" />
                        Add Item
                    </button>
                )}
            </div>

            {/* Progress Bar */}
            {progress.total > 0 && (
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress.percentage}%` }}
                    />
                </div>
            )}

            {/* Subtask List */}
            <div className="space-y-2">
                {subtasks.map((subtask, index) => (
                    <div
                        key={subtask.id}
                        draggable={!readOnly && onReorder !== undefined}
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, index)}
                        className={`flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group ${
                            draggedItem === index ? 'opacity-50' : ''
                        }`}
                    >
                        {/* Drag Handle */}
                        {!readOnly && onReorder && (
                            <button className="opacity-0 group-hover:opacity-100 cursor-move mt-1">
                                <GripVertical className="w-4 h-4 text-gray-400" />
                            </button>
                        )}

                        {/* Checkbox */}
                        <button
                            onClick={() => handleToggle(subtask.id)}
                            disabled={readOnly}
                            className={`mt-0.5 flex-shrink-0 ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
                        >
                            {subtask.is_completed ? (
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                            ) : (
                                <Circle className="w-5 h-5 text-gray-400" />
                            )}
                        </button>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <p
                                className={`text-sm ${
                                    subtask.is_completed
                                        ? 'line-through text-gray-500 dark:text-gray-400'
                                        : 'text-gray-700 dark:text-gray-200'
                                }`}
                            >
                                {subtask.title}
                            </p>
                            {subtask.completed_by && (
                                <p className="text-xs text-gray-500 mt-1">
                                    Completed by {subtask.completed_by.username}
                                </p>
                            )}
                        </div>

                        {/* Assigned User */}
                        {subtask.assigned_to && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                <User className="w-3 h-3" />
                                {subtask.assigned_to.username}
                            </div>
                        )}

                        {/* Delete Button */}
                        {!readOnly && (
                            <button
                                onClick={() => handleDelete(subtask.id)}
                                className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 p-1"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Add New Subtask Form */}
            {isAdding && (
                <form onSubmit={handleAdd} className="flex gap-2">
                    <input
                        type="text"
                        value={newSubtask}
                        onChange={(e) => setNewSubtask(e.target.value)}
                        placeholder="Enter subtask title..."
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        autoFocus
                    />
                    <button
                        type="submit"
                        className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Add
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setIsAdding(false);
                            setNewSubtask('');
                        }}
                        className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    >
                        Cancel
                    </button>
                </form>
            )}

            {/* Empty State */}
            {subtasks.length === 0 && !isAdding && (
                <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                    <Circle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No checklist items yet</p>
                    {!readOnly && (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mt-2"
                        >
                            Add your first item
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
