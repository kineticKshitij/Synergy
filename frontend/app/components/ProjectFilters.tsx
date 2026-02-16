import { Filter, X, SlidersHorizontal } from 'lucide-react';

interface ProjectFiltersProps {
    statusFilter: string;
    priorityFilter: string;
    ownerFilter: string;
    sortBy: string;
    onStatusChange: (status: string) => void;
    onPriorityChange: (priority: string) => void;
    onOwnerChange: (owner: string) => void;
    onSortChange: (sort: string) => void;
    onClearFilters: () => void;
    owners: Array<{ id: number; username: string }>;
    hasActiveFilters: boolean;
}

export function ProjectFilters({
    statusFilter,
    priorityFilter,
    ownerFilter,
    sortBy,
    onStatusChange,
    onPriorityChange,
    onOwnerChange,
    onSortChange,
    onClearFilters,
    owners,
    hasActiveFilters,
}: ProjectFiltersProps) {
    return (
        <div className="bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                        Filters
                    </h3>
                </div>
                {hasActiveFilters && (
                    <button
                        onClick={onClearFilters}
                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                    >
                        <X className="w-3 h-3" />
                        Clear all
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Status Filter */}
                <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Status
                    </label>
                    <select
                        value={statusFilter}
                        onChange={(e) => onStatusChange(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-50"
                    >
                        <option value="all">All Status</option>
                        <option value="planning">Planning</option>
                        <option value="active">Active</option>
                        <option value="on_hold">On Hold</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>

                {/* Priority Filter */}
                <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Priority
                    </label>
                    <select
                        value={priorityFilter}
                        onChange={(e) => onPriorityChange(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-50"
                    >
                        <option value="all">All Priority</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                    </select>
                </div>

                {/* Owner Filter */}
                <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Owner
                    </label>
                    <select
                        value={ownerFilter}
                        onChange={(e) => onOwnerChange(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-50"
                    >
                        <option value="all">All Owners</option>
                        {owners.map((owner) => (
                            <option key={owner.id} value={owner.id.toString()}>
                                {owner.username}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Sort By */}
                <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Sort By
                    </label>
                    <select
                        value={sortBy}
                        onChange={(e) => onSortChange(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-50"
                    >
                        <option value="created_desc">Newest First</option>
                        <option value="created_asc">Oldest First</option>
                        <option value="name_asc">Name (A-Z)</option>
                        <option value="name_desc">Name (Z-A)</option>
                        <option value="progress_desc">Progress (High-Low)</option>
                        <option value="progress_asc">Progress (Low-High)</option>
                        <option value="priority_desc">Priority (High-Low)</option>
                    </select>
                </div>
            </div>
        </div>
    );
}
