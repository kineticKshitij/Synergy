import { useState, useEffect } from 'react';
import tokenStorage from '~/services/tokenStorage';

const API_URL = '/api';

interface DueDateSuggestion {
  suggested_date: string;
  confidence_level: string;
  reasoning: string;
  alternative_dates: Array<{ date: string; rationale: string }>;
  workload_warning: boolean;
  capacity_percentage: number;
}

interface Props {
  taskTitle: string;
  taskDescription: string;
  priority: string;
  estimatedHours?: number;
  onSelectDate: (date: string) => void;
  currentDueDate?: string;
}

export function AIDueDateSuggestion({ 
  taskTitle, 
  taskDescription, 
  priority, 
  estimatedHours = 4,
  onSelectDate,
  currentDueDate
}: Props) {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<DueDateSuggestion | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Auto-fetch suggestion when component mounts or key props change
    if (taskTitle && !suggestion) {
      fetchSuggestion();
    }
  }, [taskTitle]);

  const fetchSuggestion = async () => {
    if (!taskTitle) return;

    setLoading(true);
    try {
      const token = tokenStorage.getAccessToken();
      const response = await fetch(`${API_URL}/tasks/ai_suggest_due_date/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDescription,
          priority: priority,
          estimated_hours: estimatedHours,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch suggestion');
      }

      const data = await response.json();
      setSuggestion(data.suggestion);
    } catch (err) {
      console.error('Error fetching due date suggestion:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getConfidenceColor = (level: string) => {
    const colors = {
      high: 'text-green-400 bg-green-500/10',
      medium: 'text-yellow-400 bg-yellow-500/10',
      low: 'text-orange-400 bg-orange-500/10',
    };
    return colors[level as keyof typeof colors] || colors.medium;
  };

  if (loading) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          <span className="text-sm text-gray-400">AI is analyzing your workload...</span>
        </div>
      </div>
    );
  }

  if (!suggestion) {
    return (
      <button
        onClick={fetchSuggestion}
        className="w-full bg-gray-800/50 border border-gray-700 hover:border-blue-500/50 rounded-lg p-4 transition-all group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🤖</span>
            <div className="text-left">
              <p className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                Get AI Due Date Suggestion
              </p>
              <p className="text-xs text-gray-500">Based on your current workload</p>
            </div>
          </div>
          <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg p-4 space-y-3">
      {/* Warning */}
      {suggestion.workload_warning && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-start gap-2">
          <span className="text-yellow-400 text-xl">⚠️</span>
          <div className="flex-1">
            <p className="text-sm text-yellow-300 font-semibold">Workload Warning</p>
            <p className="text-xs text-yellow-400/80 mt-1">
              You have a high number of active tasks. Consider adjusting priorities or delegating.
            </p>
          </div>
        </div>
      )}

      {/* Main Suggestion */}
      <div>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">📅</span>
            <span className="text-sm font-semibold text-white">AI Recommended</span>
            <span className={`text-xs px-2 py-1 rounded ${getConfidenceColor(suggestion.confidence_level)}`}>
              {suggestion.confidence_level} confidence
            </span>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            {expanded ? 'Show Less' : 'Details'}
          </button>
        </div>

        <button
          onClick={() => onSelectDate(suggestion.suggested_date)}
          className="w-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg p-3 transition-all group text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-blue-300 mb-1">
                {formatDate(suggestion.suggested_date)}
              </p>
              <p className="text-sm text-gray-400">{suggestion.reasoning}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Capacity Impact</p>
              <p className="text-lg font-bold text-purple-400">{Math.round(suggestion.capacity_percentage)}%</p>
            </div>
          </div>
        </button>
      </div>

      {/* Alternative Dates */}
      {expanded && suggestion.alternative_dates.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-gray-700">
          <p className="text-xs text-gray-400 font-semibold">Alternative Options:</p>
          {suggestion.alternative_dates.map((alt, index) => (
            <button
              key={index}
              onClick={() => onSelectDate(alt.date)}
              className="w-full bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 hover:border-gray-600 rounded p-2 transition-all text-left"
            >
              <p className="text-sm font-semibold text-gray-300">{formatDate(alt.date)}</p>
              <p className="text-xs text-gray-500 mt-1">{alt.rationale}</p>
            </button>
          ))}
        </div>
      )}

      {/* Refresh Button */}
      <button
        onClick={fetchSuggestion}
        className="w-full text-xs text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2 py-2"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Recalculate Suggestion
      </button>
    </div>
  );
}
