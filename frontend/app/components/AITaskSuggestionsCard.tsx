import { useState } from 'react';
import { Lightbulb, Plus, Loader2, X, Sparkles, Clock, AlertCircle } from 'lucide-react';
import { aiService, type AITaskSuggestion } from '~/services/ai.service';

interface AITaskSuggestionsCardProps {
    projectId: number;
    onTaskCreate?: (task: AITaskSuggestion) => void;
    className?: string;
}

export function AITaskSuggestionsCard({ projectId, onTaskCreate, className = '' }: AITaskSuggestionsCardProps) {
    const [suggestions, setSuggestions] = useState<AITaskSuggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [enabled, setEnabled] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    const loadSuggestions = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await aiService.generateTaskSuggestions(projectId);
            setSuggestions(response.suggestions);
            setEnabled(response.enabled);
            setIsExpanded(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate suggestions');
            console.error('Error generating task suggestions:', err);
        } finally {
            setLoading(false);
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical':
                return 'bg-red-100 text-red-700 border-red-200';
            case 'high':
                return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'medium':
                return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'low':
                return 'bg-green-100 text-green-700 border-green-200';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    if (!isExpanded && suggestions.length === 0) {
        return (
            <button
                onClick={loadSuggestions}
                disabled={loading}
                className={`w-full rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50/80 to-blue-50/80 backdrop-blur-sm p-4 hover:shadow-md transition-all ${className}`}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg shadow-purple-500/20">
                            <Lightbulb className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left">
                            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                AI Task Suggestions
                                <Sparkles className="w-4 h-4 text-purple-500" />
                            </h3>
                            <p className="text-sm text-slate-500">
                                Get intelligent task recommendations with AI
                            </p>
                        </div>
                    </div>
                    {loading ? (
                        <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                    ) : (
                        <Lightbulb className="w-5 h-5 text-purple-600" />
                    )}
                </div>
            </button>
        );
    }

    if (loading) {
        return (
            <div className={`rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50/80 to-blue-50/80 backdrop-blur-sm p-6 ${className}`}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 animate-pulse">
                        <Lightbulb className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                        <div className="h-5 bg-slate-200 rounded animate-pulse w-40 mb-1"></div>
                        <div className="h-4 bg-slate-100 rounded animate-pulse w-56"></div>
                    </div>
                </div>
                <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-slate-600">Generating task suggestions...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`rounded-xl border border-red-200 bg-red-50/50 backdrop-blur-sm p-6 ${className}`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-6 h-6 text-red-500" />
                        <h3 className="font-semibold text-red-900">Failed to Generate Suggestions</h3>
                    </div>
                    <button onClick={() => setIsExpanded(false)} className="p-1 hover:bg-red-100 rounded">
                        <X className="w-5 h-5 text-red-600" />
                    </button>
                </div>
                <p className="text-sm text-red-600 mb-4">{error}</p>
                <button
                    onClick={loadSuggestions}
                    className="text-sm text-red-600 hover:text-red-700 font-medium underline"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (!enabled || suggestions.length === 0) {
        return (
            <div className={`rounded-xl border border-slate-200 bg-white/50 backdrop-blur-sm p-6 ${className}`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-100">
                            <Lightbulb className="w-6 h-6 text-slate-400" />
                        </div>
                        <h3 className="font-semibold text-slate-900">AI Task Suggestions</h3>
                    </div>
                    <button onClick={() => setIsExpanded(false)} className="p-1 hover:bg-slate-100 rounded">
                        <X className="w-5 h-5 text-slate-600" />
                    </button>
                </div>
                <div className="text-center py-8">
                    <p className="text-slate-500 mb-2">AI features are not configured</p>
                    <p className="text-xs text-slate-400">Set GEMINI_API_KEY to enable AI-powered task suggestions</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50/80 to-blue-50/80 backdrop-blur-sm p-6 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg shadow-purple-500/20">
                        <Lightbulb className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                            AI Task Suggestions
                            <Sparkles className="w-4 h-4 text-purple-500" />
                        </h3>
                        <p className="text-sm text-slate-500">Powered by Gemini AI</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={loadSuggestions}
                        className="p-2 rounded-lg hover:bg-white/50 transition-colors"
                        title="Refresh suggestions"
                    >
                        <Sparkles className="w-5 h-5 text-purple-600" />
                    </button>
                    <button
                        onClick={() => setIsExpanded(false)}
                        className="p-2 rounded-lg hover:bg-white/50 transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-600" />
                    </button>
                </div>
            </div>

            {/* Suggestions List */}
            <div className="space-y-4">
                {suggestions.map((suggestion, idx) => (
                    <div
                        key={idx}
                        className="rounded-lg bg-white/60 border border-purple-100 p-4 hover:shadow-md transition-all group"
                    >
                        <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-slate-900 flex-1 pr-2">
                                {suggestion.title}
                            </h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(suggestion.priority)}`}>
                                {suggestion.priority}
                            </span>
                        </div>
                        <p className="text-sm text-slate-600 mb-3">
                            {suggestion.description}
                        </p>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <Clock className="w-4 h-4" />
                                <span>~{suggestion.estimated_hours}h estimated</span>
                            </div>
                            {onTaskCreate && (
                                <button
                                    onClick={() => onTaskCreate(suggestion)}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 text-white text-xs font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <Plus className="w-4 h-4" />
                                    Create Task
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {suggestions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-purple-200">
                    <p className="text-xs text-slate-500 text-center">
                        Click "Create Task" to add any suggestion to your project
                    </p>
                </div>
            )}
        </div>
    );
}
