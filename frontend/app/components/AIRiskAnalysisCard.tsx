import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, Lightbulb, TrendingUp, Loader2, X, Sparkles } from 'lucide-react';
import { aiService, type AIRiskAnalysis } from '~/services/ai.service';

interface AIRiskAnalysisCardProps {
    projectId: number;
    className?: string;
}

export function AIRiskAnalysisCard({ projectId, className = '' }: AIRiskAnalysisCardProps) {
    const [analysis, setAnalysis] = useState<AIRiskAnalysis | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [enabled, setEnabled] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    const loadAnalysis = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await aiService.analyzeProjectRisks(projectId);
            setAnalysis(response.analysis);
            setEnabled(response.enabled);
            setIsExpanded(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to analyze risks');
            console.error('Error analyzing risks:', err);
        } finally {
            setLoading(false);
        }
    };

    const getRiskColor = (level: string) => {
        switch (level) {
            case 'low':
                return {
                    bg: 'bg-green-50 border-green-200',
                    text: 'text-green-700',
                    badge: 'bg-green-100 text-green-700 border-green-200',
                };
            case 'medium':
                return {
                    bg: 'bg-yellow-50 border-yellow-200',
                    text: 'text-yellow-700',
                    badge: 'bg-yellow-100 text-yellow-700 border-yellow-200',
                };
            case 'high':
                return {
                    bg: 'bg-orange-50 border-orange-200',
                    text: 'text-orange-700',
                    badge: 'bg-orange-100 text-orange-700 border-orange-200',
                };
            case 'critical':
                return {
                    bg: 'bg-red-50 border-red-200',
                    text: 'text-red-700',
                    badge: 'bg-red-100 text-red-700 border-red-200',
                };
            default:
                return {
                    bg: 'bg-slate-50 border-slate-200',
                    text: 'text-slate-700',
                    badge: 'bg-slate-100 text-slate-700 border-slate-200',
                };
        }
    };

    if (!isExpanded && !analysis) {
        return (
            <button
                onClick={loadAnalysis}
                disabled={loading}
                className={`w-full rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50/80 to-blue-50/80 backdrop-blur-sm p-4 hover:shadow-md transition-all ${className}`}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg shadow-purple-500/20">
                            <AlertTriangle className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left">
                            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                AI Risk Analysis
                                <Sparkles className="w-4 h-4 text-purple-500" />
                            </h3>
                            <p className="text-sm text-slate-500">
                                Analyze potential project risks with AI
                            </p>
                        </div>
                    </div>
                    {loading ? (
                        <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                    ) : (
                        <TrendingUp className="w-5 h-5 text-purple-600" />
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
                        <AlertTriangle className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                        <div className="h-5 bg-slate-200 rounded animate-pulse w-32 mb-1"></div>
                        <div className="h-4 bg-slate-100 rounded animate-pulse w-48"></div>
                    </div>
                </div>
                <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-slate-600">Analyzing project risks...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`rounded-xl border border-red-200 bg-red-50/50 backdrop-blur-sm p-6 ${className}`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                        <h3 className="font-semibold text-red-900">Risk Analysis Failed</h3>
                    </div>
                    <button onClick={() => setIsExpanded(false)} className="p-1 hover:bg-red-100 rounded">
                        <X className="w-5 h-5 text-red-600" />
                    </button>
                </div>
                <p className="text-sm text-red-600 mb-4">{error}</p>
                <button
                    onClick={loadAnalysis}
                    className="text-sm text-red-600 hover:text-red-700 font-medium underline"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (!enabled || !analysis) {
        return (
            <div className={`rounded-xl border border-slate-200 bg-white/50 backdrop-blur-sm p-6 ${className}`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-100">
                            <AlertTriangle className="w-6 h-6 text-slate-400" />
                        </div>
                        <h3 className="font-semibold text-slate-900">AI Risk Analysis</h3>
                    </div>
                    <button onClick={() => setIsExpanded(false)} className="p-1 hover:bg-slate-100 rounded">
                        <X className="w-5 h-5 text-slate-600" />
                    </button>
                </div>
                <div className="text-center py-8">
                    <p className="text-slate-500 mb-2">AI features are not configured</p>
                    <p className="text-xs text-slate-400">Set GEMINI_API_KEY to enable AI-powered risk analysis</p>
                </div>
            </div>
        );
    }

    const colors = getRiskColor(analysis.risk_level);

    return (
        <div className={`rounded-xl border ${colors.bg.replace('bg-', 'border-').replace('-50', '-200')} bg-gradient-to-br ${colors.bg} backdrop-blur-sm p-6 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg shadow-purple-500/20">
                        <AlertTriangle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                            AI Risk Analysis
                            <Sparkles className="w-4 h-4 text-purple-500" />
                        </h3>
                        <p className="text-sm text-slate-500">Powered by Gemini AI</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={loadAnalysis}
                        className="p-2 rounded-lg hover:bg-white/50 transition-colors"
                        title="Refresh analysis"
                    >
                        <TrendingUp className="w-5 h-5 text-purple-600" />
                    </button>
                    <button
                        onClick={() => setIsExpanded(false)}
                        className="p-2 rounded-lg hover:bg-white/50 transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-600" />
                    </button>
                </div>
            </div>

            {/* Risk Score */}
            <div className="mb-6 p-4 rounded-lg bg-white/60 border border-purple-100">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Risk Level</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${colors.badge}`}>
                        {analysis.risk_level}
                    </span>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className={`text-4xl font-bold ${colors.text}`}>
                        {analysis.risk_score}
                    </span>
                    <span className="text-sm text-slate-500">/ 100</span>
                </div>
                <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-500 ${
                            analysis.risk_score >= 75
                                ? 'bg-gradient-to-r from-red-400 to-red-500'
                                : analysis.risk_score >= 50
                                ? 'bg-gradient-to-r from-orange-400 to-orange-500'
                                : analysis.risk_score >= 25
                                ? 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                                : 'bg-gradient-to-r from-green-400 to-green-500'
                        }`}
                        style={{ width: `${analysis.risk_score}%` }}
                    ></div>
                </div>
            </div>

            {/* Key Risks */}
            <div className="mb-6">
                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    Key Risks
                </h4>
                <div className="space-y-2">
                    {analysis.key_risks.map((risk, idx) => (
                        <div key={idx} className="flex gap-2 text-sm text-slate-600 bg-white/50 p-3 rounded-lg border border-orange-100">
                            <Info className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                            <span>{risk}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recommendations */}
            <div className="mb-6">
                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    Recommendations
                </h4>
                <div className="space-y-2">
                    {analysis.recommendations.map((rec, idx) => (
                        <div key={idx} className="flex gap-2 text-sm text-slate-600">
                            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <span>{rec}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Areas of Concern */}
            {analysis.areas_of_concern.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-500" />
                        Areas of Concern
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {analysis.areas_of_concern.map((area, idx) => (
                            <span
                                key={idx}
                                className="px-3 py-1 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-100"
                            >
                                {area}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
