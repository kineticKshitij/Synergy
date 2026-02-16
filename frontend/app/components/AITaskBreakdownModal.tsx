import { useState } from 'react';
import tokenStorage from '~/services/tokenStorage';

const API_URL = '/api';

interface Subtask {
  title: string;
  description: string;
  estimated_hours: number;
  priority: string;
  dependencies: number[];
  skills_required: string[];
}

interface TaskBreakdown {
  subtasks: Subtask[];
  total_estimated_hours: number;
  complexity_score: number;
  recommended_sequence: string;
}

interface Props {
  taskId: number;
  taskTitle: string;
  onClose: () => void;
  onCreateSubtasks: (subtasks: Subtask[]) => void;
}

export function AITaskBreakdownModal({ taskId, taskTitle, onClose, onCreateSubtasks }: Props) {
  const [loading, setLoading] = useState(false);
  const [breakdown, setBreakdown] = useState<TaskBreakdown | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubtasks, setSelectedSubtasks] = useState<Set<number>>(new Set());

  const handleBreakdown = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = tokenStorage.getAccessToken();
      const response = await fetch(`${API_URL}/tasks/ai_breakdown_task/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ task_id: taskId }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate breakdown');
      }

      const data = await response.json();
      setBreakdown(data.breakdown);
      
      // Select all by default
      const allIndices = new Set(data.breakdown.subtasks.map((_: any, idx: number) => idx));
      setSelectedSubtasks(allIndices);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleSubtask = (index: number) => {
    const newSelected = new Set(selectedSubtasks);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedSubtasks(newSelected);
  };

  const handleCreate = () => {
    if (!breakdown) return;
    
    const selected = breakdown.subtasks.filter((_, idx) => selectedSubtasks.has(idx));
    onCreateSubtasks(selected);
    onClose();
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      critical: 'text-red-400 bg-red-500/10 border-red-500/30',
      high: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
      medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
      low: 'text-green-400 bg-green-500/10 border-green-500/30',
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                <span className="text-3xl">🤖</span>
                AI Task Breakdown
              </h2>
              <p className="text-gray-400 text-sm">
                Breaking down: <span className="text-blue-400 font-semibold">{taskTitle}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!breakdown && !loading && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🧩</div>
              <p className="text-gray-300 mb-6">
                Let AI analyze this task and break it down into manageable subtasks with time estimates and dependencies.
              </p>
              <button
                onClick={handleBreakdown}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg text-white font-semibold transition-all transform hover:scale-105"
              >
                Generate Breakdown
              </button>
            </div>
          )}

          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-400">AI is analyzing the task...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {breakdown && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-400">{breakdown.subtasks.length}</div>
                    <div className="text-sm text-gray-400">Subtasks</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-400">{breakdown.total_estimated_hours}h</div>
                    <div className="text-sm text-gray-400">Total Estimate</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-400">{breakdown.complexity_score}/10</div>
                    <div className="text-sm text-gray-400">Complexity</div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p className="text-sm text-gray-400 mb-1 font-semibold">Recommended Sequence:</p>
                  <p className="text-sm text-gray-300">{breakdown.recommended_sequence}</p>
                </div>
              </div>

              {/* Subtasks */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white">Suggested Subtasks</h3>
                {breakdown.subtasks.map((subtask, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 transition-all cursor-pointer ${
                      selectedSubtasks.has(index)
                        ? 'bg-blue-500/10 border-blue-500/50'
                        : 'bg-gray-900/30 border-gray-700 hover:border-gray-600'
                    }`}
                    onClick={() => toggleSubtask(index)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <input
                          type="checkbox"
                          checked={selectedSubtasks.has(index)}
                          onChange={() => toggleSubtask(index)}
                          className="w-5 h-5 rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h4 className="font-semibold text-white flex items-center gap-2">
                            <span className="text-gray-500">#{index + 1}</span>
                            {subtask.title}
                          </h4>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-xs px-2 py-1 rounded border ${getPriorityColor(subtask.priority)}`}>
                              {subtask.priority}
                            </span>
                            <span className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300">
                              {subtask.estimated_hours}h
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-400 mb-2">{subtask.description}</p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          {subtask.skills_required.map((skill, i) => (
                            <span key={i} className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded">
                              {skill}
                            </span>
                          ))}
                          {subtask.dependencies.length > 0 && (
                            <span className="px-2 py-1 bg-orange-500/20 text-orange-300 rounded">
                              Depends on: #{subtask.dependencies.map(d => d + 1).join(', #')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {breakdown && (
          <div className="p-6 border-t border-gray-700 flex justify-between items-center">
            <p className="text-sm text-gray-400">
              {selectedSubtasks.size} of {breakdown.subtasks.length} subtasks selected
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={selectedSubtasks.size === 0}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create {selectedSubtasks.size} Subtasks
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
