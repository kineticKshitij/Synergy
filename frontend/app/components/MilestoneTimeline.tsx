import { useState, useEffect } from 'react';
import { Target, Calendar, CheckCircle, Clock } from 'lucide-react';
import tokenStorage from '~/services/tokenStorage';

interface MilestoneTimelineProps {
    projectId: number;
}

export function MilestoneTimeline({ projectId }: MilestoneTimelineProps) {
    const [milestones, setMilestones] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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
                // Sort by due date
                const sorted = data.sort(
                    (a: any, b: any) =>
                        new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
                );
                setMilestones(sorted);
            }
        } catch (error) {
            console.error('Failed to load milestones:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-500 border-green-500';
            case 'in_progress':
                return 'bg-blue-500 border-blue-500';
            case 'missed':
                return 'bg-red-500 border-red-500';
            default:
                return 'bg-slate-300 dark:bg-slate-600 border-slate-300 dark:border-slate-600';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="w-5 h-5 text-white" />;
            case 'in_progress':
                return <Clock className="w-5 h-5 text-white" />;
            default:
                return <Target className="w-5 h-5 text-white" />;
        }
    };

    if (loading) {
        return (
            <div className="space-y-8">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-4 animate-pulse">
                        <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (milestones.length === 0) {
        return (
            <div className="text-center py-8">
                <Target className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    No milestones to display
                </p>
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-slate-200 dark:bg-slate-700" />

            <div className="space-y-8">
                {milestones.map((milestone, index) => {
                    const isLast = index === milestones.length - 1;

                    return (
                        <div key={milestone.id} className="relative flex gap-6">
                            {/* Timeline Node */}
                            <div className="relative z-10 flex-shrink-0">
                                <div
                                    className={`w-12 h-12 border-4 ${getStatusColor(
                                        milestone.status
                                    )} rounded-full flex items-center justify-center shadow-md`}
                                >
                                    {getStatusIcon(milestone.status)}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 pb-8">
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-1">
                                                {milestone.name}
                                            </h4>
                                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                <Calendar className="w-4 h-4" />
                                                <span>
                                                    {new Date(milestone.due_date).toLocaleDateString(
                                                        'en-US',
                                                        {
                                                            month: 'long',
                                                            day: 'numeric',
                                                            year: 'numeric',
                                                        }
                                                    )}
                                                </span>
                                            </div>
                                        </div>

                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                                                milestone.status === 'completed'
                                                    ? 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300'
                                                    : milestone.status === 'in_progress'
                                                    ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                                                    : milestone.status === 'missed'
                                                    ? 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                            }`}
                                        >
                                            {milestone.status.replace('_', ' ')}
                                        </span>
                                    </div>

                                    {milestone.description && (
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                                            {milestone.description}
                                        </p>
                                    )}

                                    {/* Progress Bar */}
                                    <div>
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                Progress
                                            </span>
                                            <span className="text-xs font-semibold text-slate-900 dark:text-slate-50">
                                                {milestone.progress || 0}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                                            <div
                                                className={`h-2 rounded-full transition-all ${
                                                    milestone.status === 'completed'
                                                        ? 'bg-green-500'
                                                        : milestone.status === 'in_progress'
                                                        ? 'bg-blue-500'
                                                        : 'bg-slate-400'
                                                }`}
                                                style={{ width: `${milestone.progress || 0}%` }}
                                            />
                                        </div>
                                    </div>

                                    {milestone.tasks && milestone.tasks.length > 0 && (
                                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {milestone.tasks.length} associated task
                                                {milestone.tasks.length !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
