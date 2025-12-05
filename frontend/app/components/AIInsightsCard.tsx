import { useState, useEffect } from 'react';
import { Brain, Sparkles, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, Lightbulb, Target, Zap } from 'lucide-react';
import { aiService, type AIInsights } from '~/services/ai.service';

interface AIInsightsCardProps {
    className?: string;
}

export function AIInsightsCard({ className = '' }: AIInsightsCardProps) {
    const [insights, setInsights] = useState<AIInsights | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        loadInsights();
    }, []);

    const loadInsights = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await aiService.generateInsights();
            setInsights(response.insights);
            setEnabled(response.enabled);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load AI insights');
            console.error('Error loading AI insights:', err);
        } finally {
            setLoading(false);
        }
    };

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'improving':
                return <TrendingUp className="w-5 h-5 text-green-500" />;
            case 'declining':
                return <TrendingDown className="w-5 h-5 text-red-500" />;
            default:
                return <Minus className="w-5 h-5 text-yellow-500" />;
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-500';
        if (score >= 60) return 'text-blue-500';
        if (score >= 40) return 'text-yellow-500';
        return 'text-red-500';
    };

    if (!enabled && !loading) {
        return (
            <div className={`rounded-xl border border-slate-200 bg-white/50 backdrop-blur-sm p-6 ${className}`}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-slate-100">
                        <Brain className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900">AI Insights</h3>
                        <p className="text-sm text-slate-500">Powered by Gemini AI</p>
                    </div>
                </div>
                <div className="text-center py-8">
                    <p className="text-slate-500 mb-2">AI features are not configured</p>
                    <p className="text-xs text-slate-400">Set GEMINI_API_KEY to enable AI-powered insights</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className={`rounded-xl border border-slate-200 bg-white/50 backdrop-blur-sm p-6 ${className}`}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 animate-pulse">
                        <Brain className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                        <div className="h-5 bg-slate-200 rounded animate-pulse w-32 mb-1"></div>
                        <div className="h-4 bg-slate-100 rounded animate-pulse w-24"></div>
                    </div>
                </div>
                <div className="space-y-3">
                    <div className="h-4 bg-slate-100 rounded animate-pulse"></div>
                    <div className="h-4 bg-slate-100 rounded animate-pulse w-5/6"></div>
                    <div className="h-4 bg-slate-100 rounded animate-pulse w-4/6"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`rounded-xl border border-red-200 bg-red-50/50 backdrop-blur-sm p-6 ${className}`}>
                <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                    <h3 className="font-semibold text-red-900">Failed to Load AI Insights</h3>
                </div>
                <p className="text-sm text-red-600 mb-4">{error}</p>
                <button
                    onClick={loadInsights}
                    className="text-sm text-red-600 hover:text-red-700 font-medium underline"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (!insights) return null;

    return (
        <div className={`rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50/80 to-blue-50/80 backdrop-blur-sm p-6 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg shadow-purple-500/20">
                        <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                            AI Insights
                            <Sparkles className="w-4 h-4 text-purple-500" />
                        </h3>
                        <p className="text-sm text-slate-500">Powered by Gemini AI</p>
                    </div>
                </div>
                <button
                    onClick={loadInsights}
                    className="p-2 rounded-lg hover:bg-white/50 transition-colors"
                    title="Refresh insights"
                >
                    <Zap className="w-5 h-5 text-purple-600" />
                </button>
            </div>

            {/* Productivity Score */}
            <div className="mb-6 p-4 rounded-lg bg-white/60 border border-purple-100">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Productivity Score</span>
                    {getTrendIcon(insights.trend)}
                </div>
                <div className="flex items-baseline gap-2">
                    <span className={`text-4xl font-bold ${getScoreColor(insights.productivity_score)}`}>
                        {insights.productivity_score}
                    </span>
                    <span className="text-sm text-slate-500">/ 100</span>
                </div>
                <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-500 ${
                            insights.productivity_score >= 80
                                ? 'bg-gradient-to-r from-green-400 to-green-500'
                                : insights.productivity_score >= 60
                                ? 'bg-gradient-to-r from-blue-400 to-blue-500'
                                : insights.productivity_score >= 40
                                ? 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                                : 'bg-gradient-to-r from-red-400 to-red-500'
                        }`}
                        style={{ width: `${insights.productivity_score}%` }}
                    ></div>
                </div>
                <p className="text-xs text-slate-500 mt-2 capitalize">
                    Trend: <span className="font-medium">{insights.trend}</span>
                </p>
            </div>

            {/* Key Insights */}
            <div className="mb-6">
                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    Key Insights
                </h4>
                <div className="space-y-2">
                    {insights.key_insights.map((insight, idx) => (
                        <div key={idx} className="flex gap-2 text-sm text-slate-600">
                            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <span>{insight}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Predictions */}
            {insights.predictions.length > 0 && (
                <div className="mb-6">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4 text-blue-500" />
                        Predictions
                    </h4>
                    <div className="space-y-2">
                        {insights.predictions.map((prediction, idx) => (
                            <div key={idx} className="flex gap-2 text-sm text-slate-600 bg-blue-50/50 p-2 rounded-lg">
                                <span className="text-blue-500 font-medium">→</span>
                                <span>{prediction}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Focus Areas */}
            {insights.focus_areas.length > 0 && (
                <div className="mb-6">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        Focus Areas
                    </h4>
                    <div className="space-y-2">
                        {insights.focus_areas.map((area, idx) => (
                            <div key={idx} className="text-sm text-slate-600 bg-orange-50/50 p-2 rounded-lg border border-orange-100">
                                {area}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Automation Suggestions */}
            {insights.automation_suggestions.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-purple-500" />
                        Automation Suggestions
                    </h4>
                    <div className="space-y-2">
                        {insights.automation_suggestions.map((suggestion, idx) => (
                            <div key={idx} className="flex gap-2 text-sm text-slate-600 bg-purple-50/50 p-2 rounded-lg border border-purple-100">
                                <Sparkles className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                                <span>{suggestion}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
