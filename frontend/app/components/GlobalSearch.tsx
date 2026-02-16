import { useState, useEffect, useCallback } from 'react';
import { Search, X, FileText, FolderOpen, CheckSquare, Users, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import tokenStorage from '~/services/tokenStorage';

interface SearchResult {
    type: 'project' | 'task' | 'user';
    id: number;
    title: string;
    subtitle?: string;
    metadata?: any;
}

interface GlobalSearchProps {
    isOpen: boolean;
    onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const navigate = useNavigate();

    // Debounced search
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const token = tokenStorage.getAccessToken();
                if (!token) return;

                // Search projects
                const projectsResponse = await fetch(
                    `/api/projects/?search=${encodeURIComponent(query)}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                const projects = projectsResponse.ok ? await projectsResponse.json() : [];

                // Search tasks
                const tasksResponse = await fetch(
                    `/api/tasks/?search=${encodeURIComponent(query)}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                const tasks = tasksResponse.ok ? await tasksResponse.json() : [];

                // Map results
                const projectResults: SearchResult[] = projects.slice(0, 5).map((p: any) => ({
                    type: 'project',
                    id: p.id,
                    title: p.name,
                    subtitle: p.description,
                    metadata: p,
                }));

                const taskResults: SearchResult[] = tasks.slice(0, 5).map((t: any) => ({
                    type: 'task',
                    id: t.id,
                    title: t.title,
                    subtitle: t.project?.name,
                    metadata: t,
                }));

                setResults([...projectResults, ...taskResults]);
            } catch (error) {
                console.error('Search failed:', error);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
            } else if (e.key === 'Enter' && results[selectedIndex]) {
                e.preventDefault();
                handleSelect(results[selectedIndex]);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, results, selectedIndex]);

    const handleSelect = (result: SearchResult) => {
        if (result.type === 'project') {
            navigate(`/projects/${result.id}`);
        } else if (result.type === 'task') {
            navigate(`/projects/${result.metadata.project.id}`);
        }
        onClose();
        setQuery('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Search Modal */}
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                    <Search className="w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search projects, tasks..."
                        className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-slate-50 placeholder-slate-400"
                        autoFocus
                    />
                    {loading && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Results */}
                <div className="max-h-96 overflow-y-auto">
                    {results.length === 0 && query && !loading && (
                        <div className="text-center py-12">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                No results found
                            </p>
                        </div>
                    )}

                    {results.length === 0 && !query && (
                        <div className="text-center py-12">
                            <Search className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Type to search projects and tasks
                            </p>
                        </div>
                    )}

                    {results.map((result, index) => {
                        const Icon =
                            result.type === 'project'
                                ? FolderOpen
                                : result.type === 'task'
                                ? CheckSquare
                                : Users;

                        return (
                            <div
                                key={`${result.type}-${result.id}`}
                                onClick={() => handleSelect(result)}
                                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                                    index === selectedIndex
                                        ? 'bg-blue-50 dark:bg-blue-950/40'
                                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                }`}
                            >
                                <div
                                    className={`p-2 rounded-lg ${
                                        result.type === 'project'
                                            ? 'bg-blue-100 dark:bg-blue-950/40'
                                            : 'bg-green-100 dark:bg-green-950/40'
                                    }`}
                                >
                                    <Icon
                                        className={`w-4 h-4 ${
                                            result.type === 'project'
                                                ? 'text-blue-600 dark:text-blue-300'
                                                : 'text-green-600 dark:text-green-300'
                                        }`}
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">
                                        {result.title}
                                    </p>
                                    {result.subtitle && (
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                            {result.subtitle}
                                        </p>
                                    )}
                                </div>
                                <span className="text-xs text-slate-400 capitalize">
                                    {result.type}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                        <span>
                            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded">
                                ↑↓
                            </kbd>{' '}
                            Navigate
                        </span>
                        <span>
                            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded">
                                Enter
                            </kbd>{' '}
                            Select
                        </span>
                        <span>
                            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded">
                                Esc
                            </kbd>{' '}
                            Close
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
