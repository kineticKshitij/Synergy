import { useNavigate } from 'react-router';
import { Users, CheckSquare, Clock, Calendar, MoreVertical } from 'lucide-react';

interface ProjectListItemProps {
    project: any;
    isSelected: boolean;
    onToggleSelect: () => void;
}

export function ProjectListItem({ project, isSelected, onToggleSelect }: ProjectListItemProps) {
    const navigate = useNavigate();

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            planning: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300',
            active: 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300',
            on_hold: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
            completed: 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300',
            cancelled: 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300',
        };
        return colors[status] || colors.planning;
    };

    const getPriorityColor = (priority: string) => {
        const colors: Record<string, string> = {
            low: 'text-green-600 dark:text-green-400',
            medium: 'text-amber-600 dark:text-amber-400',
            high: 'text-orange-600 dark:text-orange-400',
            urgent: 'text-red-600 dark:text-red-400',
        };
        return colors[priority] || colors.medium;
    };

    return (
        <div
            className={`group bg-white dark:bg-slate-900 border rounded-xl p-4 hover:shadow-md transition-all ${
                isSelected
                    ? 'border-blue-500 dark:border-blue-400 shadow-md'
                    : 'border-slate-200 dark:border-slate-800'
            }`}
        >
            <div className="flex items-start gap-4">
                {/* Checkbox */}
                <div className="flex items-center pt-1">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                            e.stopPropagation();
                            onToggleSelect();
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                </div>

                {/* Main Content */}
                <div
                    className="flex-1 cursor-pointer"
                    onClick={() => navigate(`/projects/${project.id}`)}
                >
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {project.name}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-1">
                                {project.description || 'No description'}
                            </p>
                        </div>
                        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                            <MoreVertical className="w-4 h-4 text-slate-400" />
                        </button>
                    </div>

                    <div className="flex items-center flex-wrap gap-3 mb-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                            {project.status.replace('_', ' ')}
                        </span>
                        <span className={`text-xs font-semibold ${getPriorityColor(project.priority)}`}>
                            {project.priority} priority
                        </span>
                        {project.owner && (
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                by {project.owner?.username || 'Unknown'}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-3">
                        {project.team_members && (
                            <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                <span>{project.team_members.length} members</span>
                            </div>
                        )}
                        {project.task_count !== undefined && (
                            <div className="flex items-center gap-1">
                                <CheckSquare className="w-4 h-4" />
                                <span>{project.task_count} tasks</span>
                            </div>
                        )}
                        {project.end_date && (
                            <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>Due {new Date(project.end_date).toLocaleDateString()}</span>
                            </div>
                        )}
                    </div>

                    {/* Progress Bar */}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-slate-500 dark:text-slate-400">Progress</span>
                            <span className="text-xs font-semibold text-slate-900 dark:text-slate-50">
                                {project.progress}%
                            </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                                style={{ width: `${project.progress}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
