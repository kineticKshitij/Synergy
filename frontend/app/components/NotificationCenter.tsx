import { useState, useEffect } from 'react';
import { X, Check, CheckCheck, Filter, Archive, Trash2, Bell, MessageSquare, CheckCircle, AlertCircle, Calendar, Users } from 'lucide-react';
import tokenStorage from '~/services/tokenStorage';

interface NotificationCenterProps {
    isOpen: boolean;
    onClose: () => void;
}

type NotificationType = 'task' | 'mention' | 'milestone' | 'deadline' | 'project' | 'system';

interface Notification {
    id: number;
    type: NotificationType;
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    actionUrl?: string;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const [loading, setLoading] = useState(false);

    // Fetch notifications from API
    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const token = tokenStorage.getAccessToken();
            const response = await fetch('http://localhost/api/notifications/', {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setNotifications(data);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const unreadCount = notifications.filter((n) => !n.read).length;

    const filteredNotifications = notifications.filter((n) => {
        if (filter === 'unread') return !n.read;
        return true;
    });

    const handleMarkAsRead = async (id: number) => {
        try {
            const token = tokenStorage.getAccessToken();
            const response = await fetch(`http://localhost/api/notifications/${id}/mark_read/`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                setNotifications((prev) =>
                    prev.map((n) => (n.id === id ? { ...n, read: true } : n))
                );
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const token = tokenStorage.getAccessToken();
            const response = await fetch('http://localhost/api/notifications/mark_all_read/', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            }
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            const token = tokenStorage.getAccessToken();
            const response = await fetch(`http://localhost/api/notifications/${id}/`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                setNotifications((prev) => prev.filter((n) => n.id !== id));
            }
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    const getNotificationIcon = (type: NotificationType) => {
        switch (type) {
            case 'task':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'mention':
                return <MessageSquare className="w-5 h-5 text-blue-500" />;
            case 'milestone':
                return <Calendar className="w-5 h-5 text-purple-500" />;
            case 'deadline':
                return <AlertCircle className="w-5 h-5 text-orange-500" />;
            case 'project':
                return <Users className="w-5 h-5 text-indigo-500" />;
            default:
                return <Bell className="w-5 h-5 text-slate-500" />;
        }
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 lg:inset-auto lg:right-4 lg:top-16 lg:w-96">
            {/* Backdrop for mobile */}
            <div
                className="fixed inset-0 bg-black/20 backdrop-blur-sm lg:hidden"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="relative bg-white dark:bg-slate-900 lg:border lg:border-slate-200 dark:border-slate-800 lg:rounded-xl shadow-2xl h-full lg:h-[600px] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-blue-500" />
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                            Notifications
                        </h3>
                        {unreadCount > 0 && (
                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Actions Bar */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                                filter === 'all'
                                    ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilter('unread')}
                            className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                                filter === 'unread'
                                    ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                        >
                            Unread
                        </button>
                    </div>

                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllAsRead}
                            className="flex items-center gap-1.5 px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                        >
                            <CheckCheck className="w-4 h-4" />
                            Mark all read
                        </button>
                    )}
                </div>

                {/* Notifications List */}
                <div className="flex-1 overflow-y-auto">
                    {filteredNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-12">
                            <Bell className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-50 mb-1">
                                No notifications
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {filter === 'unread'
                                    ? "You're all caught up!"
                                    : 'Notifications will appear here'}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredNotifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                                        !notification.read
                                            ? 'bg-blue-50/50 dark:bg-blue-950/10'
                                            : ''
                                    }`}
                                >
                                    <div className="flex gap-3">
                                        {/* Icon */}
                                        <div className="flex-shrink-0 pt-1">
                                            {getNotificationIcon(notification.type)}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between mb-1">
                                                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                                                    {notification.title}
                                                </h4>
                                                {!notification.read && (
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 flex-shrink-0" />
                                                )}
                                            </div>

                                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                                {notification.message}
                                            </p>

                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                                    {formatTimestamp(notification.timestamp)}
                                                </span>

                                                <div className="flex items-center gap-1">
                                                    {!notification.read && (
                                                        <button
                                                            onClick={() =>
                                                                handleMarkAsRead(notification.id)
                                                            }
                                                            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                                                            title="Mark as read"
                                                        >
                                                            <Check className="w-3.5 h-3.5 text-slate-400" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(notification.id)}
                                                        className="p-1.5 hover:bg-red-100 dark:hover:bg-red-950/40 rounded transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {filteredNotifications.length > 0 && (
                    <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                        <button className="w-full text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                            View all notifications
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
