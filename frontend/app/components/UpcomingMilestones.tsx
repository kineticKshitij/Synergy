import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { AlertTriangle, Calendar, CheckCircle } from 'lucide-react';
import tokenStorage from '~/services/tokenStorage';

interface Task {
    id: number;
    title: string;
    status: string;
    priority: string;
    due_date: string | null;
    project: {
        id: number;
        name: string;
    };
}

export function UpcomingMilestones({ limit = 5 }: { limit?: number }) {
    const [milestones, setMilestones] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMilestones = async () => {
            try {
                const token = tokenStorage.getAccessToken();
                if (!token) return;

                const response = await fetch('/api/milestones/', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    // Sort by due date and filter upcoming
                    const upcoming = data
                        .filter((m: any) => m.status !== 'completed' && m.status !== 'missed')
                        .sort(
                            (a: any, b: any) =>
                                new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
                        )
                        .slice(0, limit);
                    setMilestones(upcoming);
                }
            } catch (error) {
                console.error('Failed to fetch milestones:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMilestones();
    }, [limit]);

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
                    <div key={i} className="h-16 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                ))}
            </div>
        );
    }

    if (milestones.length === 0) {
        return (
            <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    No upcoming milestones
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {milestones.map((milestone, index) => {
                const daysUntil = getDaysUntil(milestone.due_date);
                const isUrgent = daysUntil <= 7;

                return (
                    <div
                        key={milestone.id}
                        onClick={() => navigate(`/projects/${milestone.project.id}`)}
                        className="group cursor-pointer rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 p-3 hover:shadow-md transition-all"
                        style={{ animationDelay: `${index * 0.05}s` }}
                    >
                        <div className="flex items-start gap-3">
                            <div
                                className={`p-2 rounded-lg ${
                                    isUrgent
                                        ? 'bg-red-100 dark:bg-red-950/40'
                                        : 'bg-purple-100 dark:bg-purple-950/40'
                                }`}
                            >
                                {isUrgent ? (
                                    <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-300" />
                                ) : (
                                    <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-300" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {milestone.name}
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                                    {milestone.project.name}
                                </p>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3 text-slate-400" />
                                        <span className="text-xs text-slate-600 dark:text-slate-400">
                                            {new Date(milestone.due_date).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <span
                                        className={`text-xs font-medium ${
                                            isUrgent
                                                ? 'text-red-600 dark:text-red-400'
                                                : 'text-slate-600 dark:text-slate-400'
                                        }`}
                                    >
                                        {daysUntil > 0
                                            ? `${daysUntil} days left`
                                            : daysUntil === 0
                                            ? 'Due today'
                                            : 'Overdue'}
                                    </span>
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                    <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className="bg-purple-500 h-1.5 rounded-full transition-all"
                                            style={{ width: `${milestone.progress || 0}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-50">
                                        {milestone.progress || 0}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
