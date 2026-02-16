import { useEffect, useState } from 'react';
import {
    CheckSquare,
    FolderPlus,
    UserPlus,
    MessageSquare,
    FileText,
    AlertCircle,
    Clock,
} from 'lucide-react';
import tokenStorage from '~/services/tokenStorage';

interface Activity {
    id: number;
    action: string;
    description: string;
    user?: {
        id: number;
        username: string;
    };
    created_at: string;
    metadata?: Record<string, any>;
}

const activityIcons: Record<string, any> = {
    project_created: FolderPlus,
    task_created: CheckSquare,
    task_updated: CheckSquare,
    task_completed: CheckSquare,
    member_added: UserPlus,
    comment_added: MessageSquare,
    file_uploaded: FileText,
    default: AlertCircle,
};

const activityColors: Record<string, string> = {
    project_created: 'bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300',
    task_created: 'bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-300',
    task_updated: 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300',
    task_completed: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300',
    member_added: 'bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300',
    comment_added: 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300',
    file_uploaded: 'bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-300',
    default: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
};

export function ActivityTimeline({ limit = 10 }: { limit?: number }) {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const token = tokenStorage.getAccessToken();
                if (!token) return;

                const response = await fetch('/api/activities/', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setActivities(data.slice(0, limit));
                }
            } catch (error) {
                console.error('Failed to fetch activities:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchActivities();
    }, [limit]);

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return date.toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                        <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                        <div className="flex-1">
                            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4 mb-2" />
                            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (activities.length === 0) {
        return (
            <div className="text-center py-8">
                <Clock className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    No recent activity
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {activities.map((activity, index) => {
                const IconComponent =
                    activityIcons[activity.action] || activityIcons.default;
                const colorClass =
                    activityColors[activity.action] || activityColors.default;

                return (
                    <div
                        key={activity.id}
                        className="flex gap-3 group"
                        style={{ animationDelay: `${index * 0.05}s` }}
                    >
                        <div
                            className={`p-2.5 rounded-lg ${colorClass} h-fit group-hover:scale-110 transition-transform`}
                        >
                            <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                                <span className="font-semibold">
                                    {activity.user?.username || 'Unknown User'}
                                </span>{' '}
                                {activity.description}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {formatTimeAgo(activity.created_at)}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
