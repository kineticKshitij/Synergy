import { useState } from 'react';
import { X, Send, AtSign, Paperclip, Smile, Image as ImageIcon } from 'lucide-react';

interface TaskCommentsPanelProps {
    taskId: number;
    isOpen: boolean;
    onClose: () => void;
}

export function TaskCommentsPanel({ taskId, isOpen, onClose }: TaskCommentsPanelProps) {
    const [comment, setComment] = useState('');
    const [comments, setComments] = useState<any[]>([
        {
            id: 1,
            author: 'John Doe',
            avatar: null,
            content: 'This looks good! Let me know when you finish the design mockups.',
            timestamp: '2024-01-15T10:30:00Z',
        },
        {
            id: 2,
            author: 'Jane Smith',
            avatar: null,
            content: '@JohnDoe The mockups are ready for review in Figma.',
            timestamp: '2024-01-15T14:45:00Z',
        },
    ]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!comment.trim()) return;

        const newComment = {
            id: Date.now(),
            author: 'Current User',
            avatar: null,
            content: comment,
            timestamp: new Date().toISOString(),
        };

        setComments([...comments, newComment]);
        setComment('');
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
        <div className="fixed right-0 top-0 bottom-0 w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                    Comments
                </h3>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <X className="w-5 h-5 text-slate-400" />
                </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {comments.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            No comments yet. Start the conversation!
                        </p>
                    </div>
                ) : (
                    comments.map((item) => (
                        <div key={item.id} className="flex gap-3">
                            {/* Avatar */}
                            <div className="flex-shrink-0">
                                {item.avatar ? (
                                    <img
                                        src={item.avatar}
                                        alt={item.author}
                                        className="w-8 h-8 rounded-full"
                                    />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                                        {item.author
                                            .split(' ')
                                            .map((n: string) => n[0])
                                            .join('')
                                            .toUpperCase()}
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2 mb-1">
                                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                                        {item.author}
                                    </span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                        {formatTimestamp(item.timestamp)}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">
                                    {item.content}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Input Form */}
            <form
                onSubmit={handleSubmit}
                className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50"
            >
                <div className="flex items-start gap-2 mb-2">
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Write a comment..."
                        rows={3}
                        className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm text-slate-900 dark:text-slate-50"
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            title="Mention someone"
                        >
                            <AtSign className="w-4 h-4 text-slate-400" />
                        </button>
                        <button
                            type="button"
                            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            title="Attach file"
                        >
                            <Paperclip className="w-4 h-4 text-slate-400" />
                        </button>
                        <button
                            type="button"
                            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            title="Add emoji"
                        >
                            <Smile className="w-4 h-4 text-slate-400" />
                        </button>
                        <button
                            type="button"
                            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            title="Add image"
                        >
                            <ImageIcon className="w-4 h-4 text-slate-400" />
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={!comment.trim()}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="w-4 h-4" />
                        Send
                    </button>
                </div>
            </form>
        </div>
    );
}
