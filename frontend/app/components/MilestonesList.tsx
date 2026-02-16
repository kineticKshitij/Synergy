import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Target, Calendar, CheckCircle, Clock, AlertTriangle, Plus, Edit, Trash2 } from 'lucide-react';
import { MilestoneModal } from './MilestoneModal';
import tokenStorage from '~/services/tokenStorage';

interface MilestonesListProps {
    projectId: number;
}

export function MilestonesList({ projectId }: MilestonesListProps) {
    const [milestones, setMilestones] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMilestone, setEditingMilestone] = useState<any>(null);

    useEffect(() => {
        loadMilestones();
    }, [projectId]);

    const loadMilestones = async () => {
        try {
            const token = tokenStorage.getAccessToken();
            if (!token) return;

            const response = await fetch(`/api/milestones/?project=${projectId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setMilestones(data);
            }
        } catch (error) {
            console.error('Failed to load milestones:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (milestoneId: number) => {
        if (!confirm('Are you sure you want to delete this milestone?')) return;

        try {
            const token = tokenStorage.getAccessToken();
            if (!token) return;

            const response = await fetch(`/api/milestones/${milestoneId}/`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                await loadMilestones();
            }
        } catch (error) {
            console.error('Failed to delete milestone:', error);
            alert('Failed to delete milestone');
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'in_progress':
                return <Clock className="w-5 h-5 text-blue-500" />;
            case 'missed':
                return <AlertTriangle className="w-5 h-5 text-red-500" />;
            default:
                return <Target className="w-5 h-5 text-slate-400" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-900';
            case 'in_progress':
                return 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900';
            case 'missed':
                return 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900';
            default:
                return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
        }
    };

    const getDaysUntil = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const days = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return days;
    };

    if (loading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"
                    />
                ))}
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                    Milestones
                </h3>
                <button
                    onClick={() => {
                        setEditingMilestone(null);
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Milestone
                </button>
            </div>

            {milestones.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <Target className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
                        No milestones yet
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        Create milestones to track major deliverables
                    </p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Create First Milestone
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {milestones.map((milestone) => {
                        const daysUntil = getDaysUntil(milestone.due_date);
                        const isOverdue = daysUntil < 0 && milestone.status !== 'completed';

                        return (
                            <div
                                key={milestone.id}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:shadow-md transition-all"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 pt-1">
                                        {getStatusIcon(milestone.status)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-1">
                                                    {milestone.name}
                                                </h4>
                                                {milestone.description && (
                                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                                        {milestone.description}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 ml-4">
                                                <button
                                                    onClick={() => {
                                                        setEditingMilestone(milestone);
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                                    title="Edit milestone"
                                                >
                                                    <Edit className="w-4 h-4 text-slate-400" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(milestone.id)}
                                                    className="p-2 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                                                    title="Delete milestone"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-center flex-wrap gap-3 mb-3">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                                    milestone.status
                                                )}`}
                                            >
                                                {milestone.status.replace('_', ' ')}
                                            </span>

                                            <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                                                <Calendar className="w-4 h-4" />
                                                <span>
                                                    {new Date(milestone.due_date).toLocaleDateString()}
                                                </span>
                                            </div>

                                            {isOverdue ? (
                                                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                                                    Overdue by {Math.abs(daysUntil)} days
                                                </span>
                                            ) : daysUntil >= 0 && milestone.status !== 'completed' ? (
                                                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                                    {daysUntil === 0
                                                        ? 'Due today'
                                                        : `${daysUntil} days left`}
                                                </span>
                                            ) : null}

                                            {milestone.tasks && milestone.tasks.length > 0 && (
                                                <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                                                    <CheckCircle className="w-4 h-4" />
                                                    <span>{milestone.tasks.length} tasks</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Progress Bar */}
                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                                    Progress
                                                </span>
                                                <span className="text-xs font-semibold text-slate-900 dark:text-slate-50">
                                                    {milestone.progress || 0}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className="bg-purple-500 h-2 rounded-full transition-all"
                                                    style={{ width: `${milestone.progress || 0}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <MilestoneModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingMilestone(null);
                }}
                projectId={projectId}
                milestone={editingMilestone}
                onSuccess={loadMilestones}
            />
        </div>
    );
}
