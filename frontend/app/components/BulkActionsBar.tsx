import { CheckSquare, Archive, Trash2, Edit3, X } from 'lucide-react';

interface BulkActionsBarProps {
    selectedCount: number;
    onClearSelection: () => void;
    onUpdateStatus?: () => void;
    onUpdatePriority?: () => void;
    onArchive?: () => void;
    onDelete?: () => void;
}

export function BulkActionsBar({
    selectedCount,
    onClearSelection,
    onUpdateStatus,
    onUpdatePriority,
    onArchive,
    onDelete,
}: BulkActionsBarProps) {
    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-slideInUp">
            <div className="bg-slate-900 dark:bg-slate-800 border border-slate-700 rounded-xl shadow-2xl px-6 py-4">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <CheckSquare className="w-5 h-5 text-blue-400" />
                        <span className="text-white font-medium">
                            {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
                        </span>
                    </div>

                    <div className="h-6 w-px bg-slate-700" />

                    <div className="flex items-center gap-2">
                        {onUpdateStatus && (
                            <button
                                onClick={onUpdateStatus}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium transition-colors"
                            >
                                Update Status
                            </button>
                        )}
                        {onUpdatePriority && (
                            <button
                                onClick={onUpdatePriority}
                                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg font-medium transition-colors"
                            >
                                Update Priority
                            </button>
                        )}
                        {onArchive && (
                            <button
                                onClick={onArchive}
                                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm rounded-lg font-medium transition-colors flex items-center gap-1"
                            >
                                <Archive className="w-4 h-4" />
                                Archive
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={onDelete}
                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg font-medium transition-colors flex items-center gap-1"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete
                            </button>
                        )}
                    </div>

                    <div className="h-6 w-px bg-slate-700" />

                    <button
                        onClick={onClearSelection}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                        title="Clear selection"
                    >
                        <X className="w-4 h-4 text-slate-400 hover:text-white" />
                    </button>
                </div>
            </div>
        </div>
    );
}
