import { useState, useEffect, useRef } from 'react';
import { X, Send, Search, Hash, AtSign, Paperclip, Smile, MoreVertical, Users, Plus } from 'lucide-react';

interface MessagingPanelProps {
    isOpen: boolean;
    onClose: () => void;
    projectId?: number;
}

interface Channel {
    id: number;
    name: string;
    type: 'channel' | 'direct';
    unreadCount: number;
    lastMessage?: string;
}

interface Message {
    id: number;
    author: string;
    avatar?: string;
    content: string;
    timestamp: string;
    isOwn: boolean;
}

export function MessagingPanel({ isOpen, onClose, projectId }: MessagingPanelProps) {
    const [channels, setChannels] = useState<Channel[]>([
        {
            id: 1,
            name: 'general',
            type: 'channel',
            unreadCount: 3,
            lastMessage: 'Great work everyone!',
        },
        {
            id: 2,
            name: 'development',
            type: 'channel',
            unreadCount: 0,
            lastMessage: 'API endpoints are ready',
        },
        {
            id: 3,
            name: 'John Doe',
            type: 'direct',
            unreadCount: 1,
            lastMessage: 'Can you review the PR?',
        },
    ]);

    const [activeChannel, setActiveChannel] = useState<Channel>(channels[0]);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            author: 'John Doe',
            content: 'Hey team! Just pushed the latest changes to the repo.',
            timestamp: '2024-01-15T10:30:00Z',
            isOwn: false,
        },
        {
            id: 2,
            author: 'You',
            content: 'Thanks John! I\'ll review them shortly.',
            timestamp: '2024-01-15T10:32:00Z',
            isOwn: true,
        },
        {
            id: 3,
            author: 'Jane Smith',
            content: 'Great work everyone! @JohnDoe the new feature looks amazing 🚀',
            timestamp: '2024-01-15T10:35:00Z',
            isOwn: false,
        },
    ]);

    const [messageInput, setMessageInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageInput.trim()) return;

        const newMessage: Message = {
            id: Date.now(),
            author: 'You',
            content: messageInput,
            timestamp: new Date().toISOString(),
            isOwn: true,
        };

        setMessages([...messages, newMessage]);
        setMessageInput('');
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / 3600000);

        if (diffHours < 24) {
            return date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
            });
        }
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 lg:inset-auto lg:right-4 lg:bottom-4 lg:w-[800px] lg:h-[600px]">
            {/* Backdrop for mobile */}
            <div
                className="fixed inset-0 bg-black/20 backdrop-blur-sm lg:hidden"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="relative bg-white dark:bg-slate-900 lg:border lg:border-slate-200 dark:border-slate-800 lg:rounded-xl shadow-2xl h-full flex">
                {/* Sidebar - Channels */}
                <div className="w-64 border-r border-slate-200 dark:border-slate-800 flex flex-col">
                    {/* Sidebar Header */}
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                                Messages
                            </h3>
                            <button
                                onClick={onClose}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors lg:hidden"
                            >
                                <X className="w-4 h-4 text-slate-400" />
                            </button>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Channels List */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="p-2">
                            <div className="flex items-center justify-between px-2 py-1.5 mb-1">
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                                    Channels
                                </span>
                                <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors">
                                    <Plus className="w-3.5 h-3.5 text-slate-400" />
                                </button>
                            </div>

                            {channels
                                .filter((c) => c.type === 'channel')
                                .map((channel) => (
                                    <button
                                        key={channel.id}
                                        onClick={() => setActiveChannel(channel)}
                                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                                            activeChannel.id === channel.id
                                                ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        <Hash className="w-4 h-4 flex-shrink-0" />
                                        <span className="flex-1 text-sm font-medium truncate">
                                            {channel.name}
                                        </span>
                                        {channel.unreadCount > 0 && (
                                            <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs font-semibold rounded-full">
                                                {channel.unreadCount}
                                            </span>
                                        )}
                                    </button>
                                ))}
                        </div>

                        <div className="p-2 border-t border-slate-200 dark:border-slate-800">
                            <div className="flex items-center justify-between px-2 py-1.5 mb-1">
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                                    Direct Messages
                                </span>
                                <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors">
                                    <Plus className="w-3.5 h-3.5 text-slate-400" />
                                </button>
                            </div>

                            {channels
                                .filter((c) => c.type === 'direct')
                                .map((channel) => (
                                    <button
                                        key={channel.id}
                                        onClick={() => setActiveChannel(channel)}
                                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                                            activeChannel.id === channel.id
                                                ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                                            {channel.name
                                                .split(' ')
                                                .map((n) => n[0])
                                                .join('')}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium truncate">
                                                {channel.name}
                                            </div>
                                            {channel.lastMessage && (
                                                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                                    {channel.lastMessage}
                                                </div>
                                            )}
                                        </div>
                                        {channel.unreadCount > 0 && (
                                            <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs font-semibold rounded-full flex-shrink-0">
                                                {channel.unreadCount}
                                            </span>
                                        )}
                                    </button>
                                ))}
                        </div>
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col">
                    {/* Chat Header */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            {activeChannel.type === 'channel' ? (
                                <Hash className="w-5 h-5 text-slate-500" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                                    {activeChannel.name
                                        .split(' ')
                                        .map((n) => n[0])
                                        .join('')}
                                </div>
                            )}
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                                    {activeChannel.name}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {activeChannel.type === 'channel' ? '12 members' : 'Active'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                <Users className="w-5 h-5 text-slate-400" />
                            </button>
                            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                <MoreVertical className="w-5 h-5 text-slate-400" />
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors hidden lg:block"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex gap-3 ${message.isOwn ? 'flex-row-reverse' : ''}`}
                            >
                                {!message.isOwn && (
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-xs font-semibold">
                                            {message.author
                                                .split(' ')
                                                .map((n) => n[0])
                                                .join('')}
                                        </div>
                                    </div>
                                )}

                                <div
                                    className={`flex-1 max-w-md ${
                                        message.isOwn ? 'flex flex-col items-end' : ''
                                    }`}
                                >
                                    <div className="flex items-baseline gap-2 mb-1">
                                        <span
                                            className={`text-sm font-semibold ${
                                                message.isOwn
                                                    ? 'text-blue-600 dark:text-blue-400'
                                                    : 'text-slate-900 dark:text-slate-50'
                                            }`}
                                        >
                                            {message.author}
                                        </span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                            {formatTimestamp(message.timestamp)}
                                        </span>
                                    </div>
                                    <div
                                        className={`px-4 py-2 rounded-2xl ${
                                            message.isOwn
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-50'
                                        }`}
                                    >
                                        <p className="text-sm whitespace-pre-wrap break-words">
                                            {message.content}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 dark:border-slate-800">
                        <div className="flex items-end gap-2">
                            <div className="flex-1">
                                <textarea
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    placeholder={`Message ${activeChannel.name}...`}
                                    rows={1}
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage(e);
                                        }
                                    }}
                                />
                                <div className="flex items-center gap-1 mt-2">
                                    <button
                                        type="button"
                                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                                        title="Attach file"
                                    >
                                        <Paperclip className="w-4 h-4 text-slate-400" />
                                    </button>
                                    <button
                                        type="button"
                                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                                        title="Mention someone"
                                    >
                                        <AtSign className="w-4 h-4 text-slate-400" />
                                    </button>
                                    <button
                                        type="button"
                                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                                        title="Add emoji"
                                    >
                                        <Smile className="w-4 h-4 text-slate-400" />
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={!messageInput.trim()}
                                className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
