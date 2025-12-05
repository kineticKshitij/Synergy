import { useState } from 'react';
import { X, Check, Loader2, Users, Flag, Calendar } from 'lucide-react';
import { projectService } from '~/services/project.service';

interface BulkActionsModalProps {
    selectedTaskIds: number[];
    onClose: () => void;
    onSuccess: () => void;
}

export function BulkActionsModal({ selectedTaskIds, onClose, onSuccess }: BulkActionsModalProps) {
    const [action, setAction] = useState<'status' | 'assignee' | 'priority' | ''>('');
    const [value, setValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!action || !value) {
            setError('Please select an action and value');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Call bulk update API
            await projectService.bulkUpdateTasks(selectedTaskIds, {
                [action]: value,
            });

            onSuccess();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update tasks');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 bg-gradient-to-br from-purple-500 to-blue-500 text-white flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold">Bulk Actions</h3>
                        <p className="text-sm text-purple-100">
                            Update {selectedTaskIds.length} task{selectedTaskIds.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {/* Action Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Select Action
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => {
                                    setAction('status');
                                    setValue('');
                                }}
                                className={`p-3 rounded-lg border-2 transition-all ${
                                    action === 'status'
                                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                                        : 'border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                <Check className="w-5 h-5 mx-auto mb-1" />
                                <span className="text-xs font-medium">Status</span>
                            </button>
                            <button
                                onClick={() => {
                                    setAction('assignee');
                                    setValue('');
                                }}
                                className={`p-3 rounded-lg border-2 transition-all ${
                                    action === 'assignee'
                                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                                        : 'border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                <Users className="w-5 h-5 mx-auto mb-1" />
                                <span className="text-xs font-medium">Assignee</span>
                            </button>
                            <button
                                onClick={() => {
                                    setAction('priority');
                                    setValue('');
                                }}
                                className={`p-3 rounded-lg border-2 transition-all ${
                                    action === 'priority'
                                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                                        : 'border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                <Flag className="w-5 h-5 mx-auto mb-1" />
                                <span className="text-xs font-medium">Priority</span>
                            </button>
                        </div>
                    </div>

                    {/* Value Selection */}
                    {action && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                New {action === 'assignee' ? 'Assignee' : action === 'priority' ? 'Priority' : 'Status'}
                            </label>
                            {action === 'status' && (
                                <select
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                >
                                    <option value="">Select status...</option>
                                    <option value="pending">Pending</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="review">In Review</option>
                                    <option value="completed">Completed</option>
                                    <option value="on_hold">On Hold</option>
                                </select>
                            )}
                            {action === 'priority' && (
                                <select
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                >
                                    <option value="">Select priority...</option>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                            )}
                            {action === 'assignee' && (
                                <input
                                    type="number"
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    placeholder="Enter user ID..."
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                />
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !action || !value}
                        className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Update Tasks
                    </button>
                </div>
            </div>
        </div>
    );
}
